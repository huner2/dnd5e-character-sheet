import { Group, NumberInput, Select, Stack, Text } from '@mantine/core'
import {
  CREATURE_SIZE_SELECT_DATA,
  STANDARD_CREATURE_SIZES,
  type CharacterSheetData,
} from './types'
import classes from './CharacterSheet.module.scss'
import { SectionCard } from './SectionCard'

type CombatBarProps = {
  data: Pick<
    CharacterSheetData,
    'initiative' | 'speed' | 'size' | 'passivePerception'
  >
  onChange: (patch: Partial<CharacterSheetData>) => void
}

export function CombatBar({ data, onChange }: CombatBarProps) {
  const sizeTrim = data.size.trim()
  const sizeSelectValue = (STANDARD_CREATURE_SIZES as readonly string[]).includes(sizeTrim)
    ? sizeTrim
    : ''

  return (
    <SectionCard title="Combat">
      <Group grow gap="xs" wrap="wrap">
        <Stack gap={2}>
          <Text size="xs" tt="uppercase" fw={600} c="dimmed">
            Initiative
          </Text>
          <NumberInput
            value={data.initiative}
            onChange={(v) =>
              onChange({
                initiative: typeof v === 'number' ? v : data.initiative,
              })
            }
            size="xs"
            min={-10}
            max={30}
            classNames={{ input: classes.mono }}
          />
        </Stack>
        <Stack gap={2}>
          <Text size="xs" tt="uppercase" fw={600} c="dimmed">
            Speed
          </Text>
          <NumberInput
            value={data.speed}
            onChange={(v) =>
              onChange({ speed: typeof v === 'number' ? v : data.speed })
            }
            size="xs"
            min={0}
            max={200}
            classNames={{ input: classes.mono }}
          />
        </Stack>
        <Stack gap={2}>
          <Text size="xs" tt="uppercase" fw={600} c="dimmed">
            Size
          </Text>
          <Select
            value={sizeSelectValue}
            onChange={(v) => onChange({ size: v ?? '' })}
            data={CREATURE_SIZE_SELECT_DATA}
            size="xs"
            comboboxProps={{ withinPortal: true }}
            aria-label="Size"
            classNames={{ input: classes.mono }}
          />
        </Stack>
        <Stack gap={2}>
          <Text size="xs" tt="uppercase" fw={600} c="dimmed">
            Passive perception
          </Text>
          <NumberInput
            value={data.passivePerception}
            onChange={(v) =>
              onChange({
                passivePerception:
                  typeof v === 'number' ? v : data.passivePerception,
              })
            }
            size="xs"
            min={0}
            max={40}
            classNames={{ input: classes.mono }}
          />
        </Stack>
      </Group>
    </SectionCard>
  )
}
