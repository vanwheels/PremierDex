import { describe, expect, it } from 'vitest'
import type { CollectionEntry } from '@shared/types/pokemon'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import { checkEntryValidity } from './invalidCombo'

function makeEntry(overrides: Partial<CollectionEntry> = {}): CollectionEntry {
  return {
    id: 1,
    formId: 1,
    gender: 'unknown',
    shiny: false,
    owned: true,
    trainerProfileId: null,
    originGame: null,
    otName: null,
    tid: null,
    sid: null,
    language: null,
    nickname: null,
    caughtBall: null,
    metLocation: null,
    storageLocationId: null,
    boxNumber: null,
    boxSlot: null,
    genderConfirmed: false,
    ...overrides
  }
}

// Bulbasaur (1) in the Kanto dex; Colosseum deliberately mapped to no pokedexes at all,
// mirroring the real fetch script's output for that game.
const AVAILABILITY: SpeciesAvailabilityData = {
  pokedexes: { 'original-kanto': [1, 2, 3] },
  gameToPokedexes: { red: ['original-kanto'], colosseum: [], 'legends-arceus': ['original-kanto'] }
}

describe('checkEntryValidity', () => {
  it('is valid when the entry has no origin game', () => {
    const result = checkEntryValidity(makeEntry({ originGame: null }), 1, AVAILABILITY)
    expect(result.invalid).toBe(false)
  })

  it('is valid for an origin game name not found in ORIGIN_GAMES', () => {
    const result = checkEntryValidity(makeEntry({ originGame: 'Not A Real Game' }), 1, AVAILABILITY)
    expect(result.invalid).toBe(false)
  })

  it('flags a species absent from its origin game\'s pokedex union', () => {
    // 999 isn't in the Kanto dex fixture above.
    const result = checkEntryValidity(makeEntry({ originGame: 'Pokémon Red' }), 999, AVAILABILITY)
    expect(result.invalid).toBe(true)
    expect(result.reasons).toEqual(['Not obtainable in Pokémon Red'])
  })

  it('is valid for a species present in its origin game\'s pokedex union', () => {
    const result = checkEntryValidity(makeEntry({ originGame: 'Pokémon Red' }), 1, AVAILABILITY)
    expect(result.invalid).toBe(false)
  })

  it('skips the species check for a game mapped to no pokedexes (e.g. Colosseum)', () => {
    const result = checkEntryValidity(makeEntry({ originGame: 'Pokémon Colosseum' }), 999, AVAILABILITY)
    expect(result.invalid).toBe(false)
  })

  it('skips the species check for a game absent from gameToPokedexes entirely', () => {
    const result = checkEntryValidity(makeEntry({ originGame: 'Pokémon GO' }), 999, AVAILABILITY)
    expect(result.invalid).toBe(false)
  })

  it('flags a caught ball outside Legends Arceus\'s defined pool', () => {
    const result = checkEntryValidity(
      makeEntry({ originGame: 'Pokémon Legends: Arceus', caughtBall: 'Dream Ball' }),
      1,
      AVAILABILITY
    )
    expect(result.invalid).toBe(true)
    expect(result.reasons).toEqual(["Dream Ball isn't obtainable in Pokémon Legends: Arceus"])
  })

  it('is valid for a caught ball inside Legends Arceus\'s defined pool', () => {
    const result = checkEntryValidity(
      makeEntry({ originGame: 'Pokémon Legends: Arceus', caughtBall: 'Origin Ball' }),
      1,
      AVAILABILITY
    )
    expect(result.invalid).toBe(false)
  })

  it('never flags a ball for a game with no defined pool (falls back to the full list)', () => {
    const result = checkEntryValidity(makeEntry({ originGame: 'Pokémon Red', caughtBall: 'Beast Ball' }), 1, AVAILABILITY)
    expect(result.invalid).toBe(false)
  })

  it('reports both a species and a ball reason together', () => {
    const result = checkEntryValidity(
      makeEntry({ originGame: 'Pokémon Legends: Arceus', caughtBall: 'Dream Ball' }),
      999,
      AVAILABILITY
    )
    expect(result.invalid).toBe(true)
    expect(result.reasons).toHaveLength(2)
  })
})
