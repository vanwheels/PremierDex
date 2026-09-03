import { originGameOrder } from '@shared/data/origin-games'

/** Sort modes shared by TrainerProfilesPanel and StorageLocationsPanel (Leg 12) — game by
 * release-date order, game alphabetically, or the panel's own name field (OT name for
 * Trainer Profiles, location name for Storage Locations) alphabetically. */
export type GameSortMode = 'game-release' | 'game-alpha' | 'name-alpha'

/** Compares two (possibly absent) game names per `mode`. A null game — a Storage Location
 * with no linked Trainer Profile — always sorts after every real game, regardless of
 * mode; 'name-alpha' never reaches here since callers switch to their own name field for
 * that mode. */
export function compareGames(a: string | null, b: string | null, mode: GameSortMode): number {
  if (a === b) return 0
  if (a === null) return 1
  if (b === null) return -1
  return mode === 'game-release' ? originGameOrder(a) - originGameOrder(b) || a.localeCompare(b) : a.localeCompare(b)
}
