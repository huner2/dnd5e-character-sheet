/**
 * Recover from stale bundles after a GitHub Pages deploy.
 *
 * Users who keep a tab open across deploys may still run an old main chunk that
 * references hashed lazy chunks (e.g. items-*.js) that no longer exist.
 */

const RELOAD_SESSION_KEY = 'dnd5e-chunk-reload-attempts'
const MAX_RELOAD_ATTEMPTS = 2

export function isStaleChunkLoadError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : ''

  if (!message) return false

  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module') ||
    /Loading chunk [\w-]+ failed/i.test(message) ||
    /Unable to preload CSS/i.test(message)
  )
}

function reloadForStaleDeployment(): void {
  const attempts = Number(sessionStorage.getItem(RELOAD_SESSION_KEY) ?? '0')
  if (attempts >= MAX_RELOAD_ATTEMPTS) return

  sessionStorage.setItem(RELOAD_SESSION_KEY, String(attempts + 1))
  window.location.reload()
}

/** Returns true when a full page reload was triggered. */
export function reloadIfStaleChunkError(error: unknown): boolean {
  if (!isStaleChunkLoadError(error)) return false
  reloadForStaleDeployment()
  return true
}

export async function withStaleChunkRecovery<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    reloadIfStaleChunkError(error)
    throw error
  }
}

function onVitePreloadError(event: Event): void {
  const payload = (event as Event & { payload?: unknown }).payload
  reloadIfStaleChunkError(payload ?? new Error('vite:preloadError'))
}

function onUnhandledRejection(event: PromiseRejectionEvent): void {
  if (reloadIfStaleChunkError(event.reason)) {
    event.preventDefault()
  }
}

export function installChunkLoadRecovery(): void {
  window.addEventListener('vite:preloadError', onVitePreloadError)
  window.addEventListener('unhandledrejection', onUnhandledRejection)

  if (import.meta.env.PROD) {
    void checkDeploymentVersion()
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        void checkDeploymentVersion()
      }
    })
  }
}

export function clearChunkReloadAttempts(): void {
  sessionStorage.removeItem(RELOAD_SESSION_KEY)
}

/** Compare embedded build id with no-cache version.json from the server. */
export async function checkDeploymentVersion(): Promise<void> {
  const localBuildId = import.meta.env.VITE_BUILD_ID
  if (!localBuildId) return

  try {
    const url = new URL('version.json', window.location.href)
    url.searchParams.set('_', String(Date.now()))

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return

    const data = (await res.json()) as { buildId?: string }
    if (data.buildId && data.buildId !== localBuildId) {
      reloadForStaleDeployment()
    }
  } catch {
    // Offline or transient failure — ignore.
  }
}
