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
  buildSpellPreview,
  getSpellSourceRecord,
  listDistinctClassListSources,
  listDistinctClassNames,
  loadAllRawSpells,
  loadSpellFileIndex,
  loadSpellSourcesJson,
  rawSpellToSpellbookRow,
  spellMatchesClassFilters,
  spellRef,
  spellSchoolLong,
  type RawSpell,
  type SpellSourcesJson,
} from '../fiveetools/spellsData'
import type { SpellbookRow } from './types'
import classes from './CharacterSheet.module.scss'

const LOCALE_SORT = { sensitivity: 'base' as const }

function localeCmp(a: string, b: string): number {
  return a.localeCompare(b, undefined, LOCALE_SORT)
}

const SPELL_PICKER_SORT_DATA = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'level-asc', label: 'Level (cantrip → 9)' },
  { value: 'level-desc', label: 'Level (9 → cantrip)' },
  { value: 'source-asc', label: 'Source (A–Z)' },
  { value: 'source-desc', label: 'Source (Z–A)' },
  { value: 'school-asc', label: 'School (A–Z)' },
  { value: 'school-desc', label: 'School (Z–A)' },
] as const

type SpellPickerSortMode = (typeof SPELL_PICKER_SORT_DATA)[number]['value']

function isSpellPickerSortMode(v: string | null): v is SpellPickerSortMode {
  return SPELL_PICKER_SORT_DATA.some((x) => x.value === v)
}

function compareSpellsForPicker(a: RawSpell, b: RawSpell, mode: SpellPickerSortMode): number {
  switch (mode) {
    case 'name-asc': {
      const n = localeCmp(a.name, b.name)
      return n !== 0 ? n : localeCmp(a.source, b.source)
    }
    case 'name-desc': {
      const n = localeCmp(b.name, a.name)
      return n !== 0 ? n : localeCmp(b.source, a.source)
    }
    case 'level-asc': {
      const d = a.level - b.level
      return d !== 0 ? d : localeCmp(a.name, b.name)
    }
    case 'level-desc': {
      const d = b.level - a.level
      return d !== 0 ? d : localeCmp(a.name, b.name)
    }
    case 'source-asc': {
      const n = localeCmp(a.source, b.source)
      return n !== 0 ? n : localeCmp(a.name, b.name)
    }
    case 'source-desc': {
      const n = localeCmp(b.source, a.source)
      return n !== 0 ? n : localeCmp(a.name, b.name)
    }
    case 'school-asc': {
      const sa = spellSchoolLong(a.school)
      const sb = spellSchoolLong(b.school)
      const n = localeCmp(sa, sb)
      return n !== 0 ? n : localeCmp(a.name, b.name)
    }
    case 'school-desc': {
      const sa = spellSchoolLong(a.school)
      const sb = spellSchoolLong(b.school)
      const n = localeCmp(sb, sa)
      return n !== 0 ? n : localeCmp(a.name, b.name)
    }
    default: {
      const _x: never = mode
      return _x
    }
  }
}

export type PredefinedSpellPickerModalProps = {
  opened: boolean
  onClose: () => void
  onPick: (row: Omit<SpellbookRow, 'id'>) => void
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

export function PredefinedSpellPickerModal({
  opened,
  onClose,
  onPick,
}: PredefinedSpellPickerModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rawSpells, setRawSpells] = useState<RawSpell[]>([])
  const [sources, setSources] = useState<SpellSourcesJson | null>(null)
  const [sourceKeys, setSourceKeys] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string | null>('all')
  const [classFilter, setClassFilter] = useState<string | null>('all')
  const [classListSourceFilter, setClassListSourceFilter] = useState<string | null>('all')
  const [sortBy, setSortBy] = useState<string | null>('name-asc')
  const [selected, setSelected] = useState<RawSpell | null>(null)

  const closeModal = () => {
    setQuery('')
    setSourceFilter('all')
    setClassFilter('all')
    setClassListSourceFilter('all')
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
        const [index, spells, src] = await Promise.all([
          loadSpellFileIndex(),
          loadAllRawSpells(),
          loadSpellSourcesJson(),
        ])
        if (cancelled) return
        setSourceKeys(Object.keys(index).sort((a, b) => a.localeCompare(b)))
        setRawSpells(spells)
        setSources(src)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load spells')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [opened])

  const sourceSelectData = useMemo(
    () => [
      { value: 'all', label: 'All sources' },
      ...sourceKeys.map((k) => ({ value: k, label: k })),
    ],
    [sourceKeys],
  )

  const classFilterData = useMemo(() => {
    if (!sources) return [{ value: 'all', label: 'All classes' }]
    return [
      { value: 'all', label: 'All classes' },
      ...listDistinctClassNames(sources).map((n) => ({ value: n, label: n })),
    ]
  }, [sources])

  const classListSourceData = useMemo(() => {
    if (!sources) return [{ value: 'all', label: 'Any spellbook' }]
    return [
      { value: 'all', label: 'Any spellbook' },
      ...listDistinctClassListSources(sources).map((s) => ({ value: s, label: s })),
    ]
  }, [sources])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const cf = classFilter ?? 'all'
    const clsSrc = classListSourceFilter ?? 'all'
    return rawSpells.filter((s) => {
      if (sourceFilter && sourceFilter !== 'all' && s.source !== sourceFilter) return false
      if (sources) {
        const record = getSpellSourceRecord(sources, s)
        if (!spellMatchesClassFilters(record, cf, clsSrc)) return false
      }
      if (!q) return true
      return s.name.toLowerCase().includes(q) || s.source.toLowerCase().includes(q)
    })
  }, [rawSpells, query, sourceFilter, sources, classFilter, classListSourceFilter])

  const sortMode: SpellPickerSortMode = isSpellPickerSortMode(sortBy) ? sortBy : 'name-asc'

  const sortedSpells = useMemo(() => {
    const out = [...filtered]
    out.sort((a, b) => compareSpellsForPicker(a, b, sortMode))
    return out
  }, [filtered, sortMode])

  /** Selection only counts for preview / add when it’s still in the filtered list. */
  const selectedVisible = useMemo(() => {
    if (!selected) return null
    if (!sortedSpells.some((s) => spellRef(s) === spellRef(selected))) return null
    return selected
  }, [selected, sortedSpells])

  const preview = useMemo(() => {
    if (!selectedVisible) return null
    const record = sources ? getSpellSourceRecord(sources, selectedVisible) : undefined
    return buildSpellPreview(selectedVisible, record)
  }, [selectedVisible, sources])

  return (
    <Modal
      title="Add spell from 5etools data"
      opened={opened}
      onClose={closeModal}
      size="xl"
    >
      <Stack gap="sm">
        <Group grow align="flex-start" wrap="wrap">
          <TextInput
            label="Search"
            placeholder="Spell name or source…"
            size="xs"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            autoFocus
          />
          <Select
            label="Spell source book"
            description="Which book this spell is from"
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
        </Group>
        <Group grow align="flex-start" wrap="wrap">
          <Select
            label="Sort by"
            description="Order of the spell list"
            size="xs"
            data={[...SPELL_PICKER_SORT_DATA]}
            value={sortBy}
            onChange={setSortBy}
            clearable={false}
          />
          <Select
            label="Class"
            description="Filter by who can learn it"
            size="xs"
            data={classFilterData}
            value={classFilter}
            onChange={(v) => {
              setClassFilter(v)
              setSelected(null)
            }}
            searchable
            clearable={false}
            disabled={!sources}
          />
          <Select
            label="Class spellbook"
            description="Rulebook tag on the class line (PHB, XPHB, …)"
            size="xs"
            data={classListSourceData}
            value={classListSourceFilter}
            onChange={(v) => {
              setClassListSourceFilter(v)
              setSelected(null)
            }}
            searchable
            clearable={false}
            disabled={!sources}
          />
        </Group>
        {loading ? (
          <Group justify="center" p="xl">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              Loading spell files…
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
                Spells
              </Text>
              <ScrollArea.Autosize mah={420} type="auto" offsetScrollbars>
                <Stack gap={2}>
                  {sortedSpells.map((s) => {
                    const isSel = selected !== null && spellRef(s) === spellRef(selected)
                    return (
                      <UnstyledButton
                        key={spellRef(s)}
                        type="button"
                        onClick={() => setSelected(s)}
                        className={`${classes.predefinedSpellRow}${isSel ? ` ${classes.predefinedSpellRowSelected}` : ''}`}
                      >
                        <Group justify="space-between" wrap="nowrap" gap="xs">
                          <Text size="sm" lineClamp={1} style={{ flex: 1 }}>
                            {s.name}
                          </Text>
                          <Text
                            size="xs"
                            c="dimmed"
                            className={classes.mono}
                            w={28}
                            ta="right"
                          >
                            {s.level === 0 ? '—' : s.level}
                          </Text>
                          <Text size="xs" c="dimmed" w={44} className={classes.mono}>
                            {s.source}
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
                      <PreviewField label="Level" value={preview.levelLabel} />
                      <PreviewField label="School" value={preview.school} />
                      <PreviewField label="Source" value={preview.source} />
                      <PreviewField label="Page" value={preview.page} />
                    </Group>
                    <div>
                      <Text size="xs" fw={600} c="dimmed" mb={4}>
                        Classes
                      </Text>
                      <Text
                        size="sm"
                        className={classes.spellPreviewDescription}
                        component="div"
                      >
                        {preview.classes}
                      </Text>
                    </div>
                    <Group gap="xl" wrap="wrap">
                      <PreviewField label="Casting time" value={preview.castingTime} />
                      <PreviewField label="Range" value={preview.range} />
                      <PreviewField label="Components" value={preview.components} />
                      <PreviewField label="Duration" value={preview.duration} />
                    </Group>
                    <Group gap="xl" wrap="wrap">
                      <PreviewField label="Concentration" value={preview.concentration} />
                      <PreviewField label="Ritual" value={preview.ritual} />
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
                  Select a spell in the list to see its full text here, then add it to your
                  spellbook.
                </Text>
              )}
            </Grid.Col>
          </Grid>
        )}
        {!loading && !error ? (
          <Group justify="space-between" align="center" wrap="wrap" mt="xs">
            <Text size="xs" c="dimmed">
              {sortedSpells.length} spell{sortedSpells.length === 1 ? '' : 's'} shown
            </Text>
            <Button
              size="sm"
              disabled={!selectedVisible}
              onClick={() => {
                if (!selectedVisible) return
                onPick(rawSpellToSpellbookRow(selectedVisible))
                closeModal()
              }}
            >
              Add to spellbook
            </Button>
          </Group>
        ) : null}
      </Stack>
    </Modal>
  )
}
