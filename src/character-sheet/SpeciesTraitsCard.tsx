import { useEffect, useState } from 'react'
import { Group, Loader, ScrollArea, Stack, Text, Textarea } from '@mantine/core'
import {
  compendiumSpeciesTraitsPlain,
  findRawRaceByRefString,
  loadAllRawRaces,
} from '../fiveetools/racesData'
import classes from './CharacterSheet.module.scss'
import { SectionCard } from './SectionCard'

type SpeciesTraitsCardProps = {
  species: string
  speciesFiveEToolsRef: string | undefined
  /** Player-written additions (stored as {@link CharacterSheetData.speciesTraits}). */
  speciesTraitsNotes: string
  onChangeNotes: (value: string) => void
}

export function SpeciesTraitsCard({
  species,
  speciesFiveEToolsRef,
  speciesTraitsNotes,
  onChangeNotes,
}: SpeciesTraitsCardProps) {
  const ref = speciesFiveEToolsRef?.trim() ?? ''
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
        const races = await loadAllRawRaces()
        if (cancelled) return
        const race = findRawRaceByRefString(races, ref)
        if (!race) {
          setError('Species data was not found for this reference.')
          return
        }
        const plain = compendiumSpeciesTraitsPlain(race)
        setCompendiumBody(
          plain === '—'
            ? 'No trait text is available for this species in the bundled data.'
            : plain,
        )
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load species traits')
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
    ref && species.trim() ? `Species traits — ${species.trim()}` : 'Species traits'

  return (
    <SectionCard title={displayTitle}>
      <Stack gap="sm">
        {ref ? (
          loading ? (
            <Group justify="center" py="md">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                Loading species traits…
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
            Choose <strong>Pre-defined (5etools data)</strong> for species in the Character header to show the
            official racial traits here. Your additions go in <strong>Additional notes</strong> below.
          </Text>
        )}

        <Textarea
          label="Additional notes"
          description="Extra lineage details, table rulings, or anything not in the block above"
          autosize
          minRows={4}
          size="xs"
          value={speciesTraitsNotes}
          onChange={(e) => onChangeNotes(e.currentTarget.value)}
        />
      </Stack>
    </SectionCard>
  )
}
