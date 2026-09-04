import type { MouseEvent } from 'react'
import { SpriteThumbnail } from './SpriteThumbnail'
import { BallIcon } from './BallIcon'
import { readDragEntryPayload, setDragEntryPayload } from './dragEntryPayload'
import type { BoxCell, BoxPlaceholderCell, CellTarget } from './types'

// Same fixed sprite size as before Leg 3 pulled the box grid out of DexBoxGrid — see
// DexBoxPane's own doc comment history for why it's fixed rather than flex-stretched.
const CELL_SPRITE_SIZE = 96

interface DexBoxGridCellProps {
  cell: BoxCell | BoxPlaceholderCell | null
  slot: number
  isDragOver: boolean
  /** True when this slot is the current selection — a real entry (part of a possible
   * multi-select) or, since Leg 2 of the Dex completeness tier migration, a single
   * selected placeholder (see DexBoxPane's selectedPlaceholderSlot doc comment). */
  isSelected: boolean
  /** Returns the dragged entry id(s) to carry — DexBoxPane's handleDragStart, already
   * bound to this slot; only ever invoked for a real entry cell (see `draggable` below). */
  onDragStart: () => number[]
  onDragEnter: () => void
  onDragLeave: () => void
  onDrop: (draggedEntryIds: number[]) => void
  onContextMenu: (x: number, y: number, target: CellTarget) => void
  onClickEntry: (e: MouseEvent) => void
  /** Leg 2 of the Dex completeness tier migration: click a placeholder to view its
   * specific form/gender/color requirement in the detail panel — see DexBoxPane's
   * handleClickPlaceholder. */
  onClickPlaceholder: () => void
}

/**
 * One Box view grid cell — a real entry, a "planned" placeholder (Leg 5 of the Box View
 * Polish milestone), or empty. Split out of DexBoxPane (also Leg 5) purely to keep that
 * file under this codebase's file-size convention; owns no state of its own; DexBoxPane
 * still owns every actual selection/drag/context-menu decision and just passes the result
 * back down as props/callbacks.
 */
export function DexBoxGridCell({
  cell,
  slot,
  isDragOver,
  isSelected,
  onDragStart,
  onDragEnter,
  onDragLeave,
  onDrop,
  onContextMenu,
  onClickEntry,
  onClickPlaceholder
}: DexBoxGridCellProps): JSX.Element {
  const isEntry = cell?.kind === 'entry'
  const isPlaceholder = cell?.kind === 'placeholder'

  const target: CellTarget =
    cell?.kind === 'entry'
      ? { kind: 'entry', slot, entryId: cell.entry.id }
      : cell?.kind === 'placeholder'
        ? { kind: 'placeholder', slot, speciesId: cell.speciesId }
        : { kind: 'empty', slot }

  return (
    <div
      className={
        [
          'dex-box-cell',
          !cell && 'dex-box-cell-empty',
          isPlaceholder && 'dex-box-cell-placeholder',
          isDragOver && 'dex-box-cell-drag-over'
        ]
          .filter(Boolean)
          .join(' ')
      }
      draggable={isEntry}
      onDragStart={isEntry ? (e) => setDragEntryPayload(e, onDragStart()) : undefined}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault()
        const draggedEntryIds = readDragEntryPayload(e)
        if (draggedEntryIds !== null) onDrop(draggedEntryIds)
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        onContextMenu(e.clientX, e.clientY, target)
      }}
    >
      {isEntry && (
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
              ['dex-hybrid-tile', !cell.entry.owned && 'dex-hybrid-tile-unowned', isSelected && 'dex-hybrid-tile-selected']
                .filter(Boolean)
                .join(' ')
            }
            onClick={onClickEntry}
          />
        </>
      )}
      {isPlaceholder && (
        <SpriteThumbnail
          pokeapiId={cell.pokeapiId}
          spriteFormSuffix={cell.spriteFormSuffix}
          female={false}
          displayName={cell.displayName}
          ariaLabel={`${cell.displayName} — planned`}
          className={
            ['dex-hybrid-tile', 'dex-box-cell-placeholder-tile', isSelected && 'dex-hybrid-tile-selected']
              .filter(Boolean)
              .join(' ')
          }
          // Not draggable (see `draggable` above) — click-to-select (Leg 2 of the Dex
          // completeness tier migration) and right-click are the only interactions a
          // placeholder cell supports.
          onClick={onClickPlaceholder}
        />
      )}
    </div>
  )
}
