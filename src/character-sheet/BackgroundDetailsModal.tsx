import { useEffect, useState } from 'react'
import { Group, Loader, Modal, ScrollArea, Stack, Text } from '@mantine/core'
import {
  buildBackgroundPreview,
  findRawBackgroundByRefString,
  loadAllRawBackgrounds,
  type BackgroundPreviewModel,
} from '../fiveetools/backgroundsData'
import classes from './CharacterSheet.module.scss'

export type BackgroundDetailsModalProps = {
  opened: boolean
  onClose: () => void
  /** Display name from the sheet. */
  backgroundName: string
  /** Compendium ref when set (`Name|SOURCE`). */
  backgroundRef: string | undefined
  /** Optional character story / notes from the Background tab. */
  narrative?: string
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
  narrative,
}: {
  preview: BackgroundPreviewModel
  narrative: string
}) {
  return (
    <Stack gap="sm">
      <Group gap="xl" wrap="wrap">
        <PreviewField label="Source" value={preview.source} />
        <PreviewField label="Page" value={preview.page} />
      </Group>
      <div>
        <Text size="xs" fw={600} c="dimmed" mb={4}>
          Description
        </Text>
        <Text className={classes.spellPreviewDescription} component="div">
          {preview.description}
        </Text>
      </div>
      {narrative.trim() ? (
        <div>
          <Text size="xs" fw={600} c="dimmed" mb={4}>
            Character story (from sheet)
          </Text>
          <Text size="sm" className={classes.spellPreviewDescription} component="div">
            {narrative}
          </Text>
        </div>
      ) : null}
    </Stack>
  )
}

function CustomBody({ name, narrative }: { name: string; narrative: string }) {
  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Custom background — compendium description is not available.
      </Text>
      <PreviewField label="Name" value={name.trim() || '—'} />
      <div>
        <Text size="xs" fw={600} c="dimmed" mb={4}>
          Character story
        </Text>
        <Text size="sm" className={classes.spellPreviewDescription} component="div">
          {narrative.trim() ? narrative : '—'}
        </Text>
      </div>
    </Stack>
  )
}

export function BackgroundDetailsModal({
  opened,
  onClose,
  backgroundName,
  backgroundRef,
  narrative = '',
}: BackgroundDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<BackgroundPreviewModel | null>(null)

  const ref = backgroundRef?.trim() ?? ''

  useEffect(() => {
    if (!opened || !ref) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      setPreview(null)
      try {
        const list = await loadAllRawBackgrounds()
        if (cancelled) return
        const raw = findRawBackgroundByRefString(list, ref)
        if (!raw) {
          setError('This background is no longer in the bundled data (or the reference is invalid).')
          return
        }
        setPreview(buildBackgroundPreview(raw))
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load background details')
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
    backgroundName.trim() || preview?.name.trim() || (ref ? 'Background details' : '(No background)')

  return (
    <Modal title={title} opened={opened} onClose={onClose} size="lg">
      {!ref ? (
        <CustomBody name={backgroundName} narrative={narrative} />
      ) : loading || (!preview && !error) ? (
        <Group justify="center" p="xl">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">
            Loading background…
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
          <CustomBody name={backgroundName} narrative={narrative} />
        </Stack>
      ) : preview ? (
        <ScrollArea.Autosize mah={520} type="auto" offsetScrollbars>
          <CompendiumBody preview={preview} narrative={narrative} />
        </ScrollArea.Autosize>
      ) : null}
    </Modal>
  )
}
