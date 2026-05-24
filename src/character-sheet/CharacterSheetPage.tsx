import {
  Alert,
  Button,
  Container,
  Group,
  Stack,
  Tabs,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import { ColorSchemeToggle } from '../ColorSchemeToggle'
import { AbilityColumn } from './AbilityColumn'
import { BackgroundTab } from './BackgroundTab'
import { CombatBar } from './CombatBar'
import classes from './CharacterSheet.module.scss'
import {
  downloadCharacterSheetJson,
  loadSheetsBundle,
  parseCharacterSheetJsonFile,
  saveSheetsBundle,
} from './characterSheetStorage'
import { InventorySection } from './InventorySection'
import { createNewCharacterTemplate } from './sampleData'
import { SheetHeader } from './SheetHeader'
import { SheetListSidebar } from './SheetListSidebar'
import {
  SpellcastingSection,
  SpellcastingStatsCard,
  SpellSlotsCard,
} from './SpellcastingSection'
import { SpellsTable } from './SpellsTable'
import type {
  AbilityBlock,
  AbilityKey,
  CharacterSheetData,
  CharacterSheetsBundle,
  SkillLine,
  SpellSlotLevel,
} from './types'
import { WeaponsTable } from './WeaponsTable'

export function CharacterSheetPage() {
  const [bundle, setBundle] = useState<CharacterSheetsBundle>(() =>
    loadSheetsBundle(),
  )
  const [importError, setImportError] = useState<string | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const bundleRef = useRef(bundle)

  useEffect(() => {
    bundleRef.current = bundle
  }, [bundle])

  const [debouncedBundle] = useDebouncedValue(bundle, 500)

  useEffect(() => {
    saveSheetsBundle(debouncedBundle)
  }, [debouncedBundle])

  useEffect(() => {
    const flush = () => saveSheetsBundle(bundleRef.current)
    window.addEventListener('beforeunload', flush)
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('beforeunload', flush)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const activeSheet = useMemo(() => {
    const found = bundle.sheets.find((s) => s.id === bundle.activeId)
    return found ?? bundle.sheets[0]!
  }, [bundle])

  const data = activeSheet.data

  const patch = useCallback((partial: Partial<CharacterSheetData>) => {
    setBundle((b) => ({
      ...b,
      sheets: b.sheets.map((s) =>
        s.id === b.activeId ? { ...s, data: { ...s.data, ...partial } } : s,
      ),
    }))
  }, [])

  const changeAbility = useCallback(
    (key: AbilityKey, blockPatch: Partial<AbilityBlock>) => {
      setBundle((b) => ({
        ...b,
        sheets: b.sheets.map((s) => {
          if (s.id !== b.activeId) return s
          return {
            ...s,
            data: {
              ...s.data,
              abilities: {
                ...s.data.abilities,
                [key]: { ...s.data.abilities[key], ...blockPatch },
              },
            },
          }
        }),
      }))
    },
    [],
  )

  const changeSkill = useCallback(
    (key: AbilityKey, index: number, skillPatch: Partial<SkillLine>) => {
      setBundle((b) => ({
        ...b,
        sheets: b.sheets.map((s) => {
          if (s.id !== b.activeId) return s
          const ability = s.data.abilities[key]
          const skills = [...ability.skills]
          skills[index] = { ...skills[index], ...skillPatch }
          return {
            ...s,
            data: {
              ...s.data,
              abilities: {
                ...s.data.abilities,
                [key]: { ...ability, skills },
              },
            },
          }
        }),
      }))
    },
    [],
  )

  const changeSpellSlot = useCallback(
    (levelIndex: number, slotPatch: Partial<SpellSlotLevel>) => {
      setBundle((b) => ({
        ...b,
        sheets: b.sheets.map((s) => {
          if (s.id !== b.activeId) return s
          const next = [...s.data.spellSlotsByLevel]
          const cur = next[levelIndex]
          if (!cur) return s
          next[levelIndex] = { ...cur, ...slotPatch }
          return {
            ...s,
            data: { ...s.data, spellSlotsByLevel: next },
          }
        }),
      }))
    },
    [],
  )

  const handleSelectSheet = useCallback((id: string) => {
    setBundle((b) => ({ ...b, activeId: id }))
  }, [])

  const handleAddSheet = useCallback(() => {
    const newId = crypto.randomUUID()
    setBundle((b) => ({
      ...b,
      activeId: newId,
      sheets: [...b.sheets, { id: newId, data: createNewCharacterTemplate() }],
    }))
  }, [])

  const handleRemoveSheet = useCallback((id: string) => {
    setBundle((b) => {
      if (b.sheets.length <= 1) return b
      const nextSheets = b.sheets.filter((s) => s.id !== id)
      let nextActive = b.activeId
      if (b.activeId === id) {
        const idx = b.sheets.findIndex((s) => s.id === id)
        const neighbor = b.sheets[idx - 1] ?? b.sheets[idx + 1]
        nextActive = neighbor?.id ?? nextSheets[0]!.id
      }
      return { ...b, activeId: nextActive, sheets: nextSheets }
    })
  }, [])

  const handleExportJson = useCallback(() => {
    setImportError(null)
    downloadCharacterSheetJson(data)
  }, [data])

  const handleImportFile = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const text = String(reader.result ?? '')
          const imported = parseCharacterSheetJsonFile(text)
          const newId = crypto.randomUUID()
          setBundle((b) => ({
            ...b,
            activeId: newId,
            sheets: [...b.sheets, { id: newId, data: imported }],
          }))
          setImportError(null)
        } catch (err) {
          setImportError(
            err instanceof Error ? err.message : 'Could not import that file.',
          )
        }
      }
      reader.onerror = () => {
        setImportError('Could not read the file.')
      }
      reader.readAsText(file)
    },
    [],
  )

  return (
    <div className={classes.page}>
      <div className={classes.appLayout}>
        <SheetListSidebar
          sheets={bundle.sheets}
          activeId={bundle.activeId}
          onSelect={handleSelectSheet}
          onAdd={handleAddSheet}
          onRemove={handleRemoveSheet}
        />
        <main className={classes.sheetMain}>
          <Container size="xl" px="md">
            <Stack gap="md" mb="md">
              <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
                <div style={{ minWidth: 0 }}>
                  <Title order={2}>Character sheet</Title>
                  <Text size="sm" c="dimmed">
                    D&amp;D 5e — multiple characters in the sidebar; each has its own JSON import /
                    export. Auto-saves in this browser.
                  </Text>
                </div>
                <Group gap="xs" wrap="wrap" justify="flex-end">
                  <Tooltip label="Export the open character only (single sheet JSON)">
                    <Button variant="default" size="xs" onClick={handleExportJson}>
                      Export JSON
                    </Button>
                  </Tooltip>
                  <Tooltip label="Add a new character from a JSON file">
                    <Button
                      variant="default"
                      size="xs"
                      onClick={() => importInputRef.current?.click()}
                    >
                      Import JSON
                    </Button>
                  </Tooltip>
                  <input
                    ref={importInputRef}
                    type="file"
                    accept="application/json,.json"
                    style={{ display: 'none' }}
                    aria-hidden
                    onChange={handleImportFile}
                  />
                  <ColorSchemeToggle />
                </Group>
              </Group>

              {importError ? (
                <Alert
                  color="red"
                  title="Import failed"
                  onClose={() => setImportError(null)}
                  withCloseButton
                >
                  {importError}
                </Alert>
              ) : null}

              <SheetHeader data={data} onChange={patch} />

              <Tabs key={bundle.activeId} defaultValue="combat" keepMounted={false}>
                <Tabs.List style={{ flexWrap: 'wrap' }}>
                  <Tabs.Tab value="combat">Combat</Tabs.Tab>
                  <Tabs.Tab value="abilities">Abilities</Tabs.Tab>
                  <Tabs.Tab value="spells">Spells</Tabs.Tab>
                  <Tabs.Tab value="inventory">Inventory</Tabs.Tab>
                  <Tabs.Tab value="background">Background</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="combat" pt="md">
                  <div className={classes.combatGrid}>
                    <CombatBar
                      data={{
                        initiative: data.initiative,
                        speed: data.speed,
                        size: data.size,
                        passivePerception: data.passivePerception,
                      }}
                      onChange={patch}
                    />
                    <SpellcastingStatsCard
                      spellcasting={data.spellcasting}
                      onChangeSpellcasting={(p) =>
                        patch({ spellcasting: { ...data.spellcasting, ...p } })
                      }
                    />
                    <div className={classes.combatBottomRow}>
                      <SpellSlotsCard
                        spellSlotsByLevel={data.spellSlotsByLevel}
                        onChangeSlot={changeSpellSlot}
                        shrinkToFit
                      />
                      <WeaponsTable
                        weapons={data.weapons}
                        spells={data.spells}
                        spellcasting={data.spellcasting}
                        level={data.level}
                        onChange={(weapons) => patch({ weapons })}
                      />
                    </div>
                  </div>
                </Tabs.Panel>

                <Tabs.Panel value="abilities" pt="md">
                  <Stack gap="sm">
                    <AbilityColumn
                      proficiencyBonus={data.proficiencyBonus}
                      inspiration={data.inspiration}
                      abilities={data.abilities}
                      armorTraining={data.armorTraining}
                      weaponProficiencies={data.weaponProficiencies}
                      toolProficiencies={data.toolProficiencies}
                      onChangeProficiencyBonus={(value) =>
                        patch({ proficiencyBonus: value })
                      }
                      onToggleInspiration={(value) => patch({ inspiration: value })}
                      onChangeAbility={changeAbility}
                      onChangeSkill={changeSkill}
                      onChangeArmor={(armorPatch) =>
                        patch({
                          armorTraining: { ...data.armorTraining, ...armorPatch },
                        })
                      }
                      onChangeWeaponProficiencies={(weaponPatch) =>
                        patch({
                          weaponProficiencies: {
                            ...data.weaponProficiencies,
                            ...weaponPatch,
                          },
                        })
                      }
                      onChangeToolProficiencies={(value) =>
                        patch({ toolProficiencies: value })
                      }
                    />
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="spells" pt="md">
                  <Stack gap="md">
                    <SpellcastingSection
                      spellcasting={data.spellcasting}
                      spellSlotsByLevel={data.spellSlotsByLevel}
                      onChangeSpellcasting={(p) =>
                        patch({ spellcasting: { ...data.spellcasting, ...p } })
                      }
                      onChangeSlot={changeSpellSlot}
                    />
                    <SpellsTable
                      spells={data.spells}
                      onChange={(spells) => patch({ spells })}
                    />
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="inventory" pt="md">
                  <InventorySection
                    equipment={data.equipment}
                    attunement={data.attunement}
                    coins={data.coins}
                    onChange={patch}
                  />
                </Tabs.Panel>

                <Tabs.Panel value="background" pt="md">
                  <BackgroundTab
                    data={{
                      className: data.className,
                      classNameFiveEToolsRef: data.classNameFiveEToolsRef,
                      classFeatures: data.classFeatures,
                      species: data.species,
                      speciesFiveEToolsRef: data.speciesFiveEToolsRef,
                      speciesTraits: data.speciesTraits,
                      feats: data.feats,
                      featNotes: data.featNotes,
                      narrative: data.narrative,
                      appearance: data.appearance,
                      personalityTraits: data.personalityTraits,
                      alignment: data.alignment,
                      languages: data.languages,
                    }}
                    onChange={patch}
                  />
                </Tabs.Panel>
              </Tabs>
            </Stack>
          </Container>
        </main>
      </div>
    </div>
  )
}
