import { useEffect, useState } from 'react'
import { Group, Loader, Modal, ScrollArea, Stack, Text } from '@mantine/core'
import {
  buildWeaponPreview,
  findRawItemByRefString,
  loadAllRawWeapons,
  type WeaponPreviewModel,
} from '../fiveetools/itemsData'
import type { WeaponRow } from './types'
import classes from './CharacterSheet.module.scss'

export type WeaponDetailsModalProps = {
  opened: boolean
  onClose: () => void
  row: WeaponRow | null
}

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

function CompendiumPreviewBody({
  preview,
  row,
}: {
  preview: WeaponPreviewModel
  row: WeaponRow
}) {
  return (
    <Stack gap="sm">
      <Group gap="xl" wrap="wrap">
        <PreviewField label="Attack bonus / DC (on sheet)" value={String(row.attackBonus)} />
        <PreviewField
          label="Damage (on sheet)"
          value={`${row.diceCount}${row.diceSize} ${row.damageType}`}
        />
        <PreviewField label="Category" value={preview.category} />
        <PreviewField label="Listed damage" value={preview.damage} />
      </Group>
      <Group gap="xl" wrap="wrap">
        <PreviewField label="Source" value={preview.source} />
        <PreviewField label="Page" value={preview.page} />
        <PreviewField label="Rarity" value={preview.rarity} />
        <PreviewField label="Weight" value={preview.weight} />
      </Group>
      <div>
        <Text size="xs" fw={600} c="dimmed" mb={4}>
          Description
        </Text>
        <Text className={classes.spellPreviewDescription} component="div">
          {preview.description}
        </Text>
      </div>
      {row.notes.trim() ? (
        <div>
          <Text size="xs" fw={600} c="dimmed" mb={4}>
            Your notes
          </Text>
          <Text size="sm" className={classes.spellPreviewDescription} component="div">
            {row.notes}
          </Text>
        </div>
      ) : null}
    </Stack>
  )
}

function CustomWeaponBody({ row }: { row: WeaponRow }) {
  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Custom weapon — compendium rules are not available.
      </Text>
      <Group gap="xl" wrap="wrap">
        <PreviewField label="Name" value={row.name.trim() || '—'} />
        <PreviewField label="Attack bonus / DC" value={String(row.attackBonus)} />
        <PreviewField
          label="Damage"
          value={`${row.diceCount}${row.diceSize} ${row.damageType}`}
        />
      </Group>
      <div>
        <Text size="xs" fw={600} c="dimmed" mb={4}>
          Notes
        </Text>
        <Text size="sm" className={classes.spellPreviewDescription} component="div">
          {row.notes.trim() ? row.notes : '—'}
        </Text>
      </div>
    </Stack>
  )
}

export function WeaponDetailsModal({ opened, onClose, row }: WeaponDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<WeaponPreviewModel | null>(null)

  const ref = row?.fiveEToolsRef?.trim()

  useEffect(() => {
    if (!opened || !row || !ref) {
      setPreview(null)
      setError(null)
      setLoading(false)
      return
    }
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const weapons = await loadAllRawWeapons()
        if (cancelled) return
        const raw = findRawItemByRefString(weapons, ref)
        if (!raw) {
          setError('Weapon not found in compendium data.')
          setPreview(null)
          return
        }
        setPreview(buildWeaponPreview(raw))
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load weapon')
          setPreview(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [opened, row, ref])

  const title = row?.name?.trim() ? row.name : 'Weapon details'

  return (
    <Modal title={title} opened={opened} onClose={onClose} size="lg">
      {!row ? null : loading ? (
        <Group justify="center" p="xl">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">
            Loading weapon…
          </Text>
        </Group>
      ) : error ? (
        <Text size="sm" c="red">
          {error}
        </Text>
      ) : ref && preview ? (
        <ScrollArea.Autosize mah="70vh" type="auto" offsetScrollbars>
          <CompendiumPreviewBody preview={preview} row={row} />
        </ScrollArea.Autosize>
      ) : (
        <CustomWeaponBody row={row} />
      )}
    </Modal>
  )
}
