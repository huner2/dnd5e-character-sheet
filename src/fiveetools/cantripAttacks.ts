import type {
  DamageType,
  DiceSize,
  SpellbookRow,
  SpellcastingBlock,
} from '../character-sheet/types'
import { DAMAGE_TYPES } from '../character-sheet/types'
import { parseWeaponDiceNotation } from './itemsData'
import {
  findRawSpellByRefString,
  type RawSpell,
} from './spellsData'

export type CantripAttackRow = {
  spellId: string
  name: string
  /** Spell attack bonus or save DC (see {@link CantripAttackRow.usesSaveDc}). */
  attackBonus: number
  usesSaveDc: boolean
  diceCount: number
  diceSize: DiceSize
  damageType: DamageType
  notes: string
}

function inflictToDamageType(raw: string | undefined): DamageType {
  if (!raw?.trim()) return 'Force'
  const normalized = raw.trim().toLowerCase()
  const match = (DAMAGE_TYPES as readonly string[]).find(
    (t) => t.toLowerCase() === normalized,
  )
  return (match ?? 'Force') as DamageType
}

function scalingDiceAtLevel(
  scaling: Record<string, string>,
  characterLevel: number,
): string {
  const keys = Object.keys(scaling)
    .map((k) => parseInt(k, 10))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b)
  if (!keys.length) return '1d8'
  let chosen = keys[0]!
  for (const k of keys) {
    if (k <= characterLevel) chosen = k
    else break
  }
  return scaling[String(chosen)] ?? scaling['1'] ?? '1d8'
}

/** Cantrip with scaling or explicit damage / attack-or-save tags in compendium data. */
export function isRawSpellDamageCantrip(spell: RawSpell): boolean {
  if (spell.level !== 0) return false
  if (spell.scalingLevelDice?.scaling) return true
  if (!spell.damageInflict?.length) return false
  return Boolean(spell.spellAttack?.length || spell.savingThrow?.length)
}

function cantripAttackBonus(
  spell: RawSpell,
  spellcasting: SpellcastingBlock,
): { attackBonus: number; usesSaveDc: boolean } {
  const usesSave =
    Boolean(spell.savingThrow?.length) && !spell.spellAttack?.length
  return {
    attackBonus: usesSave
      ? spellcasting.spellSaveDc
      : spellcasting.spellAttackBonus,
    usesSaveDc: usesSave,
  }
}

function cantripNotes(spellRow: SpellbookRow, raw: RawSpell): string {
  const parts: string[] = []
  if (spellRow.range.trim()) parts.push(spellRow.range.trim())
  if (raw.scalingLevelDice?.label?.trim()) {
    parts.push(raw.scalingLevelDice.label.trim())
  }
  if (spellRow.notes.trim()) parts.push(spellRow.notes.trim())
  return parts.join(' · ')
}

function rowFromRawSpell(
  spellRow: SpellbookRow,
  raw: RawSpell,
  spellcasting: SpellcastingBlock,
  characterLevel: number,
): CantripAttackRow | null {
  if (!isRawSpellDamageCantrip(raw)) return null

  const diceStr = raw.scalingLevelDice?.scaling
    ? scalingDiceAtLevel(raw.scalingLevelDice.scaling, characterLevel)
    : '1d8'
  const parsed = parseWeaponDiceNotation(diceStr)
  const { attackBonus, usesSaveDc } = cantripAttackBonus(raw, spellcasting)
  const damageType = inflictToDamageType(raw.damageInflict?.[0])

  return {
    spellId: spellRow.id,
    name: spellRow.name,
    attackBonus,
    usesSaveDc,
    diceCount: parsed?.diceCount ?? 1,
    diceSize: parsed?.diceSize ?? 'd8',
    damageType,
    notes: cantripNotes(spellRow, raw),
  }
}

/** Damage cantrips on the Spells tab, scaled to {@link characterLevel}. */
export function deriveCantripAttackRows(
  spells: SpellbookRow[],
  spellcasting: SpellcastingBlock,
  characterLevel: number,
  rawSpells: RawSpell[],
): CantripAttackRow[] {
  const level = Math.max(1, Math.min(20, characterLevel))
  const out: CantripAttackRow[] = []

  for (const spellRow of spells) {
    if (!spellRow.cantrip) continue
    const ref = spellRow.fiveEToolsRef?.trim()
    if (!ref) continue
    const raw = findRawSpellByRefString(rawSpells, ref)
    if (!raw) continue
    const row = rowFromRawSpell(spellRow, raw, spellcasting, level)
    if (row) out.push(row)
  }

  return out
}
