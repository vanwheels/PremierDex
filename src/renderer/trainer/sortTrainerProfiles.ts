import type { TrainerProfile } from '@shared/types/trainer-profile'
import { compareGames, type GameSortMode } from '../shared/gameSort'

/** Sorts a copy of `profiles` per `mode` (Leg 12). Game modes fall back to OT name to
 * break ties between profiles on the same game. */
export function sortTrainerProfiles(profiles: TrainerProfile[], mode: GameSortMode): TrainerProfile[] {
  const sorted = [...profiles]
  sorted.sort((a, b) => {
    if (mode === 'name-alpha') return a.otName.localeCompare(b.otName)
    return compareGames(a.game, b.game, mode) || a.otName.localeCompare(b.otName)
  })
  return sorted
}
