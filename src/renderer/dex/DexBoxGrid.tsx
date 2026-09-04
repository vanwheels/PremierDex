import { useEffect, useMemo, useState } from 'react'
import type { CollectionEntry, CollectionEntryOriginInput, Form, Species } from '@shared/types/pokemon'
import type { StorageLocation } from '@shared/types/storage-location'
import type { StorageBox } from '@shared/types/box'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import { BOX_COLS, buildBoxes, buildUnboxedEntries } from './buildBoxes'
import { SpriteThumbnail } from './SpriteThumbnail'
import { BallIcon } from './BallIcon'
import { DexBoxDetailPanel } from './DexBoxDetailPanel'
import { DexBoxTray } from './DexBoxTray'
import { DexBoxContextMenu } from './DexBoxContextMenu'
import { DexBoxPager } from './DexBoxPager'
import { OriginModal } from './OriginModal'
import { readDragEntryPayload, setDragEntryPayload } from './dragEntryPayload'
import type { BoxCell } from './types'

// Vanny feedback 2026-09-03: cells were flex-stretched to fill the remaining column width,
// making a 30-slot box enormous even with a small sprite. Sprite size doubled and the grid
// switched to a fixed cell size (box-grid.css) so it renders compact — mirroring HOME's
// box view — instead of growing to fill available space.
const CELL_SPRITE_SIZE = 96

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
  /** Leg 7: drag-and-drop add/move/remove — see handleDropOnSlot/handleDropOnTray below. */
  onSetEntryBoxPosition: (entryId: number, boxNumber: number | null, boxSlot: number | null) => void
  /** Leg 7: drag-a-cell-onto-another-cell — see handleDropOnSlot below. */
  onSwapEntryBoxPositions: (entryIdA: number, entryIdB: number) => void
  /** Leg 2 of the Box View Polish milestone: "+ Add Box" in the pager. Resolves with the
   * created box so handleAddBox can jump straight to it. */
  onAddBox: (storageLocationId: number) => Promise<StorageBox>
  /** Leg 2: the pager label's inline "Rename" control. */
  onRenameBox: (boxId: number, name: string | null) => void
}

/**
 * Leg 6 (Box Arrangement milestone) HOME-style box grid — real per-individual box
 * contents (`entry.boxNumber`/`boxSlot`, Leg 3 of this milestone), paginated one box at a
 * time rather than Hybrid's continuous flow, matching HOME's own Box view screen (as
 * opposed to its List View, which Hybrid mirrors instead). Reuses SpriteThumbnail/
 * DexHybridGrid's tile-rendering and selection pattern per the Phase 1 post-mortem's
 * dependency note, adapted for a fixed 30-cell grid instead of a flowing tile list.
 *
 * Only entries within `entries` (already scoped to the selected Storage Location tab by
 * LivingDexView) can appear — a box is always a sub-unit of one real location, never
 * cross-location. Selection is tracked by cell key (`${boxNumber}-${slot}`) rather than
 * the cell object, same reasoning as DexHybridGrid's selectedTileKey.
 *
 * Leg 7 editing: drag-and-drop is the whole interaction model (decided ahead of this leg)
 * — a filled cell dragged onto another cell swaps them if it's filled, or moves if it's
 * empty; a DexBoxTray item (an unboxed entry in this location) dragged onto an empty cell
 * adds it; a filled cell dragged onto the tray removes it. Every drag source/target shares
 * one payload convention (dragEntryPayload.ts: just the CollectionEntry id) so
 * handleDropOnSlot can tell "move within this box" from "add from the tray" by checking
 * whether the dragged id is currently one of this box's own cells — no separate code path
 * per source. The right-click menu (DexBoxContextMenu) exists only as a non-drag
 * alternative for removal (Vanny's call, 2026-09-03) — add/move/swap stay drag-only.
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
  const [boxIndex, setBoxIndex] = useState(0)
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null)
  const [editingOrigin, setEditingOrigin] = useState(false)
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entryId: number } | null>(null)

  // Switching Storage Location tabs swaps which location's boxes `entries`/`boxes`
  // describe without remounting this component (LivingDexView keeps it mounted-and-hidden,
  // same as List/Hybrid) — a stale box index or selection from the old location would
  // otherwise silently carry over and land on an unrelated box. DexBoxPager resets its own
  // in-progress rename independently, keyed off the displayed box's id.
  useEffect(() => {
    setBoxIndex(0)
    setSelectedCellKey(null)
  }, [selectedLocationTab])

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
  // fetch actually resolving rather than let boxes[-1] crash the render.
  if (boxes.length === 0) {
    return <div className="dex-box-empty-state">Loading this location's boxes…</div>
  }

  const clampedIndex = Math.min(boxIndex, boxes.length - 1)
  const box = boxes[clampedIndex]
  const cells = box.cells
  const selectedCell = cells.find((c): c is BoxCell => c !== null && `${c.boxNumber}-${c.slot}` === selectedCellKey) ?? null
  const isCurrentlyBoxed = (entryId: number): boolean => cells.some((c) => c?.entry.id === entryId)

  const goToBox = (index: number): void => {
    setBoxIndex(index)
    setSelectedCellKey(null)
  }

  // Handles both "move within this box" (target empty) and "add from the tray" (target
  // empty, dragged entry currently unboxed) with the same call — an unboxed entry already
  // has boxNumber/boxSlot null, so placing it is identical either way. A tray item dropped
  // on an occupied cell is rejected: only empty cells accept adds this leg (no "bump the
  // occupant back to the tray" swap-with-tray mechanic — that's a reasonable follow-up,
  // not something actually asked for).
  const handleDropOnSlot = (targetSlot: number, draggedEntryId: number): void => {
    setDragOverSlot(null)
    const targetCell = cells[targetSlot]
    if (targetCell?.entry.id === draggedEntryId) return
    if (targetCell) {
      if (!isCurrentlyBoxed(draggedEntryId)) return
      onSwapEntryBoxPositions(draggedEntryId, targetCell.entry.id)
    } else {
      onSetEntryBoxPosition(draggedEntryId, box.boxNumber, targetSlot)
    }
  }

  const handleDropOnTray = (draggedEntryId: number): void => {
    if (!isCurrentlyBoxed(draggedEntryId)) return
    onSetEntryBoxPosition(draggedEntryId, null, null)
  }

  // Vanny feedback 2026-09-03: left-clicking an unboxed entry places it in the current
  // box directly, instead of requiring a drag every time — a no-op (rather than spilling
  // into the next box) once the current box is full, since the ask was specifically "the
  // current box".
  const handleClickUnboxedEntry = (draggedEntryId: number): void => {
    const firstEmptySlot = cells.findIndex((c) => c === null)
    if (firstEmptySlot === -1) return
    onSetEntryBoxPosition(draggedEntryId, box.boxNumber, firstEmptySlot)
  }

  // New boxes always land at the end (box_number only ever increases — see
  // sqlite-storage.ts's addBox, and there's no delete-box in this leg to open a gap), so
  // the pre-add `boxes.length` is exactly the new box's index once it lands in `boxes`
  // on the next render.
  const handleAddBox = (): void => {
    const newBoxIndex = boxes.length
    onAddBox(selectedLocationTab).then(() => goToBox(newBoxIndex))
  }

  return (
    <div className="dex-box-view">
      <div className="dex-box-columns">
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
                  [
                    'dex-box-cell',
                    !cell && 'dex-box-cell-empty',
                    dragOverSlot === slot && 'dex-box-cell-drag-over'
                  ]
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
        <DexBoxTray entries={unboxedEntries} onDropEntry={handleDropOnTray} onClickEntry={handleClickUnboxedEntry} />
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
    </div>
  )
}
