/**
 * Leg 9: checking an entry owned while a specific location tab is selected assigns it
 * there immediately, instead of leaving it in Unassigned until a separate manual step via
 * the per-row picker. Returns the storageLocationId to write, or `null` if this toggle
 * shouldn't trigger a write — either it's an un-check, or the Unassigned tab itself is
 * selected (an entry only becomes checkable there once it's already unassigned, so there's
 * nothing to write).
 */
export function autoAssignedLocationOnCheckIn(owned: boolean, selectedLocationTab: number | null): number | null {
  if (!owned) return null
  return selectedLocationTab
}
