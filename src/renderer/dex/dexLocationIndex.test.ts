import { describe, expect, it } from 'vitest'
import type { EncounterData } from '@shared/types/encounters'
import type { Form, Species } from '@shared/types/pokemon'
import { buildDexGames, filterDexLocations } from './dexLocationIndex'

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

const detail = { minLevel: 2, maxLevel: 5, chance: 50, methodIndex: 0, conditionValues: [] as string[] }
const night = { ...detail, conditionValues: ['time-night'] }
const day = { ...detail, conditionValues: ['time-day'] }

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
    // Time-conditioned rows at Hoenn Route 101 (Ruby) for the toggle test.
    25: [{ locationAreaIndex: 1, versionDetails: [{ versionIndex: 2, maxChance: 50, encounterDetails: [day, night] }] }],
    // No owning form row at all — silently skipped.
    9999: [{ locationAreaIndex: 0, versionDetails: [{ versionIndex: 0, maxChance: 1, encounterDetails: [detail] }] }]
  }
}

const SPECIES = [species(16, 'pidgey'), species(19, 'rattata'), species(25, 'pikachu')]
const FORMS = [form(1, 16, 'dex_distinct'), form(2, 19, 'dex_distinct'), form(3, 19, 'cosmetic_variant'), form(4, 25, 'dex_distinct')]

describe('buildDexGames', () => {
  const games = buildDexGames(DATA, SPECIES, FORMS)
  const byLabel = (label: string) => games.find((g) => g.label === label)

  it('splits encounters per game, in release order', () => {
    expect(games.map((g) => g.label)).toEqual(['Red', 'Blue', 'Ruby'])
  })

  it('lists each game own locations, sorted by name, with species sorted by dex #', () => {
    expect(byLabel('Red')?.locations.map((l) => l.name)).toEqual(['Kanto Route 1'])
    expect(byLabel('Ruby')?.locations.map((l) => l.name)).toEqual(['Hoenn Route 101'])
    expect(byLabel('Red')?.locations[0].species.map((s) => s.speciesId)).toEqual([16, 19])
    // Pidgey isn't in Blue at Route 1 — only Rattata.
    expect(byLabel('Blue')?.locations[0].species.map((s) => s.speciesId)).toEqual([19])
  })

  it('offers a time toggle only where encounters vary by time of day', () => {
    expect(byLabel('Ruby')?.locations[0].toggles.map((t) => t.key)).toEqual(['time'])
    expect(byLabel('Red')?.locations[0].toggles).toEqual([])
  })

  it('skips encounter entries with no owning form', () => {
    expect(games.flatMap((g) => g.locations).flatMap((l) => l.species).some((s) => s.speciesId === 9999)).toBe(false)
  })
})

describe('filterDexLocations', () => {
  const ruby = buildDexGames(DATA, SPECIES, FORMS).find((g) => g.label === 'Ruby')!.locations

  it('matches location names case-insensitively and returns all for a blank query', () => {
    expect(filterDexLocations(ruby, 'ROUTE 101').map((l) => l.name)).toEqual(['Hoenn Route 101'])
    expect(filterDexLocations(ruby, 'nowhere')).toEqual([])
    expect(filterDexLocations(ruby, '')).toBe(ruby)
  })
})
