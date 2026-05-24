import { useState } from 'react'
import {
  ActionIcon,
  Group,
  Menu,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from '@mantine/core'
import { IconBook, IconPlus, IconTrash } from '@tabler/icons-react'
import type { CharacterSheetData, FeatRow } from './types'
import classes from './CharacterSheet.module.scss'
import { FeatDetailsModal } from './FeatDetailsModal'
import { PredefinedFeatPickerModal } from './PredefinedFeatPickerModal'
import { SectionCard } from './SectionCard'

type FeatsTableProps = {
  feats: CharacterSheetData['feats']
  featNotes: CharacterSheetData['featNotes']
  onChangeFeats: (feats: FeatRow[]) => void
  onChangeNotes: (notes: string) => void
}

function isCompendiumFeatRow(row: FeatRow): boolean {
  return typeof row.fiveEToolsRef === 'string' && row.fiveEToolsRef.length > 0
}

export function FeatsTable({
  feats,
  featNotes,
  onChangeFeats,
  onChangeNotes,
}: FeatsTableProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [detailsRow, setDetailsRow] = useState<FeatRow | null>(null)

  const updateRow = (id: string, patch: Partial<FeatRow>) => {
    onChangeFeats(feats.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const removeRow = (id: string) => {
    onChangeFeats(feats.filter((r) => r.id !== id))
  }

  const addCustomRow = () => {
    onChangeFeats([
      ...feats,
      {
        id: crypto.randomUUID(),
        name: '',
      },
    ])
  }

  const addPredefinedRow = (row: Omit<FeatRow, 'id'>) => {
    onChangeFeats([...feats, { ...row, id: crypto.randomUUID() }])
  }

  return (
    <SectionCard title="Feats">
      <Stack gap="sm">
        <div className={classes.tableWrap}>
          <Table striped highlightOnHover horizontalSpacing="xs" verticalSpacing={4}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Feat</Table.Th>
                <Table.Th w={88} ta="center" />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {feats.map((row) => {
                const locked = isCompendiumFeatRow(row)
                return (
                  <Table.Tr
                    key={row.id}
                    className={locked ? classes.spellRowCompendium : undefined}
                    title={
                      locked
                        ? 'From compendium — feat name is fixed; remove the row or switch to custom to rename'
                        : undefined
                    }
                  >
                    <Table.Td>
                      {locked ? (
                        <Text size="xs" lineClamp={2} lh={1.55}>
                          {row.name}
                        </Text>
                      ) : (
                        <TextInput
                          size="xs"
                          placeholder="Feat name"
                          value={row.name}
                          onChange={(e) => updateRow(row.id, { name: e.currentTarget.value })}
                          aria-label="Feat name"
                        />
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} wrap="nowrap" justify="flex-end">
                        {locked ? (
                          <Tooltip label="Feat details" openDelay={400}>
                            <ActionIcon
                              variant="subtle"
                              size="sm"
                              onClick={() => setDetailsRow(row)}
                              aria-label="Feat details"
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
                          aria-label="Remove feat"
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
        <Group justify="flex-end">
          <Menu position="bottom-end" shadow="md" width={260}>
            <Menu.Target>
              <ActionIcon variant="light" aria-label="Add feat">
                <IconPlus size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => setPickerOpen(true)}>
                Pre-defined (5etools data)…
              </Menu.Item>
              <Menu.Item onClick={addCustomRow}>Custom feat (blank row)</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
        <Textarea
          label="Additional notes"
          autosize
          minRows={2}
          value={featNotes}
          onChange={(e) => onChangeNotes(e.currentTarget.value)}
          size="xs"
        />
      </Stack>
      <PredefinedFeatPickerModal
        opened={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={addPredefinedRow}
      />
      <FeatDetailsModal
        key={detailsRow?.id ?? 'feat-details-closed'}
        opened={detailsRow !== null}
        onClose={() => setDetailsRow(null)}
        featName={detailsRow?.name ?? ''}
        featRef={detailsRow?.fiveEToolsRef}
      />
    </SectionCard>
  )
}
