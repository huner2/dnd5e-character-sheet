import { useEffect, useState } from 'react'
import { Group, Loader, Modal, ScrollArea, Stack, Text } from '@mantine/core'
import {
  buildItemPreview,
  findRawItemByRefString,
  loadAllRawItems,
  type ItemPreviewModel,
} from '../fiveetools/itemsData'
import type { EquipmentRow } from './types'
import classes from './CharacterSheet.module.scss'

export type ItemDetailsModalProps = {
  opened: boolean
  onClose: () => void
  row: EquipmentRow | null
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text size="xs" fw={600} c="dimmed">
        {label}
      </Text>
      <Text size="sm">{value}</Text>
    </div>
  )
}

function CompendiumPreviewBody({
  preview,
  playerNotes,
  quantity,
}: {
  preview: ItemPreviewModel
  playerNotes: string
  quantity: number
}) {
  return (
    <Stack gap="sm">
      <Group gap="xl" wrap="wrap">
        <PreviewField label="Quantity (on sheet)" value={String(quantity)} />
        <PreviewField label="Type" value={preview.type} />
        <PreviewField label="Rarity" value={preview.rarity} />
        <PreviewField label="Source" value={preview.source} />
        <PreviewField label="Page" value={preview.page} />
      </Group>
      <Group gap="xl" wrap="wrap">
        <PreviewField label="Weight" value={preview.weight} />
        <PreviewField label="Listed value" value={preview.value} />
        <PreviewField label="Attunement" value={preview.attunement} />
      </Group>
      <div>
        <Text size="xs" fw={600} c="dimmed" mb={4}>
          Description
        </Text>
        <Text className={classes.spellPreviewDescription} component="div">
          {preview.description}
        </Text>
      </div>
      {playerNotes.trim() ? (
        <div>
          <Text size="xs" fw={600} c="dimmed" mb={4}>
            Your notes
          </Text>
          <Text size="sm" className={classes.spellPreviewDescription} component="div">
            {playerNotes}
          </Text>
        </div>
      ) : null}
    </Stack>
  )
}

function CustomItemBody({ row }: { row: EquipmentRow }) {
  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Custom item — compendium description is not available.
      </Text>
      <Group gap="xl" wrap="wrap">
        <PreviewField label="Quantity" value={String(row.quantity)} />
        <PreviewField label="Equipped" value={row.equipped ? 'Yes' : 'No'} />
        <PreviewField label="GP (sheet)" value={String(row.goldGp)} />
      </Group>
      <div>
        <Text size="xs" fw={600} c="dimmed" mb={4}>
          Notes
        </Text>
        <Text size="sm" className={classes.spellPreviewDescription} component="div">
          {row.notes.trim() ? row.notes : '—'}
        </Text>
      </div>
    </Stack>
  )
}

export function ItemDetailsModal({ opened, onClose, row }: ItemDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ItemPreviewModel | null>(null)

  const ref = row?.fiveEToolsRef?.trim() ?? ''

  useEffect(() => {
    if (!opened || !row || !ref) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      setPreview(null)
      try {
        const items = await loadAllRawItems()
        if (cancelled) return
        const raw = findRawItemByRefString(items, ref)
        if (!raw) {
          setError('This item is no longer in the bundled data (or the reference is invalid).')
          return
        }
        setPreview(buildItemPreview(raw))
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load item details')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [opened, row, ref])

  const title =
    row?.name.trim() || preview?.name.trim() || (ref ? 'Item details' : '(Unnamed item)')

  return (
    <Modal title={title} opened={opened} onClose={onClose} size="lg">
      {!row ? null : !ref ? (
        <CustomItemBody row={row} />
      ) : loading || (!preview && !error) ? (
        <Group justify="center" p="xl">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">
            Loading item…
          </Text>
        </Group>
      ) : error ? (
        <Stack gap="md">
          <Text size="sm" c="red">
            {error}
          </Text>
          <Text size="sm" c="dimmed">
            Showing data from your sheet only.
          </Text>
          <CustomItemBody row={row} />
        </Stack>
      ) : preview ? (
        <ScrollArea.Autosize mah={520} type="auto" offsetScrollbars>
          <CompendiumPreviewBody
            preview={preview}
            playerNotes={row.notes}
            quantity={row.quantity}
          />
        </ScrollArea.Autosize>
      ) : null}
    </Modal>
  )
}
