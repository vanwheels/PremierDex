import { useCallback, useMemo, useState } from 'react'
import type { CollectionEntry, CollectionEntryOriginInput, Form, Species } from '@shared/types/pokemon'
import type { StorageLocation } from '@shared/types/storage-location'
import type { StorageBox } from '@shared/types/box'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import { buildBoxes, buildUnboxedEntries } from './buildBoxes'
import { DexBoxPane } from './DexBoxPane'
import { DexBoxTray } from './DexBoxTray'
import type { Box } from './types'

interface DexBoxGridProps {
  entries: CollectionEntry[]
  species: Species[]
  forms: Form[]
  storageLocations: StorageLocation[]
  /** Already scoped to `selectedLocationTab` by LivingDexView, same convention as
   * `entries` — see buildBoxes.ts's doc comment (Leg 2 of the Box View Polish
   * milestone). */
  storageBoxes: StorageBox[]
  speciesAvailability: SpeciesAvailabilityData
  /** Same axis as DexLocationTabs' `selected` — needed here (unlike DexHybridGrid, which
   * only ever sees already-scoped `sections`) because Box view has to tell "the Unassigned
   * tab, which can never hold a box" apart from "a real location with zero boxed entries
   * yet," and `entries` alone can't distinguish those two empty cases. */
  selectedLocationTab: number | null
  onSaveOrigin: (entryId: number, input: CollectionEntryOriginInput) => void
  /** Leg 7: drag-and-drop add/move/remove — see DexBoxPane's handleDropOnSlot/this file's
   * handleDropOnTray. */
  onSetEntryBoxPosition: (entryId: number, boxNumber: number | null, boxSlot: number | null) => void
  /** Leg 7: drag-a-cell-onto-another-cell — see DexBoxPane's handleDropOnSlot. */
  onSwapEntryBoxPositions: (entryIdA: number, entryIdB: number) => void
  /** Leg 2 of the Box View Polish milestone: "+ Add Box" in the pager. Resolves with the
   * created box so DexBoxPane's handleAddBox can jump straight to it. */
  onAddBox: (storageLocationId: number) => Promise<StorageBox>
  /** Leg 2: the pager label's inline "Rename" control. */
  onRenameBox: (boxId: number, name: string | null) => void
}

/**
 * Leg 6 (Box Arrangement milestone) HOME-style box grid — real per-individual box
 * contents (`entry.boxNumber`/`boxSlot`, Leg 3 of this milestone), paginated one box at a
 * time rather than Hybrid's continuous flow, matching HOME's own Box view screen (as
 * opposed to its List View, which Hybrid mirrors instead).
 *
 * Only entries within `entries` (already scoped to the selected Storage Location tab by
 * LivingDexView) can appear — a box is always a sub-unit of one real location, never
 * cross-location.
 *
 * Leg 3 of the Box View Polish milestone split the actual pager/grid/detail-panel/
 * drag-and-drop rendering out into DexBoxPane so a second one can open side by side with
 * the primary (Vanny's design decision, 2026-09-03: full interactive grid, not a
 * read-only preview). Placement: the second pane takes a third column alongside the
 * primary and the tray rather than displacing the tray — the simpler of the two layouts
 * the milestone note flagged as an implementation-time decision, and it leaves the tray's
 * own layout untouched. Each pane keeps its own navigation/selection state (see
 * DexBoxPane), but they share one `boxes` array and one `boxedEntryIds` set so a cell
 * dragged from one pane onto the other follows the exact same swap/move rules as dragging
 * within a single pane.
 */
export function DexBoxGrid({
  entries,
  species,
  forms,
  storageLocations,
  storageBoxes,
  speciesAvailability,
  selectedLocationTab,
  onSaveOrigin,
  onSetEntryBoxPosition,
  onSwapEntryBoxPositions,
  onAddBox,
  onRenameBox
}: DexBoxGridProps): JSX.Element {
  const boxes = useMemo(
    () => buildBoxes(storageBoxes, species, forms, entries),
    [storageBoxes, species, forms, entries]
  )
  const unboxedEntries = useMemo(() => buildUnboxedEntries(species, forms, entries), [species, forms, entries])
  // Every entry currently occupying a slot in *any* box of this location, not just the box
  // a given pane happens to be displaying — see DexBoxPane's boxedEntryIds doc comment.
  const boxedEntryIds = useMemo(() => new Set(entries.filter((e) => e.boxNumber !== null).map((e) => e.id)), [entries])

  const [secondBoxOpen, setSecondBoxOpen] = useState(false)
  // Tracks the primary pane's currently displayed box, purely so the tray's click-to-place
  // shortcut (handleClickUnboxedEntry below) has a box to target — it always targets the
  // primary pane, never the second one, so a click stays predictable regardless of which
  // pane is open. Not used for anything else; the two panes are otherwise independent.
  const [primaryBox, setPrimaryBox] = useState<Box | null>(null)
  const handlePrimaryBoxChange = useCallback((box: Box) => setPrimaryBox(box), [])

  if (selectedLocationTab === null) {
    return (
      <div className="dex-box-empty-state">
        Select a Storage Location tab above to see its boxes — Unassigned entries have no box to show.
      </div>
    )
  }

  // Shouldn't happen in practice — createStorageLocation seeds a Box 1 for every location
  // and schema.ts's backfillBoxes covers any pre-Leg-2 install — but storageBoxes still
  // loads over IPC, so guard the moment between switching to a brand-new tab and that
  // fetch actually resolving rather than let boxes[0] crash the render.
  if (boxes.length === 0) {
    return <div className="dex-box-empty-state">Loading this location's boxes…</div>
  }

  const handleDropOnTray = (draggedEntryId: number): void => {
    if (!boxedEntryIds.has(draggedEntryId)) return
    onSetEntryBoxPosition(draggedEntryId, null, null)
  }

  // Vanny feedback 2026-09-03: left-clicking an unboxed entry places it in the current
  // box directly, instead of requiring a drag every time — a no-op (rather than spilling
  // into the next box) once the current box is full, since the ask was specifically "the
  // current box". "Current" always means the primary pane (see primaryBox above).
  const handleClickUnboxedEntry = (draggedEntryId: number): void => {
    if (!primaryBox) return
    const firstEmptySlot = primaryBox.cells.findIndex((c) => c === null)
    if (firstEmptySlot === -1) return
    onSetEntryBoxPosition(draggedEntryId, primaryBox.boxNumber, firstEmptySlot)
  }

  // Opens the second pane on the box right after whatever the primary is currently
  // showing (falling back to the same box if there's only one) — the pairing most likely
  // to be useful for an immediate cross-box drag, rather than always defaulting to box 1.
  const primaryIndex = primaryBox ? boxes.findIndex((b) => b.id === primaryBox.id) : 0
  const secondBoxInitialIndex = Math.min(Math.max(primaryIndex, 0) + 1, boxes.length - 1)

  return (
    <div className="dex-box-view">
      <div className="dex-box-toggle-row">
        <button type="button" onClick={() => setSecondBoxOpen((open) => !open)}>
          {secondBoxOpen ? '✕ Close Second Box' : '⧉ Open Second Box'}
        </button>
      </div>
      <div className="dex-box-columns">
        <DexBoxPane
          key={selectedLocationTab}
          boxes={boxes}
          initialBoxIndex={0}
          storageLocations={storageLocations}
          speciesAvailability={speciesAvailability}
          storageLocationId={selectedLocationTab}
          boxedEntryIds={boxedEntryIds}
          onSaveOrigin={onSaveOrigin}
          onSetEntryBoxPosition={onSetEntryBoxPosition}
          onSwapEntryBoxPositions={onSwapEntryBoxPositions}
          onAddBox={onAddBox}
          onRenameBox={onRenameBox}
          onCurrentBoxChange={handlePrimaryBoxChange}
        />
        {secondBoxOpen && (
          <DexBoxPane
            key={`${selectedLocationTab}-second`}
            boxes={boxes}
            initialBoxIndex={secondBoxInitialIndex}
            storageLocations={storageLocations}
            speciesAvailability={speciesAvailability}
            storageLocationId={selectedLocationTab}
            boxedEntryIds={boxedEntryIds}
            onSaveOrigin={onSaveOrigin}
            onSetEntryBoxPosition={onSetEntryBoxPosition}
            onSwapEntryBoxPositions={onSwapEntryBoxPositions}
            onAddBox={onAddBox}
            onRenameBox={onRenameBox}
          />
        )}
        <DexBoxTray entries={unboxedEntries} onDropEntry={handleDropOnTray} onClickEntry={handleClickUnboxedEntry} />
      </div>
    </div>
  )
}
