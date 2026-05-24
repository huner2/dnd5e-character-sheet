import { useEffect, useState } from 'react'
import { Group, Loader, Modal, ScrollArea, Stack, Text } from '@mantine/core'
import {
  buildClassPreview,
  findCompendiumClassByRefString,
  loadAllRawClasses,
  type ClassPreviewModel,
} from '../fiveetools/classesData'
import classes from './CharacterSheet.module.scss'

export type ClassDetailsModalProps = {
  opened: boolean
  onClose: () => void
  className: string
  classRef: string | undefined
  /** Class features / notes from the Background tab textarea. */
  sheetClassFeatures?: string
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
  sheetNotes,
}: {
  preview: ClassPreviewModel
  sheetNotes: string
}) {
  return (
    <Stack gap="sm">
      <Group gap="xl" wrap="wrap">
        <PreviewField label="Hit die" value={preview.hitDie} />
        <PreviewField label="Saving throws" value={preview.savingThrows} />
        <PreviewField label="Spellcasting ability" value={preview.spellcastingAbility} />
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
      {sheetNotes.trim() ? (
        <div>
          <Text size="xs" fw={600} c="dimmed" mb={4}>
            Your class features (from sheet)
          </Text>
          <Text size="sm" className={classes.spellPreviewDescription} component="div">
            {sheetNotes}
          </Text>
        </div>
      ) : null}
    </Stack>
  )
}

function CustomBody({ name, sheetNotes }: { name: string; sheetNotes: string }) {
  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Custom class — compendium rules are not available.
      </Text>
      <PreviewField label="Name" value={name.trim() || '—'} />
      <div>
        <Text size="xs" fw={600} c="dimmed" mb={4}>
          Class features (from sheet)
        </Text>
        <Text size="sm" className={classes.spellPreviewDescription} component="div">
          {sheetNotes.trim() ? sheetNotes : '—'}
        </Text>
      </div>
    </Stack>
  )
}

export function ClassDetailsModal({
  opened,
  onClose,
  className,
  classRef,
  sheetClassFeatures = '',
}: ClassDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ClassPreviewModel | null>(null)

  const ref = classRef?.trim() ?? ''

  useEffect(() => {
    if (!opened || !ref) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      setPreview(null)
      try {
        const list = await loadAllRawClasses()
        if (cancelled) return
        const raw = findCompendiumClassByRefString(list, ref)
        if (!raw) {
          setError('This class is no longer in the bundled data (or the reference is invalid).')
          return
        }
        setPreview(buildClassPreview(raw))
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load class details')
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
    className.trim() || preview?.name.trim() || (ref ? 'Class details' : '(No class)')

  return (
    <Modal title={title} opened={opened} onClose={onClose} size="lg">
      {!ref ? (
        <CustomBody name={className} sheetNotes={sheetClassFeatures} />
      ) : loading || (!preview && !error) ? (
        <Group justify="center" p="xl">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">
            Loading class…
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
          <CustomBody name={className} sheetNotes={sheetClassFeatures} />
        </Stack>
      ) : preview ? (
        <ScrollArea.Autosize mah={520} type="auto" offsetScrollbars>
          <CompendiumBody preview={preview} sheetNotes={sheetClassFeatures} />
        </ScrollArea.Autosize>
      ) : null}
    </Modal>
  )
}
