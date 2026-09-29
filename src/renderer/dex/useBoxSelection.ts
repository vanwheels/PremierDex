import { useState, type MouseEvent } from 'react'
import type { BoxCell, BoxPlaceholderCell } from './types'

export interface BoxSelection {
  selectedSlots: number[]
  selectedPlaceholderSlot: number | null
  /** The single selected entry cell, or null for no/multi selection — narrows DexBoxPane's
   * OriginModal/RibbonsMarksModal gating (both require selectedEntryCell.entry.owned). */
  selectedEntryCell: BoxCell | null
  /** The single selected cell (entry or placeholder) DexBoxDetailPanel shows — a
   * multi-selection shows nothing rather than guessing which of several to display
   * (Vanny's implicit call: the Box View Polish milestone's design decisions only specify
   * drag/drop behavior, not a multi-select detail view). */
  detailCell: BoxCell | BoxPlaceholderCell | null
  clearSelection: () => void
  /** Also clears the placeholder selection — for box navigation (goToBox), which resets
   * both selection kinds at once. */
  resetAll: () => void
  handleCellClick: (slot: number, e: MouseEvent) => void
  handleClickPlaceholder: (slot: number) => void
  handleDragStart: (slot: number) => number[]
}

/**
 * Split out of DexBoxPane (Codebase File-Size Cleanup pass, 2026-09-28) purely to bring
 * DexBoxPane back under the file-size cap — no behavior change. Owns the pane's entry-cell
 * multi-select (click/ctrl-click/shift-click) and the single-select placeholder-cell
 * viewer, which stay separate pieces of state per the Box View Polish/Dex completeness
 * tier migration's own original design (a placeholder supports neither multi-select nor
 * drag). `cells` is passed in fresh on every render (it's `box.cells`, shared across panes
 * — see DexBoxPane's own `boxes` doc comment) rather than owned here, since DexBoxPane
 * still needs it directly for handleDropOnSlot and the grid render.
 */
export function useBoxSelection(cells: (BoxCell | BoxPlaceholderCell | null)[]): BoxSelection {
  // `selectedSlots` is ordered by *selection* order, not slot order — a ctrl-click appends
  // to the end, a shift-click range is written in ascending slot order (see handleCellClick)
  // — since that order is what a multi-drag's payload carries through to a contiguous fill
  // (DexBoxPane's handleDropOnSlot). `selectionAnchor` is the slot a plain or ctrl-click
  // last landed on, i.e. the far end a subsequent shift-click range is computed from; only
  // a plain click moves it back (Explorer-style), so repeated shift-clicks re-select from
  // the same anchor.
  const [selectedSlots, setSelectedSlots] = useState<number[]>([])
  const [selectionAnchor, setSelectionAnchor] = useState<number | null>(null)
  // A placeholder can be single-selected (click to view its specifics in the detail panel)
  // — deliberately separate from selectedSlots/selectionAnchor above rather than folding
  // placeholders into that multi-select machinery.
  const [selectedPlaceholderSlot, setSelectedPlaceholderSlot] = useState<number | null>(null)

  const selectedSlotCell = selectedSlots.length === 1 ? cells[selectedSlots[0]] : null
  const selectedEntryCell = selectedSlotCell?.kind === 'entry' ? selectedSlotCell : null
  const selectedPlaceholderSlotCell = selectedPlaceholderSlot !== null ? cells[selectedPlaceholderSlot] : null
  const selectedPlaceholderCell = selectedPlaceholderSlotCell?.kind === 'placeholder' ? selectedPlaceholderSlotCell : null
  const detailCell: BoxCell | BoxPlaceholderCell | null = selectedEntryCell ?? selectedPlaceholderCell

  const clearSelection = (): void => {
    setSelectedSlots([])
    setSelectionAnchor(null)
  }

  const resetAll = (): void => {
    clearSelection()
    setSelectedPlaceholderSlot(null)
  }

  // Plain click replaces the selection with just this slot; ctrl/cmd-click toggles it
  // into/out of the current selection; shift-click selects every filled slot in the
  // contiguous index range between the anchor and this slot. Only ever wired to a real
  // entry cell's SpriteThumbnail — a placeholder cell's own SpriteThumbnail has a no-op
  // onClick — so `cells[slot]` is always an entry cell here.
  const handleCellClick = (slot: number, e: MouseEvent): void => {
    setSelectedPlaceholderSlot(null)
    if (e.shiftKey && selectionAnchor !== null) {
      const [lo, hi] = selectionAnchor <= slot ? [selectionAnchor, slot] : [slot, selectionAnchor]
      const range: number[] = []
      for (let i = lo; i <= hi; i++) {
        // Only real entries are selectable — a placeholder cell has no onClick wired to
        // this handler, but a shift-click range can still span over one sitting between two
        // real cells, so it's excluded here too.
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
  // multi-select, no drag, matching "view its info" as the only interaction a placeholder
  // supports.
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
      // Filters rather than asserts non-null: `cells` is shared across panes, so a slot
      // that was filled when selected could in principle have been vacated (or replaced by
      // a placeholder) by the other pane since — drop it from the drag rather than crash on
      // a stale selection.
      return selectedSlots.map((s) => cells[s]).filter((c): c is BoxCell => c?.kind === 'entry').map((c) => c.entry.id)
    }
    setSelectedSlots([slot])
    setSelectionAnchor(slot)
    return [(cells[slot] as BoxCell).entry.id]
  }

  return {
    selectedSlots,
    selectedPlaceholderSlot,
    selectedEntryCell,
    detailCell,
    clearSelection,
    resetAll,
    handleCellClick,
    handleClickPlaceholder,
    handleDragStart
  }
}
