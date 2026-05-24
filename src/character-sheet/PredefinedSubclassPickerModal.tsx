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
  buildSubclassPreview,
  listSubclassesForClassRef,
  loadAllCompendiumSubclasses,
  parseClassRef,
  rawSubclassToSheetFields,
  subclassRef,
  type CompendiumSubclass,
} from '../fiveetools/classesData'
import classes from './CharacterSheet.module.scss'

const LOCALE_SORT = { sensitivity: 'base' as const }

function localeCmp(a: string, b: string): number {
  return a.localeCompare(b, undefined, LOCALE_SORT)
}

const SUB_PICKER_SORT_DATA = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'source-asc', label: 'Source (A–Z)' },
  { value: 'source-desc', label: 'Source (Z–A)' },
] as const

type SubPickerSortMode = (typeof SUB_PICKER_SORT_DATA)[number]['value']

function isSubPickerSortMode(v: string | null): v is SubPickerSortMode {
  return SUB_PICKER_SORT_DATA.some((x) => x.value === v)
}

function compareSubclassesForPicker(
  a: CompendiumSubclass,
  b: CompendiumSubclass,
  mode: SubPickerSortMode,
): number {
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
    default: {
      const _x: never = mode
      return _x
    }
  }
}

export type PredefinedSubclassPickerModalProps = {
  opened: boolean
  onClose: () => void
  /** Parent class compendium ref (`ClassName|SOURCE`). Required when opened. */
  classNameFiveEToolsRef: string | undefined
  onPick: (fields: { subclass: string; subclassFiveEToolsRef: string }) => void
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

export function PredefinedSubclassPickerModal({
  opened,
  onClose,
  classNameFiveEToolsRef,
  onPick,
}: PredefinedSubclassPickerModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [allSubs, setAllSubs] = useState<CompendiumSubclass[]>([])
  const [query, setQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string | null>('all')
  const [sortBy, setSortBy] = useState<string | null>('name-asc')
  const [selected, setSelected] = useState<CompendiumSubclass | null>(null)

  const parentParsed = classNameFiveEToolsRef ? parseClassRef(classNameFiveEToolsRef) : null

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
        const list = await loadAllCompendiumSubclasses()
        if (cancelled) return
        setAllSubs(list)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load subclasses')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [opened])

  const forClass = useMemo(() => {
    if (!classNameFiveEToolsRef?.trim()) return []
    return listSubclassesForClassRef(allSubs, classNameFiveEToolsRef)
  }, [allSubs, classNameFiveEToolsRef])

  const sourceKeys = useMemo(() => {
    const s = new Set<string>()
    for (const sc of forClass) {
      if (sc.source) s.add(sc.source)
    }
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [forClass])

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
    return forClass.filter((sc) => {
      if (sf !== 'all' && sc.source !== sf) return false
      if (!q) return true
      return (
        sc.name.toLowerCase().includes(q) ||
        sc.source.toLowerCase().includes(q) ||
        (sc.edition ?? '').toLowerCase().includes(q)
      )
    })
  }, [forClass, query, sourceFilter])

  const sortMode: SubPickerSortMode = isSubPickerSortMode(sortBy) ? sortBy : 'name-asc'

  const sorted = useMemo(() => {
    const out = [...filtered]
    out.sort((a, b) => compareSubclassesForPicker(a, b, sortMode))
    return out
  }, [filtered, sortMode])

  const selectedVisible = useMemo(() => {
    if (!selected) return null
    if (!sorted.some((s) => subclassRef(s) === subclassRef(selected))) return null
    return selected
  }, [selected, sorted])

  const preview = useMemo(() => {
    if (!selectedVisible) return null
    return buildSubclassPreview(selectedVisible)
  }, [selectedVisible])

  const parentLabel = parentParsed
    ? `${parentParsed.name} (${parentParsed.source})`
    : '—'

  return (
    <Modal
      title="Choose subclass from 5etools data"
      opened={opened}
      onClose={closeModal}
      size="xl"
    >
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          Showing subclasses for: <Text span fw={600}>{parentLabel}</Text>
        </Text>
        <Group grow align="flex-start" wrap="wrap">
          <TextInput
            label="Search"
            placeholder="Subclass name or source…"
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
            data={[...SUB_PICKER_SORT_DATA]}
            value={sortBy}
            onChange={setSortBy}
            clearable={false}
          />
        </Group>
        {!parentParsed ? (
          <Text size="sm" c="red">
            Select a compendium class first.
          </Text>
        ) : loading ? (
          <Group justify="center" p="xl">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              Loading subclasses…
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
                Subclasses
              </Text>
              <ScrollArea.Autosize mah={400} type="auto" offsetScrollbars>
                <Stack gap={2}>
                  {sorted.length === 0 ? (
                    <Text size="sm" c="dimmed">
                      No subclasses in the bundled data for this class.
                    </Text>
                  ) : (
                    sorted.map((sc) => {
                      const isSel =
                        selected !== null && subclassRef(sc) === subclassRef(selected)
                      return (
                        <UnstyledButton
                          key={subclassRef(sc)}
                          type="button"
                          onClick={() => setSelected(sc)}
                          className={`${classes.predefinedSpellRow}${isSel ? ` ${classes.predefinedSpellRowSelected}` : ''}`}
                        >
                          <Group justify="space-between" wrap="nowrap" gap="xs">
                            <Text size="sm" lineClamp={2} style={{ flex: 1 }}>
                              {sc.name}
                            </Text>
                            <Text size="xs" c="dimmed" w={44} className={classes.mono}>
                              {sc.source}
                            </Text>
                          </Group>
                        </UnstyledButton>
                      )
                    })
                  )}
                </Stack>
              </ScrollArea.Autosize>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 7 }}>
              <Text size="xs" fw={600} c="dimmed" mb={6}>
                Preview
              </Text>
              {preview ? (
                <ScrollArea.Autosize mah={400} type="auto" offsetScrollbars>
                  <Stack gap="sm">
                    <Text fw={700} size="lg">
                      {preview.name}
                    </Text>
                    <Group gap="xl" wrap="wrap">
                      <PreviewField label="Class" value={preview.parentClass} />
                      <PreviewField label="Source" value={preview.source} />
                      <PreviewField label="Page" value={preview.page} />
                    </Group>
                    <div>
                      <Text size="xs" fw={600} c="dimmed" mb={4}>
                        Subclass features (excerpt)
                      </Text>
                      <Text className={classes.spellPreviewDescription} component="div">
                        {preview.description}
                      </Text>
                    </div>
                  </Stack>
                </ScrollArea.Autosize>
              ) : (
                <Text size="sm" c="dimmed" py="md">
                  {sorted.length === 0
                    ? 'Nothing to preview.'
                    : 'Select a subclass to see details here, then confirm.'}
                </Text>
              )}
            </Grid.Col>
          </Grid>
        )}
        {!loading && !error && parentParsed ? (
          <Group justify="space-between" align="center" wrap="wrap" mt="xs">
            <Text size="xs" c="dimmed">
              {sorted.length} subclass{sorted.length === 1 ? '' : 'es'} for this class
            </Text>
            <Button
              size="sm"
              disabled={!selectedVisible}
              onClick={() => {
                if (!selectedVisible) return
                onPick(rawSubclassToSheetFields(selectedVisible))
                closeModal()
              }}
            >
              Use this subclass
            </Button>
          </Group>
        ) : null}
      </Stack>
    </Modal>
  )
}
