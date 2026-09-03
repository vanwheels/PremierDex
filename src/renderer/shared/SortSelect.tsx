import type { GameSortMode } from './gameSort'

interface SortSelectProps {
  value: GameSortMode
  onChange: (mode: GameSortMode) => void
  /** Label for the 'name-alpha' option — "OT Name" on TrainerProfilesPanel, "Name" on
   * StorageLocationsPanel. */
  nameLabel: string
}

/** Shared sort dropdown for TrainerProfilesPanel/StorageLocationsPanel (Leg 12).
 * Presentation-only, never persisted — mirrors dex/DexToolbar.tsx's convention. */
export function SortSelect({ value, onChange, nameLabel }: SortSelectProps): JSX.Element {
  return (
    <label>
      Sort by:{' '}
      <select value={value} onChange={(e) => onChange(e.target.value as GameSortMode)}>
        <option value="game-release">Game (release order)</option>
        <option value="game-alpha">Game (A–Z)</option>
        <option value="name-alpha">{nameLabel} (A–Z)</option>
      </select>
    </label>
  )
}
