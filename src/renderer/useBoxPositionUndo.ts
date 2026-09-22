import { useCallback, useState } from 'react'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import type { CollectionEntry } from '@shared/types/pokemon'
import type { BoxPlaceholder } from '@shared/types/box'
import type { FillInPlacement } from './dex/boxTemplates'

/** Leg 2 of the Box View Move & Undo Operations milestone — one entry's box position
 * immediately before a move, captured so undo can restore it. `storageLocationId` isn't
 * needed by setEntryBoxPosition's own undo (it never changes location) but is captured
 * alongside boxNumber/boxSlot anyway since Leg 3 extends this same per-entry snapshot
 * shape to multi-drag/cross-location undo (array-of-snapshots instead of one). */
interface BoxPositionSnapshot {
  entryId: number
  storageLocationId: number | null
  boxNumber: number | null
  boxSlot: number | null
}

/** 'move' inverts by replaying setEntryBoxPosition with the pre-move snapshot; 'swap' is
 * self-inverse (swapping the same two entries back undoes it), so it only needs the two
 * ids, not a snapshot of either. 'batch' (Leg 3) inverts a multi-drag fillBoxSlots or a
 * cross-location moveEntriesToLocation call — one snapshot per moved entry, replayed
 * through restoreEntryBoxPositions in one atomic step rather than N individual writes (see
 * that method's own doc comment for why: a naive per-entry replay can collide with another
 * snapshot in the same batch that hasn't been restored yet). */
type UndoAction =
  | { kind: 'move'; snapshot: BoxPositionSnapshot }
  | { kind: 'swap'; entryIdA: number; entryIdB: number }
  | { kind: 'batch'; snapshots: BoxPositionSnapshot[] }

export interface BoxPositionUndo {
  setEntryBoxPosition: (entryId: number, boxNumber: number | null, boxSlot: number | null) => void
  swapEntryBoxPositions: (entryIdA: number, entryIdB: number) => void
  /** Leg 2 of the Box View Move & Undo Operations milestone: reverts the most recent
   * setEntryBoxPosition/swapEntryBoxPositions call. Leg 3 extends this to also cover
   * fillBoxSlots/moveEntriesToLocation — see the undo/canUndo doc comment above their
   * implementation for the stack's shape. */
  undo: () => void
  /** Whether `undo` has anything to revert — drives the undo button's disabled state. */
  canUndo: boolean
  /** See StorageAdapter.fillBoxSlots' own doc comment. */
  fillBoxSlots: (entryIds: number[], boxNumber: number, startSlot: number) => void
  /** Cross-location move (Leg 1 of the Box View Move & Undo Operations milestone) — see
   * StorageAdapter.moveEntriesToLocation's own doc comment. */
  moveEntriesToLocation: (storageLocationId: number, placements: FillInPlacement[]) => Promise<void>
}

/** Box-position/undo-stack slice split out of useCollectionData (Leg 4 of the Codebase
 * File-Size Cleanup milestone) — useCollectionData composes this back in, passing down the
 * same `entriesRef`/`setEntries`/`setBoxPlaceholdersState` this slice always read and wrote
 * even when it lived inline, since box-position moves and their undo need to merge into the
 * same `entries`/`boxPlaceholders` state the rest of the hook owns. */
export function useBoxPositionUndo(
  entriesRef: MutableRefObject<CollectionEntry[]>,
  setEntries: Dispatch<SetStateAction<CollectionEntry[]>>,
  setBoxPlaceholdersState: Dispatch<SetStateAction<BoxPlaceholder[]>>
): BoxPositionUndo {
  const [undoStack, setUndoStack] = useState<UndoAction[]>([])

  // Does the actual write plus local-state merge for a box-position change — shared by
  // setEntryBoxPosition below (which captures an undo snapshot first) and undo's own
  // replay of a prior snapshot (which must NOT capture another undo entry, or undoing
  // would push a redo-shaped action onto the same stack).
  const applySetEntryBoxPosition = useCallback(
    (entryId: number, boxNumber: number | null, boxSlot: number | null): void => {
      window.premierDex.setEntryBoxPosition(entryId, boxNumber, boxSlot).then((updated) => {
        setEntries((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)))
        // A real entry landing on a slot clears whatever placeholder was there server-side
        // (see sqlite-storage.ts's clearBoxPlaceholderStmt) — mirror that locally so a stale
        // placeholder can't reappear from this hook's own state once the entry later moves
        // off that slot again.
        if (boxNumber !== null && boxSlot !== null && updated.storageLocationId !== null) {
          const { storageLocationId } = updated
          setBoxPlaceholdersState((prev) =>
            prev.filter((p) => !(p.storageLocationId === storageLocationId && p.boxNumber === boxNumber && p.boxSlot === boxSlot))
          )
        }
      })
    },
    [setEntries, setBoxPlaceholdersState]
  )

  // Leg 2 of the Box View Move & Undo Operations milestone: captures the entry's box
  // position from *before* this write (via entriesRef, not `entries` — see its own
  // comment) as the undo stack's inverse, ahead of the window.premierDex.* call itself.
  const setEntryBoxPosition = useCallback(
    (entryId: number, boxNumber: number | null, boxSlot: number | null): void => {
      const prior = entriesRef.current.find((entry) => entry.id === entryId)
      if (prior) {
        const snapshot: BoxPositionSnapshot = {
          entryId,
          storageLocationId: prior.storageLocationId,
          boxNumber: prior.boxNumber,
          boxSlot: prior.boxSlot
        }
        setUndoStack((prev) => [...prev, { kind: 'move', snapshot }])
      }
      applySetEntryBoxPosition(entryId, boxNumber, boxSlot)
    },
    [entriesRef, applySetEntryBoxPosition]
  )

  // Same apply/capture split as setEntryBoxPosition above.
  const applySwapEntryBoxPositions = useCallback(
    (entryIdA: number, entryIdB: number): void => {
      window.premierDex.swapEntryBoxPositions(entryIdA, entryIdB).then(([updatedA, updatedB]) => {
        setEntries((prev) =>
          prev.map((entry) => {
            if (entry.id === updatedA.id) return updatedA
            if (entry.id === updatedB.id) return updatedB
            return entry
          })
        )
      })
    },
    [setEntries]
  )

  // A swap is its own inverse — replaying it with the same two ids undoes it — so unlike
  // setEntryBoxPosition's snapshot, undo only needs to remember which two entries swapped.
  const swapEntryBoxPositions = useCallback(
    (entryIdA: number, entryIdB: number): void => {
      setUndoStack((prev) => [...prev, { kind: 'swap', entryIdA, entryIdB }])
      applySwapEntryBoxPositions(entryIdA, entryIdB)
    },
    [applySwapEntryBoxPositions]
  )

  // Leg 3 of the Box View Move & Undo Operations milestone — batch-move undo's apply half
  // (mirrors applySetEntryBoxPosition/applySwapEntryBoxPositions' own apply/capture split).
  // Local placeholder-clear mirror covers every restored slot in one pass, same convention
  // as fillBoxSlots/moveEntriesToLocation's own forward-direction mirrors below.
  const applyRestoreEntryBoxPositions = useCallback(
    (snapshots: BoxPositionSnapshot[]): void => {
      window.premierDex.restoreEntryBoxPositions(snapshots).then((updated) => {
        const updatedById = new Map(updated.map((entry) => [entry.id, entry]))
        setEntries((prev) => prev.map((entry) => updatedById.get(entry.id) ?? entry))
        const restoredSlots = new Set(
          snapshots
            .filter((s) => s.storageLocationId !== null && s.boxNumber !== null && s.boxSlot !== null)
            .map((s) => `${s.storageLocationId}:${s.boxNumber}:${s.boxSlot}`)
        )
        setBoxPlaceholdersState((prev) =>
          prev.filter((p) => !restoredSlots.has(`${p.storageLocationId}:${p.boxNumber}:${p.boxSlot}`))
        )
      })
    },
    [setEntries, setBoxPlaceholdersState]
  )

  // Reads each listed entry's current (pre-move) position off entriesRef — same snapshot
  // shape and same "read before the write lands" timing as setEntryBoxPosition's own
  // capture above, generalized to N entries for fillBoxSlots/moveEntriesToLocation's undo.
  const snapshotBoxPositions = useCallback(
    (entryIds: number[]): BoxPositionSnapshot[] =>
      entryIds
        .map((entryId) => entriesRef.current.find((entry) => entry.id === entryId))
        .filter((entry): entry is CollectionEntry => entry !== undefined)
        .map((entry) => ({
          entryId: entry.id,
          storageLocationId: entry.storageLocationId,
          boxNumber: entry.boxNumber,
          boxSlot: entry.boxSlot
        })),
    [entriesRef]
  )

  // Pops and reverts the most recent move/swap/batch. Deliberately doesn't push a new undo
  // entry for the reverted action — Leg 2 only scopes Ctrl+Z/undo-button, no redo.
  const undo = useCallback((): void => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev
      const action = prev[prev.length - 1]
      if (action.kind === 'move') {
        applySetEntryBoxPosition(action.snapshot.entryId, action.snapshot.boxNumber, action.snapshot.boxSlot)
      } else if (action.kind === 'swap') {
        applySwapEntryBoxPositions(action.entryIdA, action.entryIdB)
      } else {
        applyRestoreEntryBoxPositions(action.snapshots)
      }
      return prev.slice(0, -1)
    })
  }, [applySetEntryBoxPosition, applySwapEntryBoxPositions, applyRestoreEntryBoxPositions])

  // Leg 3: captures each dragged entry's pre-move position (via snapshotBoxPositions) as a
  // 'batch' undo entry ahead of the write, same capture-then-apply split as
  // setEntryBoxPosition above.
  const fillBoxSlots = useCallback(
    (entryIds: number[], boxNumber: number, startSlot: number): void => {
      const snapshots = snapshotBoxPositions(entryIds)
      if (snapshots.length > 0) {
        setUndoStack((prev) => [...prev, { kind: 'batch', snapshots }])
      }
      window.premierDex.fillBoxSlots(entryIds, boxNumber, startSlot).then((updated) => {
        const updatedById = new Map(updated.map((entry) => [entry.id, entry]))
        setEntries((prev) => prev.map((entry) => updatedById.get(entry.id) ?? entry))
        // Same local mirror as setEntryBoxPosition above, one slot per filled entry.
        const clearedSlots = new Set(updated.map((entry) => `${entry.storageLocationId}:${boxNumber}:${entry.boxSlot}`))
        setBoxPlaceholdersState((prev) =>
          prev.filter((p) => !clearedSlots.has(`${p.storageLocationId}:${p.boxNumber}:${p.boxSlot}`))
        )
      })
    },
    [snapshotBoxPositions, setEntries, setBoxPlaceholdersState]
  )

  // Cross-location move (Leg 1 of the Box View Move & Undo Operations milestone) — same
  // updatedById merge and placeholder-clear mirror as fillInPlaceholders (useCollectionData),
  // just unconditional (every listed placement always lands, unlike fillInPlaceholders'
  // stale-state tolerance) since the caller (DexBoxGrid) computed `placements` from its own
  // just-read state immediately before calling. Leg 3: captures a 'batch' undo entry first,
  // same convention as fillBoxSlots above — restoreEntryBoxPositions' own per-snapshot
  // storageLocationId is what lets its undo cross back over the same location boundary this
  // move just crossed.
  const moveEntriesToLocation = useCallback(
    async (storageLocationId: number, placements: FillInPlacement[]): Promise<void> => {
      if (placements.length === 0) return
      const snapshots = snapshotBoxPositions(placements.map((p) => p.entryId))
      if (snapshots.length > 0) {
        setUndoStack((prev) => [...prev, { kind: 'batch', snapshots }])
      }
      const updated = await window.premierDex.moveEntriesToLocation(storageLocationId, placements)
      const updatedById = new Map(updated.map((entry) => [entry.id, entry]))
      setEntries((prev) => prev.map((entry) => updatedById.get(entry.id) ?? entry))
      const filledSlots = new Set(placements.map((p) => `${storageLocationId}:${p.boxNumber}:${p.boxSlot}`))
      setBoxPlaceholdersState((prev) =>
        prev.filter((p) => !filledSlots.has(`${p.storageLocationId}:${p.boxNumber}:${p.boxSlot}`))
      )
    },
    [snapshotBoxPositions, setEntries, setBoxPlaceholdersState]
  )

  return {
    setEntryBoxPosition,
    swapEntryBoxPositions,
    undo,
    canUndo: undoStack.length > 0,
    fillBoxSlots,
    moveEntriesToLocation
  }
}
