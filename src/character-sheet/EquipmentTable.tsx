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
import type { CharacterSheetData, EquipmentRow } from './types'
import classes from './CharacterSheet.module.scss'
import { SectionCard } from './SectionCard'
import { PredefinedItemPickerModal } from './PredefinedItemPickerModal'
import { ItemDetailsModal } from './ItemDetailsModal'

type EquipmentTableProps = {
  equipment: CharacterSheetData['equipment']
  onChange: (equipment: EquipmentRow[]) => void
}

function isCompendiumEquipmentRow(row: EquipmentRow): boolean {
  return typeof row.fiveEToolsRef === 'string' && row.fiveEToolsRef.length > 0
}

export function EquipmentTable({ equipment, onChange }: EquipmentTableProps) {
  const [predefinedOpen, setPredefinedOpen] = useState(false)
  const [detailsRow, setDetailsRow] = useState<EquipmentRow | null>(null)

  const updateRow = (id: string, patch: Partial<EquipmentRow>) => {
    onChange(equipment.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const removeRow = (id: string) => {
    onChange(equipment.filter((r) => r.id !== id))
  }

  const addCustomRow = () => {
    onChange([
      ...equipment,
      {
        id: crypto.randomUUID(),
        name: '',
        quantity: 1,
        equipped: false,
        notes: '',
        goldGp: 0,
      },
    ])
  }

  const addPredefinedRow = (row: Omit<EquipmentRow, 'id'>) => {
    onChange([...equipment, { ...row, id: crypto.randomUUID() }])
  }

  return (
    <SectionCard title="Equipment">
      <div className={classes.tableWrap}>
        <Table striped highlightOnHover horizontalSpacing="xs" verticalSpacing={4}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Item</Table.Th>
              <Table.Th w={72} ta="center">
                Qty
              </Table.Th>
              <Table.Th w={72} ta="center">
                Equipped
              </Table.Th>
              <Table.Th>Notes</Table.Th>
              <Table.Th w={88}>GP</Table.Th>
              <Table.Th w={80} ta="center" />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {equipment.map((row) => {
              const compendiumLocked = isCompendiumEquipmentRow(row)
              return (
                <Table.Tr
                  key={row.id}
                  className={compendiumLocked ? classes.spellRowCompendium : undefined}
                  title={
                    compendiumLocked
                      ? 'From compendium — item name is fixed; adjust quantity, notes, and GP on your sheet'
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
                        aria-label="Item name"
                      />
                    )}
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      size="xs"
                      min={1}
                      max={99999}
                      value={row.quantity}
                      onChange={(v) =>
                        updateRow(row.id, {
                          quantity: typeof v === 'number' ? Math.max(1, v) : row.quantity,
                        })
                      }
                      classNames={{ input: classes.mono }}
                      aria-label="Quantity"
                    />
                  </Table.Td>
                  <Table.Td ta="center">
                    <Checkbox
                      checked={row.equipped}
                      onChange={(e) =>
                        updateRow(row.id, { equipped: e.currentTarget.checked })
                      }
                      aria-label="Equipped"
                    />
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
                    <NumberInput
                      size="xs"
                      min={0}
                      max={999999}
                      value={row.goldGp}
                      onChange={(v) =>
                        updateRow(row.id, {
                          goldGp: typeof v === 'number' ? v : row.goldGp,
                        })
                      }
                      classNames={{ input: classes.mono }}
                      aria-label="Gold value (gp)"
                    />
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap" justify="flex-end">
                      {compendiumLocked ? (
                        <Tooltip label="Item details" openDelay={400}>
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            onClick={() => setDetailsRow(row)}
                            aria-label="Item details"
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
            <ActionIcon variant="light" aria-label="Add equipment">
              <IconPlus size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onClick={() => setPredefinedOpen(true)}>
              Pre-defined (5etools data)…
            </Menu.Item>
            <Menu.Item onClick={addCustomRow}>Custom item (blank row)</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
      <PredefinedItemPickerModal
        opened={predefinedOpen}
        onClose={() => setPredefinedOpen(false)}
        onPick={addPredefinedRow}
      />
      <ItemDetailsModal
        key={detailsRow?.id ?? 'item-details-closed'}
        opened={detailsRow !== null}
        onClose={() => setDetailsRow(null)}
        row={detailsRow}
      />
    </SectionCard>
  )
}
