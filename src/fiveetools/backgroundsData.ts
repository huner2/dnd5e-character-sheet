import { rawJsonEntriesPlain } from './spellsData'

/**
 * Loads backgrounds from vendored 5etools `data/backgrounds.json`.
 */

const backgroundModules = import.meta.glob<{ background: RawBackground[] }>(
  '../../vendor/5etools-src/data/backgrounds.json',
)

export type RawBackground = {
  name: string
  source: string
  page?: number
  edition?: string
  srd?: boolean
  /** Main description blocks (strings and structured objects). */
  entries?: unknown[]
}

let cache: RawBackground[] | null = null

export async function loadAllRawBackgrounds(): Promise<RawBackground[]> {
  if (cache) return cache
  const loaders = Object.values(backgroundModules)
  if (loaders.length !== 1) {
    throw new Error('Expected exactly one backgrounds.json module from glob')
  }
  const mod = await loaders[0]!()
  cache = Array.isArray(mod.background) ? mod.background : []
  return cache
}

export function backgroundRef(bg: Pick<RawBackground, 'name' | 'source'>): string {
  return `${bg.name}|${bg.source}`
}

export function findRawBackgroundByRefString(
  backgrounds: RawBackground[],
  fiveEToolsRef: string,
): RawBackground | undefined {
  return backgrounds.find((b) => backgroundRef(b) === fiveEToolsRef)
}

function formatPage(page: number | undefined): string {
  return page != null && Number.isFinite(page) ? String(page) : '—'
}

export type BackgroundPreviewModel = {
  name: string
  source: string
  page: string
  description: string
}

export function buildBackgroundPreview(bg: RawBackground): BackgroundPreviewModel {
  return {
    name: bg.name,
    source: bg.source,
    page: formatPage(bg.page),
    description: rawJsonEntriesPlain(bg.entries),
  }
}

export function rawBackgroundToSheetFields(bg: RawBackground): {
  background: string
  backgroundFiveEToolsRef: string
} {
  return {
    background: bg.name,
    backgroundFiveEToolsRef: backgroundRef(bg),
  }
}
