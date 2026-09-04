import { useEffect, useRef } from 'react'

export interface DexBoxContextMenuAction {
  label: string
  onClick: () => void
}

interface DexBoxContextMenuProps {
  x: number
  y: number
  actions: DexBoxContextMenuAction[]
  onClose: () => void
}

/**
 * Right-click action menu for a Box view cell (Leg 7 of the Box Arrangement milestone;
 * generalized from a single hardcoded "Remove from box" action to an arbitrary action list
 * at Leg 5 of the Box View Polish milestone, so the same popup serves a filled cell
 * ("Remove from box"), an empty one ("Set placeholder…"), and a "planned" placeholder cell
 * ("Change species" / "Clear placeholder") — DexBoxPane decides which actions apply.
 * Closes on outside pointerdown or Escape, the standard lightweight-popover pattern (same
 * idea as OriginGameInput's own outside-click handling).
 */
export function DexBoxContextMenu({ x, y, actions, onClose }: DexBoxContextMenuProps): JSX.Element {
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
      {actions.map((action) => (
        <button key={action.label} type="button" role="menuitem" onClick={action.onClick}>
          {action.label}
        </button>
      ))}
    </div>
  )
}
