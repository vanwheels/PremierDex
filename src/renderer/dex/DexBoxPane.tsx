import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import type { CollectionEntryOriginInput, Form, Gender, Species } from '@shared/types/pokemon'
import type { StorageLocation } from '@shared/types/storage-location'
import type { StorageBox } from '@shared/types/box'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import type { EvolutionEdge } from '@shared/types/evolution'
import type { FormeSwitchGroup } from '@shared/types/forme-switch-groups'
import { BOX_COLS } from './buildBoxes'
import { canonicalPlaceholderForm } from './boxTemplates'
import { DexBoxDetailPanel } from './DexBoxDetailPanel'
import { DexBoxContextMenu, type DexBoxContextMenuAction } from './DexBoxContextMenu'
import { DexBoxGridCell } from './DexBoxGridCell'
import { DexBoxPlaceholderModal } from './DexBoxPlaceholderModal'
import { DexBoxPager } from './DexBoxPager'
import { DexMoveToLocationModal } from './DexMoveToLocationModal'
import { OriginModal } from './OriginModal'
import { RibbonsMarksModal } from './RibbonsMarksModal'
import { SpeciesDetailPopup } from './SpeciesDetailPopup'
import type { SpeciesDetailTarget } from './SpeciesDetailPopup'
import { prefetchBoxSprites } from './spritePrefetch'
import type { Box, BoxCell, BoxPlaceholderCell, CellTarget } from './types'

interface DexBoxPaneProps {
  /** This pane's own location's full box list — see buildBoxes.ts. Shared with the other
   * pane only when both happen to show the same location (the common case, and the
   * default when a second pane first opens); since Leg 1 of the Box View Move & Undo
   * Operations milestone a second pane can pick a different location via DexBoxGrid's own
   * location dropdown, in which case each pane gets its own `boxes`. Always non-empty by
   * the time a pane renders (DexBoxGrid's own loading guard). */
  boxes: Box[]
  initialBoxIndex: number
  storageLocations: StorageLocation[]
  speciesAvailability: SpeciesAvailabilityData
  /** Leg 5 of the Box View Polish milestone: the full species list, for
   * DexBoxPlaceholderModal's search. Also backs the speciesById lookup below (Leg 2 of the
   * Evolution-Chain Reachability milestone) for DexBoxDetailPanel's invalid-combo check. */
  species: Species[]
  /** Leg 2 of the Dex completeness tier migration: resolves a manually-picked speciesId
   * into the (formId, gender) a placeholder actually stores — see
   * boxTemplates.ts's canonicalPlaceholderForm. */
  forms: Form[]
  /** Leg 3 of the Species detail popup + evolution family tree milestone — feeds
   * SpeciesDetailPopup's EvolutionTree. */
  evolutionEdges: EvolutionEdge[]
  formeSwitchGroups: FormeSwitchGroup[]
  /** The real (non-null) location id — a pane never renders for the Unassigned tab, same
   * guard as DexBoxGrid's own selectedLocationTab === null branch. */
  storageLocationId: number
  /** Every entry id currently occupying a box slot anywhere in *this pane's own* location,
   * regardless of which pane (or neither) is currently displaying that box — Leg 3's
   * generalization of the pre-Leg-3 "is this entry in *my own* cells" check, so that a
   * filled cell dragged from the other open pane onto an occupied cell here is recognized
   * as a real swap instead of being silently rejected as if it came from the tray. Scoped
   * per-pane (not shared) since Leg 1 of the Box View Move & Undo Operations milestone —
   * see `boxes`' own doc comment above. */
  boxedEntryIds: Set<number>
  /** Leg 1 of the Box View Move & Undo Operations milestone: every entry's actual current
   * storage location (or null), collection-wide — not just this pane's own location. Lets
   * handleDropOnSlot tell a same-location drag (this pane's own cells, or the tray, which
   * always belongs to the primary tab's location) apart from a cross-location one (a
   * second pane showing a different location than this one). */
  entryLocationMap: Map<number, number | null>
  onSaveOrigin: (entryId: number, input: CollectionEntryOriginInput) => void
  onSetEntryBoxPosition: (entryId: number, boxNumber: number | null, boxSlot: number | null) => void
  onSwapEntryBoxPositions: (entryIdA: number, entryIdB: number) => void
  /** Leg 4 of the Box View Polish milestone: dragging a multi-selection of cells — see
   * handleDropOnSlot below. */
  onFillBoxSlots: (entryIds: number[], boxNumber: number, startSlot: number) => void
  /** Leg 1 of the Box View Move & Undo Operations milestone: a drag whose dragged entries
   * don't belong to this pane's own location — see handleDropOnSlot's cross-location
   * branch. Always a contiguous run starting at `startSlot`, same shape as onFillBoxSlots,
   * since a drag-and-drop gesture always has one concrete drop point to fill from. */
  onMoveToLocation: (entryIds: number[], storageLocationId: number, boxNumber: number, startSlot: number) => void
  /** Leg 1: "Move to location…" context-menu action — the dedicated-picker half of
   * cross-location move, for a destination that isn't already open in a second pane.
   * DexBoxGrid finds (creating a box if needed) room at the destination and writes the
   * result; this pane just gathers which entries and which location. */
  onMoveSelectionToLocation: (entryIds: number[], destinationLocationId: number) => Promise<void>
  onAddBox: (storageLocationId: number) => Promise<StorageBox>
  onRenameBox: (boxId: number, name: string | null) => void
  /** Leg 5 of the Box View Polish milestone: right-click an empty slot ("Set
   * placeholder…") or an existing placeholder ("Change species") — see
   * DexBoxPlaceholderModal. Signature mirrors StorageAdapter.setBoxPlaceholder exactly
   * (storageLocationId included) rather than relying on this pane's own storageLocationId
   * prop implicitly, so the call reads the same all the way down the chain. */
  onSetBoxPlaceholder: (storageLocationId: number, boxNumber: number, boxSlot: number, formId: number, gender: Gender, shiny: boolean) => void
  /** Right-click a placeholder cell -> "Clear placeholder". */
  onClearBoxPlaceholder: (storageLocationId: number, boxNumber: number, boxSlot: number) => void
  /** Fires on mount and on every box navigation — lets DexBoxGrid track which box the
   * primary pane is currently showing, for the tray's click-to-place shortcut (always
   * targets the primary pane; see DexBoxGrid's own doc comment). The secondary pane passes
   * this through too since the component doesn't know which one it is, but DexBoxGrid
   * simply doesn't wire it up there. */
  onCurrentBoxChange?: (box: Box) => void
  /** Leg 3 of the Species database milestone: SpeciesDetailPopup's "View Full Page" —
   * threaded up to App.tsx, which owns the full page's own AppView/target state. */
  onOpenFullPage: (target: SpeciesDetailTarget) => void
}

/**
 * One fully interactive box pane: pager, 5x6 grid, detail panel, right-click menu, and
 * Origin modal — split out of DexBoxGrid (Leg 3 of the Box View Polish milestone) so a
 * second one can open side by side with the primary, both running the exact same
 * drag/drop/click rules off their own independent navigation and selection state. `key`ed
 * by DexBoxGrid on `selectedLocationTab` (both instances) so switching Storage Location
 * tabs remounts each pane fresh rather than carrying a stale box index or selection across
 * — replaces the single-pane version's old reset-by-useEffect.
 *
 * `boxes` is the same shared array in both panes when they show the same location (still
 * the default); only each pane's own `initialBoxIndex`/internal navigation differs, so
 * dragging a cell from one pane onto the other targets a different box within that shared
 * location. Since Leg 1 of the Box View Move & Undo Operations milestone, a second pane
 * can instead be pointed at a different location (DexBoxGrid's location dropdown), in
 * which case each pane gets its own `boxes`/`boxedEntryIds` and a cross-pane drag becomes
 * a cross-location move (see handleDropOnSlot's cross-location branch, gated on
 * `entryLocationMap`).
 */
export function DexBoxPane({
  boxes,
  initialBoxIndex,
  storageLocations,
  speciesAvailability,
  species,
  forms,
  evolutionEdges,
  formeSwitchGroups,
  storageLocationId,
  boxedEntryIds,
  entryLocationMap,
  onSaveOrigin,
  onSetEntryBoxPosition,
  onSwapEntryBoxPositions,
  onFillBoxSlots,
  onMoveToLocation,
  onMoveSelectionToLocation,
  onAddBox,
  onRenameBox,
  onSetBoxPlaceholder,
  onClearBoxPlaceholder,
  onCurrentBoxChange,
  onOpenFullPage
}: DexBoxPaneProps): JSX.Element {
  const speciesById = useMemo(() => new Map(species.map((s) => [s.id, s])), [species])
  const [boxIndex, setBoxIndex] = useState(initialBoxIndex)
  // Leg 4 of the Box View Polish milestone: multi-select. `selectedSlots` is ordered by
  // *selection* order, not slot order — a ctrl-click appends to the end, a shift-click
  // range is written in ascending slot order (see handleCellClick) — since that order is
  // what a multi-drag's payload carries through to a contiguous fill (handleDropOnSlot).
  // `selectionAnchor` is the slot a plain or ctrl-click last landed on, i.e. the far end a
  // subsequent shift-click range is computed from; only a plain click moves it back
  // (Explorer-style), so repeated shift-clicks re-select from the same anchor.
  const [selectedSlots, setSelectedSlots] = useState<number[]>([])
  const [selectionAnchor, setSelectionAnchor] = useState<number | null>(null)
  // Leg 2 of the Dex completeness tier migration: a placeholder can now be single-selected
  // (click to view its specifics in the detail panel) — deliberately a separate piece of
  // state from selectedSlots/selectionAnchor above rather than folding placeholders into
  // that multi-select machinery, since a placeholder supports neither multi-select nor
  // drag (see DexBoxGridCell's onClickPlaceholder wiring below).
  const [selectedPlaceholderSlot, setSelectedPlaceholderSlot] = useState<number | null>(null)
  const [editingOrigin, setEditingOrigin] = useState(false)
  const [editingRibbonsMarks, setEditingRibbonsMarks] = useState(false)
  // Leg 3 of the Species detail popup + evolution family tree milestone — same "parent
  // owns the modal" convention as editingOrigin/editingRibbonsMarks above, but its own
  // target rather than a boolean since it isn't scoped to the current detailCell (Escape/
  // close should still work after navigating within the tree to a different family
  // member — see SpeciesDetailPopup's own doc comment).
  const [speciesDetailTarget, setSpeciesDetailTarget] = useState<SpeciesDetailTarget | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; target: CellTarget } | null>(null)
  // Leg 5 of the Box View Polish milestone: the slot a "Set placeholder…"/"Change species"
  // context-menu action opened DexBoxPlaceholderModal for — null means the modal is closed.
  const [placeholderTarget, setPlaceholderTarget] = useState<CellTarget | null>(null)
  // Leg 1 of the Box View Move & Undo Operations milestone: the entry id(s) a "Move to
  // location…" context-menu action opened DexMoveToLocationModal for — null means the
  // modal is closed. Captured up front (rather than re-read from selectedSlots/target at
  // save time) since the context menu can close the selection state in between.
  const [movingEntryIds, setMovingEntryIds] = useState<number[] | null>(null)

  const clampedIndex = Math.min(boxIndex, boxes.length - 1)
  const box = boxes[clampedIndex]
  const cells = box.cells
  // The detail panel only ever shows one Pokémon's info — a multi-selection shows nothing
  // rather than guessing which of several to display (Vanny's implicit call: this leg's
  // design decisions only specify drag/drop behavior, not a multi-select detail view).
  // Narrowed to 'entry' specifically: selectedSlots (see handleCellClick below) only ever
  // holds real-entry slots, but cells' own type still allows a placeholder there.
  const selectedSlotCell = selectedSlots.length === 1 ? cells[selectedSlots[0]] : null
  const selectedEntryCell = selectedSlotCell?.kind === 'entry' ? selectedSlotCell : null
  // Leg 2 of the Dex completeness tier migration: a single selected placeholder, shown
  // read-only in the same detail panel — see selectedPlaceholderSlot's own doc comment.
  const selectedPlaceholderSlotCell = selectedPlaceholderSlot !== null ? cells[selectedPlaceholderSlot] : null
  const selectedPlaceholderCell = selectedPlaceholderSlotCell?.kind === 'placeholder' ? selectedPlaceholderSlotCell : null
  const detailCell: BoxCell | BoxPlaceholderCell | null = selectedEntryCell ?? selectedPlaceholderCell

  const clearSelection = (): void => {
    setSelectedSlots([])
    setSelectionAnchor(null)
  }

  // Plain click replaces the selection with just this slot; ctrl/cmd-click toggles it
  // into/out of the current selection; shift-click selects every filled slot in the
  // contiguous index range between the anchor and this slot. Only ever wired to a real
  // entry cell's SpriteThumbnail (see the grid render below) — a placeholder cell's own
  // SpriteThumbnail has a no-op onClick — so `cells[slot]` is always an entry cell here.
  const handleCellClick = (slot: number, e: MouseEvent): void => {
    setSelectedPlaceholderSlot(null)
    if (e.shiftKey && selectionAnchor !== null) {
      const [lo, hi] = selectionAnchor <= slot ? [selectionAnchor, slot] : [slot, selectionAnchor]
      const range: number[] = []
      for (let i = lo; i <= hi; i++) {
        // Only real entries are selectable — a placeholder cell has no onClick wired to
        // this handler (see the grid render below), but a shift-click range can still span
        // over one sitting between two real cells, so it's excluded here too.
        if (cells[i]?.kind === 'entry') range.push(i)
      }
      setSelectedSlots(range)
    } else if (e.ctrlKey || e.metaKey) {
      setSelectedSlots((prev) => (prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]))
      setSelectionAnchor(slot)
    } else {
      setSelectedSlots([slot])
      setSelectionAnchor(slot)
    }
  }

  // A placeholder click always replaces the selection with just this slot — no
  // multi-select, no drag, matching "view its info" as the only interaction this leg adds
  // (see selectedPlaceholderSlot's own doc comment above).
  const handleClickPlaceholder = (slot: number): void => {
    clearSelection()
    setSelectedPlaceholderSlot(slot)
  }

  // Dragging a slot that's part of the current selection carries the whole selection, in
  // its selection order; dragging any other filled slot (no selection, or a cell outside
  // it) drags just that one cell and collapses the selection down to it first, same as a
  // plain click would — matching how file-manager drag-and-drop treats an unselected item.
  const handleDragStart = (slot: number): number[] => {
    if (selectedSlots.includes(slot)) {
      // Filters rather than asserts non-null: `cells` is shared across panes (see
      // boxedEntryIds' doc comment), so a slot that was filled when selected could in
      // principle have been vacated (or, since Leg 5, replaced by a placeholder) by the
      // other pane since — drop it from the drag rather than crash on a stale selection.
      return selectedSlots.map((s) => cells[s]).filter((c): c is BoxCell => c?.kind === 'entry').map((c) => c.entry.id)
    }
    setSelectedSlots([slot])
    setSelectionAnchor(slot)
    return [(cells[slot] as BoxCell).entry.id]
  }

  // DexBoxGrid wraps its handler in useCallback so this doesn't re-fire on every unrelated
  // parent render — only when this pane's own displayed box actually changes.
  useEffect(() => {
    onCurrentBoxChange?.(box)
  }, [box, onCurrentBoxChange])

  // Box view scroller lag (Leg 4 of the Box View Quick-Wins Sweep): warm the browser's
  // sprite cache for the boxes a Prev/Next click would land on next, so a never-before-
  // seen box's sprites are already in flight (or resolved) by the time the user actually
  // navigates there — see spritePrefetch.ts's own doc comment.
  useEffect(() => {
    prefetchBoxSprites(boxes[clampedIndex - 1])
    prefetchBoxSprites(boxes[clampedIndex + 1])
  }, [boxes, clampedIndex])

  const goToBox = (index: number): void => {
    setBoxIndex(index)
    clearSelection()
    setSelectedPlaceholderSlot(null)
  }

  // Same logic as pre-Leg-3 DexBoxGrid.handleDropOnSlot, but gated on the shared
  // boxedEntryIds set instead of this pane's own cells — see the prop's doc comment.
  // A single-id drop keeps this exact pre-Leg-4 swap/move behavior regardless of
  // selection state (see handleDragStart) — only a real multi-selection drag (2+ ids)
  // gets the new contiguous-fill treatment below.
  const handleDropOnSlot = (targetSlot: number, draggedEntryIds: number[]): void => {
    setDragOverSlot(null)
    // A placeholder cell is treated as empty for drop purposes (dropping a real entry
    // there fulfills the plan and clears it — see sqlite-storage.ts's
    // clearBoxPlaceholderStmt) — only a real entry occupant is a swap/reject target below.
    const targetCell = cells[targetSlot]
    const targetEntry = targetCell?.kind === 'entry' ? targetCell : null

    // Leg 1 of the Box View Move & Undo Operations milestone: the dragged batch's home
    // location (uniform across the batch — a multi-select only ever spans one pane's own
    // grid) differs from this pane's own location, so this is a cross-location move
    // regardless of selection size. A same-location drop has a swap path (single) and a
    // vacate-first reshuffle (multi, see onFillBoxSlots below) for landing on an already-
    // occupied slot; cross-location has neither this leg — an occupied target slot is
    // rejected outright, same as the same-location multi-drop's own occupancy rule.
    if ((entryLocationMap.get(draggedEntryIds[0]) ?? null) !== storageLocationId) {
      if (targetSlot + draggedEntryIds.length > cells.length) return
      const draggedIdSet = new Set(draggedEntryIds)
      for (let i = 0; i < draggedEntryIds.length; i++) {
        const occupant = cells[targetSlot + i]
        if (occupant?.kind === 'entry' && !draggedIdSet.has(occupant.entry.id)) return
      }
      onMoveToLocation(draggedEntryIds, storageLocationId, box.boxNumber, targetSlot)
      clearSelection()
      return
    }

    if (draggedEntryIds.length === 1) {
      const draggedEntryId = draggedEntryIds[0]
      if (targetEntry?.entry.id === draggedEntryId) return
      if (targetEntry) {
        if (!boxedEntryIds.has(draggedEntryId)) return
        onSwapEntryBoxPositions(draggedEntryId, targetEntry.entry.id)
      } else {
        onSetEntryBoxPosition(draggedEntryId, box.boxNumber, targetSlot)
      }
      return
    }

    // Multi-select drop (Leg 4 of the Box View Polish milestone, Vanny's design decision
    // 2026-09-03): fills slots contiguously starting at targetSlot, in the dragged
    // selection's original order. Rejected outright — no partial fill — if the run would
    // spill past the end of the box, or if any needed slot is already occupied by a real
    // entry that isn't itself part of the dragged selection (a placeholder occupant is
    // fine, same "fulfills the plan" treatment as the single-drop branch above).
    if (targetSlot + draggedEntryIds.length > cells.length) return
    const draggedIdSet = new Set(draggedEntryIds)
    for (let i = 0; i < draggedEntryIds.length; i++) {
      const occupant = cells[targetSlot + i]
      if (occupant?.kind === 'entry' && !draggedIdSet.has(occupant.entry.id)) return
    }
    onFillBoxSlots(draggedEntryIds, box.boxNumber, targetSlot)
    clearSelection()
  }

  // New boxes always land at the end (see DexBoxGrid's pre-Leg-3 version of this comment) —
  // `boxes` is shared, so whichever pane's "+ Add Box" was clicked jumps to the same new box.
  const handleAddBox = (): void => {
    const newBoxIndex = boxes.length
    onAddBox(storageLocationId).then(() => goToBox(newBoxIndex))
  }

  // Right-click action set per cell kind (Leg 5 of the Box View Polish milestone) — see
  // CellTarget's own doc comment.
  const contextMenuActions = (target: CellTarget): DexBoxContextMenuAction[] => {
    if (target.kind === 'entry') {
      // Right-clicking a cell that's part of a live multi-selection acts on the whole
      // selection (Leg 1 of the Box View Move & Undo Operations milestone); right-clicking
      // any other filled cell acts on just that one, same "unselected item" precedent
      // handleDragStart already follows for drag.
      const entryIds = selectedSlots.includes(target.slot)
        ? selectedSlots.map((s) => cells[s]).filter((c): c is BoxCell => c?.kind === 'entry').map((c) => c.entry.id)
        : [target.entryId]
      return [
        {
          label: entryIds.length === 1 ? 'Move to location…' : `Move ${entryIds.length} entries to location…`,
          onClick: () => {
            setMovingEntryIds(entryIds)
            setContextMenu(null)
          }
        },
        {
          label: 'Remove from box',
          onClick: () => {
            onSetEntryBoxPosition(target.entryId, null, null)
            setContextMenu(null)
          }
        }
      ]
    }
    if (target.kind === 'placeholder') {
      return [
        {
          label: 'Change species',
          onClick: () => {
            setPlaceholderTarget(target)
            setContextMenu(null)
          }
        },
        {
          label: 'Clear placeholder',
          onClick: () => {
            onClearBoxPlaceholder(storageLocationId, box.boxNumber, target.slot)
            setContextMenu(null)
          }
        }
      ]
    }
    return [
      {
        label: 'Set placeholder…',
        onClick: () => {
          setPlaceholderTarget(target)
          setContextMenu(null)
        }
      }
    ]
  }

  return (
    <>
      <div className="dex-box-main">
        <DexBoxPager
          box={box}
          index={clampedIndex}
          count={boxes.length}
          boxes={boxes}
          onGoTo={goToBox}
          onAddBox={handleAddBox}
          onRenameBox={onRenameBox}
        />
        <div className="dex-box-grid" style={{ gridTemplateColumns: `repeat(${BOX_COLS}, var(--dex-box-cell-size))` }}>
          {cells.map((cell, slot) => (
            <DexBoxGridCell
              key={slot}
              cell={cell}
              slot={slot}
              isDragOver={dragOverSlot === slot}
              isSelected={selectedSlots.includes(slot) || selectedPlaceholderSlot === slot}
              onDragStart={() => handleDragStart(slot)}
              onDragEnter={() => setDragOverSlot(slot)}
              onDragLeave={() => setDragOverSlot((prev) => (prev === slot ? null : prev))}
              onDrop={(draggedEntryIds) => handleDropOnSlot(slot, draggedEntryIds)}
              onContextMenu={(x, y, target) => setContextMenu({ x, y, target })}
              onClickEntry={(e) => handleCellClick(slot, e)}
              onClickPlaceholder={() => handleClickPlaceholder(slot)}
            />
          ))}
        </div>
        <DexBoxDetailPanel
          cell={detailCell}
          storageLocations={storageLocations}
          speciesAvailability={speciesAvailability}
          speciesById={speciesById}
          onEditOrigin={() => setEditingOrigin(true)}
          onEditRibbonsMarks={() => setEditingRibbonsMarks(true)}
          onOpenSpeciesDetail={setSpeciesDetailTarget}
          onSaveOrigin={onSaveOrigin}
        />
      </div>
      {editingOrigin && selectedEntryCell?.entry.owned && (
        <OriginModal
          entry={selectedEntryCell.entry}
          displayName={selectedEntryCell.displayName}
          onClose={() => setEditingOrigin(false)}
          onSave={onSaveOrigin}
        />
      )}
      {editingRibbonsMarks && selectedEntryCell?.entry.owned && (
        <RibbonsMarksModal
          entryId={selectedEntryCell.entry.id}
          displayName={selectedEntryCell.displayName}
          onClose={() => setEditingRibbonsMarks(false)}
        />
      )}
      {speciesDetailTarget && (
        <SpeciesDetailPopup
          target={speciesDetailTarget}
          species={species}
          forms={forms}
          evolutionEdges={evolutionEdges}
          formeSwitchGroups={formeSwitchGroups}
          onClose={() => setSpeciesDetailTarget(null)}
          onOpenFullPage={onOpenFullPage}
        />
      )}
      {movingEntryIds && (
        <DexMoveToLocationModal
          entryCount={movingEntryIds.length}
          storageLocations={storageLocations}
          currentLocationId={storageLocationId}
          onClose={() => setMovingEntryIds(null)}
          onMove={(destinationLocationId) => {
            onMoveSelectionToLocation(movingEntryIds, destinationLocationId)
            setMovingEntryIds(null)
            clearSelection()
          }}
        />
      )}
      {contextMenu && (
        <DexBoxContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          actions={contextMenuActions(contextMenu.target)}
          onClose={() => setContextMenu(null)}
        />
      )}
      {placeholderTarget && (
        <DexBoxPlaceholderModal
          species={species}
          initialSpeciesId={placeholderTarget.kind === 'placeholder' ? placeholderTarget.speciesId : null}
          onClose={() => setPlaceholderTarget(null)}
          onSave={(speciesId) => {
            // Species-only in the UI (Vanny's call) — resolved to a concrete form/gender
            // here so the stored placeholder can dedupe against a template-stamped one for
            // the same requirement. Silently no-ops if the species somehow has no forms at
            // all (shouldn't happen post-seed).
            const form = canonicalPlaceholderForm(speciesId, forms)
            if (form) {
              onSetBoxPlaceholder(
                storageLocationId,
                box.boxNumber,
                placeholderTarget.slot,
                form.id,
                form.hasGenderDifference ? 'male' : 'unknown',
                false
              )
            }
            setPlaceholderTarget(null)
          }}
        />
      )}
    </>
  )
}
