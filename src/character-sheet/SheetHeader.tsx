import {
  ActionIcon,
  Box,
  Group,
  Input,
  Menu,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
} from '@mantine/core'
import { IconBook, IconChevronDown } from '@tabler/icons-react'
import { useState } from 'react'
import {
  coerceDiceSize,
  DICE_SELECT_DATA,
  type CharacterSheetData,
} from './types'
import { BackgroundDetailsModal } from './BackgroundDetailsModal'
import { ClassDetailsModal } from './ClassDetailsModal'
import { PredefinedBackgroundPickerModal } from './PredefinedBackgroundPickerModal'
import { PredefinedClassPickerModal } from './PredefinedClassPickerModal'
import { PredefinedSpeciesPickerModal } from './PredefinedSpeciesPickerModal'
import { PredefinedSubclassPickerModal } from './PredefinedSubclassPickerModal'
import { SpeciesDetailsModal } from './SpeciesDetailsModal'
import { SubclassDetailsModal } from './SubclassDetailsModal'
import classes from './CharacterSheet.module.scss'
import { nextUsedAfterPillClick } from './slotPillClick'
import { SectionCard } from './SectionCard'

const DEATH_SAVE_COUNT = 3

type SheetHeaderProps = {
  data: CharacterSheetData
  onChange: (patch: Partial<CharacterSheetData>) => void
}

function isCompendiumBackground(data: CharacterSheetData): boolean {
  return (
    typeof data.backgroundFiveEToolsRef === 'string' && data.backgroundFiveEToolsRef.length > 0
  )
}

function isCompendiumClass(data: CharacterSheetData): boolean {
  return typeof data.classNameFiveEToolsRef === 'string' && data.classNameFiveEToolsRef.length > 0
}

function isCompendiumSubclass(data: CharacterSheetData): boolean {
  return typeof data.subclassFiveEToolsRef === 'string' && data.subclassFiveEToolsRef.length > 0
}

function isCompendiumSpecies(data: CharacterSheetData): boolean {
  return typeof data.speciesFiveEToolsRef === 'string' && data.speciesFiveEToolsRef.length > 0
}

export function SheetHeader({ data, onChange }: SheetHeaderProps) {
  const [bgPickerOpen, setBgPickerOpen] = useState(false)
  const [bgDetailsOpen, setBgDetailsOpen] = useState(false)
  const [classPickerOpen, setClassPickerOpen] = useState(false)
  const [classDetailsOpen, setClassDetailsOpen] = useState(false)
  const [subPickerOpen, setSubPickerOpen] = useState(false)
  const [subDetailsOpen, setSubDetailsOpen] = useState(false)
  const [speciesPickerOpen, setSpeciesPickerOpen] = useState(false)
  const [speciesDetailsOpen, setSpeciesDetailsOpen] = useState(false)
  const compendiumBg = isCompendiumBackground(data)
  const compendiumClass = isCompendiumClass(data)
  const compendiumSub = isCompendiumSubclass(data)
  const compendiumSpecies = isCompendiumSpecies(data)

  return (
    <SectionCard title="Character">
      <div className={classes.headerGrid}>
        <Stack gap="xs">
          <div className={classes.identityFields}>
            <TextInput
              label="Name"
              value={data.name}
              onChange={(e) => onChange({ name: e.currentTarget.value })}
              size="xs"
            />
            <div>
              <Group align="flex-end" gap="xs" wrap="nowrap">
                {compendiumSpecies ? (
                  <Input.Wrapper
                    label="Species"
                    size="xs"
                    description="From compendium — use the menu to change"
                    style={{ flex: 1 }}
                  >
                    <Text size="sm" lh={1.5} py={6}>
                      {data.species}
                    </Text>
                  </Input.Wrapper>
                ) : (
                  <TextInput
                    label="Species"
                    style={{ flex: 1 }}
                    value={data.species}
                    onChange={(e) => onChange({ species: e.currentTarget.value })}
                    size="xs"
                  />
                )}
                <Menu position="bottom-end" shadow="md" width={260}>
                  <Menu.Target>
                    <Tooltip label="Species source" openDelay={400}>
                      <ActionIcon variant="light" size="lg" aria-label="Species options">
                        <IconChevronDown size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item onClick={() => setSpeciesPickerOpen(true)}>
                      Pre-defined (5etools data)…
                    </Menu.Item>
                    <Menu.Item
                      onClick={() => onChange({ speciesFiveEToolsRef: undefined })}
                      disabled={!compendiumSpecies}
                    >
                      Custom name (editable)
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
                <Tooltip
                  label={compendiumSpecies ? 'Species details' : 'Species summary'}
                  openDelay={400}
                >
                  <ActionIcon
                    variant="subtle"
                    size="lg"
                    onClick={() => setSpeciesDetailsOpen(true)}
                    aria-label="Species details"
                  >
                    <IconBook size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </div>
            <div>
              <Group align="flex-end" gap="xs" wrap="nowrap">
                {compendiumClass ? (
                  <Input.Wrapper
                    label="Class"
                    size="xs"
                    description="From compendium — use the menu to change"
                    style={{ flex: 1 }}
                  >
                    <Text size="sm" lh={1.5} py={6}>
                      {data.className}
                    </Text>
                  </Input.Wrapper>
                ) : (
                  <TextInput
                    label="Class"
                    style={{ flex: 1 }}
                    value={data.className}
                    onChange={(e) => onChange({ className: e.currentTarget.value })}
                    size="xs"
                  />
                )}
                <Menu position="bottom-end" shadow="md" width={260}>
                  <Menu.Target>
                    <Tooltip label="Class source" openDelay={400}>
                      <ActionIcon variant="light" size="lg" aria-label="Class options">
                        <IconChevronDown size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item onClick={() => setClassPickerOpen(true)}>
                      Pre-defined (5etools data)…
                    </Menu.Item>
                    <Menu.Item
                      onClick={() =>
                        onChange({
                          classNameFiveEToolsRef: undefined,
                          subclassFiveEToolsRef: undefined,
                        })
                      }
                      disabled={!compendiumClass}
                    >
                      Custom name (editable)
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
                <Tooltip
                  label={compendiumClass ? 'Class details' : 'Class summary'}
                  openDelay={400}
                >
                  <ActionIcon
                    variant="subtle"
                    size="lg"
                    onClick={() => setClassDetailsOpen(true)}
                    aria-label="Class details"
                  >
                    <IconBook size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </div>
            <div>
              <Group align="flex-end" gap="xs" wrap="nowrap">
                {compendiumSub ? (
                  <Input.Wrapper
                    label="Subclass"
                    size="xs"
                    description="From compendium — use the menu to change"
                    style={{ flex: 1 }}
                  >
                    <Text size="sm" lh={1.5} py={6}>
                      {data.subclass}
                    </Text>
                  </Input.Wrapper>
                ) : (
                  <TextInput
                    label="Subclass"
                    style={{ flex: 1 }}
                    description={
                      compendiumClass
                        ? 'Type a custom subclass or pick from the compendium'
                        : undefined
                    }
                    value={data.subclass}
                    onChange={(e) => onChange({ subclass: e.currentTarget.value })}
                    size="xs"
                  />
                )}
                <Menu position="bottom-end" shadow="md" width={280}>
                  <Menu.Target>
                    <Tooltip
                      label={
                        compendiumClass
                          ? 'Subclass source'
                          : 'Choose a compendium class first to browse subclasses'
                      }
                      openDelay={400}
                    >
                      <ActionIcon
                        variant="light"
                        size="lg"
                        aria-label="Subclass options"
                        disabled={!compendiumClass}
                      >
                        <IconChevronDown size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      onClick={() => setSubPickerOpen(true)}
                      disabled={!compendiumClass}
                    >
                      Pre-defined (5etools data)…
                    </Menu.Item>
                    <Menu.Item
                      onClick={() => onChange({ subclassFiveEToolsRef: undefined })}
                      disabled={!compendiumSub}
                    >
                      Custom name (editable)
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
                <Tooltip
                  label={compendiumSub ? 'Subclass details' : 'Subclass summary'}
                  openDelay={400}
                >
                  <ActionIcon
                    variant="subtle"
                    size="lg"
                    onClick={() => setSubDetailsOpen(true)}
                    aria-label="Subclass details"
                  >
                    <IconBook size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Group align="flex-end" gap="xs" wrap="nowrap">
                {compendiumBg ? (
                  <Input.Wrapper
                    label="Background"
                    size="xs"
                    description="From compendium — use the menu to change"
                    style={{ flex: 1 }}
                  >
                    <Text size="sm" lh={1.5} py={6}>
                      {data.background}
                    </Text>
                  </Input.Wrapper>
                ) : (
                  <TextInput
                    label="Background"
                    style={{ flex: 1 }}
                    value={data.background}
                    onChange={(e) => onChange({ background: e.currentTarget.value })}
                    size="xs"
                  />
                )}
                <Menu position="bottom-end" shadow="md" width={260}>
                  <Menu.Target>
                    <Tooltip label="Background source" openDelay={400}>
                      <ActionIcon variant="light" size="lg" aria-label="Background options">
                        <IconChevronDown size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item onClick={() => setBgPickerOpen(true)}>
                      Pre-defined (5etools data)…
                    </Menu.Item>
                    <Menu.Item
                      onClick={() => onChange({ backgroundFiveEToolsRef: undefined })}
                      disabled={!compendiumBg}
                    >
                      Custom name (editable)
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
                <Tooltip
                  label={compendiumBg ? 'Background details' : 'Background summary'}
                  openDelay={400}
                >
                  <ActionIcon
                    variant="subtle"
                    size="lg"
                    onClick={() => setBgDetailsOpen(true)}
                    aria-label="Background details"
                  >
                    <IconBook size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </div>
          </div>
        </Stack>

        <div className={classes.statCluster}>
          <Stack gap="sm" align="center">
            <Box className={classes.levelRing}>
              <Text size="xs" c="dimmed" tt="uppercase" ta="center">
                Level
              </Text>
              <NumberInput
                variant="unstyled"
                hideControls
                value={data.level}
                onChange={(v) => onChange({ level: typeof v === 'number' ? v : data.level })}
                size="md"
                classNames={{ input: classes.mono }}
                styles={{ input: { textAlign: 'center', fontWeight: 700, fontSize: '1.25rem' } }}
                min={1}
                max={20}
              />
            </Box>
            <Stack gap={4} align="center" w="100%" maw={120}>
              <Text size="xs" tt="uppercase" fw={600} ta="center">
                XP
              </Text>
              <NumberInput
                size="xs"
                w="100%"
                value={data.xp}
                onChange={(v) =>
                  onChange({ xp: typeof v === 'number' ? v : data.xp })
                }
                min={0}
                max={999999}
                thousandSeparator=","
                classNames={{ input: classes.mono }}
                aria-label="Experience points"
              />
            </Stack>
          </Stack>

          <Stack gap={4} align="center">
            <Text size="xs" tt="uppercase" fw={600}>
              Armor Class
            </Text>
            <Box className={classes.shieldAc}>
              <svg
                className={classes.shieldAcSvg}
                viewBox="0 0 48 56"
                preserveAspectRatio="xMidYMid meet"
                aria-hidden
              >
                <path
                  className={classes.shieldAcShape}
                  d="M 10 8 L 38 8 L 41 13 L 41 36 Q 41 45 24 51 Q 7 45 7 36 L 7 13 L 10 8 Z"
                />
              </svg>
              <Box className={classes.shieldAcInputWrap}>
                <NumberInput
                  variant="unstyled"
                  hideControls
                  value={data.ac}
                  onChange={(v) => onChange({ ac: typeof v === 'number' ? v : data.ac })}
                  w={48}
                  classNames={{ input: classes.mono }}
                  styles={{ input: { textAlign: 'center', fontSize: '1.25rem', fontWeight: 700 } }}
                  min={0}
                />
              </Box>
            </Box>
          </Stack>

          <Stack gap="xs" maw={220}>
            <Text size="xs" tt="uppercase" fw={600}>
              Hit Points
            </Text>
            <Group gap="xs" wrap="nowrap" grow>
              <NumberInput
                label="Current"
                size="xs"
                value={data.hpCurrent}
                onChange={(v) =>
                  onChange({ hpCurrent: typeof v === 'number' ? v : data.hpCurrent })
                }
                min={0}
                classNames={{ input: classes.mono }}
              />
              <NumberInput
                label="Max"
                size="xs"
                value={data.hpMax}
                onChange={(v) =>
                  onChange({ hpMax: typeof v === 'number' ? v : data.hpMax })
                }
                min={0}
                classNames={{ input: classes.mono }}
              />
              <NumberInput
                label="Temp"
                size="xs"
                value={data.hpTemp}
                onChange={(v) =>
                  onChange({ hpTemp: typeof v === 'number' ? v : data.hpTemp })
                }
                min={0}
                classNames={{ input: classes.mono }}
              />
            </Group>
          </Stack>

          <Stack gap="xs" maw={200}>
            <Text size="xs" tt="uppercase" fw={600}>
              Hit dice
            </Text>
            <Group gap="xs" wrap="nowrap" align="flex-end">
              <NumberInput
                label="Spent"
                size="xs"
                w={70}
                value={data.hitDiceSpent}
                onChange={(v) =>
                  onChange({
                    hitDiceSpent: typeof v === 'number' ? v : data.hitDiceSpent,
                  })
                }
                min={0}
                classNames={{ input: classes.mono }}
              />
              <Text size="sm" pb={4} className={classes.mono}>
                /
              </Text>
              <NumberInput
                label="Max"
                size="xs"
                w={70}
                value={data.hitDiceMax}
                onChange={(v) =>
                  onChange({
                    hitDiceMax: typeof v === 'number' ? v : data.hitDiceMax,
                  })
                }
                min={0}
                classNames={{ input: classes.mono }}
              />
              <Select
                label="Die"
                size="xs"
                w={76}
                data={DICE_SELECT_DATA}
                value={data.hitDiceDie}
                onChange={(v) => onChange({ hitDiceDie: coerceDiceSize(v) })}
                comboboxProps={{ withinPortal: true }}
                aria-label="Hit dice size"
                classNames={{ input: classes.mono }}
              />
            </Group>
          </Stack>

          <Stack gap="xs" maw={260}>
            <Text size="xs" tt="uppercase" fw={600}>
              Death saves
            </Text>
            <Group grow gap="md" align="flex-start" wrap="nowrap">
              <Stack gap={4}>
                <Text size="xs" c="dimmed">
                  Successes
                </Text>
                <div
                  className={classes.spellSlotPills}
                  role="group"
                  aria-label="Death save successes"
                >
                  {Array.from({ length: DEATH_SAVE_COUNT }, (_, pillIndex) => (
                    <UnstyledButton
                      key={pillIndex}
                      type="button"
                      className={`${classes.spellSlotPill} ${pillIndex < data.deathSuccesses ? classes.spellSlotPillFilled : ''}`}
                      aria-pressed={pillIndex < data.deathSuccesses}
                      aria-label={
                        pillIndex < data.deathSuccesses
                          ? `Success ${pillIndex + 1} marked, click to clear from here`
                          : `Success ${pillIndex + 1} unmarked, click to mark through here`
                      }
                      onClick={() => {
                        const next = nextUsedAfterPillClick(
                          DEATH_SAVE_COUNT,
                          data.deathSuccesses,
                          pillIndex,
                        )
                        onChange({ deathSuccesses: next })
                      }}
                    />
                  ))}
                </div>
              </Stack>
              <Stack gap={4}>
                <Text size="xs" c="dimmed">
                  Failures
                </Text>
                <div
                  className={classes.spellSlotPills}
                  role="group"
                  aria-label="Death save failures"
                >
                  {Array.from({ length: DEATH_SAVE_COUNT }, (_, pillIndex) => (
                    <UnstyledButton
                      key={pillIndex}
                      type="button"
                      className={`${classes.spellSlotPill} ${pillIndex < data.deathFailures ? classes.spellSlotPillFilled : ''}`}
                      aria-pressed={pillIndex < data.deathFailures}
                      aria-label={
                        pillIndex < data.deathFailures
                          ? `Failure ${pillIndex + 1} marked, click to clear from here`
                          : `Failure ${pillIndex + 1} unmarked, click to mark through here`
                      }
                      onClick={() => {
                        const next = nextUsedAfterPillClick(
                          DEATH_SAVE_COUNT,
                          data.deathFailures,
                          pillIndex,
                        )
                        onChange({ deathFailures: next })
                      }}
                    />
                  ))}
                </div>
              </Stack>
            </Group>
          </Stack>
        </div>
      </div>
      <PredefinedSpeciesPickerModal
        opened={speciesPickerOpen}
        onClose={() => setSpeciesPickerOpen(false)}
        onPick={(fields) => onChange(fields)}
      />
      <SpeciesDetailsModal
        opened={speciesDetailsOpen}
        onClose={() => setSpeciesDetailsOpen(false)}
        speciesName={data.species}
        speciesRef={data.speciesFiveEToolsRef}
        speciesTraits={data.speciesTraits}
      />
      <PredefinedBackgroundPickerModal
        opened={bgPickerOpen}
        onClose={() => setBgPickerOpen(false)}
        onPick={(fields) => onChange(fields)}
      />
      <BackgroundDetailsModal
        opened={bgDetailsOpen}
        onClose={() => setBgDetailsOpen(false)}
        backgroundName={data.background}
        backgroundRef={data.backgroundFiveEToolsRef}
        narrative={data.narrative}
      />
      <PredefinedClassPickerModal
        opened={classPickerOpen}
        onClose={() => setClassPickerOpen(false)}
        onPick={(fields) => onChange(fields)}
      />
      <ClassDetailsModal
        opened={classDetailsOpen}
        onClose={() => setClassDetailsOpen(false)}
        className={data.className}
        classRef={data.classNameFiveEToolsRef}
        sheetClassFeatures={data.classFeatures}
      />
      <PredefinedSubclassPickerModal
        opened={subPickerOpen}
        onClose={() => setSubPickerOpen(false)}
        classNameFiveEToolsRef={data.classNameFiveEToolsRef}
        onPick={(fields) => onChange(fields)}
      />
      <SubclassDetailsModal
        opened={subDetailsOpen}
        onClose={() => setSubDetailsOpen(false)}
        subclassName={data.subclass}
        subclassRef={data.subclassFiveEToolsRef}
        sheetClassFeatures={data.classFeatures}
      />
    </SectionCard>
  )
}
