import { useEffect, useState, type MouseEvent } from 'react'
import type { CollectionEntryOriginInput, Form, Gender, Species } from '@shared/types/pokemon'
import type { StorageLocation } from '@shared/types/storage-location'
import type { StorageBox } from '@shared/types/box'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import { BOX_COLS } from './buildBoxes'
import { canonicalPlaceholderForm } from './boxTemplates'
import { DexBoxDetailPanel } from './DexBoxDetailPanel'
import { DexBoxContextMenu, type DexBoxContextMenuAction } from './DexBoxContextMenu'
import { DexBoxGridCell } from './DexBoxGridCell'
import { DexBoxPlaceholderModal } from './DexBoxPlaceholderModal'
import { DexBoxPager } from './DexBoxPager'
import { OriginModal } from './OriginModal'
import type { Box, BoxCell, BoxPlaceholderCell, CellTarget } from './types'

interface DexBoxPaneProps {
  /** The selected location's full box list, shared by every open pane — see buildBoxes.ts.
   * Always non-empty by the time a pane renders (DexBoxGrid's own loading guard). */
  boxes: Box[]
  initialBoxIndex: number
  storageLocations: StorageLocation[]
  speciesAvailability: SpeciesAvailabilityData
  /** Leg 5 of the Box View Polish milestone: the full species list, threaded down purely
   * for DexBoxPlaceholderModal's search — nothing else here needs it. */
  species: Species[]
  /** Leg 2 of the Dex completeness tier migration: resolves a manually-picked speciesId
   * into the (formId, gender) a placeholder actually stores — see
   * boxTemplates.ts's canonicalPlaceholderForm. */
  forms: Form[]
  /** The real (non-null) location id — a pane never renders for the Unassigned tab, same
   * guard as DexBoxGrid's own selectedLocationTab === null branch. */
  storageLocationId: number
  /** Every entry id currently occupying a box slot anywhere in this location, regardless
   * of which pane (or neither) is currently displaying that box — Leg 3's generalization
   * of the pre-Leg-3 "is this entry in *my own* cells" check, so that a filled cell dragged
   * from the other open pane onto an occupied cell here is recognized as a real swap
   * instead of being silently rejected as if it came from the tray. */
  boxedEntryIds: Set<number>
  onSaveOrigin: (entryId: number, input: CollectionEntryOriginInput) => void
  onSetEntryBoxPosition: (entryId: number, boxNumber: number | null, boxSlot: number | null) => void
  onSwapEntryBoxPositions: (entryIdA: number, entryIdB: number) => void
  /** Leg 4 of the Box View Polish milestone: dragging a multi-selection of cells — see
   * handleDropOnSlot below. */
  onFillBoxSlots: (entryIds: number[], boxNumber: number, startSlot: number) => void
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
 * `boxes` is the same shared array in both panes; only each pane's own `initialBoxIndex`/
 * internal navigation differs, so dragging a cell from one pane onto the other targets a
 * different box within the same location, not a different location.
 */
export function DexBoxPane({
  boxes,
  initialBoxIndex,
  storageLocations,
  speciesAvailability,
  species,
  forms,
  storageLocationId,
  boxedEntryIds,
  onSaveOrigin,
  onSetEntryBoxPosition,
  onSwapEntryBoxPositions,
  onFillBoxSlots,
  onAddBox,
  onRenameBox,
  onSetBoxPlaceholder,
  onClearBoxPlaceholder,
  onCurrentBoxChange
}: DexBoxPaneProps): JSX.Element {
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
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; target: CellTarget } | null>(null)
  // Leg 5 of the Box View Polish milestone: the slot a "Set placeholder…"/"Change species"
  // context-menu action opened DexBoxPlaceholderModal for — null means the modal is closed.
  const [placeholderTarget, setPlaceholderTarget] = useState<CellTarget | null>(null)

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
      return [
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
          onEditOrigin={() => setEditingOrigin(true)}
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
