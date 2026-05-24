import { Grid, Select, Stack, Textarea } from '@mantine/core'
import { alignmentSelectItems, type CharacterSheetData } from './types'
import { ClassFeaturesCard } from './ClassFeaturesCard'
import { FeatsTable } from './FeatsTable'
import { LanguagesTable } from './LanguagesTable'
import { SpeciesTraitsCard } from './SpeciesTraitsCard'
import { SectionCard } from './SectionCard'

type BackgroundTabProps = {
  data: Pick<
    CharacterSheetData,
    | 'className'
    | 'classNameFiveEToolsRef'
    | 'classFeatures'
    | 'species'
    | 'speciesFiveEToolsRef'
    | 'speciesTraits'
    | 'feats'
    | 'featNotes'
    | 'narrative'
    | 'appearance'
    | 'personalityTraits'
    | 'alignment'
    | 'languages'
  >
  onChange: (patch: Partial<CharacterSheetData>) => void
}

export function BackgroundTab({ data, onChange }: BackgroundTabProps) {
  return (
    <Grid gap="md">
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Stack gap="md">
          <ClassFeaturesCard
            className={data.className}
            classNameFiveEToolsRef={data.classNameFiveEToolsRef}
            classFeaturesNotes={data.classFeatures}
            onChangeNotes={(value) => onChange({ classFeatures: value })}
          />
          <SpeciesTraitsCard
            species={data.species}
            speciesFiveEToolsRef={data.speciesFiveEToolsRef}
            speciesTraitsNotes={data.speciesTraits}
            onChangeNotes={(value) => onChange({ speciesTraits: value })}
          />
          <FeatsTable
            feats={data.feats}
            featNotes={data.featNotes}
            onChangeFeats={(feats) => onChange({ feats })}
            onChangeNotes={(featNotes) => onChange({ featNotes })}
          />
        </Stack>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Stack gap="md">
          <SectionCard title="Appearance">
            <Textarea
              autosize
              minRows={2}
              value={data.appearance}
              onChange={(e) => onChange({ appearance: e.currentTarget.value })}
              size="xs"
            />
          </SectionCard>
          <SectionCard title="Personality, ideals & bonds">
            <Textarea
              autosize
              minRows={8}
              value={data.personalityTraits}
              onChange={(e) => onChange({ personalityTraits: e.currentTarget.value })}
              size="xs"
            />
            <Select
              mt="sm"
              label="Alignment"
              size="xs"
              data={alignmentSelectItems(data.alignment)}
              value={data.alignment.trim() === '' ? '' : data.alignment}
              onChange={(v) => onChange({ alignment: v ?? '' })}
              searchable
              comboboxProps={{ withinPortal: true }}
              aria-label="Alignment"
            />
          </SectionCard>
          <LanguagesTable
            languages={data.languages}
            onChange={(languages) => onChange({ languages })}
          />
          <SectionCard title="Other notes">
            <Textarea
              autosize
              minRows={3}
              value={data.narrative}
              onChange={(e) => onChange({ narrative: e.currentTarget.value })}
              size="xs"
            />
          </SectionCard>
        </Stack>
      </Grid.Col>
    </Grid>
  )
}
