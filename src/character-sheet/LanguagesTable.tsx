import { useState } from 'react'
import {
  ActionIcon,
  Group,
  Menu,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { IconBook, IconPlus, IconTrash } from '@tabler/icons-react'
import type { CharacterSheetData, LanguageRow } from './types'
import classes from './CharacterSheet.module.scss'
import { LanguageDetailsModal } from './LanguageDetailsModal'
import { PredefinedLanguagePickerModal } from './PredefinedLanguagePickerModal'
import { SectionCard } from './SectionCard'

type LanguagesTableProps = {
  languages: CharacterSheetData['languages']
  onChange: (languages: LanguageRow[]) => void
}

function isCompendiumLanguageRow(row: LanguageRow): boolean {
  return typeof row.fiveEToolsRef === 'string' && row.fiveEToolsRef.length > 0
}

export function LanguagesTable({ languages, onChange }: LanguagesTableProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [detailsRow, setDetailsRow] = useState<LanguageRow | null>(null)

  const updateRow = (id: string, patch: Partial<LanguageRow>) => {
    onChange(languages.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const removeRow = (id: string) => {
    onChange(languages.filter((r) => r.id !== id))
  }

  const addCustomRow = () => {
    onChange([
      ...languages,
      {
        id: crypto.randomUUID(),
        name: '',
      },
    ])
  }

  const addPredefinedRow = (row: Omit<LanguageRow, 'id'>) => {
    onChange([...languages, { ...row, id: crypto.randomUUID() }])
  }

  return (
    <SectionCard title="Languages">
      <div className={classes.tableWrap}>
        <Table striped highlightOnHover horizontalSpacing="xs" verticalSpacing={4}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Language</Table.Th>
              <Table.Th w={88} ta="center" />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {languages.map((row) => {
              const locked = isCompendiumLanguageRow(row)
              return (
                <Table.Tr
                  key={row.id}
                  className={locked ? classes.spellRowCompendium : undefined}
                  title={
                    locked
                      ? 'From compendium — language name is fixed; remove the row or switch to custom to rename'
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
                        placeholder="Language name"
                        value={row.name}
                        onChange={(e) => updateRow(row.id, { name: e.currentTarget.value })}
                        aria-label="Language name"
                      />
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap" justify="flex-end">
                      {locked ? (
                        <Tooltip label="Language details" openDelay={400}>
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            onClick={() => setDetailsRow(row)}
                            aria-label="Language details"
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
                        aria-label="Remove language"
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
        <Menu position="bottom-end" shadow="md" width={260}>
          <Menu.Target>
            <ActionIcon variant="light" aria-label="Add language">
              <IconPlus size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onClick={() => setPickerOpen(true)}>
              Pre-defined (5etools data)…
            </Menu.Item>
            <Menu.Item onClick={addCustomRow}>Custom language (blank row)</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
      <PredefinedLanguagePickerModal
        opened={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={addPredefinedRow}
      />
      <LanguageDetailsModal
        key={detailsRow?.id ?? 'language-details-closed'}
        opened={detailsRow !== null}
        onClose={() => setDetailsRow(null)}
        languageName={detailsRow?.name ?? ''}
        languageRef={detailsRow?.fiveEToolsRef}
      />
    </SectionCard>
  )
}
