import { useEffect, useState } from 'react'
import { Group, Loader, Modal, ScrollArea, Stack, Text } from '@mantine/core'
import {
  buildLanguagePreview,
  findRawLanguageByRefString,
  loadAllRawLanguages,
  type LanguagePreviewModel,
} from '../fiveetools/languagesData'
import classes from './CharacterSheet.module.scss'

export type LanguageDetailsModalProps = {
  opened: boolean
  onClose: () => void
  languageName: string
  languageRef: string | undefined
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

function CompendiumBody({ preview }: { preview: LanguagePreviewModel }) {
  return (
    <Stack gap="sm">
      <Group gap="xl" wrap="wrap">
        <PreviewField label="Type" value={preview.type} />
        <PreviewField label="Script" value={preview.script} />
        <PreviewField label="Source" value={preview.source} />
        <PreviewField label="Page" value={preview.page} />
      </Group>
      <div>
        <Text size="xs" fw={600} c="dimmed" mb={4}>
          Typical speakers
        </Text>
        <Text size="sm" className={classes.spellPreviewDescription} component="div">
          {preview.typicalSpeakers}
        </Text>
      </div>
      <div>
        <Text size="xs" fw={600} c="dimmed" mb={4}>
          Details
        </Text>
        <Text className={classes.spellPreviewDescription} component="div">
          {preview.description}
        </Text>
      </div>
    </Stack>
  )
}

function CustomBody({ name }: { name: string }) {
  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Custom language — compendium entry is not available.
      </Text>
      <PreviewField label="Name" value={name.trim() || '—'} />
    </Stack>
  )
}

export function LanguageDetailsModal({
  opened,
  onClose,
  languageName,
  languageRef,
}: LanguageDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<LanguagePreviewModel | null>(null)

  const ref = languageRef?.trim() ?? ''

  useEffect(() => {
    if (!opened || !ref) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      setPreview(null)
      try {
        const languages = await loadAllRawLanguages()
        if (cancelled) return
        const raw = findRawLanguageByRefString(languages, ref)
        if (!raw) {
          setError('This language is no longer in the bundled data (or the reference is invalid).')
          return
        }
        setPreview(buildLanguagePreview(raw))
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load language details')
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
    languageName.trim() || preview?.name.trim() || (ref ? 'Language details' : '(No language)')

  return (
    <Modal title={title} opened={opened} onClose={onClose} size="lg">
      {!ref ? (
        <CustomBody name={languageName} />
      ) : loading || (!preview && !error) ? (
        <Group justify="center" p="xl">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">
            Loading language…
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
          <CustomBody name={languageName} />
        </Stack>
      ) : preview ? (
        <ScrollArea.Autosize mah={520} type="auto" offsetScrollbars>
          <CompendiumBody preview={preview} />
        </ScrollArea.Autosize>
      ) : null}
    </Modal>
  )
}
