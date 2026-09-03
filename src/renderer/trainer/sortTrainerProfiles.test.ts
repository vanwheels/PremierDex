import { describe, expect, it } from 'vitest'
import type { TrainerProfile } from '@shared/types/trainer-profile'
import { sortTrainerProfiles } from './sortTrainerProfiles'

function profile(overrides: Partial<TrainerProfile>): TrainerProfile {
  return { id: 1, game: 'Pokémon Red', otName: 'Red', tid: null, sid: null, label: null, language: null, ...overrides }
}

describe('sortTrainerProfiles', () => {
  // Deliberately chosen so release order, alpha-by-game, and alpha-by-name each land on a
  // different arrangement: Yellow releases before Gold but sorts after it alphabetically.
  const profiles: TrainerProfile[] = [
    profile({ id: 1, game: 'Pokémon Yellow', otName: 'Mallory' }),
    profile({ id: 2, game: 'Pokémon Gold', otName: 'Zed' }),
    profile({ id: 3, game: 'Pokémon Red', otName: 'Ash' })
  ]

  it('does not mutate the input array', () => {
    const original = [...profiles]
    sortTrainerProfiles(profiles, 'game-release')
    expect(profiles).toEqual(original)
  })

  it('game-release: orders by release date', () => {
    const sorted = sortTrainerProfiles(profiles, 'game-release')
    expect(sorted.map((p) => p.id)).toEqual([3, 1, 2]) // Red, Yellow, Gold
  })

  it('game-alpha: orders by game name alphabetically', () => {
    const sorted = sortTrainerProfiles(profiles, 'game-alpha')
    expect(sorted.map((p) => p.id)).toEqual([2, 3, 1]) // Gold, Red, Yellow
  })

  it('name-alpha: orders by OT name alphabetically, ignoring game', () => {
    const sorted = sortTrainerProfiles(profiles, 'name-alpha')
    expect(sorted.map((p) => p.id)).toEqual([3, 1, 2]) // Ash, Mallory, Zed
  })

  it('game-release breaks ties on the same game by OT name', () => {
    const tied: TrainerProfile[] = [
      profile({ id: 10, game: 'Pokémon Red', otName: 'Zed' }),
      profile({ id: 11, game: 'Pokémon Red', otName: 'Ash' })
    ]
    const sorted = sortTrainerProfiles(tied, 'game-release')
    expect(sorted.map((p) => p.id)).toEqual([11, 10])
  })
})
