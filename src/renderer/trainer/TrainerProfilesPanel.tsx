import { useEffect, useMemo, useState } from 'react'
import type { TrainerProfile, TrainerProfileInput } from '@shared/types/trainer-profile'
import type { GameSortMode } from '../shared/gameSort'
import { SortSelect } from '../shared/SortSelect'
import { TrainerProfileForm } from './TrainerProfileForm'
import { TrainerProfileRow } from './TrainerProfileRow'
import { sortTrainerProfiles } from './sortTrainerProfiles'

const EMPTY_INPUT: TrainerProfileInput = { game: '', otName: '', tid: null, sid: null, label: null, language: null }

/** CRUD UI for Trainer Profiles (Leg 1) — the origin identity a Collection Entry will
 * eventually reference (Leg 4). Standalone here: nothing else reads or links to these
 * yet. See TODO.md's [Trainer Profile model]. */
export function TrainerProfilesPanel(): JSX.Element {
  const [profiles, setProfiles] = useState<TrainerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [sortMode, setSortMode] = useState<GameSortMode>('game-release')

  const sortedProfiles = useMemo(() => sortTrainerProfiles(profiles, sortMode), [profiles, sortMode])

  const load = (): Promise<void> => window.premierDex.listTrainerProfiles().then(setProfiles)

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  const handleCreate = async (input: TrainerProfileInput): Promise<void> => {
    await window.premierDex.createTrainerProfile(input)
    setAdding(false)
    await load()
  }

  const handleUpdate = async (id: number, input: TrainerProfileInput): Promise<void> => {
    await window.premierDex.updateTrainerProfile(id, input)
    await load()
  }

  const handleDelete = async (id: number): Promise<void> => {
    if (!window.confirm('Delete this trainer profile?')) return
    await window.premierDex.deleteTrainerProfile(id)
    await load()
  }

  if (loading) {
    return <p>Loading trainer profiles…</p>
  }

  return (
    <section className="trainer-profiles">
      <h2>Trainer Profiles</h2>
      <div className="panel-toolbar">
        <SortSelect value={sortMode} onChange={setSortMode} nameLabel="OT Name" />
      </div>
      <table className="trainer-profiles-table">
        <thead>
          <tr>
            <th>Game</th>
            <th>OT Name</th>
            <th>TID</th>
            <th>SID</th>
            <th>Label</th>
            <th>Language</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {sortedProfiles.map((profile) => (
            <TrainerProfileRow
              key={profile.id}
              profile={profile}
              onSave={(input) => handleUpdate(profile.id, input)}
              onDelete={() => handleDelete(profile.id)}
            />
          ))}
          {adding && (
            <tr>
              <TrainerProfileForm initial={EMPTY_INPUT} onSubmit={handleCreate} onCancel={() => setAdding(false)} />
            </tr>
          )}
        </tbody>
      </table>
      {!adding && (
        <button type="button" onClick={() => setAdding(true)}>
          Add profile
        </button>
      )}
    </section>
  )
}
