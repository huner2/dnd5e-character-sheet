import { Checkbox, Group, NumberInput, Stack, Text } from '@mantine/core'
import type { AbilityBlock, AbilityKey, CharacterSheetData, SkillLine } from './types'
import classes from './CharacterSheet.module.scss'
import { SectionCard } from './SectionCard'
import { TrainingPanel } from './TrainingPanel'

const ORDER: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

const MOD_RANGE = { min: -10, max: 10 } as const
const SAVE_RANGE = { min: -10, max: 20 } as const
const SKILL_RANGE = { min: -10, max: 30 } as const
const PB_RANGE = { min: 0, max: 10 } as const

type AbilityColumnProps = {
  proficiencyBonus: number
  inspiration: boolean
  abilities: CharacterSheetData['abilities']
  armorTraining: CharacterSheetData['armorTraining']
  weaponProficiencies: CharacterSheetData['weaponProficiencies']
  toolProficiencies: string
  onChangeProficiencyBonus: (value: number) => void
  onToggleInspiration: (value: boolean) => void
  onChangeAbility: (key: AbilityKey, patch: Partial<AbilityBlock>) => void
  onChangeSkill: (
    key: AbilityKey,
    index: number,
    patch: Partial<SkillLine>,
  ) => void
  onChangeArmor: (patch: Partial<CharacterSheetData['armorTraining']>) => void
  onChangeWeaponProficiencies: (
    patch: Partial<CharacterSheetData['weaponProficiencies']>,
  ) => void
  onChangeToolProficiencies: (value: string) => void
}

export function AbilityColumn({
  proficiencyBonus,
  inspiration,
  abilities,
  armorTraining,
  weaponProficiencies,
  toolProficiencies,
  onChangeProficiencyBonus,
  onToggleInspiration,
  onChangeAbility,
  onChangeSkill,
  onChangeArmor,
  onChangeWeaponProficiencies,
  onChangeToolProficiencies,
}: AbilityColumnProps) {
  return (
    <Stack gap="sm">
      <Group align="stretch" wrap="wrap" gap="sm" justify="flex-start">
        <SectionCard
          title="Proficiency bonus"
          style={{ flex: '0 0 auto', width: 'fit-content', maxWidth: '100%' }}
        >
          <NumberInput
            value={proficiencyBonus}
            onChange={(v) => {
              const n = typeof v === 'number' ? v : proficiencyBonus
              onChangeProficiencyBonus(n)
            }}
            size="lg"
            w={88}
            min={PB_RANGE.min}
            max={PB_RANGE.max}
            classNames={{ input: classes.mono }}
            styles={{
              input: {
                fontSize: '1.625rem',
                fontWeight: 700,
                lineHeight: 1.15,
                textAlign: 'center',
                minHeight: 48,
              },
            }}
            aria-label="Proficiency bonus"
          />
        </SectionCard>
        <SectionCard
          title="Heroic inspiration"
          style={{ flex: '0 0 auto', width: 'fit-content', maxWidth: '100%' }}
        >
          <Checkbox
            size="xl"
            label="Has inspiration"
            checked={inspiration}
            onChange={(e) => onToggleInspiration(e.currentTarget.checked)}
            styles={{
              label: { fontSize: 'var(--mantine-font-size-md)', fontWeight: 600 },
              body: { alignItems: 'center' },
            }}
          />
        </SectionCard>
      </Group>

      <div className={classes.abilityScoresGrid}>
        {ORDER.map((key) => {
          const block = abilities[key]
          return (
            <BoxWithAbility
              key={key}
              block={block}
              onChangeAbility={(patch) => onChangeAbility(key, patch)}
              onChangeSkill={(index, patch) => onChangeSkill(key, index, patch)}
            />
          )
        })}
      </div>
      <TrainingPanel
        armorTraining={armorTraining}
        weaponProficiencies={weaponProficiencies}
        toolProficiencies={toolProficiencies}
        onChangeArmor={onChangeArmor}
        onChangeWeapons={onChangeWeaponProficiencies}
        onChangeTools={onChangeToolProficiencies}
      />
    </Stack>
  )
}

type BoxWithAbilityProps = {
  block: AbilityBlock
  onChangeAbility: (patch: Partial<AbilityBlock>) => void
  onChangeSkill: (index: number, patch: Partial<SkillLine>) => void
}

function BoxWithAbility({
  block,
  onChangeAbility,
  onChangeSkill,
}: BoxWithAbilityProps) {
  return (
    <div className={`${classes.section} ${classes.abilityStatBox}`}>
      <div className={classes.sectionHeader} style={{ padding: '6px var(--mantine-spacing-xs)' }}>
        <Text size="xs" tt="uppercase" fw={700} ta="center" c="dimmed">
          {block.label}
        </Text>
      </div>
      <Stack p="xs" gap="xs" className={classes.abilityStatBoxBody}>
        <Group justify="space-between" align="flex-end" wrap="nowrap" gap="md">
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              Modifier
            </Text>
            <NumberInput
              size="xs"
              w={72}
              value={block.modifier}
              onChange={(v) =>
                onChangeAbility({
                  modifier: typeof v === 'number' ? v : block.modifier,
                })
              }
              min={MOD_RANGE.min}
              max={MOD_RANGE.max}
              classNames={{ input: classes.mono }}
              styles={{
                input: {
                  fontSize: '1.375rem',
                  fontWeight: 600,
                  lineHeight: 1.2,
                },
              }}
            />
          </Stack>
          <Stack gap={2} align="flex-end" miw={72}>
            <Text size="xs" c="dimmed">
              Score
            </Text>
            <NumberInput
              size="xs"
              w={64}
              value={block.score}
              onChange={(v) =>
                onChangeAbility({
                  score: typeof v === 'number' ? v : block.score,
                })
              }
              min={0}
              max={30}
              classNames={{ input: classes.mono }}
            />
          </Stack>
        </Group>

        <div className={classes.saveRow}>
          <Checkbox
            checked={block.saveProficient}
            onChange={(e) =>
              onChangeAbility({ saveProficient: e.currentTarget.checked })
            }
            aria-label={`${block.label} save proficient`}
          />
          <Text size="xs" fw={600}>
            Saving throws
          </Text>
          <NumberInput
            variant="unstyled"
            size="xs"
            value={block.saveBonus}
            onChange={(v) =>
              onChangeAbility({
                saveBonus: typeof v === 'number' ? v : block.saveBonus,
              })
            }
            {...SAVE_RANGE}
            w={56}
            styles={{ input: { textAlign: 'right' } }}
            classNames={{ input: classes.mono }}
          />
        </div>

        <Text size="xs" tt="uppercase" fw={700} c="dimmed">
          Skills
        </Text>
        {block.skills.map((skill, index) => (
          <div key={skill.name} className={classes.skillRow}>
            <Checkbox
              checked={skill.proficient}
              onChange={(e) =>
                onChangeSkill(index, { proficient: e.currentTarget.checked })
              }
              aria-label={`${skill.name} proficient`}
            />
            <Text size="xs" lineClamp={2}>
              {skill.name}
            </Text>
            <NumberInput
              variant="unstyled"
              size="xs"
              value={skill.bonus}
              onChange={(v) =>
                onChangeSkill(index, {
                  bonus: typeof v === 'number' ? v : skill.bonus,
                })
              }
              {...SKILL_RANGE}
              w={52}
              styles={{ input: { textAlign: 'right' } }}
              classNames={{ input: classes.mono }}
            />
          </div>
        ))}
      </Stack>
    </div>
  )
}
