import { useEffect, useState } from 'react'
import type { Box } from './types'

interface DexBoxPagerProps {
  box: Box
  index: number
  count: number
  /** Full box list for this location, in display order — backs the "Jump to box" picker
   * (Leg 3 of the Box View Quick-Wins Sweep) so it can list every box by number/name
   * without DexBoxPager needing its own fetch. Same shared array DexBoxPane already
   * threads through everywhere else. */
  boxes: Box[]
  onGoTo: (index: number) => void
  onAddBox: () => void
  onRenameBox: (boxId: number, name: string | null) => void
}

/**
 * DexBoxGrid's Prev/label/Next row, split out (Leg 2 of the Box View Polish & Multi-Box
 * Editing milestone) once it grew a rename control and an "+ Add Box" button past what fit
 * comfortably inline — same "small focused subcomponent" pattern as DexBoxContextMenu/
 * DexBoxTray. Owns only the rename-in-place UI state; "+ Add Box" and navigation are pure
 * callbacks up to DexBoxGrid, which is what actually knows the box list and can jump to a
 * freshly created one.
 *
 * The "Jump to box" <select> (Leg 3 of the Box View Quick-Wins Sweep) sits next to Prev
 * rather than replacing it — Prev/Next stay the fast path for browsing adjacent boxes,
 * the dropdown is for jumping straight to a specific one without paging through everything
 * in between (Vanny 2026-09-04).
 */
export function DexBoxPager({ box, index, count, boxes, onGoTo, onAddBox, onRenameBox }: DexBoxPagerProps): JSX.Element {
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')

  // Displaying a different box — via Prev/Next or a Storage Location tab switch one level
  // up — always drops out of an in-progress rename rather than carrying a stale edit onto
  // an unrelated box.
  useEffect(() => {
    setRenaming(false)
  }, [box.id])

  const startRenaming = (): void => {
    setRenameValue(box.name ?? '')
    setRenaming(true)
  }

  const submitRename = (): void => {
    const trimmed = renameValue.trim()
    onRenameBox(box.id, trimmed === '' ? null : trimmed)
    setRenaming(false)
  }

  return (
    <div className="dex-box-pager">
      <button type="button" onClick={() => onGoTo(index - 1)} disabled={index === 0}>
        ← Prev
      </button>
      <select
        className="dex-box-jump-select"
        aria-label="Jump to box"
        value={index}
        onChange={(e) => onGoTo(Number(e.target.value))}
      >
        {boxes.map((b, i) => (
          <option key={b.id} value={i}>
            Box {b.boxNumber}
            {b.name ? `: ${b.name}` : ''}
          </option>
        ))}
      </select>
      {renaming ? (
        <form
          className="dex-box-rename-form"
          onSubmit={(e) => {
            e.preventDefault()
            submitRename()
          }}
        >
          <input
            autoFocus
            value={renameValue}
            placeholder={`Box ${box.boxNumber}`}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setRenaming(false)
            }}
          />
        </form>
      ) : (
        <span className="dex-box-pager-label">
          Box {box.boxNumber}
          {box.name ? `: ${box.name}` : ''} ({index + 1} of {count})
          <button type="button" className="dex-box-rename-button" onClick={startRenaming}>
            Rename
          </button>
        </span>
      )}
      <button type="button" onClick={() => onGoTo(index + 1)} disabled={index === count - 1}>
        Next →
      </button>
      <button type="button" onClick={onAddBox}>
        + Add Box
      </button>
    </div>
  )
}
