import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Grid,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core'
import {
  buildItemPreview,
  itemRef,
  loadAllRawItems,
  rawItemToEquipmentRow,
  type RawItem,
} from '../fiveetools/itemsData'
import type { EquipmentRow } from './types'
import classes from './CharacterSheet.module.scss'

const LOCALE_SORT = { sensitivity: 'base' as const }

function localeCmp(a: string, b: string): number {
  return a.localeCompare(b, undefined, LOCALE_SORT)
}

const ITEM_PICKER_SORT_DATA = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'source-asc', label: 'Source (A–Z)' },
  { value: 'source-desc', label: 'Source (Z–A)' },
  { value: 'rarity-asc', label: 'Rarity (A–Z)' },
  { value: 'rarity-desc', label: 'Rarity (Z–A)' },
  { value: 'value-asc', label: 'Value (low → high)' },
  { value: 'value-desc', label: 'Value (high → low)' },
] as const

type ItemPickerSortMode = (typeof ITEM_PICKER_SORT_DATA)[number]['value']

function isItemPickerSortMode(v: string | null): v is ItemPickerSortMode {
  return ITEM_PICKER_SORT_DATA.some((x) => x.value === v)
}

function raritySortKey(r: string | undefined): string {
  return (r ?? '').trim().toLowerCase()
}

function compareItemsForPicker(a: RawItem, b: RawItem, mode: ItemPickerSortMode): number {
  switch (mode) {
    case 'name-asc': {
      const n = localeCmp(a.name, b.name)
      return n !== 0 ? n : localeCmp(a.source, b.source)
    }
    case 'name-desc': {
      const n = localeCmp(b.name, a.name)
      return n !== 0 ? n : localeCmp(b.source, a.source)
    }
    case 'source-asc': {
      const n = localeCmp(a.source, b.source)
      return n !== 0 ? n : localeCmp(a.name, b.name)
    }
    case 'source-desc': {
      const n = localeCmp(b.source, a.source)
      return n !== 0 ? n : localeCmp(a.name, b.name)
    }
    case 'rarity-asc': {
      const n = localeCmp(raritySortKey(a.rarity), raritySortKey(b.rarity))
      return n !== 0 ? n : localeCmp(a.name, b.name)
    }
    case 'rarity-desc': {
      const n = localeCmp(raritySortKey(b.rarity), raritySortKey(a.rarity))
      return n !== 0 ? n : localeCmp(a.name, b.name)
    }
    case 'value-asc':
    case 'value-desc': {
      const aHas = a.value != null && Number.isFinite(a.value)
      const bHas = b.value != null && Number.isFinite(b.value)
      if (!aHas && !bHas) return localeCmp(a.name, b.name)
      if (!aHas) return 1
      if (!bHas) return -1
      const av = a.value!
      const bv = b.value!
      const d = mode === 'value-asc' ? av - bv : bv - av
      return d !== 0 ? d : localeCmp(a.name, b.name)
    }
    default: {
      const _x: never = mode
      return _x
    }
  }
}

export type PredefinedItemPickerModalProps = {
  opened: boolean
  onClose: () => void
  onPick: (row: Omit<EquipmentRow, 'id'>) => void
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

export function PredefinedItemPickerModal({
  opened,
  onClose,
  onPick,
}: PredefinedItemPickerModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rawItems, setRawItems] = useState<RawItem[]>([])
  const [query, setQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string | null>('all')
  const [sortBy, setSortBy] = useState<string | null>('name-asc')
  const [selected, setSelected] = useState<RawItem | null>(null)

  const closeModal = () => {
    setQuery('')
    setSourceFilter('all')
    setSortBy('name-asc')
    setSelected(null)
    onClose()
  }

  useEffect(() => {
    if (!opened) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const items = await loadAllRawItems()
        if (cancelled) return
        setRawItems(items)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load items')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [opened])

  const sourceKeys = useMemo(() => {
    const s = new Set<string>()
    for (const it of rawItems) {
      if (it.source) s.add(it.source)
    }
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [rawItems])

  const sourceSelectData = useMemo(
    () => [
      { value: 'all', label: 'All sources' },
      ...sourceKeys.map((k) => ({ value: k, label: k })),
    ],
    [sourceKeys],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const sf = sourceFilter ?? 'all'
    return rawItems.filter((it) => {
      if (sf !== 'all' && it.source !== sf) return false
      if (!q) return true
      const rarity = (it.rarity ?? '').toLowerCase()
      const typ = (it.type ?? '').toLowerCase()
      return (
        it.name.toLowerCase().includes(q) ||
        it.source.toLowerCase().includes(q) ||
        rarity.includes(q) ||
        typ.includes(q)
      )
    })
  }, [rawItems, query, sourceFilter])

  const sortMode: ItemPickerSortMode = isItemPickerSortMode(sortBy) ? sortBy : 'name-asc'

  const sortedItems = useMemo(() => {
    const out = [...filtered]
    out.sort((a, b) => compareItemsForPicker(a, b, sortMode))
    return out
  }, [filtered, sortMode])

  const selectedVisible = useMemo(() => {
    if (!selected) return null
    if (!sortedItems.some((it) => itemRef(it) === itemRef(selected))) return null
    return selected
  }, [selected, sortedItems])

  const preview = useMemo(() => {
    if (!selectedVisible) return null
    return buildItemPreview(selectedVisible)
  }, [selectedVisible])

  return (
    <Modal title="Add item from 5etools data" opened={opened} onClose={closeModal} size="xl">
      <Stack gap="sm">
        <Group grow align="flex-start" wrap="wrap">
          <TextInput
            label="Search"
            placeholder="Item name, source, type, rarity…"
            size="xs"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            autoFocus
          />
          <Select
            label="Source book"
            size="xs"
            data={sourceSelectData}
            value={sourceFilter}
            onChange={(v) => {
              setSourceFilter(v)
              setSelected(null)
            }}
            searchable
            clearable={false}
          />
          <Select
            label="Sort by"
            size="xs"
            data={[...ITEM_PICKER_SORT_DATA]}
            value={sortBy}
            onChange={setSortBy}
            clearable={false}
          />
        </Group>
        {loading ? (
          <Group justify="center" p="xl">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              Loading items…
            </Text>
          </Group>
        ) : error ? (
          <Text size="sm" c="red">
            {error}
          </Text>
        ) : (
          <Grid gap="md" align="flex-start">
            <Grid.Col span={{ base: 12, sm: 5 }}>
              <Text size="xs" fw={600} c="dimmed" mb={6}>
                Items
              </Text>
              <ScrollArea.Autosize mah={420} type="auto" offsetScrollbars>
                <Stack gap={2}>
                  {sortedItems.map((it) => {
                    const isSel = selected !== null && itemRef(it) === itemRef(selected)
                    return (
                      <UnstyledButton
                        key={itemRef(it)}
                        type="button"
                        onClick={() => setSelected(it)}
                        className={`${classes.predefinedSpellRow}${isSel ? ` ${classes.predefinedSpellRowSelected}` : ''}`}
                      >
                        <Group justify="space-between" wrap="nowrap" gap="xs">
                          <Text size="sm" lineClamp={1} style={{ flex: 1 }}>
                            {it.name}
                          </Text>
                          <Text size="xs" c="dimmed" w={44} className={classes.mono}>
                            {it.source}
                          </Text>
                        </Group>
                      </UnstyledButton>
                    )
                  })}
                </Stack>
              </ScrollArea.Autosize>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 7 }}>
              <Text size="xs" fw={600} c="dimmed" mb={6}>
                Preview
              </Text>
              {preview ? (
                <ScrollArea.Autosize mah={420} type="auto" offsetScrollbars>
                  <Stack gap="sm">
                    <Text fw={700} size="lg">
                      {preview.name}
                    </Text>
                    <Group gap="xl" wrap="wrap">
                      <PreviewField label="Type" value={preview.type} />
                      <PreviewField label="Rarity" value={preview.rarity} />
                      <PreviewField label="Source" value={preview.source} />
                      <PreviewField label="Page" value={preview.page} />
                    </Group>
                    <Group gap="xl" wrap="wrap">
                      <PreviewField label="Weight" value={preview.weight} />
                      <PreviewField label="Value" value={preview.value} />
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
                  </Stack>
                </ScrollArea.Autosize>
              ) : (
                <Text size="sm" c="dimmed" py="md">
                  Select an item in the list to see its full text here, then add it to your
                  equipment.
                </Text>
              )}
            </Grid.Col>
          </Grid>
        )}
        {!loading && !error ? (
          <Group justify="space-between" align="center" wrap="wrap" mt="xs">
            <Text size="xs" c="dimmed">
              {sortedItems.length} item{sortedItems.length === 1 ? '' : 's'} shown
            </Text>
            <Button
              size="sm"
              disabled={!selectedVisible}
              onClick={() => {
                if (!selectedVisible) return
                onPick(rawItemToEquipmentRow(selectedVisible))
                closeModal()
              }}
            >
              Add to equipment
            </Button>
          </Group>
        ) : null}
      </Stack>
    </Modal>
  )
}
