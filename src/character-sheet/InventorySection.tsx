import { Checkbox, Group, NumberInput, Stack, Text, TextInput } from '@mantine/core'
import type { AttunementRow, CharacterSheetData, CoinPouch } from './types'
import classes from './CharacterSheet.module.scss'
import { EquipmentTable } from './EquipmentTable'
import { SectionCard } from './SectionCard'

type InventorySectionProps = {
  equipment: CharacterSheetData['equipment']
  attunement: CharacterSheetData['attunement']
  coins: CoinPouch
  onChange: (patch: Partial<CharacterSheetData>) => void
}

const COIN_KEYS: (keyof CoinPouch)[] = ['cp', 'sp', 'ep', 'gp', 'pp']
const COIN_LABEL: Record<keyof CoinPouch, string> = {
  cp: 'CP',
  sp: 'SP',
  ep: 'EP',
  gp: 'GP',
  pp: 'PP',
}

function updateAttunement(
  rows: CharacterSheetData['attunement'],
  index: 0 | 1 | 2,
  patch: Partial<AttunementRow>,
): CharacterSheetData['attunement'] {
  const next: [AttunementRow, AttunementRow, AttunementRow] = [...rows] as [
    AttunementRow,
    AttunementRow,
    AttunementRow,
  ]
  next[index] = { ...next[index], ...patch }
  return next
}

export function InventorySection({
  equipment,
  attunement,
  coins,
  onChange,
}: InventorySectionProps) {
  return (
    <Stack gap="md">
      <EquipmentTable
        equipment={equipment}
        onChange={(next) => onChange({ equipment: next })}
      />

      <SectionCard title="Magic item attunement">
        <Stack gap="sm">
          {([0, 1, 2] as const).map((i) => (
            <Group key={i} wrap="nowrap" align="center" gap="sm">
              <Checkbox
                checked={attunement[i].attuned}
                onChange={(e) =>
                  onChange({
                    attunement: updateAttunement(attunement, i, {
                      attuned: e.currentTarget.checked,
                    }),
                  })
                }
                aria-label={`Attunement ${i + 1} active`}
              />
              <TextInput
                style={{ flex: 1 }}
                size="xs"
                placeholder="Item name"
                value={attunement[i].name}
                onChange={(e) =>
                  onChange({
                    attunement: updateAttunement(attunement, i, {
                      name: e.currentTarget.value,
                    }),
                  })
                }
                aria-label={`Attuned item ${i + 1}`}
              />
            </Group>
          ))}
        </Stack>
        <Text size="xs" c="dimmed" mt="xs">
          You can attune to at most three magic items.
        </Text>
      </SectionCard>

      <SectionCard title="Coins">
        <Group grow align="flex-end" wrap="wrap" gap="sm">
          {COIN_KEYS.map((key) => (
            <NumberInput
              key={key}
              style={{ flex: '1 1 88px' }}
              label={COIN_LABEL[key]}
              size="xs"
              min={0}
              value={coins[key]}
              onChange={(v) =>
                onChange({
                  coins: {
                    ...coins,
                    [key]: typeof v === 'number' ? v : coins[key],
                  },
                })
              }
              classNames={{ input: classes.mono }}
            />
          ))}
        </Group>
      </SectionCard>
    </Stack>
  )
}
