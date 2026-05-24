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
  buildWeaponPreview,
  itemRef,
  loadAllRawWeapons,
  rawItemToWeaponRow,
  type RawItem,
} from '../fiveetools/itemsData'
import type { WeaponRow } from './types'
import classes from './CharacterSheet.module.scss'

const LOCALE_SORT = { sensitivity: 'base' as const }

function localeCmp(a: string, b: string): number {
  return a.localeCompare(b, undefined, LOCALE_SORT)
}

const WEAPON_PICKER_SORT_DATA = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'source-asc', label: 'Source (A–Z)' },
  { value: 'source-desc', label: 'Source (Z–A)' },
  { value: 'category-asc', label: 'Category (A–Z)' },
  { value: 'category-desc', label: 'Category (Z–A)' },
] as const

type WeaponPickerSortMode = (typeof WEAPON_PICKER_SORT_DATA)[number]['value']

function isWeaponPickerSortMode(v: string | null): v is WeaponPickerSortMode {
  return WEAPON_PICKER_SORT_DATA.some((x) => x.value === v)
}

function compareWeaponsForPicker(
  a: RawItem,
  b: RawItem,
  mode: WeaponPickerSortMode,
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
    case 'category-asc': {
      const n = localeCmp(a.weaponCategory ?? '', b.weaponCategory ?? '')
      return n !== 0 ? n : localeCmp(a.name, b.name)
    }
    case 'category-desc': {
      const n = localeCmp(b.weaponCategory ?? '', a.weaponCategory ?? '')
      return n !== 0 ? n : localeCmp(a.name, b.name)
    }
    default: {
      const _x: never = mode
      return _x
    }
  }
}

export type PredefinedWeaponPickerModalProps = {
  opened: boolean
  onClose: () => void
  onPick: (row: Omit<WeaponRow, 'id'>) => void
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

export function PredefinedWeaponPickerModal({
  opened,
  onClose,
  onPick,
}: PredefinedWeaponPickerModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rawWeapons, setRawWeapons] = useState<RawItem[]>([])
  const [query, setQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string | null>('all')
  const [categoryFilter, setCategoryFilter] = useState<string | null>('all')
  const [sortBy, setSortBy] = useState<string | null>('name-asc')
  const [selected, setSelected] = useState<RawItem | null>(null)

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
        const weapons = await loadAllRawWeapons()
        if (cancelled) return
        setRawWeapons(weapons)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load weapons')
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
    for (const it of rawWeapons) {
      if (it.source) s.add(it.source)
    }
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [rawWeapons])

  const categoryKeys = useMemo(() => {
    const s = new Set<string>()
    for (const it of rawWeapons) {
      if (it.weaponCategory) s.add(it.weaponCategory)
    }
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [rawWeapons])

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
    return rawWeapons.filter((it) => {
      if (sf !== 'all' && it.source !== sf) return false
      if (cf !== 'all' && it.weaponCategory !== cf) return false
      if (!q) return true
      const cat = (it.weaponCategory ?? '').toLowerCase()
      const dmg = (it.dmg1 ?? '').toLowerCase()
      return (
        it.name.toLowerCase().includes(q) ||
        it.source.toLowerCase().includes(q) ||
        cat.includes(q) ||
        dmg.includes(q)
      )
    })
  }, [rawWeapons, query, sourceFilter, categoryFilter])

  const sortMode: WeaponPickerSortMode = isWeaponPickerSortMode(sortBy)
    ? sortBy
    : 'name-asc'

  const sortedWeapons = useMemo(() => {
    const out = [...filtered]
    out.sort((a, b) => compareWeaponsForPicker(a, b, sortMode))
    return out
  }, [filtered, sortMode])

  const selectedVisible = useMemo(() => {
    if (!selected) return null
    if (!sortedWeapons.some((it) => itemRef(it) === itemRef(selected))) return null
    return selected
  }, [selected, sortedWeapons])

  const preview = useMemo(() => {
    if (!selectedVisible) return null
    return buildWeaponPreview(selectedVisible)
  }, [selectedVisible])

  return (
    <Modal title="Add weapon from 5etools data" opened={opened} onClose={closeModal} size="xl">
      <Stack gap="sm">
        <Group grow align="flex-start" wrap="wrap">
          <TextInput
            label="Search"
            placeholder="Weapon name, source, damage…"
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
            data={[...WEAPON_PICKER_SORT_DATA]}
            value={sortBy}
            onChange={setSortBy}
            clearable={false}
          />
        </Group>
        {loading ? (
          <Group justify="center" p="xl">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              Loading weapons…
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
                Weapons
              </Text>
              <ScrollArea.Autosize mah={420} type="auto" offsetScrollbars>
                <Stack gap={2}>
                  {sortedWeapons.map((it) => {
                    const isSel =
                      selected !== null && itemRef(it) === itemRef(selected)
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
                      <PreviewField label="Category" value={preview.category} />
                      <PreviewField label="Damage" value={preview.damage} />
                      <PreviewField label="Damage type" value={preview.damageType} />
                      <PreviewField label="Properties" value={preview.properties} />
                    </Group>
                    <Group gap="xl" wrap="wrap">
                      <PreviewField label="Source" value={preview.source} />
                      <PreviewField label="Page" value={preview.page} />
                      <PreviewField label="Weight" value={preview.weight} />
                      <PreviewField label="Rarity" value={preview.rarity} />
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
                  Select a weapon in the list to see its full text here, then add it to your
                  sheet.
                </Text>
              )}
            </Grid.Col>
          </Grid>
        )}
        {!loading && !error ? (
          <Group justify="space-between" align="center" wrap="wrap" mt="xs">
            <Text size="xs" c="dimmed">
              {sortedWeapons.length} weapon{sortedWeapons.length === 1 ? '' : 's'} shown
            </Text>
            <Button
              size="sm"
              disabled={!selectedVisible}
              onClick={() => {
                if (!selectedVisible) return
                onPick(rawItemToWeaponRow(selectedVisible))
                closeModal()
              }}
            >
              Add to weapons
            </Button>
          </Group>
        ) : null}
      </Stack>
    </Modal>
  )
}
