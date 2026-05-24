import { useEffect, useMemo, useState } from 'react'
import {
  ActionIcon,
  Group,
  Menu,
  NumberInput,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { IconBook, IconPlus, IconTrash } from '@tabler/icons-react'
import { deriveCantripAttackRows } from '../fiveetools/cantripAttacks'
import { loadAllRawSpells, type RawSpell } from '../fiveetools/spellsData'
import {
  coerceDiceSize,
  DAMAGE_TYPES,
  DICE_SELECT_DATA,
  type CharacterSheetData,
  type DamageType,
  type SpellbookRow,
  type WeaponRow,
} from './types'
import classes from './CharacterSheet.module.scss'
import { PredefinedWeaponPickerModal } from './PredefinedWeaponPickerModal'
import { SpellDetailsModal } from './SpellDetailsModal'
import { WeaponDetailsModal } from './WeaponDetailsModal'
import { SectionCard } from './SectionCard'

const TYPE_SELECT_DATA = DAMAGE_TYPES.map((t) => ({ value: t, label: t }))

function coerceDamageType(value: string | null): DamageType {
  if (value && (DAMAGE_TYPES as readonly string[]).includes(value)) {
    return value as DamageType
  }
  return 'Slashing'
}

function isCompendiumWeaponRow(row: WeaponRow): boolean {
  return typeof row.fiveEToolsRef === 'string' && row.fiveEToolsRef.length > 0
}

type WeaponsTableProps = {
  weapons: CharacterSheetData['weapons']
  spells: CharacterSheetData['spells']
  spellcasting: CharacterSheetData['spellcasting']
  level: number
  onChange: (weapons: WeaponRow[]) => void
}

function AttackTableHead() {
  return (
    <Table.Thead>
      <Table.Tr>
        <Table.Th>Name</Table.Th>
        <Table.Th>Atk bonus / DC</Table.Th>
        <Table.Th miw={56}>Dice</Table.Th>
        <Table.Th miw={72}>Die</Table.Th>
        <Table.Th miw={100}>Type</Table.Th>
        <Table.Th>Notes</Table.Th>
        <Table.Th w={56} />
      </Table.Tr>
    </Table.Thead>
  )
}

export function WeaponsTable({
  weapons,
  spells,
  spellcasting,
  level,
  onChange,
}: WeaponsTableProps) {
  const [predefinedOpen, setPredefinedOpen] = useState(false)
  const [detailsRow, setDetailsRow] = useState<WeaponRow | null>(null)
  const [spellDetailsRow, setSpellDetailsRow] = useState<SpellbookRow | null>(null)
  const [rawSpells, setRawSpells] = useState<RawSpell[] | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadAllRawSpells().then((list) => {
      if (!cancelled) setRawSpells(list)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const cantripRows = useMemo(() => {
    if (!rawSpells) return []
    return deriveCantripAttackRows(spells, spellcasting, level, rawSpells)
  }, [rawSpells, spells, spellcasting, level])

  const updateRow = (id: string, patch: Partial<WeaponRow>) => {
    onChange(weapons.map((w) => (w.id === id ? { ...w, ...patch } : w)))
  }

  const removeRow = (id: string) => {
    onChange(weapons.filter((w) => w.id !== id))
  }

  const addCustomRow = () => {
    onChange([
      ...weapons,
      {
        id: crypto.randomUUID(),
        name: '',
        attackBonus: 0,
        diceCount: 1,
        diceSize: 'd8',
        damageType: 'Slashing',
        notes: '',
      },
    ])
  }

  const addPredefinedRow = (row: Omit<WeaponRow, 'id'>) => {
    onChange([...weapons, { ...row, id: crypto.randomUUID() }])
  }

  return (
    <SectionCard title="Weapons & damage cantrips">
      <Stack gap="md">
        <div>
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb="xs">
            Damage cantrips (from Spells tab)
          </Text>
          <Text size="xs" c="dimmed" mb="xs">
            Compendium cantrips with damage scale with level and use your spell attack or save
            DC from Spellcasting. Add cantrips on the Spells tab.
          </Text>
          <div className={classes.tableWrap}>
            <Table
              className={classes.weaponsTable}
              layout="fixed"
              striped
              highlightOnHover
              horizontalSpacing="xs"
              verticalSpacing={4}
            >
              <AttackTableHead />
              <Table.Tbody>
                {cantripRows.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      <Text size="xs" c="dimmed" py={4}>
                        {rawSpells
                          ? 'No damage cantrips on your spell list yet.'
                          : 'Loading cantrip data…'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  cantripRows.map((row) => (
                    <Table.Tr
                      key={row.spellId}
                      className={classes.spellRowCompendium}
                      title="Synced from Spells tab — edit the spell there"
                    >
                      <Table.Td>
                        <Text size="xs" lineClamp={2}>
                          {row.name}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" className={classes.mono}>
                          {row.usesSaveDc ? `DC ${row.attackBonus}` : `+${row.attackBonus}`}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" className={classes.mono}>
                          {row.diceCount}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" className={classes.mono}>
                          {row.diceSize}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs">{row.damageType}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" lineClamp={2}>
                          {row.notes || '—'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} wrap="nowrap" justify="flex-end">
                          <Tooltip label="Spell details" openDelay={400}>
                            <ActionIcon
                              variant="subtle"
                              size="sm"
                              onClick={() => {
                                const spell = spells.find((s) => s.id === row.spellId)
                                if (spell) setSpellDetailsRow(spell)
                              }}
                              aria-label="Spell details"
                            >
                              <IconBook size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </div>
        </div>

        <div>
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb="xs">
            Weapons
          </Text>
          <div className={classes.tableWrap}>
            <Table
              className={classes.weaponsTable}
              layout="fixed"
              striped
              highlightOnHover
              horizontalSpacing="xs"
              verticalSpacing={4}
            >
              <AttackTableHead />
              <Table.Tbody>
                {weapons.map((row) => {
                  const compendiumLocked = isCompendiumWeaponRow(row)
                  return (
                    <Table.Tr
                      key={row.id}
                      className={compendiumLocked ? classes.spellRowCompendium : undefined}
                      title={
                        compendiumLocked
                          ? 'From compendium — weapon name and base damage are fixed; adjust attack bonus and notes on your sheet'
                          : undefined
                      }
                    >
                      <Table.Td>
                        {compendiumLocked ? (
                          <Text size="xs" lineClamp={3} lh={1.55}>
                            {row.name}
                          </Text>
                        ) : (
                          <TextInput
                            size="xs"
                            value={row.name}
                            onChange={(e) =>
                              updateRow(row.id, { name: e.currentTarget.value })
                            }
                            aria-label="Weapon name"
                          />
                        )}
                      </Table.Td>
                      <Table.Td>
                        <NumberInput
                          size="xs"
                          classNames={{ input: classes.mono }}
                          value={row.attackBonus}
                          onChange={(v) =>
                            updateRow(row.id, {
                              attackBonus:
                                typeof v === 'number' ? v : row.attackBonus,
                            })
                          }
                          min={-10}
                          max={35}
                          aria-label="Attack bonus or save DC number"
                        />
                      </Table.Td>
                      <Table.Td>
                        {compendiumLocked ? (
                          <Text size="xs" className={classes.mono}>
                            {row.diceCount}
                          </Text>
                        ) : (
                          <NumberInput
                            size="xs"
                            w={52}
                            min={0}
                            max={40}
                            value={row.diceCount}
                            onChange={(v) =>
                              updateRow(row.id, {
                                diceCount:
                                  typeof v === 'number' ? v : row.diceCount,
                              })
                            }
                            classNames={{ input: classes.mono }}
                            aria-label="Number of damage dice"
                          />
                        )}
                      </Table.Td>
                      <Table.Td>
                        {compendiumLocked ? (
                          <Text size="xs" className={classes.mono}>
                            {row.diceSize}
                          </Text>
                        ) : (
                          <Select
                            size="xs"
                            data={DICE_SELECT_DATA}
                            value={row.diceSize}
                            onChange={(v) =>
                              updateRow(row.id, { diceSize: coerceDiceSize(v) })
                            }
                            comboboxProps={{ withinPortal: true }}
                            aria-label="Damage die size"
                          />
                        )}
                      </Table.Td>
                      <Table.Td>
                        {compendiumLocked ? (
                          <Text size="xs">{row.damageType}</Text>
                        ) : (
                          <Select
                            size="xs"
                            data={TYPE_SELECT_DATA}
                            value={row.damageType}
                            onChange={(v) =>
                              updateRow(row.id, { damageType: coerceDamageType(v) })
                            }
                            comboboxProps={{ withinPortal: true }}
                            aria-label="Damage type"
                          />
                        )}
                      </Table.Td>
                      <Table.Td>
                        <TextInput
                          size="xs"
                          value={row.notes}
                          onChange={(e) =>
                            updateRow(row.id, { notes: e.currentTarget.value })
                          }
                          aria-label="Notes"
                        />
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} wrap="nowrap" justify="flex-end">
                          {compendiumLocked ? (
                            <Tooltip label="Weapon details" openDelay={400}>
                              <ActionIcon
                                variant="subtle"
                                size="sm"
                                onClick={() => setDetailsRow(row)}
                                aria-label="Weapon details"
                              >
                                <IconBook size={16} />
                              </ActionIcon>
                            </Tooltip>
                          ) : null}
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            onClick={() => removeRow(row.id)}
                            aria-label="Remove row"
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          </div>
          <Group justify="flex-end" mt="xs">
            <Menu position="bottom-end" shadow="md" width={220}>
              <Menu.Target>
                <ActionIcon variant="light" aria-label="Add weapon">
                  <IconPlus size={18} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={() => setPredefinedOpen(true)}>
                  Pre-defined (5etools data)…
                </Menu.Item>
                <Menu.Item onClick={addCustomRow}>Custom weapon (blank row)</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </div>
      </Stack>

      <PredefinedWeaponPickerModal
        opened={predefinedOpen}
        onClose={() => setPredefinedOpen(false)}
        onPick={addPredefinedRow}
      />
      <WeaponDetailsModal
        key={detailsRow?.id ?? 'weapon-details-closed'}
        opened={detailsRow !== null}
        onClose={() => setDetailsRow(null)}
        row={detailsRow}
      />
      <SpellDetailsModal
        key={spellDetailsRow?.id ?? 'cantrip-spell-details-closed'}
        opened={spellDetailsRow !== null}
        onClose={() => setSpellDetailsRow(null)}
        row={spellDetailsRow}
      />
    </SectionCard>
  )
}
