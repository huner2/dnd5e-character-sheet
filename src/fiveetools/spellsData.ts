import type { SpellbookRow } from '../character-sheet/types'

/**
 * Loads and maps spell entries from vendored 5etools `data/spells` JSON (mirror).
 * @see https://github.com/5etools-mirror-3/5etools-src
 */

const spellChunkModules = import.meta.glob<{ spell: RawSpell[] }>(
  '../../vendor/5etools-src/data/spells/spells-*.json',
)

const spellIndexLoaders = import.meta.glob<SpellFileIndex>(
  '../../vendor/5etools-src/data/spells/index.json',
  { import: 'default' },
)

const spellSourcesLoaders = import.meta.glob<SpellSourcesJson>(
  '../../vendor/5etools-src/data/spells/sources.json',
  { import: 'default' },
)

export type SpellFileIndex = Record<string, string>

export type SpellClassEntry = {
  name: string
  source: string
  definedInSource?: string
}

export type SpellSourceRecord = {
  class?: SpellClassEntry[]
  classVariant?: SpellClassEntry[]
}

/** `sources.json`: spell book → spell name → class lists. */
export type SpellSourcesJson = Record<string, Record<string, SpellSourceRecord>>

export type RawSpellScalingLevelDice = {
  label?: string
  scaling: Record<string, string>
}

export type RawSpell = {
  name: string
  source: string
  level: number
  time?: RawCastingTime[]
  range?: RawRange
  components?: RawComponents
  duration?: RawDurationEntry[]
  meta?: { ritual?: boolean }
  school?: string
  page?: number
  /** Main description blocks (strings and structured objects). */
  entries?: unknown[]
  entriesHigherLevel?: unknown[]
  scalingLevelDice?: RawSpellScalingLevelDice
  damageInflict?: string[]
  spellAttack?: string[]
  savingThrow?: string[]
}

type RawCastingTime = { number: number; unit: string }

type RawDistance =
  | { type: 'feet' | 'miles'; amount: number }
  | { type: 'touch' | 'self' | 'sight' | 'unlimited' }

type RawRange =
  | {
      type: 'point'
      distance: RawDistance
      /** e.g. "R" for reach — rare */
      alias?: boolean
    }
  | {
      type: 'cone' | 'line' | 'sphere' | 'hemisphere' | 'cube' | 'cylinder'
      distance: { type: 'feet' | 'miles'; amount: number }
    }
  | {
      type: 'radius'
      distance: { type: 'feet' | 'miles'; amount: number }
    }
  | { type: 'special' }

type RawComponents = {
  v?: boolean
  s?: boolean
  m?: string | { text?: string; cost?: number; consume?: boolean }
}

type RawDurationEntry =
  | { type: 'instant' }
  | { type: 'special' }
  | { type: 'permanent'; ends?: string[] }
  | {
      type: 'timed'
      duration: { type: string; amount: number }
      concentration?: boolean
    }

let spellIndexCache: SpellFileIndex | null = null
let allSpellsCache: RawSpell[] | null = null
let spellSourcesCache: SpellSourcesJson | null = null

export function spellRef(spell: Pick<RawSpell, 'name' | 'source'>): string {
  return `${spell.name}|${spell.source}`
}

/** Look up a vendored spell by its stored {@link SpellbookRow.fiveEToolsRef} string. */
export function findRawSpellByRefString(
  spells: RawSpell[],
  fiveEToolsRef: string,
): RawSpell | undefined {
  return spells.find((s) => spellRef(s) === fiveEToolsRef)
}

export async function loadSpellFileIndex(): Promise<SpellFileIndex> {
  if (spellIndexCache) return spellIndexCache
  const loaders = Object.values(spellIndexLoaders)
  if (loaders.length === 0) {
    throw new Error('5etools spell index.json not found (check vendor/5etools-src).')
  }
  spellIndexCache = await loaders[0]()
  return spellIndexCache
}

/** All spell records from every `spells-*.json` chunk (cached after first load). */
export async function loadAllRawSpells(): Promise<RawSpell[]> {
  if (allSpellsCache) return allSpellsCache
  const loaders = Object.entries(spellChunkModules)
  if (loaders.length === 0) {
    throw new Error('No spells-*.json chunks found under vendor/5etools-src/data/spells.')
  }
  const chunks = await Promise.all(loaders.map(([, load]) => load()))
  const out: RawSpell[] = []
  for (const mod of chunks) {
    if (Array.isArray(mod.spell)) out.push(...mod.spell)
  }
  allSpellsCache = out
  return out
}

export async function loadSpellSourcesJson(): Promise<SpellSourcesJson> {
  if (spellSourcesCache) return spellSourcesCache
  const loaders = Object.values(spellSourcesLoaders)
  if (loaders.length === 0) {
    throw new Error('5etools sources.json not found (check vendor/5etools-src).')
  }
  spellSourcesCache = await loaders[0]()
  return spellSourcesCache
}

export function getSpellSourceRecord(
  sources: SpellSourcesJson,
  spell: Pick<RawSpell, 'name' | 'source'>,
): SpellSourceRecord | undefined {
  return sources[spell.source]?.[spell.name]
}

export function listDistinctClassNames(sources: SpellSourcesJson): string[] {
  const set = new Set<string>()
  for (const book of Object.values(sources)) {
    for (const rec of Object.values(book)) {
      if (!rec || typeof rec !== 'object') continue
      for (const c of rec.class ?? []) {
        if (c?.name) set.add(c.name)
      }
      for (const c of rec.classVariant ?? []) {
        if (c?.name) set.add(c.name)
      }
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

/** Distinct `source` values on class / classVariant lines (PHB, XPHB, TCE, …). */
export function listDistinctClassListSources(sources: SpellSourcesJson): string[] {
  const set = new Set<string>()
  for (const book of Object.values(sources)) {
    for (const rec of Object.values(book)) {
      if (!rec || typeof rec !== 'object') continue
      for (const c of rec.class ?? []) {
        if (c?.source) set.add(c.source)
      }
      for (const c of rec.classVariant ?? []) {
        if (c?.source) set.add(c.source)
      }
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

/**
 * When both filters are `all`, any spell passes.
 * Otherwise requires a matching line on `class` or `classVariant` for this spell’s book entry.
 */
export function spellMatchesClassFilters(
  record: SpellSourceRecord | undefined,
  classFilter: string,
  classListSourceFilter: string,
): boolean {
  const anyClass = classFilter === 'all'
  const anyListSrc = classListSourceFilter === 'all'
  if (anyClass && anyListSrc) return true
  if (!record) return false
  const entries = [...(record.class ?? []), ...(record.classVariant ?? [])]
  if (entries.length === 0) return false
  return entries.some((e) => {
    const nameOk = anyClass || e.name === classFilter
    const srcOk = anyListSrc || e.source === classListSourceFilter
    return nameOk && srcOk
  })
}

export function formatSpellClassesForPreview(record: SpellSourceRecord | undefined): string {
  if (!record) return '—'
  const primary = record.class ?? []
  const uniqPrimary = [...new Set(primary.map((c) => c.name))].sort((a, b) =>
    a.localeCompare(b),
  )
  const chunks: string[] = []
  if (uniqPrimary.length) {
    chunks.push(uniqPrimary.join(', '))
  }
  const variants = record.classVariant ?? []
  if (variants.length) {
    const vstr = variants
      .map((v) => (v.definedInSource ? `${v.name} (${v.definedInSource})` : v.name))
      .join(', ')
    chunks.push(`Optional / expanded: ${vstr}`)
  }
  return chunks.length ? chunks.join('\n') : '—'
}

function formatCastingTime(times: RawCastingTime[] | undefined): string {
  if (!times?.length) return ''
  return times
    .map((t) => {
      const n = t.number
      const u = t.unit
      switch (u) {
        case 'action':
          return n === 1 ? '1 action' : `${n} actions`
        case 'bonus':
          return n === 1 ? '1 bonus action' : `${n} bonus actions`
        case 'reaction':
          return n === 1 ? '1 reaction' : `${n} reactions`
        case 'minute':
          return n === 1 ? '1 minute' : `${n} minutes`
        case 'hour':
          return n === 1 ? '1 hour' : `${n} hours`
        case 'day':
          return n === 1 ? '1 day' : `${n} days`
        default:
          return n === 1 ? `1 ${u}` : `${n} ${u}`
      }
    })
    .join(' or ')
}

function formatDistance(d: RawDistance): string {
  if (d.type === 'feet') return `${d.amount} ft.`
  if (d.type === 'miles') return `${d.amount} mile${d.amount === 1 ? '' : 's'}`
  if (d.type === 'touch') return 'Touch'
  if (d.type === 'self') return 'Self'
  if (d.type === 'sight') return 'Sight'
  if (d.type === 'unlimited') return 'Unlimited'
  return ''
}

function formatRange(range: RawRange | undefined): string {
  if (!range) return ''
  if (range.type === 'special') return 'Special'
  if (range.type === 'point') {
    return formatDistance(range.distance)
  }
  if (range.type === 'radius') {
    const { distance } = range
    if (distance.type === 'feet') {
      return `Self (${distance.amount}-ft radius)`
    }
    if (distance.type === 'miles') {
      return `Self (${distance.amount}-mile radius)`
    }
    return 'Self (radius)'
  }
  const { type, distance } = range
  if (distance.type === 'feet') {
    return `Self (${distance.amount}-ft ${type})`
  }
  if (distance.type === 'miles') {
    return `Self (${distance.amount}-mile ${type})`
  }
  return type
}

function hasMaterial(components: RawComponents | undefined): boolean {
  if (!components?.m) return false
  return typeof components.m === 'string' ? components.m.length > 0 : true
}

function hasConcentration(duration: RawDurationEntry[] | undefined): boolean {
  if (!duration?.length) return false
  return duration.some((d) => 'concentration' in d && d.concentration === true)
}

function isRitual(spell: RawSpell): boolean {
  return spell.meta?.ritual === true
}

/** Map a 5etools spell JSON object into our spellbook row (without `id`). */
export function rawSpellToSpellbookRow(spell: RawSpell): Omit<SpellbookRow, 'id'> {
  const cantrip = spell.level === 0
  return {
    cantrip,
    level: cantrip ? 0 : Math.min(9, Math.max(1, spell.level)),
    name: spell.name,
    castingTime: formatCastingTime(spell.time),
    range: formatRange(spell.range),
    concentration: hasConcentration(spell.duration),
    ritual: isRitual(spell),
    material: hasMaterial(spell.components),
    notes: '',
    fiveEToolsRef: spellRef(spell),
  }
}

const SCHOOL_LONG: Record<string, string> = {
  A: 'Abjuration',
  C: 'Conjuration',
  D: 'Divination',
  E: 'Enchantment',
  V: 'Evocation',
  I: 'Illusion',
  N: 'Necromancy',
  T: 'Transmutation',
}

export function spellSchoolLong(abbrev: string | undefined): string {
  if (!abbrev) return '—'
  return SCHOOL_LONG[abbrev] ?? abbrev
}

function pluralDurationUnit(n: number, unit: string): string {
  const map: Record<string, [string, string]> = {
    round: ['round', 'rounds'],
    minute: ['minute', 'minutes'],
    hour: ['hour', 'hours'],
    day: ['day', 'days'],
  }
  const [one, many] = map[unit] ?? [unit, `${unit}s`]
  return n === 1 ? one : many
}

function formatOneDuration(d: RawDurationEntry): string {
  if (d.type === 'instant') return 'Instantaneous'
  if (d.type === 'special') return 'Special'
  if (d.type === 'permanent') return 'Permanent'
  if (d.type === 'timed') {
    const { amount, type: unit } = d.duration
    const u = pluralDurationUnit(amount, unit)
    const base = `${amount} ${u}`
    return d.concentration ? `${base} (concentration)` : base
  }
  return ''
}

export function formatSpellDurationPlain(spell: RawSpell): string {
  const dur = spell.duration
  if (!dur?.length) return '—'
  return dur.map(formatOneDuration).filter(Boolean).join('; ') || '—'
}

export function formatSpellComponentsPlain(spell: RawSpell): string {
  const c = spell.components
  if (!c) return '—'
  const parts: string[] = []
  if (c.v) parts.push('V')
  if (c.s) parts.push('S')
  if (c.m) {
    if (typeof c.m === 'string') {
      parts.push(`M (${c.m})`)
    } else {
      const t = c.m.text?.trim()
      parts.push(t ? `M (${t})` : 'M')
    }
  }
  return parts.length ? parts.join(', ') : '—'
}

/** Turn 5etools `{@tag ...}` markers into readable plain text for previews. */
export function simplify5eToolsText(input: string): string {
  let s = input
  s = s.replace(/\{@chance\s+(\d+)[^}]*\}/gi, '$1% chance')
  s = s.replace(/\{@(\w+)\s+([^}]+)\}/g, (_full, tag: string, inner: string) => {
    const parts = inner.split('|').map((p: string) => p.trim())
    const t = tag.toLowerCase()
    if (t === 'creature' && parts.length > 0) {
      return parts[parts.length - 1] ?? parts[0]
    }
    if (t === 'filter' || t === 'scaledamage') {
      return parts[0] ?? inner
    }
    return parts[0] ?? inner
  })
  return s
}

function entryBlockToLines(entry: unknown): string[] {
  if (typeof entry === 'string') {
    return [simplify5eToolsText(entry)]
  }
  if (!entry || typeof entry !== 'object') return []
  const o = entry as Record<string, unknown>
  const t = o.type

  if (t === 'entries') {
    const lines: string[] = []
    if (typeof o.name === 'string' && o.name.length > 0) {
      lines.push(simplify5eToolsText(o.name))
    }
    if (Array.isArray(o.entries)) {
      for (const e of o.entries) {
        lines.push(...entryBlockToLines(e))
      }
    }
    return lines
  }

  if (t === 'list') {
    if (!Array.isArray(o.items)) return []
    return o.items.flatMap((item: unknown) => {
      if (typeof item === 'string') {
        return [`• ${simplify5eToolsText(item)}`]
      }
      const nested = entryBlockToLines(item)
      return nested.map((line) => (line.startsWith('•') ? line : `• ${line}`))
    })
  }

  if (t === 'table') {
    const lines: string[] = []
    if (typeof o.caption === 'string') lines.push(simplify5eToolsText(o.caption))
    const cols = Array.isArray(o.colLabels) ? o.colLabels : null
    const rows = o.rows
    if (Array.isArray(rows)) {
      for (const row of rows) {
        if (!Array.isArray(row)) continue
        const cells = row.map((cell) =>
          typeof cell === 'string'
            ? simplify5eToolsText(cell)
            : entryBlockToLines(cell).join(' '),
        )
        if (cols && cols.length === cells.length) {
          lines.push(
            cols
              .map((col, i) => {
                const label = typeof col === 'string' ? col : String(col)
                return `${label}: ${cells[i]}`
              })
              .join('; '),
          )
        } else {
          lines.push(cells.join(' | '))
        }
      }
    }
    return lines
  }

  if (Array.isArray(o.entries)) {
    return o.entries.flatMap((e: unknown) => entryBlockToLines(e))
  }
  return []
}

/** Full spell description + at higher levels, as plain text (paragraphs separated by blank lines). */
export function rawSpellDescriptionPlain(spell: RawSpell): string {
  const chunks: string[] = []
  if (Array.isArray(spell.entries)) {
    for (const e of spell.entries) {
      const lines = entryBlockToLines(e)
      if (lines.length) chunks.push(lines.join('\n'))
    }
  }
  if (Array.isArray(spell.entriesHigherLevel) && spell.entriesHigherLevel.length > 0) {
    for (const e of spell.entriesHigherLevel) {
      const lines = entryBlockToLines(e)
      if (lines.length) chunks.push(lines.join('\n'))
    }
  }
  return chunks.join('\n\n').trim() || '—'
}

/** Plain text from a 5etools `entries` array (items, features, etc.). */
export function rawJsonEntriesPlain(entries: unknown[] | undefined): string {
  if (!entries?.length) return '—'
  const chunks: string[] = []
  for (const e of entries) {
    const lines = entryBlockToLines(e)
    if (lines.length) chunks.push(lines.join('\n'))
  }
  return chunks.join('\n\n').trim() || '—'
}

export type SpellPreviewModel = {
  name: string
  levelLabel: string
  school: string
  castingTime: string
  range: string
  components: string
  duration: string
  ritual: string
  concentration: string
  source: string
  page: string
  /** Classes from `sources.json` (spell book entry). */
  classes: string
  description: string
}

export function buildSpellPreview(
  spell: RawSpell,
  sourceRecord?: SpellSourceRecord,
): SpellPreviewModel {
  const cantrip = spell.level === 0
  return {
    name: spell.name,
    levelLabel: cantrip ? 'Cantrip' : `${spell.level}${ordinalSuffix(spell.level)} level`,
    school: spellSchoolLong(spell.school),
    castingTime: formatCastingTime(spell.time) || '—',
    range: formatRange(spell.range) || '—',
    components: formatSpellComponentsPlain(spell),
    duration: formatSpellDurationPlain(spell),
    ritual: isRitual(spell) ? 'Yes' : 'No',
    concentration: hasConcentration(spell.duration) ? 'Yes' : 'No',
    source: spell.source,
    page: typeof spell.page === 'number' ? String(spell.page) : '—',
    classes: formatSpellClassesForPreview(sourceRecord),
    description: rawSpellDescriptionPlain(spell),
  }
}

function ordinalSuffix(n: number): string {
  const v = n % 100
  if (v >= 11 && v <= 13) return 'th'
  switch (n % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}
