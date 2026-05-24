import type { FeatRow } from '../character-sheet/types'
import { rawJsonEntriesPlain, simplify5eToolsText } from './spellsData'

/**
 * Loads feats from vendored 5etools `data/feats.json`.
 */

const featsModules = import.meta.glob<{ feat?: RawFeat[] }>(
  '../../vendor/5etools-src/data/feats.json',
)

export type RawFeat = {
  name: string
  source: string
  page?: number
  category?: string
  prerequisite?: unknown[]
  ability?: unknown[]
  repeatable?: boolean
  additionalSpells?: unknown[]
  entries?: unknown[]
}

const FEAT_CATEGORY_FULL: Record<string, string> = {
  D: 'Dragonmark',
  G: 'General',
  O: 'Origin',
  FS: 'Fighting Style',
  'FS:P': 'Fighting Style Replacement (Paladin)',
  'FS:R': 'Fighting Style Replacement (Ranger)',
  EB: 'Epic Boon',
}

const ABILITY_LONG: Record<string, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
}

const PREREQ_KEY_ORDER = [
  'level',
  'pact',
  'patron',
  'spell',
  'race',
  'alignment',
  'ability',
  'proficiency',
  'expertise',
  'spellcasting',
  'spellcasting2020',
  'spellcastingFeature',
  'spellcastingPrepared',
  'spellcastingFocus',
  'feature',
  'feat',
  'featCategory',
  'exclusiveFeatCategory',
  'optionalfeature',
  'background',
  'item',
  'itemType',
  'itemProperty',
  'campaign',
  'culture',
  'group',
  'otherSummary',
  'other',
] as const

function unwrap5eToolsJsonModule(mod: Record<string, unknown>): Record<string, unknown> {
  const d = mod.default
  if (d && typeof d === 'object' && d !== null && !Array.isArray(d)) {
    return d as Record<string, unknown>
  }
  return mod
}

let cache: RawFeat[] | null = null

export async function loadAllRawFeats(): Promise<RawFeat[]> {
  if (cache) return cache
  const loaders = Object.values(featsModules)
  if (loaders.length !== 1) {
    throw new Error('Expected exactly one feats.json module from glob')
  }
  const raw = (await loaders[0]!()) as Record<string, unknown>
  const mod = unwrap5eToolsJsonModule(raw)
  const list = mod.feat
  cache = Array.isArray(list) ? (list as RawFeat[]) : []
  return cache
}

export function featRef(feat: Pick<RawFeat, 'name' | 'source'>): string {
  return `${feat.name}|${feat.source}`
}

export function findRawFeatByRefString(
  feats: RawFeat[],
  fiveEToolsRef: string,
): RawFeat | undefined {
  return feats.find((f) => featRef(f) === fiveEToolsRef)
}

function formatPage(page: number | undefined): string {
  return page != null && Number.isFinite(page) ? String(page) : '—'
}

function titleCaseWords(input: string): string {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function abilityLong(key: string): string {
  return ABILITY_LONG[key.toLowerCase()] ?? titleCaseWords(key)
}

function formatFeatCategory(category: string | undefined): string {
  const key = category?.trim()
  if (!key) return '—'
  return FEAT_CATEGORY_FULL[key] ?? key
}

function joinConjunct(items: string[], conj: string, lastConj: string): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]!
  if (items.length === 2) return `${items[0]}${lastConj}${items[1]}`
  return `${items.slice(0, -1).join(conj)}${lastConj}${items.at(-1)}`
}

function formatUidName(uid: string): string {
  const parts = uid.split('|')
  const name = titleCaseWords(parts[0] ?? uid)
  const qualifier = parts[2]?.trim()
  return qualifier ? `${name} (${qualifier})` : name
}

function formatPrereqAbilityScores(entries: unknown[]): string {
  const options = entries
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return ''
      const groups: Record<number, string[]> = {}
      for (const [ab, req] of Object.entries(entry as Record<string, unknown>)) {
        if (typeof req !== 'number') continue
        ;(groups[req] = groups[req] ?? []).push(abilityLong(ab))
      }
      const byScore = Object.entries(groups)
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([req, abs]) => `${joinConjunct(abs.sort(), ', ', ' and ')} ${req}+`)
      return byScore.join('; ')
    })
    .filter(Boolean)

  if (options.length === 0) return ''
  if (options.length === 1) return options[0]!
  return joinConjunct(options, '; ', ' or ')
}

function formatPrereqLevel(value: unknown): string {
  if (typeof value === 'number') return `Level ${value}+`

  if (!value || typeof value !== 'object') return ''

  const o = value as Record<string, unknown>
  const level = typeof o.level === 'number' ? o.level : null
  const classObj = o.class as { name?: string } | undefined
  const subclassObj = o.subclass as { name?: string } | undefined

  let text = level != null ? `Level ${level}+` : ''
  if (classObj?.name) {
    const className = titleCaseWords(classObj.name)
    text += subclassObj?.name
      ? ` ${className} (${subclassObj.name})`
      : ` ${className}`
  } else if (subclassObj?.name) {
    text += ` (${subclassObj.name})`
  }
  return text.trim()
}

function formatPrereqRace(entries: unknown[]): string {
  const parts = entries
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return ''
      const o = entry as { name?: string; subrace?: string; displayEntry?: string }
      const name = o.displayEntry
        ? simplify5eToolsText(o.displayEntry)
        : titleCaseWords(o.name ?? '')
      return o.subrace ? `${name} (${o.subrace})` : name
    })
    .filter(Boolean)
  return joinConjunct(parts, ', ', ' or ')
}

function formatPrereqProficiency(entries: unknown[]): string {
  const parts = entries.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    return Object.entries(entry as Record<string, unknown>).map(([type, prof]) => {
      const p = String(prof)
      switch (type) {
        case 'armor':
          return p === 'shield'
            ? 'Shield training'
            : `${titleCaseWords(p)} armor proficiency`
        case 'weapon':
          return `${titleCaseWords(p)} weapon proficiency`
        case 'weaponGroup':
          return `${titleCaseWords(p)} weapon proficiency`
        default:
          return `${titleCaseWords(type)}: ${titleCaseWords(p)}`
      }
    })
  })
  return joinConjunct(parts, ', ', ' or ')
}

function formatPrereqFeatCategory(entries: unknown[]): string {
  const parts = entries.map((entry) => {
    if (typeof entry === 'string') {
      return `Any ${formatFeatCategory(entry)} feat`
    }
    if (entry && typeof entry === 'object') {
      const o = entry as { category?: string; count?: number }
      const label = formatFeatCategory(o.category)
      const count = o.count ?? 1
      return count > 1 ? `Any ${count}× ${label} feats` : `Any ${label} feat`
    }
    return ''
  })
  return joinConjunct(parts.filter(Boolean), ', ', ' or ')
}

function formatPrereqExclusiveFeatCategory(entries: unknown[]): string {
  const parts = entries.map((entry) => {
    const label = formatFeatCategory(String(entry))
    return `Can't have another ${label} feat`
  })
  return joinConjunct(parts, ', ', ' or ')
}

function formatPrereqPart(key: string, value: unknown): string {
  switch (key) {
    case 'level':
      return formatPrereqLevel(value)
    case 'ability':
      return Array.isArray(value) ? formatPrereqAbilityScores(value) : ''
    case 'feat':
    case 'optionalfeature':
      return Array.isArray(value)
        ? joinConjunct(value.map((uid) => formatUidName(String(uid))), ', ', ' or ')
        : ''
    case 'feature':
      return Array.isArray(value)
        ? joinConjunct(
            value.map((f) => simplify5eToolsText(String(f))),
            ', ',
            ' or ',
          ) + ' feature'
        : ''
    case 'race':
      return Array.isArray(value) ? formatPrereqRace(value) : ''
    case 'background':
      return Array.isArray(value)
        ? joinConjunct(
            value.map((bg) => {
              if (!bg || typeof bg !== 'object') return ''
              const o = bg as { name?: string; displayEntry?: string }
              return o.displayEntry
                ? simplify5eToolsText(o.displayEntry)
                : titleCaseWords(o.name ?? '')
            }),
            ', ',
            ' or ',
          )
        : ''
    case 'campaign':
    case 'culture':
    case 'group':
      return Array.isArray(value)
        ? joinConjunct(value.map((v) => String(v)), ', ', ' or ') + ` ${key}`
        : ''
    case 'featCategory':
      return Array.isArray(value) ? formatPrereqFeatCategory(value) : ''
    case 'exclusiveFeatCategory':
      return Array.isArray(value) ? formatPrereqExclusiveFeatCategory(value) : ''
    case 'proficiency':
      return Array.isArray(value) ? formatPrereqProficiency(value) : ''
    case 'spellcasting':
      return 'Ability to cast at least one spell'
    case 'spellcasting2020':
      return 'Spellcasting or Pact Magic feature'
    case 'spellcastingFeature':
      return 'Spellcasting feature'
    case 'spellcastingPrepared':
      return 'Prepared spellcasting'
    case 'spellcastingFocus':
      return 'Spellcasting focus'
    case 'spell':
      return Array.isArray(value)
        ? joinConjunct(
            value.map((sp) => {
              if (typeof sp === 'string') return simplify5eToolsText(sp.split('|')[0] ?? sp)
              if (sp && typeof sp === 'object') {
                const o = sp as { entry?: string; entrySummary?: string }
                return simplify5eToolsText(o.entrySummary ?? o.entry ?? '')
              }
              return ''
            }),
            ', ',
            ' or ',
          )
        : ''
    case 'otherSummary':
      if (value && typeof value === 'object') {
        const o = value as { entry?: string; entrySummary?: string }
        return simplify5eToolsText(o.entrySummary ?? o.entry ?? '')
      }
      return ''
    case 'other':
      return typeof value === 'string' ? simplify5eToolsText(value) : ''
    case 'pact':
      return typeof value === 'string' ? `Pact of the ${value}` : ''
    case 'patron':
      return typeof value === 'string' ? `${value} patron` : ''
    case 'alignment':
      return Array.isArray(value)
        ? joinConjunct(value.map((v) => String(v)), ', ', ' or ')
        : ''
    case 'note':
      return ''
    default:
      return ''
  }
}

function formatPrereqBlock(block: Record<string, unknown>): string {
  const weight = (key: string) => {
    const ix = PREREQ_KEY_ORDER.indexOf(key as (typeof PREREQ_KEY_ORDER)[number])
    return ix === -1 ? 999 : ix
  }

  const parts = Object.entries(block)
    .filter(([key]) => key !== 'note')
    .sort(([a], [b]) => weight(a) - weight(b))
    .map(([key, value]) => formatPrereqPart(key, value))
    .filter(Boolean)

  const note = typeof block.note === 'string' ? simplify5eToolsText(block.note) : ''
  const core = parts.join(', ')
  return note ? `${core}. ${note}` : core
}

export function formatFeatPrerequisitesPlain(prerequisites: unknown[] | undefined): string {
  if (!prerequisites?.length) return '—'

  const choices = prerequisites
    .map((entry) =>
      entry && typeof entry === 'object' ? formatPrereqBlock(entry as Record<string, unknown>) : '',
    )
    .filter(Boolean)

  if (!choices.length) return '—'
  if (choices.length === 1) return choices[0]!
  return joinConjunct(choices, '; ', ' or ')
}

function formatAbilityIncreaseEntry(entry: Record<string, unknown>): string {
  if (entry.choose && typeof entry.choose === 'object') {
    const choose = entry.choose as { from?: string[]; amount?: number; count?: number }
    const names = (choose.from ?? []).map(abilityLong)
    const list = names.length ? ` (${names.join(', ')})` : ''

    if (typeof choose.amount === 'number' && choose.amount > 0) {
      return `Increase one ability score by ${choose.amount}${list}`
    }
    if (typeof choose.count === 'number' && choose.count > 0) {
      const n = choose.count
      return `Increase ${n} ability score${n === 1 ? '' : 's'} by 1${list}`
    }
    if (names.length) return `Increase one of: ${names.join(', ')} (+1)`
    return 'Ability score increase (choose)'
  }

  const fixed: string[] = []
  for (const [key, value] of Object.entries(entry)) {
    if (key === 'choose' || key === 'hidden' || key === 'max') continue
    if (typeof value === 'number' && value !== 0) {
      fixed.push(`${value >= 0 ? '+' : ''}${value} ${abilityLong(key)}`)
    }
  }
  return fixed.join(', ')
}

export function formatFeatAbilityIncreasePlain(ability: unknown[] | undefined): string {
  if (!ability?.length) return '—'

  const visible = ability.filter((entry) => {
    if (!entry || typeof entry !== 'object') return false
    return !(entry as Record<string, unknown>).hidden
  })

  if (!visible.length) return '—'

  const parts = visible
    .map((entry) => formatAbilityIncreaseEntry(entry as Record<string, unknown>))
    .filter(Boolean)

  return parts.length ? parts.join('; ') : '—'
}

export type FeatPreviewModel = {
  name: string
  source: string
  page: string
  category: string
  prerequisites: string
  abilityIncrease: string
  repeatable: string
  additionalSpells: string
  description: string
}

export function buildFeatPreview(feat: RawFeat): FeatPreviewModel {
  return {
    name: feat.name,
    source: feat.source,
    page: formatPage(feat.page),
    category: formatFeatCategory(feat.category),
    prerequisites: formatFeatPrerequisitesPlain(feat.prerequisite),
    abilityIncrease: formatFeatAbilityIncreasePlain(feat.ability),
    repeatable: feat.repeatable ? 'Yes' : 'No',
    additionalSpells: feat.additionalSpells?.length ? 'Yes' : 'No',
    description: rawJsonEntriesPlain(feat.entries),
  }
}

export function rawFeatToFeatRow(feat: RawFeat): Omit<FeatRow, 'id'> {
  return {
    name: feat.name,
    fiveEToolsRef: featRef(feat),
  }
}
