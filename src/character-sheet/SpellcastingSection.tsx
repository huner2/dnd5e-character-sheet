import {
  Group,
  NumberInput,
  Select,
  Stack,
  Table,
  Text,
  UnstyledButton,
} from '@mantine/core'
import {
  spellcastingAbilitySelectItems,
  type CharacterSheetData,
  type SpellSlotLevel,
} from './types'
import classes from './CharacterSheet.module.scss'
import { nextUsedAfterPillClick } from './slotPillClick'
import { SectionCard } from './SectionCard'

export type SpellcastingStatsProps = {
  spellcasting: CharacterSheetData['spellcasting']
  onChangeSpellcasting: (patch: Partial<CharacterSheetData['spellcasting']>) => void
}

export function SpellcastingStatsCard({
  spellcasting,
  onChangeSpellcasting,
}: SpellcastingStatsProps) {
  return (
    <SectionCard title="Spellcasting">
      <Group grow align="flex-end" wrap="wrap" gap="sm">
        <Select
          label="Spellcasting ability"
          size="xs"
          data={spellcastingAbilitySelectItems(spellcasting.ability)}
          value={spellcasting.ability.trim() || null}
          onChange={(v) => onChangeSpellcasting({ ability: v ?? '' })}
          searchable
          clearable={false}
        />
        <NumberInput
          label="Spellcasting modifier"
          size="xs"
          value={spellcasting.modifier}
          onChange={(v) =>
            onChangeSpellcasting({
              modifier: typeof v === 'number' ? v : spellcasting.modifier,
            })
          }
          min={-10}
          max={20}
          classNames={{ input: classes.mono }}
        />
        <NumberInput
          label="Spell save DC"
          size="xs"
          value={spellcasting.spellSaveDc}
          onChange={(v) =>
            onChangeSpellcasting({
              spellSaveDc: typeof v === 'number' ? v : spellcasting.spellSaveDc,
            })
          }
          min={8}
          max={30}
          classNames={{ input: classes.mono }}
        />
        <NumberInput
          label="Spell attack"
          size="xs"
          value={spellcasting.spellAttackBonus}
          onChange={(v) =>
            onChangeSpellcasting({
              spellAttackBonus:
                typeof v === 'number' ? v : spellcasting.spellAttackBonus,
            })
          }
          min={-10}
          max={25}
          classNames={{ input: classes.mono }}
        />
      </Group>
    </SectionCard>
  )
}

export type SpellSlotsCardProps = {
  spellSlotsByLevel: CharacterSheetData['spellSlotsByLevel']
  onChangeSlot: (levelIndex: number, patch: Partial<SpellSlotLevel>) => void
  /** Combat layout: clamp card width to table intrinsic size (no extra empty margin). */
  shrinkToFit?: boolean
}

export function SpellSlotsCard({
  spellSlotsByLevel,
  onChangeSlot,
  shrinkToFit = false,
}: SpellSlotsCardProps) {
  const spellSlotsTable = (
    <Table
      captionSide="bottom"
      striped
      highlightOnHover
      horizontalSpacing="xs"
      verticalSpacing={4}
    >
      <Table.Caption className={classes.spellSlotsCaption}>
        <Text size="xs" c="dimmed">
          Set total per level, then tap squares left-to-right to mark expended slots (tap an
          expended square to clear from there).
        </Text>
      </Table.Caption>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Level</Table.Th>
          <Table.Th>Total</Table.Th>
          <Table.Th>Expended</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {spellSlotsByLevel.map((slot, index) => {
          const level = index + 1
          const max = slot.max
          const used = slot.used
          return (
            <Table.Tr key={level}>
              <Table.Td>
                <Text size="sm" fw={600} className={classes.mono}>
                  {level}
                </Text>
              </Table.Td>
              <Table.Td>
                <NumberInput
                  size="xs"
                  min={0}
                  max={20}
                  w={72}
                  value={max}
                  onChange={(v) => {
                    const nextMax = typeof v === 'number' ? v : max
                    const nextUsed = Math.min(used, nextMax)
                    onChangeSlot(index, { max: nextMax, used: nextUsed })
                  }}
                  classNames={{ input: classes.mono }}
                />
              </Table.Td>
              <Table.Td>
                {max <= 0 ? (
                  <Text size="xs" c="dimmed">
                    —
                  </Text>
                ) : (
                  <div
                    className={classes.spellSlotPills}
                    role="group"
                    aria-label={`Level ${level} expended spell slots`}
                  >
                    {Array.from({ length: max }, (_, pillIndex) => (
                      <UnstyledButton
                        key={pillIndex}
                        type="button"
                        disabled={max <= 0}
                        className={`${classes.spellSlotPill} ${pillIndex < used ? classes.spellSlotPillFilled : ''}`}
                        aria-pressed={pillIndex < used}
                        aria-label={
                          pillIndex < used
                            ? `Level ${level} slot ${pillIndex + 1} expended, click to reduce`
                            : `Level ${level} slot ${pillIndex + 1} available, click to mark expended`
                        }
                        onClick={() => {
                          const nextUsed = nextUsedAfterPillClick(max, used, pillIndex)
                          onChangeSlot(index, { used: nextUsed })
                        }}
                      />
                    ))}
                  </div>
                )}
              </Table.Td>
            </Table.Tr>
          )
        })}
      </Table.Tbody>
    </Table>
  )

  return (
    <SectionCard
      title="Spell slots"
      className={shrinkToFit ? classes.spellSlotsShrinkCard : undefined}
    >
      <div
        className={`${classes.tableWrap}${shrinkToFit ? ` ${classes.spellSlotsTableWrap}` : ''}`}
      >
        {spellSlotsTable}
      </div>
    </SectionCard>
  )
}

type SpellcastingSectionProps = SpellcastingStatsProps & SpellSlotsCardProps

/** Full spellcasting summary + slots (same blocks used on Combat and Spells tabs). */
export function SpellcastingSection({
  spellcasting,
  spellSlotsByLevel,
  onChangeSpellcasting,
  onChangeSlot,
}: SpellcastingSectionProps) {
  return (
    <Stack gap="md">
      <SpellcastingStatsCard
        spellcasting={spellcasting}
        onChangeSpellcasting={onChangeSpellcasting}
      />
      <SpellSlotsCard
        spellSlotsByLevel={spellSlotsByLevel}
        onChangeSlot={onChangeSlot}
      />
    </Stack>
  )
}
