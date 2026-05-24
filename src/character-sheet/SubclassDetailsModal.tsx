import { useEffect, useState } from 'react'
import { Group, Loader, Modal, ScrollArea, Stack, Text } from '@mantine/core'
import {
  buildSubclassPreview,
  findCompendiumSubclassByRefString,
  loadAllCompendiumSubclasses,
  type SubclassPreviewModel,
} from '../fiveetools/classesData'
import classes from './CharacterSheet.module.scss'

export type SubclassDetailsModalProps = {
  opened: boolean
  onClose: () => void
  subclassName: string
  subclassRef: string | undefined
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
  preview: SubclassPreviewModel
  sheetNotes: string
}) {
  return (
    <Stack gap="sm">
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
      {sheetNotes.trim() ? (
        <div>
          <Text size="xs" fw={600} c="dimmed" mb={4}>
            Class features (from sheet)
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
        Custom subclass — compendium rules are not available.
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

export function SubclassDetailsModal({
  opened,
  onClose,
  subclassName,
  subclassRef,
  sheetClassFeatures = '',
}: SubclassDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<SubclassPreviewModel | null>(null)

  const ref = subclassRef?.trim() ?? ''

  useEffect(() => {
    if (!opened || !ref) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      setPreview(null)
      try {
        const list = await loadAllCompendiumSubclasses()
        if (cancelled) return
        const raw = findCompendiumSubclassByRefString(list, ref)
        if (!raw) {
          setError('This subclass is no longer in the bundled data (or the reference is invalid).')
          return
        }
        setPreview(buildSubclassPreview(raw))
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load subclass details')
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
    subclassName.trim() ||
    preview?.name.trim() ||
    (ref ? 'Subclass details' : '(No subclass)')

  return (
    <Modal title={title} opened={opened} onClose={onClose} size="lg">
      {!ref ? (
        <CustomBody name={subclassName} sheetNotes={sheetClassFeatures} />
      ) : loading || (!preview && !error) ? (
        <Group justify="center" p="xl">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">
            Loading subclass…
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
          <CustomBody name={subclassName} sheetNotes={sheetClassFeatures} />
        </Stack>
      ) : preview ? (
        <ScrollArea.Autosize mah={520} type="auto" offsetScrollbars>
          <CompendiumBody preview={preview} sheetNotes={sheetClassFeatures} />
        </ScrollArea.Autosize>
      ) : null}
    </Modal>
  )
}
