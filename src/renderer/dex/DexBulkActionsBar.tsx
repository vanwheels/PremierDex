import { useState } from 'react'
import type { StorageLocation } from '@shared/types/storage-location'

const UNASSIGNED = ''

interface DexBulkActionsBarProps {
  selectedEntryIds: Set<number>
  storageLocations: StorageLocation[]
  onMove: (entryIds: number[], storageLocationId: number | null) => void
  onDuplicate: (entryIds: number[], storageLocationId: number | null) => void
  onClearSelection: () => void
}

/**
 * [Bulk move/duplicate entries between storage locations]: appears above List view's table
 * once at least one per-entry checkbox (DexRow's Loc. cells) is checked. Move reassigns the
 * selected entries' storage location in place — same semantics as the existing per-row
 * picker, just batched (StorageAdapter.bulkSetEntryStorageLocation). Duplicate instead
 * clones each selected entry into a brand-new row in the target location
 * (StorageAdapter.duplicateEntries) — the first UI path able to create a real duplicate
 * individual, see that method's own doc comment. Both land unassigned-within-location; the
 * user places the result into a specific box afterward via Box view, same as any
 * newly-moved entry. Selection clears once either action fires, so a repeat click can't
 * silently reapply to a stale selection.
 *
 * Deliberately List-view-only for now, not Box view too — see TODO.md's own item for the
 * design tradeoff that decision carries (List view only ever surfaces one representative
 * entry per form/gender/shiny slot, so a slot with hidden duplicate individuals can't
 * select or act on anything but the one shown).
 */
export function DexBulkActionsBar({
  selectedEntryIds,
  storageLocations,
  onMove,
  onDuplicate,
  onClearSelection
}: DexBulkActionsBarProps): JSX.Element | null {
  const [targetLocation, setTargetLocation] = useState<string>(UNASSIGNED)

  if (selectedEntryIds.size === 0) return null

  const entryIds = [...selectedEntryIds]
  const storageLocationId = targetLocation === UNASSIGNED ? null : Number(targetLocation)

  return (
    <div className="dex-bulk-actions-bar">
      <span className="dex-bulk-actions-count">{entryIds.length} selected</span>
      <select
        className="dex-storage-location-select"
        value={targetLocation}
        onChange={(e) => setTargetLocation(e.target.value)}
        title="Target storage location"
      >
        <option value={UNASSIGNED}>Unassigned</option>
        {storageLocations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => {
          onMove(entryIds, storageLocationId)
          onClearSelection()
        }}
      >
        Move
      </button>
      <button
        type="button"
        onClick={() => {
          onDuplicate(entryIds, storageLocationId)
          onClearSelection()
        }}
      >
        Duplicate
      </button>
      <button type="button" className="dex-bulk-clear-button" onClick={onClearSelection}>
        Clear selection
      </button>
    </div>
  )
}
