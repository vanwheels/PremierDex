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
  /** Only meaningful for a real entry cell — a placeholder is never selectable (see
   * DexBoxPane's handleCellClick doc comment). */
  isSelected: boolean
  /** Returns the dragged entry id(s) to carry — DexBoxPane's handleDragStart, already
   * bound to this slot; only ever invoked for a real entry cell (see `draggable` below). */
  onDragStart: () => number[]
  onDragEnter: () => void
  onDragLeave: () => void
  onDrop: (draggedEntryIds: number[]) => void
  onContextMenu: (x: number, y: number, target: CellTarget) => void
  /** Only wired to a real entry cell's sprite — a placeholder's own SpriteThumbnail has no
   * click handler at all (right-click is its only interaction this leg). */
  onClickEntry: (e: MouseEvent) => void
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
  onClickEntry
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
          className="dex-hybrid-tile dex-box-cell-placeholder-tile"
          // Not selectable/draggable (see `draggable`/isSelected above) — right-click is
          // the only interaction a placeholder cell supports this leg.
          onClick={() => {}}
        />
      )}
    </div>
  )
}
