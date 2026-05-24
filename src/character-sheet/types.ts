export const DICE_SIZES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'] as const
export type DiceSize = (typeof DICE_SIZES)[number]

/** Mantine `Select` items for dice notation (weapons, hit dice, etc.). */
export const DICE_SELECT_DATA = DICE_SIZES.map((d) => ({ value: d, label: d }))

export function coerceDiceSize(value: string | null): DiceSize {
  if (value && (DICE_SIZES as readonly string[]).includes(value)) {
    return value as DiceSize
  }
  return 'd8'
}

export const DAMAGE_TYPES = [
  'Acid',
  'Bludgeoning',
  'Cold',
  'Fire',
  'Force',
  'Lightning',
  'Necrotic',
  'Piercing',
  'Poison',
  'Psychic',
  'Radiant',
  'Slashing',
  'Thunder',
] as const
export type DamageType = (typeof DAMAGE_TYPES)[number]

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export interface SkillLine {
  name: string
  proficient: boolean
  /** Total skill bonus (ability + proficiency + other). */
  bonus: number
}

export interface AbilityBlock {
  key: AbilityKey
  label: string
  score: number
  modifier: number
  saveProficient: boolean
  saveBonus: number
  skills: SkillLine[]
}

export interface WeaponRow {
  id: string
  name: string
  /** Attack roll modifier or spell attack bonus (also used when the entry is a spell attack). */
  attackBonus: number
  /** Number of damage dice (e.g. 2 for 2d6). */
  diceCount: number
  diceSize: DiceSize
  damageType: DamageType
  notes: string
  /**
   * When set, row was filled from vendored 5etools weapon data (`Name|SOURCE`).
   * Name and base damage come from the compendium; attack bonus and notes stay editable.
   */
  fiveEToolsRef?: string
}

export interface ArmorTraining {
  light: boolean
  medium: boolean
  heavy: boolean
  shields: boolean
}

/** PHB-style categories plus free text for edge cases. */
export interface WeaponProficiencies {
  simple: boolean
  martial: boolean
  /** Specific weapons, firearms, homebrew, etc. */
  other: string
}

/** Max slots at this spell level and how many are expended */
export interface SpellSlotLevel {
  max: number
  used: number
}

export interface SpellbookRow {
  id: string
  /** True for cantrips (level is stored as 0). */
  cantrip: boolean
  /** Spell slot level 1–9; 0 when {@link cantrip} is true. */
  level: number
  name: string
  castingTime: string
  range: string
  concentration: boolean
  ritual: boolean
  material: boolean
  notes: string
  /**
   * When set, this row was filled from vendored 5etools data (`Name|SOURCE`, e.g. `Fireball|PHB`).
   * The spells table keeps these rows aligned with the compendium (only Notes stay editable).
   * Custom/homebrew spells omit this.
   */
  fiveEToolsRef?: string
}

/** Full ability names for {@link SpellcastingBlock.ability} (matches ability column labels). */
export const SPELLCASTING_ABILITY_NAMES = [
  'Strength',
  'Dexterity',
  'Constitution',
  'Intelligence',
  'Wisdom',
  'Charisma',
] as const

export function spellcastingAbilitySelectItems(current: string): {
  value: string
  label: string
}[] {
  const base = SPELLCASTING_ABILITY_NAMES.map((name) => ({ value: name, label: name }))
  const trimmed = current.trim()
  if (
    trimmed &&
    !(SPELLCASTING_ABILITY_NAMES as readonly string[]).includes(trimmed)
  ) {
    return [...base, { value: trimmed, label: trimmed }]
  }
  return base
}

export interface SpellcastingBlock {
  ability: string
  modifier: number
  spellSaveDc: number
  spellAttackBonus: number
}

export interface CoinPouch {
  cp: number
  sp: number
  ep: number
  gp: number
  pp: number
}

export interface AttunementRow {
  name: string
  attuned: boolean
}

export interface EquipmentRow {
  id: string
  name: string
  /** Stack count for identical items (e.g. torches, rations). */
  quantity: number
  /** True when the item is worn or actively wielded. */
  equipped: boolean
  notes: string
  /** Optional rough value in gold pieces. */
  goldGp: number
  /**
   * When set, this row was filled from vendored 5etools data (`Name|SOURCE`).
   * The equipment table keeps the item name aligned with the compendium.
   */
  fiveEToolsRef?: string
}

export interface LanguageRow {
  id: string
  name: string
  /**
   * When set, this row was filled from vendored 5etools data (`Name|SOURCE`).
   * The languages list keeps the name aligned with the compendium.
   */
  fiveEToolsRef?: string
}

export interface FeatRow {
  id: string
  name: string
  /**
   * When set, this row was filled from vendored 5etools data (`Name|SOURCE`).
   */
  fiveEToolsRef?: string
}

export interface CharacterSheetData {
  name: string
  species: string
  /**
   * When set, {@link species} matches vendored 5etools races (`Name|SOURCE`).
   */
  speciesFiveEToolsRef?: string
  className: string
  /**
   * When set, {@link className} matches vendored 5etools (`Name|SOURCE`) and the header
   * keeps the class name aligned with the compendium.
   */
  classNameFiveEToolsRef?: string
  subclass: string
  /**
   * When set, {@link subclass} matches vendored 5etools for the current compendium class
   * (`Name|ClassName|ClassSource|SubclassSource`).
   */
  subclassFiveEToolsRef?: string
  background: string
  /**
   * When set, {@link background} matches vendored 5etools (`Name|SOURCE`) and the header
   * keeps the name aligned with the compendium.
   */
  backgroundFiveEToolsRef?: string
  level: number
  /** Current experience points. */
  xp: number
  ac: number
  hpCurrent: number
  hpMax: number
  hpTemp: number
  hitDiceSpent: number
  hitDiceMax: number
  hitDiceDie: DiceSize
  deathSuccesses: number
  deathFailures: number
  proficiencyBonus: number
  inspiration: boolean
  initiative: number
  speed: number
  size: string
  passivePerception: number
  abilities: Record<AbilityKey, AbilityBlock>
  weapons: WeaponRow[]
  classFeatures: string
  narrative: string
  speciesTraits: string
  /** Selected feats (compendium and custom). */
  feats: FeatRow[]
  /** Free-form notes about feats (separate from the feat list). */
  featNotes: string
  armorTraining: ArmorTraining
  weaponProficiencies: WeaponProficiencies
  toolProficiencies: string

  /** Spellcasting page */
  spellcasting: SpellcastingBlock
  /** Index 0 = spell level 1 … index 8 = level 9 */
  spellSlotsByLevel: SpellSlotLevel[]
  spells: SpellbookRow[]

  /** Bio / social */
  appearance: string
  personalityTraits: string
  alignment: string
  languages: LanguageRow[]

  /** Inventory page */
  equipment: EquipmentRow[]
  attunement: [AttunementRow, AttunementRow, AttunementRow]
  coins: CoinPouch
}

/** Creature sizes (PHB-style). */
export const STANDARD_CREATURE_SIZES = [
  'Tiny',
  'Small',
  'Medium',
  'Large',
  'Huge',
  'Gargantuan',
] as const

export const CREATURE_SIZE_SELECT_DATA: { value: string; label: string }[] = [
  { value: '', label: '—' },
  ...STANDARD_CREATURE_SIZES.map((s) => ({ value: s, label: s })),
]

/** Typical PC alignments (PHB-style nine-grid). */
export const STANDARD_CHARACTER_ALIGNMENTS = [
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil',
] as const

/** Mantine `Select` items for alignment; keeps non-standard imported text selectable. */
export function alignmentSelectItems(current: string): { value: string; label: string }[] {
  const none = { value: '', label: '—' }
  const standard = STANDARD_CHARACTER_ALIGNMENTS.map((a) => ({ value: a, label: a }))
  const t = current.trim()
  if (t && !(STANDARD_CHARACTER_ALIGNMENTS as readonly string[]).includes(t)) {
    return [none, { value: t, label: `${t} (custom)` }, ...standard]
  }
  return [none, ...standard]
}

/** One saved character in the library (sidebar list). */
export interface CharacterSheetEntry {
  id: string
  data: CharacterSheetData
}

export const CHARACTER_SHEETS_BUNDLE_VERSION = 5 as const

/** Persisted root: multiple characters + which one is open. */
export interface CharacterSheetsBundle {
  version: typeof CHARACTER_SHEETS_BUNDLE_VERSION
  activeId: string
  sheets: CharacterSheetEntry[]
}
