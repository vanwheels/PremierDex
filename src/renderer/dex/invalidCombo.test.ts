import { describe, expect, it } from 'vitest'
import type { CollectionEntry, Species } from '@shared/types/pokemon'
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
    isAlpha: false,
    captureDate: null,
    sizeClass: null,
    ...overrides
  }
}

// Bulbasaur (1) in the Kanto dex; Colosseum deliberately mapped to no pokedexes at all,
// mirroring the real fetch script's output for that game. `kanto`/`hoenn` fixtures back
// Platinum's Pal Park supplemental check (Leg 2). 167 (Spinarak) and 179 (Mareep) back the
// evolution-chain-reachability fixtures below (Leg 2 of the Evolution-Chain Reachability
// milestone) — added to `original-kanto` purely as a fixture convenience, not a claim
// about their real dex membership.
const AVAILABILITY: SpeciesAvailabilityData = {
  pokedexes: { 'original-kanto': [1, 2, 3, 167, 179], kanto: [1, 2, 3], hoenn: [252], 'extended-sinnoh': [387] },
  entryNumbers: {},
  gameToPokedexes: {
    red: ['original-kanto'],
    colosseum: [],
    'legends-arceus': ['original-kanto'],
    platinum: ['extended-sinnoh']
  }
}

const EMPTY_SPECIES_BY_ID: Map<number, Species> = new Map()

function makeSpecies(id: number, evolvesFromSpeciesId: number | null): Species {
  return { id, name: `Species ${id}`, generation: 1, collapsedDisplayFormId: null, isFinalEvolutionStage: true, evolvesFromSpeciesId }
}

// 168 (Ariados) evolves from 167 (Spinarak, in the dex fixture above); 181 (Ampharos)
// evolves from 180 (Flaaffy), which in turn evolves from 179 (Mareep, also in the dex
// fixture) — a two-hop chain, so the walk has to keep going past a direct parent that's
// itself unavailable.
// 200/201 form a chain with no available species anywhere in it, for the "still flags"
// case below.
const CHAIN_SPECIES_BY_ID: Map<number, Species> = new Map(
  [
    makeSpecies(168, 167),
    makeSpecies(167, null),
    makeSpecies(181, 180),
    makeSpecies(180, 179),
    makeSpecies(179, null),
    makeSpecies(200, 201),
    makeSpecies(201, null)
  ].map((s) => [s.id, s])
)

describe('checkEntryValidity', () => {
  it('is valid when the entry has no origin game', () => {
    const result = checkEntryValidity(makeEntry({ originGame: null }), 1, AVAILABILITY, EMPTY_SPECIES_BY_ID)
    expect(result.invalid).toBe(false)
  })

  it('is valid for an origin game name not found in ORIGIN_GAMES', () => {
    const result = checkEntryValidity(makeEntry({ originGame: 'Not A Real Game' }), 1, AVAILABILITY, EMPTY_SPECIES_BY_ID)
    expect(result.invalid).toBe(false)
  })

  it('flags a species absent from its origin game\'s pokedex union', () => {
    // 999 isn't in the Kanto dex fixture above.
    const result = checkEntryValidity(makeEntry({ originGame: 'Pokémon Red' }), 999, AVAILABILITY, EMPTY_SPECIES_BY_ID)
    expect(result.invalid).toBe(true)
    expect(result.reasons).toEqual(['Not obtainable in Pokémon Red'])
  })

  it('is valid for a species present in its origin game\'s pokedex union', () => {
    const result = checkEntryValidity(makeEntry({ originGame: 'Pokémon Red' }), 1, AVAILABILITY, EMPTY_SPECIES_BY_ID)
    expect(result.invalid).toBe(false)
  })

  it('skips the species check for a game mapped to no pokedexes (e.g. Colosseum)', () => {
    const result = checkEntryValidity(makeEntry({ originGame: 'Pokémon Colosseum' }), 999, AVAILABILITY, EMPTY_SPECIES_BY_ID)
    expect(result.invalid).toBe(false)
  })

  it('skips the species check for a game absent from gameToPokedexes entirely', () => {
    const result = checkEntryValidity(makeEntry({ originGame: 'Pokémon GO' }), 999, AVAILABILITY, EMPTY_SPECIES_BY_ID)
    expect(result.invalid).toBe(false)
  })

  it('is valid for a species outside Platinum\'s own dex but reachable via Pal Park\'s Kanto pool', () => {
    // 1 (Bulbasaur) isn't in extended-sinnoh but is in the `kanto` fixture Pal Park draws from.
    const result = checkEntryValidity(makeEntry({ originGame: 'Pokémon Platinum' }), 1, AVAILABILITY, EMPTY_SPECIES_BY_ID)
    expect(result.invalid).toBe(false)
  })

  it('is valid for a species outside Platinum\'s own dex but reachable via Pal Park\'s Hoenn pool', () => {
    // 252 (Treecko) is only in the `hoenn` fixture.
    const result = checkEntryValidity(makeEntry({ originGame: 'Pokémon Platinum' }), 252, AVAILABILITY, EMPTY_SPECIES_BY_ID)
    expect(result.invalid).toBe(false)
  })

  it('flags a species unreachable through Platinum\'s dex or its Pal Park supplemental pool', () => {
    const result = checkEntryValidity(makeEntry({ originGame: 'Pokémon Platinum' }), 999, AVAILABILITY, EMPTY_SPECIES_BY_ID)
    expect(result.invalid).toBe(true)
    expect(result.reasons).toEqual(['Not obtainable in Pokémon Platinum'])
  })

  it('flags a caught ball outside Legends Arceus\'s defined pool', () => {
    const result = checkEntryValidity(
      makeEntry({ originGame: 'Pokémon Legends: Arceus', caughtBall: 'Dream Ball' }),
      1,
      AVAILABILITY,
      EMPTY_SPECIES_BY_ID
    )
    expect(result.invalid).toBe(true)
    expect(result.reasons).toEqual(["Dream Ball isn't obtainable in Pokémon Legends: Arceus"])
  })

  it('is valid for a caught ball inside Legends Arceus\'s defined pool', () => {
    const result = checkEntryValidity(
      makeEntry({ originGame: 'Pokémon Legends: Arceus', caughtBall: 'Origin Ball' }),
      1,
      AVAILABILITY,
      EMPTY_SPECIES_BY_ID
    )
    expect(result.invalid).toBe(false)
  })

  it('never flags a ball for a game with no defined pool (falls back to the full list)', () => {
    const result = checkEntryValidity(
      makeEntry({ originGame: 'Pokémon Red', caughtBall: 'Beast Ball' }),
      1,
      AVAILABILITY,
      EMPTY_SPECIES_BY_ID
    )
    expect(result.invalid).toBe(false)
  })

  it('reports both a species and a ball reason together', () => {
    const result = checkEntryValidity(
      makeEntry({ originGame: 'Pokémon Legends: Arceus', caughtBall: 'Dream Ball' }),
      999,
      AVAILABILITY,
      EMPTY_SPECIES_BY_ID
    )
    expect(result.invalid).toBe(true)
    expect(result.reasons).toHaveLength(2)
  })
})

describe('checkEntryValidity evolution-chain reachability (Leg 2)', () => {
  it('is valid when the species itself is unavailable but its direct evolution ancestor is', () => {
    // 168 (Ariados) isn't in the Kanto dex fixture; its parent 167 (Spinarak) is.
    const result = checkEntryValidity(makeEntry({ originGame: 'Pokémon Red' }), 168, AVAILABILITY, CHAIN_SPECIES_BY_ID)
    expect(result.invalid).toBe(false)
  })

  it('walks past an unavailable direct parent to reach an available grandparent', () => {
    // 181 (Ampharos) and its direct parent 180 (Flaaffy) are both absent from the dex
    // fixture; only the root 179 (Mareep) is present.
    const result = checkEntryValidity(makeEntry({ originGame: 'Pokémon Red' }), 181, AVAILABILITY, CHAIN_SPECIES_BY_ID)
    expect(result.invalid).toBe(false)
  })

  it('still flags a species whose entire ancestor chain is unavailable', () => {
    // Neither 200 nor its root ancestor 201 appears anywhere in the dex fixture.
    const result = checkEntryValidity(makeEntry({ originGame: 'Pokémon Red' }), 200, AVAILABILITY, CHAIN_SPECIES_BY_ID)
    expect(result.invalid).toBe(true)
    expect(result.reasons).toEqual(['Not obtainable in Pokémon Red'])
  })

  it('stops the walk when a species has no entry in the lookup (treated as a chain root)', () => {
    const result = checkEntryValidity(makeEntry({ originGame: 'Pokémon Red' }), 999, AVAILABILITY, CHAIN_SPECIES_BY_ID)
    expect(result.invalid).toBe(true)
  })
})
