import { ActionIcon, Button, ScrollArea, Stack, Text, Tooltip } from '@mantine/core'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import type { CharacterSheetEntry } from './types'
import classes from './CharacterSheet.module.scss'
import { sheetEntryListLabel } from './sheetEntryLabel'

type SheetListSidebarProps = {
  sheets: CharacterSheetEntry[]
  activeId: string
  onSelect: (id: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
}

export function SheetListSidebar({
  sheets,
  activeId,
  onSelect,
  onAdd,
  onRemove,
}: SheetListSidebarProps) {
  return (
    <div className={classes.sheetSidebar}>
      <Text size="xs" tt="uppercase" fw={700} c="dimmed" px={4} pb={6}>
        Characters
      </Text>
      <ScrollArea className={classes.sheetSidebarScroll} type="auto" offsetScrollbars>
        <Stack gap={6} pr={4}>
          {sheets.map((sheet) => {
            const label = sheetEntryListLabel(sheet)
            const selected = sheet.id === activeId
            return (
              <div key={sheet.id} className={classes.sheetSidebarRow}>
                <button
                  type="button"
                  className={`${classes.sheetSidebarItem} ${selected ? classes.sheetSidebarItemActive : ''}`}
                  onClick={() => onSelect(sheet.id)}
                >
                  <Text size="sm" fw={selected ? 600 : 400} lineClamp={2}>
                    {label}
                  </Text>
                </button>
                {sheets.length > 1 ? (
                  <Tooltip label="Remove character">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      aria-label={`Remove ${label}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemove(sheet.id)
                      }}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Tooltip>
                ) : null}
              </div>
            )
          })}
        </Stack>
      </ScrollArea>
      <Button
        className={classes.sheetSidebarCreate}
        leftSection={<IconPlus size={16} />}
        variant="light"
        size="sm"
        fullWidth
        onClick={onAdd}
      >
        Create
      </Button>
    </div>
  )
}
