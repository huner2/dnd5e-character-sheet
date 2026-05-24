import { emptyCharacterSheet, sampleCharacterSheet } from './sampleData'
import {
  DAMAGE_TYPES,
  DICE_SIZES,
  coerceDiceSize,
  type AbilityBlock,
  type AbilityKey,
  type AttunementRow,
  type CharacterSheetData,
  type CoinPouch,
  type DamageType,
  type DiceSize,
  type EquipmentRow,
  type FeatRow,
  type LanguageRow,
  type SkillLine,
  type SpellSlotLevel,
  type SpellbookRow,
  type WeaponProficiencies,
  type WeaponRow,
  type CharacterSheetEntry,
  type CharacterSheetsBundle,
  CHARACTER_SHEETS_BUNDLE_VERSION,
} from './types'

/** @deprecated Legacy single-sheet blob; migrated once into {@link SHEETS_BUNDLE_STORAGE_KEY}. */
export const CHARACTER_SHEET_STORAGE_KEY = 'dnd5e-character-sheet-data'

export const SHEETS_BUNDLE_STORAGE_KEY = 'dnd5e-character-sheets-bundle'

const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function pickString(v: unknown, fallback: string): string {
  return typeof v === 'string' ? v : fallback
}

function pickNum(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function pickBool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback
}

function reviveWeaponProficiencies(v: unknown): WeaponProficiencies {
  const s = sampleCharacterSheet.weaponProficiencies
  if (typeof v === 'string') {
    const low = v.toLowerCase()
    return {
      simple: low.includes('simple'),
      martial: low.includes('martial'),
      other: v,
    }
  }
  if (!isObject(v)) return s
  return {
    simple: pickBool(v.simple, s.simple),
    martial: pickBool(v.martial, s.martial),
    other: pickString(v.other, s.other),
  }
}

function reviveEquipmentRow(row: unknown, index: number): EquipmentRow {
  if (!isObject(row)) {
    return {
      id: `equipment-${index}`,
      name: '',
      quantity: 1,
      equipped: false,
      notes: '',
      goldGp: 0,
    }
  }
  const qty = pickNum(row.quantity, 1)
  const ref =
    typeof row.fiveEToolsRef === 'string' && row.fiveEToolsRef.trim().length > 0
      ? row.fiveEToolsRef.trim()
      : undefined
  return {
    id: typeof row.id === 'string' ? row.id : crypto.randomUUID(),
    name: pickString(row.name, ''),
    quantity: qty >= 1 ? qty : 1,
    equipped: pickBool(row.equipped, false),
    notes: pickString(row.notes, ''),
    goldGp: pickNum(row.goldGp, 0),
    ...(ref ? { fiveEToolsRef: ref } : {}),
  }
}

function reviveLanguageRow(row: unknown, index: number): LanguageRow {
  if (!isObject(row)) {
    return {
      id: `language-${index}`,
      name: '',
    }
  }
  const ref =
    typeof row.fiveEToolsRef === 'string' && row.fiveEToolsRef.trim().length > 0
      ? row.fiveEToolsRef.trim()
      : undefined
  return {
    id: typeof row.id === 'string' ? row.id : crypto.randomUUID(),
    name: pickString(row.name, ''),
    ...(ref ? { fiveEToolsRef: ref } : {}),
  }
}

function reviveFeatRow(row: unknown, index: number): FeatRow {
  if (!isObject(row)) {
    return {
      id: `feat-${index}`,
      name: '',
    }
  }
  const ref =
    typeof row.fiveEToolsRef === 'string' && row.fiveEToolsRef.trim().length > 0
      ? row.fiveEToolsRef.trim()
      : undefined
  return {
    id: typeof row.id === 'string' ? row.id : crypto.randomUUID(),
    name: pickString(row.name, ''),
    ...(ref ? { fiveEToolsRef: ref } : {}),
  }
}

function reviveFeats(v: unknown): FeatRow[] {
  if (!Array.isArray(v)) return emptyCharacterSheet.feats
  return v.map((row, i) => reviveFeatRow(row, i))
}

function reviveFeatNotes(v: unknown, legacyFeats: unknown): string {
  if (typeof v === 'string') return v
  if (typeof legacyFeats === 'string') {
    const t = legacyFeats.trim()
    return t === '—' ? '' : t
  }
  return ''
}

function reviveLanguages(v: unknown): LanguageRow[] {
  if (typeof v === 'string') {
    const parts = v
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean)
    return parts.map((name) => ({
      id: crypto.randomUUID(),
      name,
    }))
  }
  if (!Array.isArray(v)) return emptyCharacterSheet.languages
  return v.map((row, i) => reviveLanguageRow(row, i))
}

function reviveEquipment(v: unknown): EquipmentRow[] {
  if (typeof v === 'string') {
    const parts = v
      .split(/\n/)
      .flatMap((line) => line.split(','))
      .map((s) => s.trim())
      .filter(Boolean)
    return parts.map((name) => ({
      id: crypto.randomUUID(),
      name,
      quantity: 1,
      equipped: false,
      notes: '',
      goldGp: 0,
    }))
  }
  if (!Array.isArray(v)) return sampleCharacterSheet.equipment
  return v.map((row, i) => reviveEquipmentRow(row, i))
}

function reviveAttunement(v: unknown): CharacterSheetData['attunement'] {
  const s = sampleCharacterSheet.attunement
  if (!Array.isArray(v) || v.length < 3) return s
  const row = (x: unknown, i: number): AttunementRow => {
    if (!isObject(x)) return s[i]!
    return {
      name: pickString(x.name, ''),
      attuned: pickBool(x.attuned, false),
    }
  }
  return [row(v[0], 0), row(v[1], 1), row(v[2], 2)]
}

function reviveCoins(v: unknown): CoinPouch {
  const s = sampleCharacterSheet.coins
  if (!isObject(v)) return s
  return {
    cp: pickNum(v.cp, s.cp),
    sp: pickNum(v.sp, s.sp),
    ep: pickNum(v.ep, s.ep),
    gp: pickNum(v.gp, s.gp),
    pp: pickNum(v.pp, s.pp),
  }
}

function reviveArmorTraining(v: unknown): CharacterSheetData['armorTraining'] {
  const s = sampleCharacterSheet.armorTraining
  if (!isObject(v)) return s
  return {
    light: pickBool(v.light, s.light),
    medium: pickBool(v.medium, s.medium),
    heavy: pickBool(v.heavy, s.heavy),
    shields: pickBool(v.shields, s.shields),
  }
}

function reviveSkill(skill: unknown): SkillLine {
  if (!isObject(skill)) {
    return { name: '', proficient: false, bonus: 0 }
  }
  return {
    name: pickString(skill.name, ''),
    proficient: pickBool(skill.proficient, false),
    bonus: pickNum(skill.bonus, 0),
  }
}

function reviveAbilities(v: unknown): CharacterSheetData['abilities'] {
  const s = sampleCharacterSheet.abilities
  if (!isObject(v)) return s
  const out = { ...s }
  for (const k of ABILITY_KEYS) {
    const block = v[k]
    if (!isObject(block)) continue
    const base = s[k]
    const skillsRaw = block.skills
    const skills = Array.isArray(skillsRaw)
      ? skillsRaw.map(reviveSkill)
      : base.skills
    out[k] = {
      ...base,
      ...block,
      key: k,
      skills,
    } as AbilityBlock
  }
  return out
}

function coerceDamageType(value: unknown): DamageType {
  if (typeof value === 'string' && (DAMAGE_TYPES as readonly string[]).includes(value)) {
    return value as DamageType
  }
  return 'Slashing'
}

function reviveWeaponRow(row: unknown): WeaponRow {
  const d: WeaponRow = {
    id: crypto.randomUUID(),
    name: '',
    attackBonus: 0,
    diceCount: 1,
    diceSize: 'd8',
    damageType: 'Slashing',
    notes: '',
  }
  if (!isObject(row)) return d
  const fiveEToolsRefRaw = row.fiveEToolsRef
  const fiveEToolsRef =
    typeof fiveEToolsRefRaw === 'string' && fiveEToolsRefRaw.trim() !== ''
      ? fiveEToolsRefRaw.trim()
      : undefined
  return {
    id: typeof row.id === 'string' ? row.id : crypto.randomUUID(),
    name: pickString(row.name, ''),
    attackBonus: pickNum(row.attackBonus, 0),
    diceCount: pickNum(row.diceCount, 1),
    diceSize:
      typeof row.diceSize === 'string'
        ? coerceDiceSize(row.diceSize)
        : (DICE_SIZES as readonly string[]).includes(row.diceSize as string)
          ? (row.diceSize as DiceSize)
          : 'd8',
    damageType: coerceDamageType(row.damageType),
    notes: pickString(row.notes, ''),
    ...(fiveEToolsRef ? { fiveEToolsRef } : {}),
  }
}

function reviveWeapons(v: unknown): WeaponRow[] {
  if (!Array.isArray(v)) return sampleCharacterSheet.weapons
  return v.map(reviveWeaponRow)
}

function reviveSpellRow(row: unknown): SpellbookRow {
  const empty: SpellbookRow = {
    id: crypto.randomUUID(),
    cantrip: false,
    level: 1,
    name: '',
    castingTime: '',
    range: '',
    concentration: false,
    ritual: false,
    material: false,
    notes: '',
  }
  if (!isObject(row)) return empty

  let cantrip = pickBool(row.cantrip, false)
  let level = 1

  const levelRaw = row.level
  if (typeof levelRaw === 'number' && Number.isFinite(levelRaw)) {
    level = levelRaw
    if (cantrip) {
      level = 0
    } else {
      level = Math.min(9, Math.max(1, level))
    }
  } else if (typeof levelRaw === 'string') {
    const t = levelRaw.trim()
    const first = t.charAt(0)
    if (first === '0' || t.toLowerCase() === 'c') {
      cantrip = true
      level = 0
    } else if (/\d/.test(first)) {
      const n = parseInt(first, 10)
      level = Number.isFinite(n) ? Math.min(9, Math.max(1, n)) : 1
    }
  }

  const fiveEToolsRefRaw = row.fiveEToolsRef
  const fiveEToolsRef =
    typeof fiveEToolsRefRaw === 'string' && fiveEToolsRefRaw.trim() !== ''
      ? fiveEToolsRefRaw.trim()
      : undefined

  return {
    id: typeof row.id === 'string' ? row.id : crypto.randomUUID(),
    cantrip,
    level: cantrip ? 0 : Math.min(9, Math.max(1, level)),
    name: pickString(row.name, ''),
    castingTime: pickString(row.castingTime, ''),
    range: pickString(row.range, ''),
    concentration: pickBool(row.concentration, false),
    ritual: pickBool(row.ritual, false),
    material: pickBool(row.material, false),
    notes: pickString(row.notes, ''),
    ...(fiveEToolsRef ? { fiveEToolsRef } : {}),
  }
}

function reviveSpells(v: unknown): SpellbookRow[] {
  if (!Array.isArray(v)) return sampleCharacterSheet.spells
  return v.map(reviveSpellRow)
}

function reviveSpellSlots(v: unknown): SpellSlotLevel[] {
  const s = sampleCharacterSheet.spellSlotsByLevel
  if (!Array.isArray(v)) return s
  return s.map((slot, i) => {
    const x = v[i]
    if (!isObject(x)) return slot
    return {
      max: pickNum(x.max, slot.max),
      used: pickNum(x.used, slot.used),
    }
  })
}

function reviveSpellcasting(v: unknown): CharacterSheetData['spellcasting'] {
  const s = sampleCharacterSheet.spellcasting
  if (!isObject(v)) return s
  return {
    ability: pickString(v.ability, s.ability),
    modifier: pickNum(v.modifier, s.modifier),
    spellSaveDc: pickNum(v.spellSaveDc, s.spellSaveDc),
    spellAttackBonus: pickNum(v.spellAttackBonus, s.spellAttackBonus),
  }
}

/** Parse and normalize imported JSON (handles older export shapes). */
export function reviveCharacterSheet(parsed: unknown): CharacterSheetData {
  if (!isObject(parsed)) {
    throw new Error('Invalid file: JSON must be an object.')
  }
  const p = parsed
  const s = sampleCharacterSheet

  const bgRefRaw = p.backgroundFiveEToolsRef
  const backgroundFiveEToolsRef =
    typeof bgRefRaw === 'string' && bgRefRaw.trim().length > 0 ? bgRefRaw.trim() : undefined

  const clsRefRaw = p.classNameFiveEToolsRef
  const classNameFiveEToolsRef =
    typeof clsRefRaw === 'string' && clsRefRaw.trim().length > 0 ? clsRefRaw.trim() : undefined

  const subRefRaw = p.subclassFiveEToolsRef
  const subclassFiveEToolsRef =
    typeof subRefRaw === 'string' && subRefRaw.trim().length > 0 ? subRefRaw.trim() : undefined

  const spRefRaw = p.speciesFiveEToolsRef
  const speciesFiveEToolsRef =
    typeof spRefRaw === 'string' && spRefRaw.trim().length > 0 ? spRefRaw.trim() : undefined

  const hitDiceRaw = p.hitDiceDie
  const hitDiceDie: DiceSize =
    typeof hitDiceRaw === 'string'
      ? coerceDiceSize(hitDiceRaw)
      : (DICE_SIZES as readonly string[]).includes(String(hitDiceRaw))
        ? (hitDiceRaw as DiceSize)
        : s.hitDiceDie

  return {
    name: pickString(p.name, s.name),
    species: pickString(p.species, s.species),
    ...(speciesFiveEToolsRef ? { speciesFiveEToolsRef } : {}),
    className: pickString(p.className, s.className),
    ...(classNameFiveEToolsRef ? { classNameFiveEToolsRef } : {}),
    subclass: pickString(p.subclass, s.subclass),
    ...(subclassFiveEToolsRef ? { subclassFiveEToolsRef } : {}),
    background: pickString(p.background, s.background),
    ...(backgroundFiveEToolsRef
      ? { backgroundFiveEToolsRef }
      : {}),
    level: pickNum(p.level, s.level),
    xp: Math.max(0, pickNum(p.xp, 0)),
    ac: pickNum(p.ac, s.ac),
    hpCurrent: pickNum(p.hpCurrent, s.hpCurrent),
    hpMax: pickNum(p.hpMax, s.hpMax),
    hpTemp: pickNum(p.hpTemp, s.hpTemp),
    hitDiceSpent: pickNum(p.hitDiceSpent, s.hitDiceSpent),
    hitDiceMax: pickNum(p.hitDiceMax, s.hitDiceMax),
    hitDiceDie,
    deathSuccesses: Math.min(3, Math.max(0, pickNum(p.deathSuccesses, s.deathSuccesses))),
    deathFailures: Math.min(3, Math.max(0, pickNum(p.deathFailures, s.deathFailures))),
    proficiencyBonus: pickNum(p.proficiencyBonus, s.proficiencyBonus),
    inspiration: pickBool(p.inspiration, s.inspiration),
    initiative: pickNum(p.initiative, s.initiative),
    speed: pickNum(p.speed, s.speed),
    size: pickString(p.size, s.size),
    passivePerception: pickNum(p.passivePerception, s.passivePerception),
    abilities: reviveAbilities(p.abilities),
    weapons: reviveWeapons(p.weapons),
    classFeatures: pickString(p.classFeatures, s.classFeatures),
    narrative: pickString(p.narrative, s.narrative),
    speciesTraits: pickString(p.speciesTraits, s.speciesTraits),
    feats: reviveFeats(p.feats),
    featNotes: reviveFeatNotes(p.featNotes, p.feats),
    armorTraining: reviveArmorTraining(p.armorTraining),
    weaponProficiencies: reviveWeaponProficiencies(p.weaponProficiencies),
    toolProficiencies: pickString(p.toolProficiencies, s.toolProficiencies),
    spellcasting: reviveSpellcasting(p.spellcasting),
    spellSlotsByLevel: reviveSpellSlots(p.spellSlotsByLevel),
    spells: reviveSpells(p.spells),
    appearance: pickString(p.appearance, s.appearance),
    personalityTraits: pickString(p.personalityTraits, s.personalityTraits),
    alignment: pickString(p.alignment, s.alignment),
    languages: reviveLanguages(p.languages),
    equipment: reviveEquipment(p.equipment),
    attunement: reviveAttunement(p.attunement),
    coins: reviveCoins(p.coins),
  }
}

function createDefaultSheetsBundle(): CharacterSheetsBundle {
  const id = crypto.randomUUID()
  return {
    version: CHARACTER_SHEETS_BUNDLE_VERSION,
    activeId: id,
    sheets: [
      {
        id,
        data: structuredClone(emptyCharacterSheet),
      },
    ],
  }
}

function reviveSheetsBundle(parsed: unknown): CharacterSheetsBundle {
  if (!isObject(parsed)) {
    return createDefaultSheetsBundle()
  }
  const sheetsRaw = parsed.sheets
  if (!Array.isArray(sheetsRaw) || sheetsRaw.length === 0) {
    return createDefaultSheetsBundle()
  }
  const sheets: CharacterSheetEntry[] = []
  for (const item of sheetsRaw) {
    try {
      if (isObject(item) && 'data' in item) {
        const id = typeof item.id === 'string' ? item.id : crypto.randomUUID()
        sheets.push({ id, data: reviveCharacterSheet(item.data) })
      } else {
        sheets.push({
          id: crypto.randomUUID(),
          data: reviveCharacterSheet(item),
        })
      }
    } catch {
      /* skip invalid entries */
    }
  }
  if (sheets.length === 0) {
    return createDefaultSheetsBundle()
  }
  const activeId =
    typeof parsed.activeId === 'string' && sheets.some((s) => s.id === parsed.activeId)
      ? parsed.activeId
      : sheets[0]!.id
  return {
    version: CHARACTER_SHEETS_BUNDLE_VERSION,
    activeId,
    sheets,
  }
}

export function loadSheetsBundle(): CharacterSheetsBundle {
  if (typeof localStorage === 'undefined') {
    return createDefaultSheetsBundle()
  }
  try {
    const rawV2 = localStorage.getItem(SHEETS_BUNDLE_STORAGE_KEY)
    if (rawV2) {
      return reviveSheetsBundle(JSON.parse(rawV2))
    }
    const legacy = localStorage.getItem(CHARACTER_SHEET_STORAGE_KEY)
    if (legacy) {
      const data = reviveCharacterSheet(JSON.parse(legacy))
      const id = crypto.randomUUID()
      const bundle: CharacterSheetsBundle = {
        version: CHARACTER_SHEETS_BUNDLE_VERSION,
        activeId: id,
        sheets: [{ id, data }],
      }
      saveSheetsBundle(bundle)
      localStorage.removeItem(CHARACTER_SHEET_STORAGE_KEY)
      return bundle
    }
  } catch {
    /* use default */
  }
  return createDefaultSheetsBundle()
}

export function saveSheetsBundle(bundle: CharacterSheetsBundle): void {
  if (typeof localStorage === 'undefined') {
    return
  }
  try {
    localStorage.setItem(SHEETS_BUNDLE_STORAGE_KEY, JSON.stringify(bundle))
  } catch (e) {
    console.error('Failed to save character sheets', e)
  }
}

export function parseCharacterSheetJsonFile(text: string): CharacterSheetData {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Invalid JSON.')
  }
  return reviveCharacterSheet(parsed)
}

export function downloadCharacterSheetJson(data: CharacterSheetData): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const slug = data.name
    .trim()
    .replace(/[^a-zA-Z0-9\-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
  a.download = slug ? `dnd5e-character-${slug}.json` : 'dnd5e-character-sheet.json'
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
