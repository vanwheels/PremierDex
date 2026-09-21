import type { CollectionEntry, Form, Species } from '@shared/types/pokemon'
import type { BoxPlaceholder, StorageBox } from '@shared/types/box'
import type { DexTier } from './completionStats'
import { TIER_CONFIGS } from './completionStats'
import {
  buildOccupiedUnitIndex,
  buildPlaceholderKeys,
  countAvailableSlots,
  extraBoxesNeeded,
  pendingRequiredUnits,
  placeUnitsIntoSlots,
  slotKey,
  type DexColor,
  type TemplatePlacement
} from './boxTemplates'

export interface ApplyTemplateParams {
  tier: DexTier
  color: DexColor
  forms: Form[]
  species: Species[]
  /** Already scoped to the target Storage Location — same convention `boxTemplates.ts`'s
   * own functions assume. */
  entries: CollectionEntry[]
  boxPlaceholders: BoxPlaceholder[]
  storageBoxes: StorageBox[]
  storageLocationId: number
  onAddBox: (storageLocationId: number) => Promise<StorageBox>
  onSetBoxPlaceholders: (storageLocationId: number, placements: TemplatePlacement[]) => Promise<void>
}

/**
 * Apply Template's orchestration (box-creation math + sequential `onAddBox` awaits + the
 * batched `onSetBoxPlaceholders` call), extracted out of DexBoxGrid's `handleApplyTemplate`
 * (Leg 2 of the Apply Template Combined Color milestone) so the combined-color box-count
 * math due to land in Leg 3 doesn't grow an already-over-cap DexBoxGrid.tsx further —
 * mirrors collection-backup.ts's extraction out of sqlite-storage.ts, the established split
 * pattern (see TODO.md's "Codebase File-Size Cleanup" item). Pure refactor: computes the
 * tier's still-needed units (whatever already occupies a slot or placeholder in this
 * location filtered out), creates whatever new boxes are needed to fit all of them
 * (sequential awaits — same one-box-at-a-time creation DexBoxPane.handleAddBox already
 * does, just looped), then writes every placement in one batch call. A no-op (no `onAddBox`/
 * `onSetBoxPlaceholders` calls) when the tier is already fully satisfied in this location.
 */
export async function applyTemplate(params: ApplyTemplateParams): Promise<void> {
  const { tier, color, forms, species, entries, boxPlaceholders, storageBoxes, storageLocationId, onAddBox, onSetBoxPlaceholders } = params
  const tierConfig = TIER_CONFIGS[tier]
  const occupiedUnitIndex = buildOccupiedUnitIndex(entries)
  const existingPlaceholderKeys = buildPlaceholderKeys(boxPlaceholders)
  const units = pendingRequiredUnits({ tierConfig, color, forms, species, occupiedUnitIndex, existingPlaceholderKeys })
  if (units.length === 0) return

  const occupiedSlots = new Set<string>()
  for (const entry of entries) {
    if (entry.boxNumber !== null && entry.boxSlot !== null) occupiedSlots.add(slotKey(entry.boxNumber, entry.boxSlot))
  }
  for (const placeholder of boxPlaceholders) {
    occupiedSlots.add(slotKey(placeholder.boxNumber, placeholder.boxSlot))
  }

  const boxNumbers = storageBoxes.map((b) => b.boxNumber)
  const available = countAvailableSlots(boxNumbers.length, occupiedSlots.size)
  const shortfall = extraBoxesNeeded(units.length, available)
  for (let i = 0; i < shortfall; i++) {
    const created = await onAddBox(storageLocationId)
    boxNumbers.push(created.boxNumber)
  }

  const placements = placeUnitsIntoSlots(units, boxNumbers, occupiedSlots)
  await onSetBoxPlaceholders(storageLocationId, placements)
}
