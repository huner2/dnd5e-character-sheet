import { useEffect, useState } from 'react'
import { Group, Loader, Modal, ScrollArea, Stack, Text } from '@mantine/core'
import {
  buildFeatPreview,
  findRawFeatByRefString,
  loadAllRawFeats,
  type FeatPreviewModel,
} from '../fiveetools/featsData'
import { FeatPreviewContent } from './FeatPreviewContent'

export type FeatDetailsModalProps = {
  opened: boolean
  onClose: () => void
  featName: string
  featRef: string | undefined
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

function CustomBody({ name }: { name: string }) {
  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Custom feat — compendium entry is not available.
      </Text>
      <PreviewField label="Name" value={name.trim() || '—'} />
    </Stack>
  )
}

export function FeatDetailsModal({
  opened,
  onClose,
  featName,
  featRef,
}: FeatDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<FeatPreviewModel | null>(null)

  const ref = featRef?.trim() ?? ''

  useEffect(() => {
    if (!opened || !ref) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      setPreview(null)
      try {
        const feats = await loadAllRawFeats()
        if (cancelled) return
        const raw = findRawFeatByRefString(feats, ref)
        if (!raw) {
          setError('This feat is no longer in the bundled data (or the reference is invalid).')
          return
        }
        setPreview(buildFeatPreview(raw))
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load feat details')
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
    featName.trim() || preview?.name.trim() || (ref ? 'Feat details' : '(No feat)')

  return (
    <Modal title={title} opened={opened} onClose={onClose} size="lg">
      {!ref ? (
        <CustomBody name={featName} />
      ) : loading || (!preview && !error) ? (
        <Group justify="center" p="xl">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">
            Loading feat…
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
          <CustomBody name={featName} />
        </Stack>
      ) : preview ? (
        <ScrollArea.Autosize mah={520} type="auto" offsetScrollbars>
          <FeatPreviewContent preview={preview} />
        </ScrollArea.Autosize>
      ) : null}
    </Modal>
  )
}
