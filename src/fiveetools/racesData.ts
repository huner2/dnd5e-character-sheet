import { rawJsonEntriesPlain } from './spellsData'

/**
 * Loads species (races) from vendored 5etools `data/races.json`.
 */

const racesModules = import.meta.glob<{ race?: RawRace[] }>(
  '../../vendor/5etools-src/data/races.json',
)

export type RawRace = {
  name: string
  source: string
  page?: number
  /** Rulebook edition tag when present (e.g. `one` for 2024 rules). */
  edition?: string
  size?: string[]
  speed?: unknown
  entries?: unknown[]
}

function unwrap5eToolsJsonModule(mod: Record<string, unknown>): Record<string, unknown> {
  const d = mod.default
  if (d && typeof d === 'object' && d !== null && !Array.isArray(d)) {
    return d as Record<string, unknown>
  }
  return mod
}

let cache: RawRace[] | null = null

export async function loadAllRawRaces(): Promise<RawRace[]> {
  if (cache) return cache
  const loaders = Object.values(racesModules)
  if (loaders.length !== 1) {
    throw new Error('Expected exactly one races.json module from glob')
  }
  const raw = (await loaders[0]!()) as Record<string, unknown>
  const mod = unwrap5eToolsJsonModule(raw)
  const list = mod.race
  cache = Array.isArray(list) ? (list as RawRace[]) : []
  return cache
}

export function raceRef(race: Pick<RawRace, 'name' | 'source'>): string {
  return `${race.name}|${race.source}`
}

export function findRawRaceByRefString(
  races: RawRace[],
  fiveEToolsRef: string,
): RawRace | undefined {
  return races.find((r) => raceRef(r) === fiveEToolsRef)
}

function formatPage(page: number | undefined): string {
  return page != null && Number.isFinite(page) ? String(page) : '—'
}

function formatSize(size: string[] | undefined): string {
  if (!size?.length) return '—'
  return size.join(', ')
}

function formatSpeed(speed: unknown): string {
  if (speed == null) return '—'
  if (typeof speed === 'number') return `${speed} ft.`
  if (typeof speed === 'object' && speed !== null && !Array.isArray(speed)) {
    const o = speed as Record<string, unknown>
    const parts: string[] = []
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'number') parts.push(`${k} ${v} ft.`)
      else if (v === true) parts.push(k)
      else if (typeof v === 'string') parts.push(`${k}: ${v}`)
    }
    return parts.length ? parts.join('; ') : '—'
  }
  return '—'
}

export type RacePreviewModel = {
  name: string
  source: string
  page: string
  size: string
  speed: string
  description: string
}

export function buildRacePreview(race: RawRace): RacePreviewModel {
  return {
    name: race.name,
    source: race.source,
    page: formatPage(race.page),
    size: formatSize(race.size),
    speed: formatSpeed(race.speed),
    description: rawJsonEntriesPlain(race.entries),
  }
}

/** Summary lines + full trait text from `entries` (Background tab, read-only block). */
export function compendiumSpeciesTraitsPlain(race: RawRace): string {
  const meta: string[] = []
  const sz = formatSize(race.size)
  const sp = formatSpeed(race.speed)
  if (sz !== '—') meta.push(`Size: ${sz}`)
  if (sp !== '—') meta.push(`Speed: ${sp}`)
  const traits = rawJsonEntriesPlain(race.entries)
  const head = meta.join('\n')
  if (!head && traits === '—') return '—'
  if (!head) return traits
  if (traits === '—') return head
  return `${head}\n\n${traits}`
}

export function rawRaceToSheetFields(race: RawRace): {
  species: string
  speciesFiveEToolsRef: string
} {
  return {
    species: race.name,
    speciesFiveEToolsRef: raceRef(race),
  }
}
