import { useEffect, useState } from 'react'
import { Group, Loader, Modal, ScrollArea, Stack, Text } from '@mantine/core'
import {
  buildRacePreview,
  findRawRaceByRefString,
  loadAllRawRaces,
  type RacePreviewModel,
} from '../fiveetools/racesData'
import classes from './CharacterSheet.module.scss'

export type SpeciesDetailsModalProps = {
  opened: boolean
  onClose: () => void
  speciesName: string
  speciesRef: string | undefined
  speciesTraits?: string
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

function CompendiumBody({
  preview,
  sheetTraits,
}: {
  preview: RacePreviewModel
  sheetTraits: string
}) {
  return (
    <Stack gap="sm">
      <Group gap="xl" wrap="wrap">
        <PreviewField label="Source" value={preview.source} />
        <PreviewField label="Page" value={preview.page} />
        <PreviewField label="Size" value={preview.size} />
        <PreviewField label="Speed" value={preview.speed} />
      </Group>
      <div>
        <Text size="xs" fw={600} c="dimmed" mb={4}>
          Traits
        </Text>
        <Text className={classes.spellPreviewDescription} component="div">
          {preview.description}
        </Text>
      </div>
      {sheetTraits.trim() ? (
        <div>
          <Text size="xs" fw={600} c="dimmed" mb={4}>
            Additional notes
          </Text>
          <Text size="sm" className={classes.spellPreviewDescription} component="div">
            {sheetTraits}
          </Text>
        </div>
      ) : null}
    </Stack>
  )
}

function CustomBody({ name, sheetTraits }: { name: string; sheetTraits: string }) {
  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Custom species — compendium rules are not available.
      </Text>
      <PreviewField label="Name" value={name.trim() || '—'} />
      <div>
        <Text size="xs" fw={600} c="dimmed" mb={4}>
          Additional notes
        </Text>
        <Text size="sm" className={classes.spellPreviewDescription} component="div">
          {sheetTraits.trim() ? sheetTraits : '—'}
        </Text>
      </div>
    </Stack>
  )
}

export function SpeciesDetailsModal({
  opened,
  onClose,
  speciesName,
  speciesRef,
  speciesTraits = '',
}: SpeciesDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<RacePreviewModel | null>(null)

  const ref = speciesRef?.trim() ?? ''

  useEffect(() => {
    if (!opened || !ref) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      setPreview(null)
      try {
        const races = await loadAllRawRaces()
        if (cancelled) return
        const raw = findRawRaceByRefString(races, ref)
        if (!raw) {
          setError('This species is no longer in the bundled data (or the reference is invalid).')
          return
        }
        setPreview(buildRacePreview(raw))
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load species details')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [opened, ref])

  const title =
    speciesName.trim() || preview?.name.trim() || (ref ? 'Species details' : '(No species)')

  return (
    <Modal title={title} opened={opened} onClose={onClose} size="lg">
      {!ref ? (
        <CustomBody name={speciesName} sheetTraits={speciesTraits} />
      ) : loading || (!preview && !error) ? (
        <Group justify="center" p="xl">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">
            Loading species…
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
          <CustomBody name={speciesName} sheetTraits={speciesTraits} />
        </Stack>
      ) : preview ? (
        <ScrollArea.Autosize mah={520} type="auto" offsetScrollbars>
          <CompendiumBody preview={preview} sheetTraits={speciesTraits} />
        </ScrollArea.Autosize>
      ) : null}
    </Modal>
  )
}
