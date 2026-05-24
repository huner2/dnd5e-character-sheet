import { Checkbox, Stack, Text, Textarea } from '@mantine/core'
import type { CharacterSheetData } from './types'
import { SectionCard } from './SectionCard'

type TrainingPanelProps = {
  armorTraining: CharacterSheetData['armorTraining']
  weaponProficiencies: CharacterSheetData['weaponProficiencies']
  toolProficiencies: string
  onChangeArmor: (patch: Partial<CharacterSheetData['armorTraining']>) => void
  onChangeWeapons: (patch: Partial<CharacterSheetData['weaponProficiencies']>) => void
  onChangeTools: (value: string) => void
}

export function TrainingPanel({
  armorTraining,
  weaponProficiencies,
  toolProficiencies,
  onChangeArmor,
  onChangeWeapons,
  onChangeTools,
}: TrainingPanelProps) {
  return (
    <SectionCard title="Training & proficiencies">
      <Stack gap="sm">
        <Stack gap="sm">
          <Checkbox
            size="xs"
            label="Light armor"
            checked={armorTraining.light}
            onChange={(e) => onChangeArmor({ light: e.currentTarget.checked })}
          />
          <Checkbox
            size="xs"
            label="Medium armor"
            checked={armorTraining.medium}
            onChange={(e) => onChangeArmor({ medium: e.currentTarget.checked })}
          />
          <Checkbox
            size="xs"
            label="Heavy armor"
            checked={armorTraining.heavy}
            onChange={(e) => onChangeArmor({ heavy: e.currentTarget.checked })}
          />
          <Checkbox
            size="xs"
            label="Shields"
            checked={armorTraining.shields}
            onChange={(e) => onChangeArmor({ shields: e.currentTarget.checked })}
          />
        </Stack>
        <Stack gap="xs">
          <Text size="xs" fw={600}>
            Weapons
          </Text>
          <Checkbox
            size="xs"
            label="Simple weapons"
            checked={weaponProficiencies.simple}
            onChange={(e) =>
              onChangeWeapons({ simple: e.currentTarget.checked })
            }
          />
          <Checkbox
            size="xs"
            label="Martial weapons"
            checked={weaponProficiencies.martial}
            onChange={(e) =>
              onChangeWeapons({ martial: e.currentTarget.checked })
            }
          />
          <Textarea
            label="Other (specific weapons, firearms, homebrew, etc.)"
            size="xs"
            minRows={2}
            autosize
            value={weaponProficiencies.other}
            onChange={(e) => onChangeWeapons({ other: e.currentTarget.value })}
          />
        </Stack>
        <Textarea
          label="Tools"
          size="xs"
          minRows={2}
          autosize
          value={toolProficiencies}
          onChange={(e) => onChangeTools(e.currentTarget.value)}
        />
      </Stack>
    </SectionCard>
  )
}
