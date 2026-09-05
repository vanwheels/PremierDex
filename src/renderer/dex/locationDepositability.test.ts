import { describe, expect, it } from 'vitest'
import type { CollectionEntry } from '@shared/types/pokemon'
import type { StorageLocation } from '@shared/types/storage-location'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import { filterDepositableSections, isRowDepositableAtLocation, LOCATION_TYPE_MAX_GENERATION } from './locationDepositability'
import type { DexRowData, DexSection } from './types'

function makeEntry(overrides: Partial<CollectionEntry> & Pick<CollectionEntry, 'id'>): CollectionEntry {
  return {
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

function makeRow(overrides: Partial<DexRowData> & Pick<DexRowData, 'key' | 'dexNumber' | 'displayName'>): DexRowData {
  return {
    formId: 1,
    regular: null,
    shinyEntry: null,
    pokeapiId: 1,
    spriteFormSuffix: null,
    femaleSprite: false,
    firstAvailableGeneration: 1,
    homeBoxable: true,
    shinyLocked: false,
    alwaysShiny: false,
    regionalGroup: null,
    hasGenderDifference: false,
    ...overrides
  }
}

function makeSection(overrides: Partial<DexSection> & Pick<DexSection, 'key'>): DexSection {
  return { heading: overrides.key, speciesId: 1, rows: [], cosmeticRows: [], collapsedDisplayFormId: null, ...overrides }
}

function location(overrides: Partial<StorageLocation>): StorageLocation {
  return { id: 1, locationType: 'home', name: '', trainerProfileId: null, ...overrides }
}

const EMPTY_AVAILABILITY: SpeciesAvailabilityData = { pokedexes: {}, gameToPokedexes: {} }

describe('isRowDepositableAtLocation', () => {
  it('is always depositable when no location is selected (Unassigned tab)', () => {
    const row = makeRow({ key: 'r', dexNumber: 900, displayName: 'A', firstAvailableGeneration: 9 })
    expect(isRowDepositableAtLocation(row, null, null, EMPTY_AVAILABILITY)).toBe(true)
  })

  it('is uncapped for home, the only location type absent from LOCATION_TYPE_MAX_GENERATION', () => {
    expect(LOCATION_TYPE_MAX_GENERATION.home).toBeUndefined()
    const row = makeRow({ key: 'r', dexNumber: 1000, displayName: 'A', firstAvailableGeneration: 9 })
    expect(isRowDepositableAtLocation(row, location({ locationType: 'home' }), null, EMPTY_AVAILABILITY)).toBe(true)
  })

  it('caps ranch at Gen 4', () => {
    const gen4 = makeRow({ key: 'a', dexNumber: 490, displayName: 'A', firstAvailableGeneration: 4 })
    const gen5 = makeRow({ key: 'b', dexNumber: 494, displayName: 'B', firstAvailableGeneration: 5 })
    const ranch = location({ locationType: 'ranch' })
    expect(isRowDepositableAtLocation(gen4, ranch, null, EMPTY_AVAILABILITY)).toBe(true)
    expect(isRowDepositableAtLocation(gen5, ranch, null, EMPTY_AVAILABILITY)).toBe(false)
  })

  it('caps box at Gen 3', () => {
    const gen3 = makeRow({ key: 'a', dexNumber: 380, displayName: 'A', firstAvailableGeneration: 3 })
    const gen4 = makeRow({ key: 'b', dexNumber: 400, displayName: 'B', firstAvailableGeneration: 4 })
    const box = location({ locationType: 'box' })
    expect(isRowDepositableAtLocation(gen3, box, null, EMPTY_AVAILABILITY)).toBe(true)
    expect(isRowDepositableAtLocation(gen4, box, null, EMPTY_AVAILABILITY)).toBe(false)
  })

  it('caps bank at Gen 7', () => {
    const gen7 = makeRow({ key: 'a', dexNumber: 800, displayName: 'A', firstAvailableGeneration: 7 })
    const gen8 = makeRow({ key: 'b', dexNumber: 810, displayName: 'B', firstAvailableGeneration: 8 })
    const bank = location({ locationType: 'bank' })
    expect(isRowDepositableAtLocation(gen7, bank, null, EMPTY_AVAILABILITY)).toBe(true)
    expect(isRowDepositableAtLocation(gen8, bank, null, EMPTY_AVAILABILITY)).toBe(false)
  })

  it('lets an already-owned row through regardless of the cap (grandfathered)', () => {
    const row = makeRow({
      key: 'a',
      dexNumber: 900,
      displayName: 'A',
      firstAvailableGeneration: 9,
      regular: makeEntry({ id: 1, owned: true })
    })
    expect(isRowDepositableAtLocation(row, location({ locationType: 'ranch' }), null, EMPTY_AVAILABILITY)).toBe(true)
  })

  describe('save_file', () => {
    const availability: SpeciesAvailabilityData = {
      pokedexes: { 'original-kanto': [1, 2, 3] },
      gameToPokedexes: { red: ['original-kanto'], colosseum: [] }
    }
    const saveFile = location({ locationType: 'save_file', trainerProfileId: 1 })

    it('is depositable when the species is in the linked game\'s pokedex union', () => {
      const row = makeRow({ key: 'a', dexNumber: 1, displayName: 'Bulbasaur' })
      expect(isRowDepositableAtLocation(row, saveFile, 'Pokémon Red', availability)).toBe(true)
    })

    it('is not depositable when the species is absent from the linked game\'s pokedex union', () => {
      const row = makeRow({ key: 'a', dexNumber: 999, displayName: 'Not Kanto' })
      expect(isRowDepositableAtLocation(row, saveFile, 'Pokémon Red', availability)).toBe(false)
    })

    it('has nothing to check against when the location has no linked trainer game', () => {
      const row = makeRow({ key: 'a', dexNumber: 999, displayName: 'Not Kanto' })
      expect(isRowDepositableAtLocation(row, saveFile, null, availability)).toBe(true)
    })

    it('has nothing to check against for an unrecognized game name', () => {
      const row = makeRow({ key: 'a', dexNumber: 999, displayName: 'Not Kanto' })
      expect(isRowDepositableAtLocation(row, saveFile, 'Not A Real Game', availability)).toBe(true)
    })

    it('skips the check for a game mapped to no pokedexes (e.g. Colosseum)', () => {
      const row = makeRow({ key: 'a', dexNumber: 999, displayName: 'Not Kanto' })
      expect(isRowDepositableAtLocation(row, saveFile, 'Pokémon Colosseum', availability)).toBe(true)
    })
  })
})

describe('filterDepositableSections', () => {
  it('passes sections through unchanged when no location is selected', () => {
    const sections = [makeSection({ key: 's', rows: [makeRow({ key: 'r', dexNumber: 1, displayName: 'A' })] })]
    expect(filterDepositableSections(sections, null, null, EMPTY_AVAILABILITY)).toEqual(sections)
  })

  it('drops a section entirely when nothing in it is depositable', () => {
    const row = makeRow({ key: 'r', dexNumber: 900, displayName: 'A', firstAvailableGeneration: 9 })
    const sections = [makeSection({ key: 's', rows: [row] })]
    expect(filterDepositableSections(sections, location({ locationType: 'ranch' }), null, EMPTY_AVAILABILITY)).toEqual([])
  })

  it('keeps only the depositable rows within a surviving section', () => {
    const gen1 = makeRow({ key: 'a', dexNumber: 1, displayName: 'A', firstAvailableGeneration: 1 })
    const gen9 = makeRow({ key: 'b', dexNumber: 900, displayName: 'B', firstAvailableGeneration: 9 })
    const sections = [makeSection({ key: 's', rows: [gen1, gen9] })]
    const result = filterDepositableSections(sections, location({ locationType: 'ranch' }), null, EMPTY_AVAILABILITY)
    expect(result[0].rows.map((r) => r.key)).toEqual(['a'])
  })

  it('promotes a depositable cosmetic row into rows when the base row is not depositable', () => {
    const base = makeRow({ key: 'base', dexNumber: 900, displayName: 'Base', firstAvailableGeneration: 9 })
    const letter = makeRow({ key: 'letter', dexNumber: 900, displayName: 'Letter', firstAvailableGeneration: 1 })
    const sections = [makeSection({ key: 's', rows: [base], cosmeticRows: [letter] })]
    const result = filterDepositableSections(sections, location({ locationType: 'ranch' }), null, EMPTY_AVAILABILITY)
    expect(result).toHaveLength(1)
    expect(result[0].rows.map((r) => r.key)).toEqual(['letter'])
    expect(result[0].cosmeticRows).toEqual([])
  })
})
