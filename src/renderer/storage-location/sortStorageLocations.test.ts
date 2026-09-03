import { describe, expect, it } from 'vitest'
import type { StorageLocation } from '@shared/types/storage-location'
import type { TrainerProfile } from '@shared/types/trainer-profile'
import { sortStorageLocations } from './sortStorageLocations'

function trainer(overrides: Partial<TrainerProfile>): TrainerProfile {
  return { id: 1, game: 'Pokémon Red', otName: 'Red', tid: null, sid: null, label: null, language: null, ...overrides }
}

function location(overrides: Partial<StorageLocation>): StorageLocation {
  return { id: 1, locationType: 'home', name: '', trainerProfileId: null, ...overrides }
}

describe('sortStorageLocations', () => {
  const trainerProfiles: TrainerProfile[] = [
    trainer({ id: 1, game: 'Pokémon Gold' }),
    trainer({ id: 2, game: 'Pokémon Red' })
  ]

  const locations: StorageLocation[] = [
    location({ id: 1, locationType: 'save_file', name: 'Save B', trainerProfileId: 1 }), // Gold
    location({ id: 2, locationType: 'save_file', name: 'Save A', trainerProfileId: 2 }), // Red
    location({ id: 3, locationType: 'home', name: 'My HOME', trainerProfileId: null }) // no linked game
  ]

  it('does not mutate the input array', () => {
    const original = [...locations]
    sortStorageLocations(locations, trainerProfiles, 'game-release')
    expect(locations).toEqual(original)
  })

  it('game-release: orders by the linked trainer profile\'s release date, unlinked locations last', () => {
    const sorted = sortStorageLocations(locations, trainerProfiles, 'game-release')
    expect(sorted.map((l) => l.id)).toEqual([2, 1, 3]) // Red, Gold, then no-game
  })

  it('game-alpha: orders by the linked trainer profile\'s game name alphabetically, unlinked locations last', () => {
    const sorted = sortStorageLocations(locations, trainerProfiles, 'game-alpha')
    expect(sorted.map((l) => l.id)).toEqual([1, 2, 3]) // Gold, Red, then no-game
  })

  it('name-alpha: orders by the location\'s own name, ignoring game entirely', () => {
    const sorted = sortStorageLocations(locations, trainerProfiles, 'name-alpha')
    expect(sorted.map((l) => l.id)).toEqual([3, 2, 1]) // "My HOME", "Save A", "Save B"
  })
})
