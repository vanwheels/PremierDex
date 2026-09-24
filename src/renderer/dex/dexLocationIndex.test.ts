import { describe, expect, it } from 'vitest'
import type { EncounterData } from '@shared/types/encounters'
import type { Form, Species } from '@shared/types/pokemon'
import { buildDexLocations, filterDexLocations } from './dexLocationIndex'

const species = (id: number, name: string): Species => ({
  id,
  name,
  generation: 1,
  collapsedDisplayFormId: null,
  isFinalEvolutionStage: true,
  evolvesFromSpeciesId: null
})

const form = (id: number, speciesId: number, formCategory: Form['formCategory'], pokeapiId = speciesId): Form => ({
  id,
  speciesId,
  formName: 'base',
  formCategory,
  homeBoxable: true,
  hasGenderDifference: false,
  firstAvailableGeneration: 1,
  regionalGroup: null,
  pokeapiId,
  spriteFormSuffix: null,
  shinyLocked: false,
  alwaysShiny: false
})

const detail = { minLevel: 2, maxLevel: 5, chance: 50, methodIndex: 0, conditionValues: [] }

const DATA: EncounterData = {
  locationAreas: ['kanto-route-1-area', 'hoenn-route-101-area'],
  methods: ['walk'],
  versions: ['red', 'blue', 'ruby'],
  encounters: {
    // Two games at Route 1.
    19: [
      {
        locationAreaIndex: 0,
        versionDetails: [
          { versionIndex: 0, maxChance: 50, encounterDetails: [detail] },
          { versionIndex: 1, maxChance: 50, encounterDetails: [detail] }
        ]
      }
    ],
    // One game at Route 1, a different one at Route 101.
    16: [
      { locationAreaIndex: 0, versionDetails: [{ versionIndex: 0, maxChance: 50, encounterDetails: [detail] }] },
      { locationAreaIndex: 1, versionDetails: [{ versionIndex: 2, maxChance: 50, encounterDetails: [detail] }] }
    ],
    // No owning form row at all — silently skipped.
    9999: [{ locationAreaIndex: 0, versionDetails: [{ versionIndex: 0, maxChance: 1, encounterDetails: [detail] }] }]
  }
}

const SPECIES = [species(16, 'pidgey'), species(19, 'rattata')]
const FORMS = [form(1, 16, 'dex_distinct'), form(2, 19, 'dex_distinct'), form(3, 19, 'cosmetic_variant')]

describe('buildDexLocations', () => {
  const locations = buildDexLocations(DATA, SPECIES, FORMS)

  it('inverts per-form encounters into per-location species lists, sorted by location then dex #', () => {
    expect(locations.map((l) => l.name)).toEqual(['Hoenn Route 101', 'Kanto Route 1'])
    expect(locations[1].species.map((s) => s.speciesId)).toEqual([16, 19])
  })

  it('joins the games that have each species at that location, in release order', () => {
    const route1 = locations[1].species
    expect(route1.find((s) => s.speciesId === 19)?.gamesLabel).toBe('Red/Blue')
    expect(route1.find((s) => s.speciesId === 16)?.gamesLabel).toBe('Red')
    expect(locations[0].species[0].gamesLabel).toBe('Ruby')
  })

  it('skips encounter entries with no owning form', () => {
    expect(locations.flatMap((l) => l.species).some((s) => s.speciesId === 9999)).toBe(false)
  })
})

describe('filterDexLocations', () => {
  const locations = buildDexLocations(DATA, SPECIES, FORMS)

  it('matches location names case-insensitively and returns all for a blank query', () => {
    expect(filterDexLocations(locations, 'ROUTE 101').map((l) => l.name)).toEqual(['Hoenn Route 101'])
    expect(filterDexLocations(locations, '')).toBe(locations)
  })
})
