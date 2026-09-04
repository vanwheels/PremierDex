import { useEffect, useRef } from 'react'

interface DexBoxContextMenuProps {
  x: number
  y: number
  onRemove: () => void
  onClose: () => void
}

/**
 * Right-click action menu for a filled Box view cell (Leg 7 of the Box Arrangement
 * milestone) — currently just "Remove from box" (Vanny's call, 2026-09-03): drag-and-drop
 * already covers add/move/swap, so this exists purely as a non-drag alternative for
 * removal. Closes on outside pointerdown or Escape, the standard lightweight-popover
 * pattern (same idea as OriginGameInput's own outside-click handling).
 */
export function DexBoxContextMenu({ x, y, onRemove, onClose }: DexBoxContextMenuProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div ref={ref} className="dex-box-context-menu" style={{ left: x, top: y }} role="menu">
      <button type="button" role="menuitem" onClick={onRemove}>
        Remove from box
      </button>
    </div>
  )
}
