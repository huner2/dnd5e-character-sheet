import { useState } from 'react'
import {
  ActionIcon,
  Checkbox,
  Group,
  Menu,
  NumberInput,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { IconBook, IconPlus, IconTrash } from '@tabler/icons-react'
import type { CharacterSheetData, SpellbookRow } from './types'
import classes from './CharacterSheet.module.scss'
import { SectionCard } from './SectionCard'
import { PredefinedSpellPickerModal } from './PredefinedSpellPickerModal'
import { SpellDetailsModal } from './SpellDetailsModal'

type SpellsTableProps = {
  spells: CharacterSheetData['spells']
  onChange: (spells: SpellbookRow[]) => void
}

function isCompendiumSpellRow(row: SpellbookRow): boolean {
  return typeof row.fiveEToolsRef === 'string' && row.fiveEToolsRef.length > 0
}

function CompendiumBoolMark({ value }: { value: boolean }) {
  return (
    <Text size="xs" ta="center" className={classes.spellCompendiumMark}>
      {value ? '✓' : '—'}
    </Text>
  )
}

export function SpellsTable({ spells, onChange }: SpellsTableProps) {
  const [predefinedOpen, setPredefinedOpen] = useState(false)
  const [detailsRow, setDetailsRow] = useState<SpellbookRow | null>(null)

  const updateRow = (id: string, patch: Partial<SpellbookRow>) => {
    onChange(spells.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  const removeRow = (id: string) => {
    onChange(spells.filter((s) => s.id !== id))
  }

  const addCustomRow = () => {
    onChange([
      ...spells,
      {
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
      },
    ])
  }

  const addPredefinedRow = (row: Omit<SpellbookRow, 'id'>) => {
    onChange([...spells, { ...row, id: crypto.randomUUID() }])
  }

  return (
    <SectionCard title="Cantrips & prepared spells">
      <div className={classes.tableWrap}>
        <Table striped highlightOnHover horizontalSpacing="xs" verticalSpacing={6}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={64} ta="center">
                Cantrip
              </Table.Th>
              <Table.Th w={68}>Level</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Casting time</Table.Th>
              <Table.Th>Range</Table.Th>
              <Table.Th w={40} ta="center">
                C
              </Table.Th>
              <Table.Th w={40} ta="center">
                R
              </Table.Th>
              <Table.Th w={40} ta="center">
                M
              </Table.Th>
              <Table.Th>Notes</Table.Th>
              <Table.Th w={80} ta="center" />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {spells.map((row) => {
              const compendiumLocked = isCompendiumSpellRow(row)
              return (
                <Table.Tr
                  key={row.id}
                  className={compendiumLocked ? classes.spellRowCompendium : undefined}
                  title={
                    compendiumLocked
                      ? 'From compendium — only notes can be edited'
                      : undefined
                  }
                >
                  <Table.Td ta="center">
                    {compendiumLocked ? (
                      <CompendiumBoolMark value={row.cantrip} />
                    ) : (
                      <Checkbox
                        checked={row.cantrip}
                        onChange={(e) => {
                          const cantrip = e.currentTarget.checked
                          updateRow(row.id, {
                            cantrip,
                            level: cantrip ? 0 : Math.max(1, row.level),
                          })
                        }}
                        aria-label="Cantrip"
                      />
                    )}
                  </Table.Td>
                  <Table.Td>
                    {compendiumLocked ? (
                      <Text
                        size="xs"
                        className={classes.mono}
                        w={56}
                        ta="right"
                        lh={1.6}
                        aria-label="Spell level"
                      >
                        {row.cantrip ? '—' : Math.min(9, Math.max(1, row.level))}
                      </Text>
                    ) : (
                      <NumberInput
                        size="xs"
                        w={56}
                        min={row.cantrip ? 0 : 1}
                        max={9}
                        disabled={row.cantrip}
                        value={
                          row.cantrip
                            ? 0
                            : Math.min(9, Math.max(1, row.level))
                        }
                        onChange={(v) =>
                          updateRow(row.id, {
                            level:
                              typeof v === 'number'
                                ? Math.min(9, Math.max(1, v))
                                : row.level,
                          })
                        }
                        classNames={{ input: classes.mono }}
                        aria-label="Spell level"
                      />
                    )}
                  </Table.Td>
                  <Table.Td>
                    {compendiumLocked ? (
                      <Text size="xs" lineClamp={3} lh={1.55}>
                        {row.name}
                      </Text>
                    ) : (
                      <TextInput
                        size="xs"
                        value={row.name}
                        onChange={(e) => updateRow(row.id, { name: e.currentTarget.value })}
                        aria-label="Spell name"
                      />
                    )}
                  </Table.Td>
                  <Table.Td>
                    {compendiumLocked ? (
                      <Text size="xs" lineClamp={2} lh={1.55}>
                        {row.castingTime}
                      </Text>
                    ) : (
                      <TextInput
                        size="xs"
                        value={row.castingTime}
                        onChange={(e) =>
                          updateRow(row.id, { castingTime: e.currentTarget.value })
                        }
                        aria-label="Casting time"
                      />
                    )}
                  </Table.Td>
                  <Table.Td>
                    {compendiumLocked ? (
                      <Text size="xs" lineClamp={2} lh={1.55}>
                        {row.range}
                      </Text>
                    ) : (
                      <TextInput
                        size="xs"
                        value={row.range}
                        onChange={(e) => updateRow(row.id, { range: e.currentTarget.value })}
                        aria-label="Range"
                      />
                    )}
                  </Table.Td>
                  <Table.Td>
                    {compendiumLocked ? (
                      <CompendiumBoolMark value={row.concentration} />
                    ) : (
                      <Checkbox
                        checked={row.concentration}
                        onChange={(e) =>
                          updateRow(row.id, { concentration: e.currentTarget.checked })
                        }
                        aria-label="Concentration"
                      />
                    )}
                  </Table.Td>
                  <Table.Td>
                    {compendiumLocked ? (
                      <CompendiumBoolMark value={row.ritual} />
                    ) : (
                      <Checkbox
                        checked={row.ritual}
                        onChange={(e) => updateRow(row.id, { ritual: e.currentTarget.checked })}
                        aria-label="Ritual"
                      />
                    )}
                  </Table.Td>
                  <Table.Td>
                    {compendiumLocked ? (
                      <CompendiumBoolMark value={row.material} />
                    ) : (
                      <Checkbox
                        checked={row.material}
                        onChange={(e) => updateRow(row.id, { material: e.currentTarget.checked })}
                        aria-label="Material"
                      />
                    )}
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      size="xs"
                      value={row.notes}
                      onChange={(e) => updateRow(row.id, { notes: e.currentTarget.value })}
                      aria-label="Notes"
                    />
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap" justify="flex-end">
                      {compendiumLocked ? (
                        <Tooltip label="Spell details" openDelay={400}>
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            onClick={() => setDetailsRow(row)}
                            aria-label="Spell details"
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
                        aria-label="Remove spell"
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
            <ActionIcon variant="light" aria-label="Add spell">
              <IconPlus size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onClick={() => setPredefinedOpen(true)}>
              Pre-defined (5etools data)…
            </Menu.Item>
            <Menu.Item onClick={addCustomRow}>Custom spell (blank row)</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
      <PredefinedSpellPickerModal
        opened={predefinedOpen}
        onClose={() => setPredefinedOpen(false)}
        onPick={addPredefinedRow}
      />
      <SpellDetailsModal
        key={detailsRow?.id ?? 'spell-details-closed'}
        opened={detailsRow !== null}
        onClose={() => setDetailsRow(null)}
        row={detailsRow}
      />
    </SectionCard>
  )
}
