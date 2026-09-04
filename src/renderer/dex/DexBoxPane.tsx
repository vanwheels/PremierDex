import { useEffect, useState } from 'react'
import type { CollectionEntryOriginInput } from '@shared/types/pokemon'
import type { StorageLocation } from '@shared/types/storage-location'
import type { StorageBox } from '@shared/types/box'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import { BOX_COLS } from './buildBoxes'
import { SpriteThumbnail } from './SpriteThumbnail'
import { BallIcon } from './BallIcon'
import { DexBoxDetailPanel } from './DexBoxDetailPanel'
import { DexBoxContextMenu } from './DexBoxContextMenu'
import { DexBoxPager } from './DexBoxPager'
import { OriginModal } from './OriginModal'
import { readDragEntryPayload, setDragEntryPayload } from './dragEntryPayload'
import type { Box, BoxCell } from './types'

// Same fixed sprite size as before Leg 3 split this out of DexBoxGrid — see that file's
// own doc comment on why it's fixed rather than flex-stretched.
const CELL_SPRITE_SIZE = 96

interface DexBoxPaneProps {
  /** The selected location's full box list, shared by every open pane — see buildBoxes.ts.
   * Always non-empty by the time a pane renders (DexBoxGrid's own loading guard). */
  boxes: Box[]
  initialBoxIndex: number
  storageLocations: StorageLocation[]
  speciesAvailability: SpeciesAvailabilityData
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
  onAddBox: (storageLocationId: number) => Promise<StorageBox>
  onRenameBox: (boxId: number, name: string | null) => void
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
  storageLocationId,
  boxedEntryIds,
  onSaveOrigin,
  onSetEntryBoxPosition,
  onSwapEntryBoxPositions,
  onAddBox,
  onRenameBox,
  onCurrentBoxChange
}: DexBoxPaneProps): JSX.Element {
  const [boxIndex, setBoxIndex] = useState(initialBoxIndex)
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null)
  const [editingOrigin, setEditingOrigin] = useState(false)
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entryId: number } | null>(null)

  const clampedIndex = Math.min(boxIndex, boxes.length - 1)
  const box = boxes[clampedIndex]
  const cells = box.cells
  const selectedCell = cells.find((c): c is BoxCell => c !== null && `${c.boxNumber}-${c.slot}` === selectedCellKey) ?? null

  // DexBoxGrid wraps its handler in useCallback so this doesn't re-fire on every unrelated
  // parent render — only when this pane's own displayed box actually changes.
  useEffect(() => {
    onCurrentBoxChange?.(box)
  }, [box, onCurrentBoxChange])

  const goToBox = (index: number): void => {
    setBoxIndex(index)
    setSelectedCellKey(null)
  }

  // Same logic as pre-Leg-3 DexBoxGrid.handleDropOnSlot, but gated on the shared
  // boxedEntryIds set instead of this pane's own cells — see the prop's doc comment.
  const handleDropOnSlot = (targetSlot: number, draggedEntryId: number): void => {
    setDragOverSlot(null)
    const targetCell = cells[targetSlot]
    if (targetCell?.entry.id === draggedEntryId) return
    if (targetCell) {
      if (!boxedEntryIds.has(draggedEntryId)) return
      onSwapEntryBoxPositions(draggedEntryId, targetCell.entry.id)
    } else {
      onSetEntryBoxPosition(draggedEntryId, box.boxNumber, targetSlot)
    }
  }

  // New boxes always land at the end (see DexBoxGrid's pre-Leg-3 version of this comment) —
  // `boxes` is shared, so whichever pane's "+ Add Box" was clicked jumps to the same new box.
  const handleAddBox = (): void => {
    const newBoxIndex = boxes.length
    onAddBox(storageLocationId).then(() => goToBox(newBoxIndex))
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
            <div
              key={slot}
              className={
                ['dex-box-cell', !cell && 'dex-box-cell-empty', dragOverSlot === slot && 'dex-box-cell-drag-over']
                  .filter(Boolean)
                  .join(' ')
              }
              draggable={cell !== null}
              onDragStart={cell ? (e) => setDragEntryPayload(e, cell.entry.id) : undefined}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => setDragOverSlot(slot)}
              onDragLeave={() => setDragOverSlot((prev) => (prev === slot ? null : prev))}
              onDrop={(e) => {
                e.preventDefault()
                const draggedEntryId = readDragEntryPayload(e)
                if (draggedEntryId !== null) handleDropOnSlot(slot, draggedEntryId)
              }}
              onContextMenu={
                cell
                  ? (e) => {
                      e.preventDefault()
                      setContextMenu({ x: e.clientX, y: e.clientY, entryId: cell.entry.id })
                    }
                  : undefined
              }
            >
              {cell && (
                <>
                  {cell.entry.shiny && (
                    <span className="dex-box-cell-shiny-badge" aria-hidden="true">
                      ✨
                    </span>
                  )}
                  {cell.entry.caughtBall && (
                    <span className="dex-box-cell-ball-badge">
                      <BallIcon ball={cell.entry.caughtBall} />
                    </span>
                  )}
                  <SpriteThumbnail
                    pokeapiId={cell.pokeapiId}
                    spriteFormSuffix={cell.spriteFormSuffix}
                    female={cell.femaleSprite}
                    shiny={cell.entry.shiny}
                    size={CELL_SPRITE_SIZE}
                    displayName={cell.displayName}
                    ariaLabel={`${cell.displayName}${cell.entry.owned ? '' : ' — not yet owned'}`}
                    className={
                      [
                        'dex-hybrid-tile',
                        !cell.entry.owned && 'dex-hybrid-tile-unowned',
                        `${cell.boxNumber}-${cell.slot}` === selectedCellKey && 'dex-hybrid-tile-selected'
                      ]
                        .filter(Boolean)
                        .join(' ')
                    }
                    onClick={() => setSelectedCellKey(`${cell.boxNumber}-${cell.slot}`)}
                  />
                </>
              )}
            </div>
          ))}
        </div>
        <DexBoxDetailPanel
          cell={selectedCell}
          storageLocations={storageLocations}
          speciesAvailability={speciesAvailability}
          onEditOrigin={() => setEditingOrigin(true)}
          onSaveOrigin={onSaveOrigin}
        />
      </div>
      {editingOrigin && selectedCell?.entry.owned && (
        <OriginModal
          entry={selectedCell.entry}
          displayName={selectedCell.displayName}
          onClose={() => setEditingOrigin(false)}
          onSave={onSaveOrigin}
        />
      )}
      {contextMenu && (
        <DexBoxContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onRemove={() => {
            onSetEntryBoxPosition(contextMenu.entryId, null, null)
            setContextMenu(null)
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  )
}
