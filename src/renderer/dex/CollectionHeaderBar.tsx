import { useState } from 'react'
import type { StorageLocation } from '@shared/types/storage-location'
import { PanelModal } from '../shared/PanelModal'
import { StorageLocationsPanel } from '../storage-location/StorageLocationsPanel'
import { TrainerProfilesPanel } from '../trainer/TrainerProfilesPanel'

interface CollectionHeaderBarProps {
  storageLocations: StorageLocation[]
  /** null = the fixed Unassigned bucket, same axis as LivingDexView's selectedLocationTab. */
  selected: number | null
  onSelect: (locationId: number | null) => void
  /** Forwarded to the popups' panels — see StorageLocationsPanel/TrainerProfilesPanel. */
  onLocationsChanged: () => void
  onEntriesChanged: () => void
}

const UNASSIGNED_VALUE = 'unassigned'

/**
 * Top row of the Collection tab (Leg 1 of the Full UI/UX pass, docs/design/ui-ux-pass/):
 * the current-Storage-Location picker, the pencil that opens the Storage Locations
 * management popup, and the Trainer Profiles popup button. Replaces the old per-location
 * pill tab bar and the standalone Storage Locations/Trainer Profiles top-level tabs.
 * Sorted alphabetically by name with the fixed Unassigned bucket last — Unassigned is also
 * where an entry lives until it's given a real location (checking it owned while a real
 * location is selected assigns it there in the same action, see LivingDexView's
 * handleToggleEntry), so a species nobody's caught yet only ever shows as checkable from
 * there.
 */
export function CollectionHeaderBar({
  storageLocations,
  selected,
  onSelect,
  onLocationsChanged,
  onEntriesChanged
}: CollectionHeaderBarProps): JSX.Element {
  const [locationsOpen, setLocationsOpen] = useState(false)
  const [trainersOpen, setTrainersOpen] = useState(false)
  const sorted = [...storageLocations].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="collection-header-bar">
      <div className="collection-location-picker">
        <label>
          Storage Location
          <select
            value={selected === null ? UNASSIGNED_VALUE : String(selected)}
            onChange={(e) => onSelect(e.target.value === UNASSIGNED_VALUE ? null : Number(e.target.value))}
          >
            {sorted.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
            <option value={UNASSIGNED_VALUE}>Unassigned</option>
          </select>
        </label>
        <button type="button" onClick={() => setLocationsOpen(true)} aria-label="Edit storage locations" title="Edit storage locations">
          ✎
        </button>
      </div>
      <button type="button" onClick={() => setTrainersOpen(true)}>
        Trainer Profiles
      </button>
      {locationsOpen && (
        <PanelModal title="Storage Locations" onClose={() => setLocationsOpen(false)}>
          <StorageLocationsPanel onLocationsChanged={onLocationsChanged} />
        </PanelModal>
      )}
      {trainersOpen && (
        <PanelModal title="Trainer Profiles" onClose={() => setTrainersOpen(false)}>
          <TrainerProfilesPanel onEntriesChanged={onEntriesChanged} />
        </PanelModal>
      )}
    </div>
  )
}
