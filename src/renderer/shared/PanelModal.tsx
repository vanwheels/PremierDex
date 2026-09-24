import { useEffect, type ReactNode } from 'react'

interface PanelModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

/** Popup shell for the Trainer Profiles / Storage Locations management panels (Leg 1 of the
 * Full UI/UX pass) — same backdrop/dialog chrome as OriginModal (origin-modal-*), widened
 * via .panel-modal since both panels are multi-column tables. Escape and backdrop click
 * close it. */
export function PanelModal({ title, onClose, children }: PanelModalProps): JSX.Element {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="origin-modal-backdrop" onClick={onClose}>
      <div className="origin-modal panel-modal" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="origin-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        {children}
      </div>
    </div>
  )
}
