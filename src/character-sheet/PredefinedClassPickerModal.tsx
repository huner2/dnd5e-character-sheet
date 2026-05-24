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
  buildClassPreview,
  classRef,
  loadAllRawClasses,
  rawClassToSheetFields,
  type CompendiumClass,
} from '../fiveetools/classesData'
import classes from './CharacterSheet.module.scss'

const LOCALE_SORT = { sensitivity: 'base' as const }

function localeCmp(a: string, b: string): number {
  return a.localeCompare(b, undefined, LOCALE_SORT)
}

const CLASS_PICKER_SORT_DATA = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'source-asc', label: 'Source (A–Z)' },
  { value: 'source-desc', label: 'Source (Z–A)' },
] as const

type ClassPickerSortMode = (typeof CLASS_PICKER_SORT_DATA)[number]['value']

function isClassPickerSortMode(v: string | null): v is ClassPickerSortMode {
  return CLASS_PICKER_SORT_DATA.some((x) => x.value === v)
}

function compareClassesForPicker(
  a: CompendiumClass,
  b: CompendiumClass,
  mode: ClassPickerSortMode,
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

export type PredefinedClassPickerModalProps = {
  opened: boolean
  onClose: () => void
  onPick: (fields: {
    className: string
    classNameFiveEToolsRef: string
    subclass: string
    subclassFiveEToolsRef?: string | undefined
  }) => void
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

export function PredefinedClassPickerModal({
  opened,
  onClose,
  onPick,
}: PredefinedClassPickerModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rawList, setRawList] = useState<CompendiumClass[]>([])
  const [query, setQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string | null>('all')
  const [sortBy, setSortBy] = useState<string | null>('name-asc')
  const [selected, setSelected] = useState<CompendiumClass | null>(null)

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
        const list = await loadAllRawClasses()
        if (cancelled) return
        setRawList(list)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load classes')
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
    for (const c of rawList) {
      if (c.source) s.add(c.source)
    }
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [rawList])

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
    return rawList.filter((c) => {
      if (sf !== 'all' && c.source !== sf) return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        c.source.toLowerCase().includes(q) ||
        (c.edition ?? '').toLowerCase().includes(q)
      )
    })
  }, [rawList, query, sourceFilter])

  const sortMode: ClassPickerSortMode = isClassPickerSortMode(sortBy) ? sortBy : 'name-asc'

  const sorted = useMemo(() => {
    const out = [...filtered]
    out.sort((a, b) => compareClassesForPicker(a, b, sortMode))
    return out
  }, [filtered, sortMode])

  const selectedVisible = useMemo(() => {
    if (!selected) return null
    if (!sorted.some((c) => classRef(c) === classRef(selected))) return null
    return selected
  }, [selected, sorted])

  const preview = useMemo(() => {
    if (!selectedVisible) return null
    return buildClassPreview(selectedVisible)
  }, [selectedVisible])

  return (
    <Modal title="Choose class from 5etools data" opened={opened} onClose={closeModal} size="xl">
      <Stack gap="sm">
        <Group grow align="flex-start" wrap="wrap">
          <TextInput
            label="Search"
            placeholder="Class name or source…"
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
            data={[...CLASS_PICKER_SORT_DATA]}
            value={sortBy}
            onChange={setSortBy}
            clearable={false}
          />
        </Group>
        {loading ? (
          <Group justify="center" p="xl">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              Loading classes…
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
                Classes
              </Text>
              <ScrollArea.Autosize mah={420} type="auto" offsetScrollbars>
                <Stack gap={2}>
                  {sorted.map((c) => {
                    const isSel = selected !== null && classRef(c) === classRef(selected)
                    return (
                      <UnstyledButton
                        key={classRef(c)}
                        type="button"
                        onClick={() => setSelected(c)}
                        className={`${classes.predefinedSpellRow}${isSel ? ` ${classes.predefinedSpellRowSelected}` : ''}`}
                      >
                        <Group justify="space-between" wrap="nowrap" gap="xs">
                          <Text size="sm" lineClamp={1} style={{ flex: 1 }}>
                            {c.name}
                          </Text>
                          <Text size="xs" c="dimmed" w={44} className={classes.mono}>
                            {c.source}
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
                      <PreviewField label="Hit die" value={preview.hitDie} />
                      <PreviewField label="Saving throws" value={preview.savingThrows} />
                      <PreviewField
                        label="Spellcasting ability"
                        value={preview.spellcastingAbility}
                      />
                      <PreviewField label="Source" value={preview.source} />
                      <PreviewField label="Page" value={preview.page} />
                    </Group>
                    <div>
                      <Text size="xs" fw={600} c="dimmed" mb={4}>
                        Class features (excerpt)
                      </Text>
                      <Text className={classes.spellPreviewDescription} component="div">
                        {preview.description}
                      </Text>
                    </div>
                  </Stack>
                </ScrollArea.Autosize>
              ) : (
                <Text size="sm" c="dimmed" py="md">
                  Select a class to see details here, then confirm.
                </Text>
              )}
            </Grid.Col>
          </Grid>
        )}
        {!loading && !error ? (
          <Group justify="space-between" align="center" wrap="wrap" mt="xs">
            <Text size="xs" c="dimmed">
              {sorted.length} class{sorted.length === 1 ? '' : 'es'} shown
            </Text>
            <Button
              size="sm"
              disabled={!selectedVisible}
              onClick={() => {
                if (!selectedVisible) return
                onPick(rawClassToSheetFields(selectedVisible))
                closeModal()
              }}
            >
              Use this class
            </Button>
          </Group>
        ) : null}
      </Stack>
    </Modal>
  )
}
