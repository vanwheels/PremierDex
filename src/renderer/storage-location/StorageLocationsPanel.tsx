import { useEffect, useMemo, useState } from 'react'
import type { StorageLocation, StorageLocationInput } from '@shared/types/storage-location'
import type { TrainerProfile } from '@shared/types/trainer-profile'
import type { GameSortMode } from '../shared/gameSort'
import { SortSelect } from '../shared/SortSelect'
import { StorageLocationForm } from './StorageLocationForm'
import { StorageLocationRow } from './StorageLocationRow'
import { sortStorageLocations } from './sortStorageLocations'

const EMPTY_INPUT: StorageLocationInput = { locationType: 'home', name: '', trainerProfileId: null }

interface StorageLocationsPanelProps {
  /** DexTable's interim assignment picker (Leg 3) reads its options from App.tsx's own
   * copy of the list — this tells App to refetch after a create/update/delete here, same
   * pattern as TrainerProfilesPanel's onEntriesChanged. */
  onLocationsChanged: () => void
}

/** CRUD UI for Storage Locations (Leg 2) — where a Pokémon currently sits (HOME/Bank/
 * Box/Ranch/save-file), kept independent of TrainerProfile (Leg 1) origin so
 * trades/transfers can move location without touching origin. See TODO.md's [Storage
 * Location model]. Mirrors trainer/TrainerProfilesPanel.tsx's shape. */
export function StorageLocationsPanel({ onLocationsChanged }: StorageLocationsPanelProps): JSX.Element {
  const [locations, setLocations] = useState<StorageLocation[]>([])
  const [trainerProfiles, setTrainerProfiles] = useState<TrainerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [sortMode, setSortMode] = useState<GameSortMode>('game-release')

  const sortedLocations = useMemo(
    () => sortStorageLocations(locations, trainerProfiles, sortMode),
    [locations, trainerProfiles, sortMode]
  )

  // Trainer profiles are reloaded alongside locations so the save_file picker (and each
  // row's linked-trainer display) stays current after edits made elsewhere on the page.
  const load = (): Promise<void> =>
    Promise.all([window.premierDex.listStorageLocations(), window.premierDex.listTrainerProfiles()]).then(
      ([locationList, profileList]) => {
        setLocations(locationList)
        setTrainerProfiles(profileList)
      }
    )

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  const handleCreate = async (input: StorageLocationInput): Promise<void> => {
    await window.premierDex.createStorageLocation(input)
    setAdding(false)
    await load()
    onLocationsChanged()
  }

  const handleUpdate = async (id: number, input: StorageLocationInput): Promise<void> => {
    await window.premierDex.updateStorageLocation(id, input)
    await load()
    onLocationsChanged()
  }

  const handleDelete = async (id: number): Promise<void> => {
    if (!window.confirm('Delete this storage location?')) return
    await window.premierDex.deleteStorageLocation(id)
    await load()
    onLocationsChanged()
  }

  // "Duplicate" (replaces the per-entry List-view duplicate from commit 74c73c9, unworkable
  // at 1025+ entries — see StorageAdapter.duplicateStorageLocation's own doc comment).
  // onLocationsChanged is App's full data.loadAll, not just this panel's own load() — the
  // clone brings along a whole new set of collection_entries rows, which live in App's
  // data, not this panel's.
  const handleDuplicate = async (id: number): Promise<void> => {
    await window.premierDex.duplicateStorageLocation(id)
    await load()
    onLocationsChanged()
  }

  if (loading) {
    return <p>Loading storage locations…</p>
  }

  return (
    <section className="storage-locations">
      <h2>Storage Locations</h2>
      <div className="panel-toolbar">
        <SortSelect value={sortMode} onChange={setSortMode} nameLabel="Name" />
      </div>
      <table className="storage-locations-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Name</th>
            <th>Trainer</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {sortedLocations.map((location) => (
            <StorageLocationRow
              key={location.id}
              location={location}
              trainerProfiles={trainerProfiles}
              onSave={(input) => handleUpdate(location.id, input)}
              onDuplicate={() => handleDuplicate(location.id)}
              onDelete={() => handleDelete(location.id)}
            />
          ))}
          {adding && (
            <tr>
              <StorageLocationForm
                initial={EMPTY_INPUT}
                trainerProfiles={trainerProfiles}
                onSubmit={handleCreate}
                onCancel={() => setAdding(false)}
              />
            </tr>
          )}
        </tbody>
      </table>
      {!adding && (
        <button type="button" onClick={() => setAdding(true)}>
          Add location
        </button>
      )}
    </section>
  )
}
