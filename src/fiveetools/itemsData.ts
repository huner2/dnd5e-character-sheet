import { withStaleChunkRecovery } from '../chunkLoadRecovery'
import type { DamageType, DiceSize, EquipmentRow, WeaponRow } from '../character-sheet/types'
import { coerceDiceSize, DICE_SIZES } from '../character-sheet/types'
import { rawJsonEntriesPlain } from './spellsData'

/**
 * Loads magic items and equipment entries from vendored 5etools `data/items.json`.
 */

const itemsModules = import.meta.glob<{ item: RawItem[] }>(
  '../../vendor/5etools-src/data/items.json',
)

export type RawItem = {
  name: string
  source: string
  page?: number
  type?: string
  rarity?: string
  weight?: number
  /** Value in copper pieces (PHB coin standard in 5etools). */
  value?: number
  wondrous?: boolean
  reqAttune?: string | boolean
  entries?: unknown[]
  weaponCategory?: string
  dmg1?: string
  dmg2?: string
  dmgType?: string
  property?: string[]
  baseItem?: string
}

let cache: RawItem[] | null = null

export async function loadAllRawItems(): Promise<RawItem[]> {
  if (cache) return cache
  return withStaleChunkRecovery(async () => {
    const loaders = Object.values(itemsModules)
    if (loaders.length !== 1) {
      throw new Error('Expected exactly one items.json module from glob')
    }
    const mod = await loaders[0]!()
    cache = Array.isArray(mod.item) ? mod.item : []
    return cache
  })
}

export function itemRef(item: Pick<RawItem, 'name' | 'source'>): string {
  return `${item.name}|${item.source}`
}

export function findRawItemByRefString(
  items: RawItem[],
  fiveEToolsRef: string,
): RawItem | undefined {
  return items.find((i) => itemRef(i) === fiveEToolsRef)
}

export function formatItemValueGp(value: number | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  const gp = value / 100
  if (Number.isInteger(gp)) return `${gp} gp`
  const rounded = Math.round(gp * 100) / 100
  return `${rounded} gp`
}

function formatItemPage(page: number | undefined): string {
  return page != null && Number.isFinite(page) ? String(page) : '—'
}

function formatAttune(req: string | boolean | undefined): string {
  if (req === true) return 'Requires attunement'
  if (typeof req === 'string' && req.trim()) return `Attunement: ${req}`
  return '—'
}

export type ItemPreviewModel = {
  name: string
  type: string
  rarity: string
  weight: string
  value: string
  source: string
  page: string
  attunement: string
  description: string
}

export function buildItemPreview(item: RawItem): ItemPreviewModel {
  return {
    name: item.name,
    type: item.type?.trim() || '—',
    rarity: item.rarity?.trim() || '—',
    weight:
      item.weight != null && Number.isFinite(item.weight) ? `${item.weight} lb.` : '—',
    value: formatItemValueGp(item.value),
    source: item.source,
    page: formatItemPage(item.page),
    attunement: formatAttune(item.reqAttune),
    description: rawJsonEntriesPlain(item.entries),
  }
}

/** Map a 5etools item JSON object into our equipment row (without `id`). */
export function rawItemToEquipmentRow(item: RawItem): Omit<EquipmentRow, 'id'> {
  const gp =
    item.value != null && Number.isFinite(item.value) ? Math.round(item.value / 100) : 0
  return {
    name: item.name,
    quantity: 1,
    equipped: false,
    notes: '',
    goldGp: gp,
    fiveEToolsRef: itemRef(item),
  }
}

const ITEM_DMGTYPE_TO_FULL: Record<string, DamageType> = {
  A: 'Acid',
  B: 'Bludgeoning',
  C: 'Cold',
  F: 'Fire',
  O: 'Force',
  L: 'Lightning',
  N: 'Necrotic',
  P: 'Piercing',
  I: 'Poison',
  Y: 'Psychic',
  R: 'Radiant',
  S: 'Slashing',
  T: 'Thunder',
}

function itemTypeAbbrev(type: string | undefined): string {
  if (!type) return ''
  return type.split('|')[0]?.trim() ?? type
}

/** Melee / ranged weapon entries in `items.json` (type `M` or `R` with damage). */
export function isWeaponItem(item: RawItem): boolean {
  const abbrev = itemTypeAbbrev(item.type)
  return (abbrev === 'M' || abbrev === 'R') && typeof item.dmg1 === 'string' && item.dmg1.length > 0
}

export async function loadAllRawWeapons(): Promise<RawItem[]> {
  const items = await loadAllRawItems()
  return items.filter(isWeaponItem)
}

const DICE_NOTATION = /^(\d+)d(\d+)/i

export function parseWeaponDiceNotation(
  notation: string | undefined,
): { diceCount: number; diceSize: DiceSize } | null {
  if (!notation?.trim()) return null
  const m = notation.trim().match(DICE_NOTATION)
  if (!m) return null
  const diceCount = parseInt(m[1]!, 10)
  const face = parseInt(m[2]!, 10)
  const diceSize = `d${face}` as DiceSize
  if (!Number.isFinite(diceCount) || diceCount < 1) return null
  if (!(DICE_SIZES as readonly string[]).includes(diceSize)) return null
  return { diceCount, diceSize }
}

export function itemDmgTypeToDamageType(dmgType: string | undefined): DamageType {
  if (!dmgType?.trim()) return 'Slashing'
  const key = dmgType.trim().charAt(0).toUpperCase()
  return ITEM_DMGTYPE_TO_FULL[key] ?? 'Slashing'
}

export type WeaponPreviewModel = {
  name: string
  category: string
  damage: string
  damageType: string
  properties: string
  weight: string
  rarity: string
  source: string
  page: string
  description: string
}

export function buildWeaponPreview(item: RawItem): WeaponPreviewModel {
  const dmgParts = [item.dmg1, item.dmg2 ? `(versatile ${item.dmg2})` : null]
    .filter(Boolean)
    .join(' ')
  return {
    name: item.name,
    category: item.weaponCategory?.trim() || '—',
    damage: dmgParts || '—',
    damageType: itemDmgTypeToDamageType(item.dmgType),
    properties: item.property?.length ? item.property.join(', ') : '—',
    weight:
      item.weight != null && Number.isFinite(item.weight) ? `${item.weight} lb.` : '—',
    rarity: item.rarity?.trim() || '—',
    source: item.source,
    page: formatItemPage(item.page),
    description: rawJsonEntriesPlain(item.entries),
  }
}

/** Map a 5etools weapon item into our weapon row (without `id`). */
export function rawItemToWeaponRow(item: RawItem): Omit<WeaponRow, 'id'> {
  const parsed = parseWeaponDiceNotation(item.dmg1)
  const notes: string[] = []
  if (item.dmg2?.trim()) notes.push(`Versatile: ${item.dmg2}`)
  if (item.property?.length) notes.push(`Properties: ${item.property.join(', ')}`)
  return {
    name: item.name,
    attackBonus: 0,
    diceCount: parsed?.diceCount ?? 1,
    diceSize: parsed?.diceSize ?? coerceDiceSize(null),
    damageType: itemDmgTypeToDamageType(item.dmgType),
    notes: notes.join(' · '),
    fiveEToolsRef: itemRef(item),
  }
}
