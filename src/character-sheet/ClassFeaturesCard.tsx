import { useEffect, useState } from 'react'
import { Group, Loader, ScrollArea, Stack, Text, Textarea } from '@mantine/core'
import {
  compendiumClassFeaturesPlain,
  findCompendiumClassByRefString,
  loadAllRawClasses,
} from '../fiveetools/classesData'
import classes from './CharacterSheet.module.scss'
import { SectionCard } from './SectionCard'

type ClassFeaturesCardProps = {
  className: string
  classNameFiveEToolsRef: string | undefined
  /** Player-written additions (stored as {@link CharacterSheetData.classFeatures}). */
  classFeaturesNotes: string
  onChangeNotes: (value: string) => void
}

export function ClassFeaturesCard({
  className,
  classNameFiveEToolsRef,
  classFeaturesNotes,
  onChangeNotes,
}: ClassFeaturesCardProps) {
  const ref = classNameFiveEToolsRef?.trim() ?? ''
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [compendiumBody, setCompendiumBody] = useState<string | null>(null)

  useEffect(() => {
    if (!ref) {
      setLoading(false)
      setError(null)
      setCompendiumBody(null)
      return
    }
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      setCompendiumBody(null)
      try {
        const list = await loadAllRawClasses()
        if (cancelled) return
        const cls = findCompendiumClassByRefString(list, ref)
        if (!cls) {
          setError('Class data was not found for this reference.')
          return
        }
        const plain = compendiumClassFeaturesPlain(cls)
        setCompendiumBody(plain === '—' ? 'No feature text is available for this class in the bundled data.' : plain)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load class features')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ref])

  const displayTitle =
    ref && className.trim()
      ? `Class features — ${className.trim()}`
      : 'Class features'

  return (
    <SectionCard title={displayTitle}>
      <Stack gap="sm">
        {ref ? (
          loading ? (
            <Group justify="center" py="md">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                Loading class features…
              </Text>
            </Group>
          ) : error ? (
            <Text size="sm" c="red">
              {error}
            </Text>
          ) : compendiumBody !== null ? (
            <ScrollArea.Autosize mah={420} type="auto" offsetScrollbars>
              <Text size="sm" className={classes.spellPreviewDescription} component="div">
                {compendiumBody}
              </Text>
            </ScrollArea.Autosize>
          ) : null
        ) : (
          <Text size="sm" c="dimmed">
            Choose <strong>Pre-defined (5etools data)</strong> for class in the Character header to show the
            official class feature text here. Your additions and homebrew go in{' '}
            <strong>Additional notes</strong> below.
          </Text>
        )}

        <Textarea
          label="Additional notes"
          description="Extra reminders, subclass highlights, or anything not in the block above"
          autosize
          minRows={4}
          size="xs"
          value={classFeaturesNotes}
          onChange={(e) => onChangeNotes(e.currentTarget.value)}
        />
      </Stack>
    </SectionCard>
  )
}
