import { Group, Stack, Text } from '@mantine/core'
import type { FeatPreviewModel } from '../fiveetools/featsData'
import classes from './CharacterSheet.module.scss'

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

function PreviewBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text size="xs" fw={600} c="dimmed" mb={4}>
        {label}
      </Text>
      <Text className={classes.spellPreviewDescription} component="div">
        {value}
      </Text>
    </div>
  )
}

export type FeatPreviewContentProps = {
  preview: FeatPreviewModel
  /** When set, shown as a heading above the metadata (picker modal). */
  title?: string
}

export function FeatPreviewContent({ preview, title }: FeatPreviewContentProps) {
  return (
    <Stack gap="sm">
      {title ? (
        <Text fw={700} size="lg">
          {title}
        </Text>
      ) : null}
      <Group gap="xl" wrap="wrap">
        <PreviewField label="Category" value={preview.category} />
        <PreviewField label="Source" value={preview.source} />
        <PreviewField label="Page" value={preview.page} />
        {preview.repeatable === 'Yes' ? (
          <PreviewField label="Repeatable" value={preview.repeatable} />
        ) : null}
        {preview.additionalSpells === 'Yes' ? (
          <PreviewField label="Grants spells" value="Yes" />
        ) : null}
      </Group>
      {preview.prerequisites !== '—' ? (
        <PreviewBlock label="Prerequisites" value={preview.prerequisites} />
      ) : null}
      {preview.abilityIncrease !== '—' ? (
        <PreviewField label="Ability score increase" value={preview.abilityIncrease} />
      ) : null}
      <PreviewBlock label="Description" value={preview.description} />
    </Stack>
  )
}
