import type { StorageLocation } from '@shared/types/storage-location'
import type { TrainerProfile } from '@shared/types/trainer-profile'
import { compareGames, type GameSortMode } from '../shared/gameSort'

/** Sorts a copy of `locations` per `mode` (Leg 12). A location's "game" is its linked
 * Trainer Profile's game (null for every location without one — home/bank/box/ranch
 * normally have none, only save_file does — see storage-location.ts). Game modes fall
 * back to the location's own name to break ties. */
export function sortStorageLocations(
  locations: StorageLocation[],
  trainerProfiles: TrainerProfile[],
  mode: GameSortMode
): StorageLocation[] {
  const gameOf = (location: StorageLocation): string | null =>
    trainerProfiles.find((profile) => profile.id === location.trainerProfileId)?.game ?? null

  const sorted = [...locations]
  sorted.sort((a, b) => {
    if (mode === 'name-alpha') return a.name.localeCompare(b.name)
    return compareGames(gameOf(a), gameOf(b), mode) || a.name.localeCompare(b.name)
  })
  return sorted
}
