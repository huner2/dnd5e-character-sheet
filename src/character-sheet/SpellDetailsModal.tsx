import { useEffect, useState } from 'react'
import { Group, Loader, Modal, ScrollArea, Stack, Text } from '@mantine/core'
import {
  buildSpellPreview,
  findRawSpellByRefString,
  getSpellSourceRecord,
  loadAllRawSpells,
  loadSpellSourcesJson,
  type SpellPreviewModel,
} from '../fiveetools/spellsData'
import type { SpellbookRow } from './types'
import classes from './CharacterSheet.module.scss'

export type SpellDetailsModalProps = {
  opened: boolean
  onClose: () => void
  row: SpellbookRow | null
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
}: {
  preview: SpellPreviewModel
  playerNotes: string
}) {
  return (
    <Stack gap="sm">
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
        <Text size="sm" className={classes.spellPreviewDescription} component="div">
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

function CustomSpellBody({ row }: { row: SpellbookRow }) {
  const levelLabel = row.cantrip ? 'Cantrip' : `${row.level}${ordinalSuffix(row.level)} level`
  const yn = (v: boolean) => (v ? 'Yes' : 'No')
  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Custom spell — compendium description is not available.
      </Text>
      <Group gap="xl" wrap="wrap">
        <PreviewField label="Level" value={levelLabel} />
        <PreviewField label="Casting time" value={row.castingTime || '—'} />
        <PreviewField label="Range" value={row.range || '—'} />
      </Group>
      <Group gap="xl" wrap="wrap">
        <PreviewField label="Concentration" value={yn(row.concentration)} />
        <PreviewField label="Ritual" value={yn(row.ritual)} />
        <PreviewField label="Material component" value={yn(row.material)} />
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

function ordinalSuffix(n: number): string {
  const v = n % 100
  if (v >= 11 && v <= 13) return 'th'
  switch (n % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}

export function SpellDetailsModal({ opened, onClose, row }: SpellDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<SpellPreviewModel | null>(null)

  const ref = row?.fiveEToolsRef?.trim() ?? ''

  useEffect(() => {
    if (!opened || !row || !ref) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      setPreview(null)
      try {
        const [spells, sources] = await Promise.all([
          loadAllRawSpells(),
          loadSpellSourcesJson(),
        ])
        if (cancelled) return
        const raw = findRawSpellByRefString(spells, ref)
        if (!raw) {
          setError('This spell is no longer in the bundled data (or the reference is invalid).')
          return
        }
        const record = getSpellSourceRecord(sources, raw)
        setPreview(buildSpellPreview(raw, record))
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load spell details')
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
    row?.name.trim() ||
    preview?.name.trim() ||
    (ref ? 'Spell details' : '(Unnamed spell)')

  return (
    <Modal title={title} opened={opened} onClose={onClose} size="lg">
      {!row ? null : !ref ? (
        <CustomSpellBody row={row} />
      ) : loading || (!preview && !error) ? (
        <Group justify="center" p="xl">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">
            Loading spell…
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
          <CustomSpellBody row={row} />
        </Stack>
      ) : preview ? (
        <ScrollArea.Autosize mah={520} type="auto" offsetScrollbars>
          <CompendiumPreviewBody preview={preview} playerNotes={row.notes} />
        </ScrollArea.Autosize>
      ) : null}
    </Modal>
  )
}
