/** Click pill i: prefix selection (0..max); click inside selected range to reduce. */
export function nextUsedAfterPillClick(
  max: number,
  used: number,
  pillIndex: number,
): number {
  if (max <= 0) {
    return 0
  }
  let newUsed: number
  if (pillIndex < used) {
    newUsed = pillIndex
  } else {
    newUsed = pillIndex + 1
  }
  return Math.max(0, Math.min(newUsed, max))
}
