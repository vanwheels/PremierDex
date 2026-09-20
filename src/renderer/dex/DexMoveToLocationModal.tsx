import { useEffect, useState } from 'react'
import type { StorageLocation } from '@shared/types/storage-location'

interface DexMoveToLocationModalProps {
  entryCount: number
  storageLocations: StorageLocation[]
  /** The pane's own current location — excluded from the picker, since "move to the
   * location it's already in" isn't a real destination. */
  currentLocationId: number
  onClose: () => void
  onMove: (storageLocationId: number) => void
}

/**
 * "Move to location…" (Leg 1 of the Box View Move & Undo Operations milestone) — the
 * dedicated-picker half of cross-location move, for when the destination location isn't
 * already open in a second pane (drag-onto-second-pane, DexBoxPane's handleDropOnSlot,
 * covers that case instead). Reuses OriginModal's backdrop/dialog chrome (origin-modal-*),
 * same convention DexBoxPlaceholderModal follows, rather than a parallel stylesheet.
 * Destination placement (which box/slot) is computed by DexBoxGrid's
 * handleMoveSelectionToLocation after this resolves — this modal only picks *where*, not
 * the exact slot.
 */
export function DexMoveToLocationModal({
  entryCount,
  storageLocations,
  currentLocationId,
  onClose,
  onMove
}: DexMoveToLocationModalProps): JSX.Element {
  const destinations = storageLocations.filter((location) => location.id !== currentLocationId)
  const [targetLocation, setTargetLocation] = useState<string>(destinations[0] ? String(destinations[0].id) : '')

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="origin-modal-backdrop" onClick={onClose}>
      <div className="origin-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="origin-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2>Move {entryCount === 1 ? 'entry' : `${entryCount} entries`} to…</h2>
        {destinations.length === 0 ? (
          <p>No other Storage Locations exist yet.</p>
        ) : (
          <label className="origin-modal-field">
            Destination
            <select value={targetLocation} onChange={(e) => setTargetLocation(e.target.value)}>
              {destinations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="origin-modal-actions">
          <button
            type="button"
            onClick={() => onMove(Number(targetLocation))}
            disabled={destinations.length === 0}
          >
            Move
          </button>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
