import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CollectionEntry, Form, Species } from '@shared/types/pokemon'
import type { BoxPlaceholder, StorageBox } from '@shared/types/box'
import { buildBoxes } from './buildBoxes'
import { findAvailableSlots, slotKey, type FillInPlacement } from './boxTemplates'
import type { Box } from './types'

interface UseSecondBoxPaneParams {
  selectedLocationTab: number | null
  species: Species[]
  forms: Form[]
  allEntries: CollectionEntry[]
  allBoxes: StorageBox[]
  allBoxPlaceholders: BoxPlaceholder[]
  onAddBox: (storageLocationId: number) => Promise<StorageBox>
  onMoveEntriesToLocation: (storageLocationId: number, placements: FillInPlacement[]) => Promise<void>
}

export interface SecondBoxPane {
  secondBoxOpen: boolean
  toggleSecondBox: () => void
  effectiveSecondLocationId: number | null
  setSecondLocationId: (id: number) => void
  secondBoxes: Box[]
  secondBoxedEntryIds: Set<number>
  /** Every entry's actual current storage location, collection-wide — see DexBoxPane's
   * entryLocationMap doc comment for why handleDropOnSlot needs this rather than just a
   * pane's own boxedEntryIds. */
  entryLocationById: Map<number, number | null>
  handleDragMoveToLocation: (entryIds: number[], storageLocationId: number, boxNumber: number, startSlot: number) => void
  handleMoveSelectionToLocation: (entryIds: number[], destinationLocationId: number) => Promise<void>
}

/**
 * Split out of DexBoxGrid (Codebase File-Size Cleanup pass, 2026-09-28) purely to bring
 * DexBoxGrid back under the file-size cap — no behavior change. Owns the "second box pane
 * can show a different location than the primary tab" machinery added by Leg 1 of the Box
 * View Move & Undo Operations milestone: which location the second pane targets, that
 * location's own boxes/boxedEntryIds, and the two cross-location move paths (drag-onto-
 * second-pane, and the "Move to location…" picker) — see DexBoxGrid's own doc comment for
 * the fuller history this was lifted from.
 */
export function useSecondBoxPane({
  selectedLocationTab,
  species,
  forms,
  allEntries,
  allBoxes,
  allBoxPlaceholders,
  onAddBox,
  onMoveEntriesToLocation
}: UseSecondBoxPaneParams): SecondBoxPane {
  const [secondBoxOpen, setSecondBoxOpen] = useState(false)
  const toggleSecondBox = useCallback(() => setSecondBoxOpen((open) => !open), [])

  // Which location the second pane shows, overriding the primary tab — null means "mirror
  // the primary tab" (the default the moment a second pane opens, and after a tab switch
  // below), not literally "no location", since selectedLocationTab is guaranteed non-null
  // by the time DexBoxGrid actually renders panes.
  const [secondLocationId, setSecondLocationId] = useState<number | null>(null)
  // A cross-location override from a previous tab shouldn't silently carry over onto a new
  // primary tab's context — resets back to "mirror primary" on every tab switch, same
  // remount-fresh convention DexBoxPane's own `key` already follows for tab switches.
  useEffect(() => {
    setSecondLocationId(null)
  }, [selectedLocationTab])
  const effectiveSecondLocationId = secondLocationId ?? selectedLocationTab

  const entryLocationById = useMemo(() => {
    const map = new Map<number, number | null>()
    for (const entry of allEntries) map.set(entry.id, entry.storageLocationId)
    return map
  }, [allEntries])

  // Builds a Box[] for any location, not just the selected tab — used for the second
  // pane's own boxes when it's pointed at a different location than the primary, and for
  // "Move to location…" finding room in a location that isn't open in either pane.
  const boxesForLocation = useCallback(
    (locationId: number): Box[] => {
      const locationEntries = allEntries.filter((e) => e.storageLocationId === locationId)
      const locationBoxes = allBoxes.filter((b) => b.storageLocationId === locationId)
      const locationPlaceholders = allBoxPlaceholders.filter((p) => p.storageLocationId === locationId)
      return buildBoxes(locationBoxes, species, forms, locationEntries, locationPlaceholders)
    },
    [allEntries, allBoxes, allBoxPlaceholders, species, forms]
  )
  // Only actually built while the second pane is open and pointed somewhere — no sense
  // paying buildBoxes' cost on every render otherwise.
  const secondBoxes = useMemo(
    () => (secondBoxOpen && effectiveSecondLocationId !== null ? boxesForLocation(effectiveSecondLocationId) : []),
    [secondBoxOpen, effectiveSecondLocationId, boxesForLocation]
  )
  const secondBoxedEntryIds = useMemo(() => {
    if (!secondBoxOpen || effectiveSecondLocationId === null) return new Set<number>()
    return new Set(
      allEntries.filter((e) => e.storageLocationId === effectiveSecondLocationId && e.boxNumber !== null).map((e) => e.id)
    )
  }, [secondBoxOpen, effectiveSecondLocationId, allEntries])

  // The drag-onto-a-different-location-pane gesture — DexBoxPane already resolved a
  // concrete contiguous run (targetSlot..targetSlot+entryIds.length-1) against its own
  // displayed box before calling, so this just reshapes that into onMoveEntriesToLocation's
  // per-entry placements shape.
  const handleDragMoveToLocation = useCallback(
    (entryIds: number[], storageLocationId: number, boxNumber: number, startSlot: number): void => {
      const placements = entryIds.map((entryId, i) => ({ entryId, boxNumber, boxSlot: startSlot + i }))
      onMoveEntriesToLocation(storageLocationId, placements)
    },
    [onMoveEntriesToLocation]
  )

  // "Move to location…": unlike the drag gesture above, there's no drop point to fill
  // contiguously from — finds up to entryIds.length free slots at the destination,
  // creating boxes there as needed, same shortfall-loop shape as DexBoxGrid's own
  // handleApplyTemplate (sequential awaits, one box at a time). Free slots are gathered
  // fresh from allBoxes/allEntries/allBoxPlaceholders each pass through the loop rather
  // than incrementally patched, since onAddBox's own resolved StorageBox is the only new
  // fact each iteration actually adds.
  const handleMoveSelectionToLocation = useCallback(
    async (entryIds: number[], destinationLocationId: number): Promise<void> => {
      const occupiedSlots = new Set<string>()
      for (const entry of allEntries) {
        if (entry.storageLocationId === destinationLocationId && entry.boxNumber !== null && entry.boxSlot !== null) {
          occupiedSlots.add(slotKey(entry.boxNumber, entry.boxSlot))
        }
      }
      for (const placeholder of allBoxPlaceholders) {
        if (placeholder.storageLocationId === destinationLocationId) occupiedSlots.add(slotKey(placeholder.boxNumber, placeholder.boxSlot))
      }
      const boxNumbers = allBoxes.filter((b) => b.storageLocationId === destinationLocationId).map((b) => b.boxNumber)

      let slots = findAvailableSlots(boxNumbers, occupiedSlots, entryIds.length)
      while (slots.length < entryIds.length) {
        const created = await onAddBox(destinationLocationId)
        boxNumbers.push(created.boxNumber)
        slots = findAvailableSlots(boxNumbers, occupiedSlots, entryIds.length)
      }

      const placements = entryIds.map((entryId, i) => ({ entryId, boxNumber: slots[i].boxNumber, boxSlot: slots[i].boxSlot }))
      await onMoveEntriesToLocation(destinationLocationId, placements)
    },
    [allEntries, allBoxPlaceholders, allBoxes, onAddBox, onMoveEntriesToLocation]
  )

  return {
    secondBoxOpen,
    toggleSecondBox,
    effectiveSecondLocationId,
    setSecondLocationId,
    secondBoxes,
    secondBoxedEntryIds,
    entryLocationById,
    handleDragMoveToLocation,
    handleMoveSelectionToLocation
  }
}
