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
  buildFeatPreview,
  featRef,
  loadAllRawFeats,
  rawFeatToFeatRow,
  type RawFeat,
} from '../fiveetools/featsData'
import type { FeatRow } from './types'
import classes from './CharacterSheet.module.scss'
import { FeatPreviewContent } from './FeatPreviewContent'

const LOCALE_SORT = { sensitivity: 'base' as const }

function localeCmp(a: string, b: string): number {
  return a.localeCompare(b, undefined, LOCALE_SORT)
}

const FEAT_PICKER_SORT_DATA = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'source-asc', label: 'Source (A–Z)' },
  { value: 'source-desc', label: 'Source (Z–A)' },
  { value: 'category-asc', label: 'Category (A–Z)' },
  { value: 'category-desc', label: 'Category (Z–A)' },
] as const

type FeatPickerSortMode = (typeof FEAT_PICKER_SORT_DATA)[number]['value']

function isFeatPickerSortMode(v: string | null): v is FeatPickerSortMode {
  return FEAT_PICKER_SORT_DATA.some((x) => x.value === v)
}

function compareFeatsForPicker(a: RawFeat, b: RawFeat, mode: FeatPickerSortMode): number {
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
    case 'category-asc': {
      const n = localeCmp(a.category ?? '', b.category ?? '')
      return n !== 0 ? n : localeCmp(a.name, b.name)
    }
    case 'category-desc': {
      const n = localeCmp(b.category ?? '', a.category ?? '')
      return n !== 0 ? n : localeCmp(a.name, b.name)
    }
    default: {
      const _x: never = mode
      return _x
    }
  }
}

export type PredefinedFeatPickerModalProps = {
  opened: boolean
  onClose: () => void
  onPick: (row: Omit<FeatRow, 'id'>) => void
}

export function PredefinedFeatPickerModal({
  opened,
  onClose,
  onPick,
}: PredefinedFeatPickerModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rawFeats, setRawFeats] = useState<RawFeat[]>([])
  const [query, setQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string | null>('all')
  const [categoryFilter, setCategoryFilter] = useState<string | null>('all')
  const [sortBy, setSortBy] = useState<string | null>('name-asc')
  const [selected, setSelected] = useState<RawFeat | null>(null)

  const closeModal = () => {
    setQuery('')
    setSourceFilter('all')
    setCategoryFilter('all')
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
        const list = await loadAllRawFeats()
        if (cancelled) return
        setRawFeats(list)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load feats')
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
    for (const f of rawFeats) {
      if (f.source) s.add(f.source)
    }
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [rawFeats])

  const categoryKeys = useMemo(() => {
    const s = new Set<string>()
    for (const f of rawFeats) {
      if (f.category) s.add(f.category)
    }
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [rawFeats])

  const sourceSelectData = useMemo(
    () => [
      { value: 'all', label: 'All sources' },
      ...sourceKeys.map((k) => ({ value: k, label: k })),
    ],
    [sourceKeys],
  )

  const categorySelectData = useMemo(
    () => [
      { value: 'all', label: 'All categories' },
      ...categoryKeys.map((k) => ({ value: k, label: k })),
    ],
    [categoryKeys],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const sf = sourceFilter ?? 'all'
    const cf = categoryFilter ?? 'all'
    return rawFeats.filter((f) => {
      if (sf !== 'all' && f.source !== sf) return false
      if (cf !== 'all' && f.category !== cf) return false
      if (!q) return true
      const cat = (f.category ?? '').toLowerCase()
      return (
        f.name.toLowerCase().includes(q) ||
        f.source.toLowerCase().includes(q) ||
        cat.includes(q)
      )
    })
  }, [rawFeats, query, sourceFilter, categoryFilter])

  const sortMode: FeatPickerSortMode = isFeatPickerSortMode(sortBy) ? sortBy : 'name-asc'

  const sortedFeats = useMemo(() => {
    const out = [...filtered]
    out.sort((a, b) => compareFeatsForPicker(a, b, sortMode))
    return out
  }, [filtered, sortMode])

  const selectedVisible = useMemo(() => {
    if (!selected) return null
    if (!sortedFeats.some((f) => featRef(f) === featRef(selected))) return null
    return selected
  }, [selected, sortedFeats])

  const preview = useMemo(() => {
    if (!selectedVisible) return null
    return buildFeatPreview(selectedVisible)
  }, [selectedVisible])

  return (
    <Modal title="Add feat from 5etools data" opened={opened} onClose={closeModal} size="xl">
      <Stack gap="sm">
        <Group grow align="flex-start" wrap="wrap">
          <TextInput
            label="Search"
            placeholder="Feat name, source, category…"
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
            label="Category"
            size="xs"
            data={categorySelectData}
            value={categoryFilter}
            onChange={(v) => {
              setCategoryFilter(v)
              setSelected(null)
            }}
            searchable
            clearable={false}
          />
          <Select
            label="Sort by"
            size="xs"
            data={[...FEAT_PICKER_SORT_DATA]}
            value={sortBy}
            onChange={setSortBy}
            clearable={false}
          />
        </Group>
        {loading ? (
          <Group justify="center" p="xl">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              Loading feats…
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
                Feats
              </Text>
              <ScrollArea.Autosize mah={420} type="auto" offsetScrollbars>
                <Stack gap={2}>
                  {sortedFeats.map((f) => {
                    const isSel = selected !== null && featRef(f) === featRef(selected)
                    return (
                      <UnstyledButton
                        key={featRef(f)}
                        type="button"
                        onClick={() => setSelected(f)}
                        className={`${classes.predefinedSpellRow}${isSel ? ` ${classes.predefinedSpellRowSelected}` : ''}`}
                      >
                        <Group justify="space-between" wrap="nowrap" gap="xs">
                          <Text size="sm" lineClamp={1} style={{ flex: 1 }}>
                            {f.name}
                          </Text>
                          <Text size="xs" c="dimmed" w={44} className={classes.mono}>
                            {f.source}
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
                  <FeatPreviewContent preview={preview} title={preview.name} />
                </ScrollArea.Autosize>
              ) : (
                <Text size="sm" c="dimmed" py="md">
                  Select a feat in the list to see its full text here, then add it to your
                  sheet.
                </Text>
              )}
            </Grid.Col>
          </Grid>
        )}
        {!loading && !error ? (
          <Group justify="space-between" align="center" wrap="wrap" mt="xs">
            <Text size="xs" c="dimmed">
              {sortedFeats.length} feat{sortedFeats.length === 1 ? '' : 's'} shown
            </Text>
            <Button
              size="sm"
              disabled={!selectedVisible}
              onClick={() => {
                if (!selectedVisible) return
                onPick(rawFeatToFeatRow(selectedVisible))
                closeModal()
              }}
            >
              Add to feats
            </Button>
          </Group>
        ) : null}
      </Stack>
    </Modal>
  )
}
