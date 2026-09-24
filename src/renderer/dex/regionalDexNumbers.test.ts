import { describe, expect, it } from 'vitest'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import { regionalDexNumbersForGame, regionalDexNumbersForSpecies } from './regionalDexNumbers'

// Mirrors the real Sun/Moon shape (main Alola dex + one island sub-dex) and X/Y's three
// co-equal Kalos sub-dexes — the two multi-dex shapes docs/investigations/
// regional-dex-numbers.md calls out. Bulbasaur (1) sits at a different entry number in
// each dex, same as PokeAPI's real independent-numbering behavior.
const AVAILABILITY: SpeciesAvailabilityData = {
  pokedexes: {
    'original-alola': [1, 4],
    'original-melemele': [1],
    'kalos-central': [1],
    'kalos-coastal': [4],
    'kalos-mountain': []
  },
  entryNumbers: {
    'original-alola': { 1: 80 },
    'original-melemele': { 1: 12 },
    'kalos-central': { 1: 1 },
    'kalos-coastal': { 4: 5 }
  },
  gameToPokedexes: {
    moon: ['original-alola', 'original-melemele'],
    y: ['kalos-central', 'kalos-coastal', 'kalos-mountain'],
    colosseum: []
  }
}

describe('regionalDexNumbersForGame', () => {
  it('returns nothing for a game absent from gameToPokedexes', () => {
    expect(regionalDexNumbersForGame('red', 1, AVAILABILITY)).toEqual([])
  })

  it('returns nothing for a game mapped to an empty pokedex list', () => {
    expect(regionalDexNumbersForGame('colosseum', 1, AVAILABILITY)).toEqual([])
  })

  it('returns every applicable dex number when a species is in more than one', () => {
    const result = regionalDexNumbersForGame('moon', 1, AVAILABILITY)
    expect(result).toEqual(
      expect.arrayContaining([
        { dexDisplayName: 'Alola', entryNumber: 80 },
        { dexDisplayName: 'Melemele Island', entryNumber: 12 }
      ])
    )
    expect(result).toHaveLength(2)
  })

  it('omits a dex the species has no entry in, without dropping the others', () => {
    const result = regionalDexNumbersForGame('y', 4, AVAILABILITY)
    expect(result).toEqual([{ dexDisplayName: 'Kalos (Coastal)', entryNumber: 5 }])
  })

  it('returns nothing when the species is in none of the game\'s dexes', () => {
    expect(regionalDexNumbersForGame('y', 999, AVAILABILITY)).toEqual([])
  })
})

describe('regionalDexNumbersForSpecies', () => {
  it('lists every dex the species has an entry in, regardless of game', () => {
    expect(regionalDexNumbersForSpecies(1, AVAILABILITY)).toEqual([
      { dexDisplayName: 'Alola', entryNumbers: [80] },
      { dexDisplayName: 'Melemele Island', entryNumbers: [12] },
      { dexDisplayName: 'Kalos (Central)', entryNumbers: [1] }
    ])
  })

  it('collapses dexes sharing a display name, keeping each distinct number', () => {
    const availability: SpeciesAvailabilityData = {
      pokedexes: {},
      entryNumbers: { 'original-johto': { 152: 1 }, 'updated-johto': { 152: 1 }, hoenn: { 152: 9 }, 'updated-hoenn': { 152: 7 } },
      gameToPokedexes: {}
    }
    expect(regionalDexNumbersForSpecies(152, availability)).toEqual([
      { dexDisplayName: 'Johto', entryNumbers: [1] },
      { dexDisplayName: 'Hoenn', entryNumbers: [9, 7] }
    ])
  })

  it('returns nothing for a species in no dex', () => {
    expect(regionalDexNumbersForSpecies(999, AVAILABILITY)).toEqual([])
  })
})
