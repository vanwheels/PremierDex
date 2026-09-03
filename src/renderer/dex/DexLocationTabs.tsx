import type { StorageLocation } from '@shared/types/storage-location'

interface DexLocationTabsProps {
  storageLocations: StorageLocation[]
  selected: number | null
  onSelect: (locationId: number | null) => void
}

/**
 * Per-Storage-Location tab bar for the Living Dex view (Leg 8). Selecting a tab scopes
 * both the Completion Stats panel and the table below it to one location's entries, via
 * Leg 7's `filterEntriesByStorageLocation` (App.tsx wires the filtered entries into both —
 * this component only tracks which tab is selected).
 *
 * Sorted alphabetically by name — sortStorageLocations' game-aware ordering doesn't apply
 * here, since a tab isn't tied to a single game the way a save-file location's Trainer
 * Profile is. The fixed Unassigned tab (`null`) always renders last, after every real
 * location, so creating a new location can't shift it around. It's also where an entry
 * lives from the moment it's first checked owned until it's actually assigned a location
 * (Leg 3's interim per-row picker still does that assignment; Leg 9 moves it into this
 * table) — so a species nobody's caught yet only ever shows as checkable from here, not
 * from a real location's tab. That's expected under this filter, not a bug: an entry has
 * no location to belong to until someone gives it one.
 */
export function DexLocationTabs({ storageLocations, selected, onSelect }: DexLocationTabsProps): JSX.Element {
  const sorted = [...storageLocations].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <nav className="dex-location-tabs">
      {sorted.map((location) => (
        <button
          key={location.id}
          type="button"
          className={selected === location.id ? 'dex-location-tab active' : 'dex-location-tab'}
          onClick={() => onSelect(location.id)}
        >
          {location.name}
        </button>
      ))}
      <button
        type="button"
        className={selected === null ? 'dex-location-tab active' : 'dex-location-tab'}
        onClick={() => onSelect(null)}
      >
        Unassigned
      </button>
    </nav>
  )
}
