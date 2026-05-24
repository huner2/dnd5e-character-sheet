import type { CharacterSheetEntry } from './types'

/** Sidebar row text: character name, or class fallback if unnamed. */
export function sheetEntryListLabel(sheet: CharacterSheetEntry): string {
  const name = sheet.data.name.trim()
  if (name) return name
  return `Unnamed (${sheet.data.className || '—'})`.trim()
}
