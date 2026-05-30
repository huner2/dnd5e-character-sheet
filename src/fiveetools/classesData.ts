import { withStaleChunkRecovery } from '../chunkLoadRecovery'
import { rawJsonEntriesPlain } from './spellsData'

/**
 * Loads classes and subclasses from vendored 5etools `data/class/class-*.json` chunks.
 */

const classChunkModules = import.meta.glob<{
  class?: RawClass[]
  classFeature?: RawClassFeature[]
  subclass?: RawSubclass[]
  subclassFeature?: RawSubclassFeature[]
}>('../../vendor/5etools-src/data/class/class-*.json')

export type RawClass = {
  name: string
  source: string
  page?: number
  edition?: string
  hd?: { number?: number; faces: number }
  /** Saving throw proficiencies (ability keys). */
  proficiency?: string[]
  spellcastingAbility?: string
  srd?: boolean
}

export type RawClassFeature = {
  name: string
  source: string
  page?: number
  className: string
  classSource: string
  level: number
  entries?: unknown[]
}

export type RawSubclass = {
  name: string
  shortName?: string
  source: string
  className: string
  classSource: string
  page?: number
  edition?: string
}

export type RawSubclassFeature = {
  name: string
  source: string
  page?: number
  className: string
  classSource: string
  subclassShortName: string
  subclassSource: string
  level: number
  entries?: unknown[]
  header?: number
}

const ABILITY_LONG: Record<string, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
}

export type CompendiumClass = RawClass & {
  /** Class features from the same file for this name + source. */
  _features: RawClassFeature[]
}

export type CompendiumSubclass = RawSubclass & {
  _features: RawSubclassFeature[]
}

type ClassCompendiumCache = {
  classes: CompendiumClass[]
  subclasses: CompendiumSubclass[]
}

let cache: ClassCompendiumCache | null = null

/**
 * Vite JSON imports expose a `default` copy of the file. Spell/item chunks also hoist
 * keys to the top level, but `class-*.json` only lists `class` on `default`, so we must
 * unwrap or the class list is empty.
 */
function unwrap5eToolsJsonModule(mod: Record<string, unknown>): Record<string, unknown> {
  const d = mod.default
  if (d && typeof d === 'object' && d !== null && !Array.isArray(d)) {
    return d as Record<string, unknown>
  }
  return mod
}

function subclassShortKey(sc: RawSubclass): string {
  return sc.shortName ?? sc.name
}

function formatHitDie(hd: RawClass['hd']): string {
  if (!hd?.faces) return '—'
  const n = hd.number ?? 1
  return `${n}d${hd.faces}`
}

function formatSavingThrows(keys: string[] | undefined): string {
  if (!keys?.length) return '—'
  return keys.map((k) => ABILITY_LONG[k] ?? k).join(', ')
}

function formatSpellAbility(key: string | undefined): string {
  if (!key?.trim()) return '—'
  return ABILITY_LONG[key.toLowerCase()] ?? key
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

async function loadClassCompendium(): Promise<ClassCompendiumCache> {
  if (cache) return cache
  return withStaleChunkRecovery(async () => {
    const classesOut: CompendiumClass[] = []
    const subclassesOut: CompendiumSubclass[] = []
    for (const load of Object.values(classChunkModules)) {
      const mod = unwrap5eToolsJsonModule((await load()) as Record<string, unknown>)
      const classFeats = Array.isArray(mod.classFeature) ? mod.classFeature : []
      const subFeats = Array.isArray(mod.subclassFeature) ? mod.subclassFeature : []
      const classList = Array.isArray(mod.class) ? mod.class : []
      const subList = Array.isArray(mod.subclass) ? mod.subclass : []

      for (const c of classList) {
        classesOut.push({
          ...c,
          _features: classFeats.filter(
            (f) => f.className === c.name && f.classSource === c.source,
          ),
        })
      }
      for (const s of subList) {
        const sk = subclassShortKey(s)
        subclassesOut.push({
          ...s,
          _features: subFeats.filter(
            (f) =>
              f.className === s.className &&
              f.classSource === s.classSource &&
              f.subclassShortName === sk &&
              f.subclassSource === s.source,
          ),
        })
      }
    }
    cache = { classes: classesOut, subclasses: subclassesOut }
    return cache
  })
}

export async function loadAllRawClasses(): Promise<CompendiumClass[]> {
  return (await loadClassCompendium()).classes
}

export async function loadAllCompendiumSubclasses(): Promise<CompendiumSubclass[]> {
  return (await loadClassCompendium()).subclasses
}

/** Parse `ClassName|SOURCE` from {@link classRef}. */
export function parseClassRef(ref: string): { name: string; source: string } | null {
  const t = ref.trim()
  const i = t.lastIndexOf('|')
  if (i <= 0 || i >= t.length - 1) return null
  const name = t.slice(0, i)
  const source = t.slice(i + 1)
  if (!name || !source) return null
  return { name, source }
}

export function listSubclassesForClassRef(
  allSubclasses: CompendiumSubclass[],
  classFiveEToolsRef: string,
): CompendiumSubclass[] {
  const parsed = parseClassRef(classFiveEToolsRef)
  if (!parsed) return []
  return allSubclasses.filter(
    (s) => s.className === parsed.name && s.classSource === parsed.source,
  )
}

export function classRef(c: Pick<RawClass, 'name' | 'source'>): string {
  return `${c.name}|${c.source}`
}

export function subclassRef(
  sc: Pick<RawSubclass, 'name' | 'className' | 'classSource' | 'source'>,
): string {
  return `${sc.name}|${sc.className}|${sc.classSource}|${sc.source}`
}

export function findCompendiumClassByRefString(
  classes: CompendiumClass[],
  fiveEToolsRef: string,
): CompendiumClass | undefined {
  return classes.find((c) => classRef(c) === fiveEToolsRef)
}

export function findCompendiumSubclassByRefString(
  subclasses: CompendiumSubclass[],
  fiveEToolsRef: string,
): CompendiumSubclass | undefined {
  return subclasses.find((s) => subclassRef(s) === fiveEToolsRef)
}

function formatPage(page: number | undefined): string {
  return page != null && Number.isFinite(page) ? String(page) : '—'
}

export type ClassPreviewModel = {
  name: string
  source: string
  page: string
  hitDie: string
  savingThrows: string
  spellcastingAbility: string
  description: string
}

export function buildClassPreview(c: CompendiumClass): ClassPreviewModel {
  const feats = [...c._features].sort((a, b) => {
    const d = a.level - b.level
    return d !== 0 ? d : a.name.localeCompare(b.name)
  })
  const chunks: string[] = []
  for (const f of feats.slice(0, 8)) {
    const body = rawJsonEntriesPlain(f.entries)
    if (body !== '—') {
      chunks.push(`${f.name} (${f.level}${ordinalSuffix(f.level)} level)\n${body}`)
    }
  }
  const description = chunks.join('\n\n').trim() || '—'

  return {
    name: c.name,
    source: c.source,
    page: formatPage(c.page),
    hitDie: formatHitDie(c.hd),
    savingThrows: formatSavingThrows(c.proficiency),
    spellcastingAbility: formatSpellAbility(c.spellcastingAbility),
    description,
  }
}

/** Full plain-text listing of every class feature block (for the Background tab). */
export function compendiumClassFeaturesPlain(c: CompendiumClass): string {
  const feats = [...c._features].sort((a, b) => {
    const d = a.level - b.level
    return d !== 0 ? d : a.name.localeCompare(b.name)
  })
  const chunks: string[] = []
  for (const f of feats) {
    const body = rawJsonEntriesPlain(f.entries)
    if (body !== '—') {
      chunks.push(`${f.name} (${f.level}${ordinalSuffix(f.level)} level)\n${body}`)
    }
  }
  return chunks.join('\n\n').trim() || '—'
}

export type SubclassPreviewModel = {
  name: string
  source: string
  page: string
  parentClass: string
  description: string
}

export function buildSubclassPreview(s: CompendiumSubclass): SubclassPreviewModel {
  const feats = [...s._features].sort((a, b) => {
    const d = a.level - b.level
    return d !== 0 ? d : a.name.localeCompare(b.name)
  })
  const chunks: string[] = []
  for (const f of feats.slice(0, 10)) {
    if (f.header === 2) continue
    const body = rawJsonEntriesPlain(f.entries)
    if (body !== '—') {
      chunks.push(`${f.name} (${f.level}${ordinalSuffix(f.level)} level)\n${body}`)
    }
  }
  const description = chunks.join('\n\n').trim() || '—'

  return {
    name: s.name,
    source: s.source,
    page: formatPage(s.page),
    parentClass: `${s.className} (${s.classSource})`,
    description,
  }
}

export function rawClassToSheetFields(c: CompendiumClass): {
  className: string
  classNameFiveEToolsRef: string
  subclass: string
  subclassFiveEToolsRef?: undefined
} {
  return {
    className: c.name,
    classNameFiveEToolsRef: classRef(c),
    subclass: '',
    subclassFiveEToolsRef: undefined,
  }
}

export function rawSubclassToSheetFields(s: CompendiumSubclass): {
  subclass: string
  subclassFiveEToolsRef: string
} {
  return {
    subclass: s.name,
    subclassFiveEToolsRef: subclassRef(s),
  }
}
