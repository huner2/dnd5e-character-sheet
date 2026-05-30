import type { LanguageRow } from '../character-sheet/types'
import { withStaleChunkRecovery } from '../chunkLoadRecovery'
import { rawJsonEntriesPlain, simplify5eToolsText } from './spellsData'

/**
 * Loads languages from vendored 5etools `data/languages.json`.
 */

const languagesModules = import.meta.glob<{ language?: RawLanguage[] }>(
  '../../vendor/5etools-src/data/languages.json',
)

export type RawLanguage = {
  name: string
  source: string
  page?: number
  type?: string
  script?: string
  edition?: string
  typicalSpeakers?: string[]
  entries?: unknown[]
}

function unwrap5eToolsJsonModule(mod: Record<string, unknown>): Record<string, unknown> {
  const d = mod.default
  if (d && typeof d === 'object' && d !== null && !Array.isArray(d)) {
    return d as Record<string, unknown>
  }
  return mod
}

let cache: RawLanguage[] | null = null

export async function loadAllRawLanguages(): Promise<RawLanguage[]> {
  if (cache) return cache
  return withStaleChunkRecovery(async () => {
    const loaders = Object.values(languagesModules)
    if (loaders.length !== 1) {
      throw new Error('Expected exactly one languages.json module from glob')
    }
    const raw = (await loaders[0]!()) as Record<string, unknown>
    const mod = unwrap5eToolsJsonModule(raw)
    const list = mod.language
    cache = Array.isArray(list) ? (list as RawLanguage[]) : []
    return cache
  })
}

export function languageRef(lang: Pick<RawLanguage, 'name' | 'source'>): string {
  return `${lang.name}|${lang.source}`
}

export function findRawLanguageByRefString(
  languages: RawLanguage[],
  fiveEToolsRef: string,
): RawLanguage | undefined {
  return languages.find((l) => languageRef(l) === fiveEToolsRef)
}

function formatTypicalSpeakers(raw: string[] | undefined): string {
  if (!raw?.length) return '—'
  return raw.map((s) => simplify5eToolsText(s)).join('; ')
}

function formatPage(page: number | undefined): string {
  return page != null && Number.isFinite(page) ? String(page) : '—'
}

export type LanguagePreviewModel = {
  name: string
  source: string
  page: string
  type: string
  script: string
  typicalSpeakers: string
  description: string
}

export function buildLanguagePreview(lang: RawLanguage): LanguagePreviewModel {
  return {
    name: lang.name,
    source: lang.source,
    page: formatPage(lang.page),
    type: lang.type?.trim() || '—',
    script: lang.script?.trim() || '—',
    typicalSpeakers: formatTypicalSpeakers(lang.typicalSpeakers),
    description: rawJsonEntriesPlain(lang.entries),
  }
}

export function rawLanguageToLanguageRow(lang: RawLanguage): Omit<LanguageRow, 'id'> {
  return {
    name: lang.name,
    fiveEToolsRef: languageRef(lang),
  }
}
