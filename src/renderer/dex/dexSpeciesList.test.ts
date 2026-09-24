import { describe, expect, it } from 'vitest'
import type { Form, Species } from '@shared/types/pokemon'
import type { SpeciesDetailsData } from '@shared/types/species-details'
import { buildDexListRows, filterDexListRows, groupRowsByGeneration, sortDexListRows } from './dexSpeciesList'

const species = (id: number, name: string, generation: number): Species => ({
  id,
  name,
  generation,
  collapsedDisplayFormId: null,
  isFinalEvolutionStage: true,
  evolvesFromSpeciesId: null
})

const form = (id: number, speciesId: number, formName: string, formCategory: Form['formCategory'], pokeapiId = speciesId): Form => ({
  id,
  speciesId,
  formName,
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

const details: SpeciesDetailsData = {
  species: {},
  growthRates: {},
  abilities: {},
  forms: {
    1: {
      abilities: [
        { name: 'overgrow', isHidden: false },
        { name: 'chlorophyll', isHidden: true }
      ],
      evYield: {}
    },
    10033: { abilities: [{ name: 'thick-fat', isHidden: false }], evYield: {} },
    4: { abilities: [{ name: 'blaze', isHidden: false }], evYield: {} },
    152: { abilities: [{ name: 'overgrow', isHidden: false }], evYield: {} }
  }
}

const SPECIES = [species(1, 'bulbasaur', 1), species(4, 'charmander', 1), species(152, 'chikorita', 2)]
const FORMS = [
  form(1, 1, 'base', 'dex_distinct'),
  form(2, 1, 'mega', 'non_boxable', 10033),
  form(3, 1, 'cosmetic', 'cosmetic_variant'),
  form(4, 4, 'base', 'dex_distinct'),
  form(5, 152, 'base', 'dex_distinct')
]

describe('buildDexListRows', () => {
  const rows = buildDexListRows(SPECIES, FORMS, details)

  it('lists dex_distinct and non_boxable forms but skips cosmetic variants', () => {
    expect(rows.map((r) => r.displayName)).toEqual(['Bulbasaur', 'Bulbasaur (Mega)', 'Charmander', 'Chikorita'])
  })

  it('resolves abilities per form via pokeapiId, display-formatted', () => {
    expect(rows[0].abilities).toEqual([
      { name: 'Overgrow', isHidden: false },
      { name: 'Chlorophyll', isHidden: true }
    ])
    expect(rows[1].abilities).toEqual([{ name: 'Thick Fat', isHidden: false }])
  })

  it('gives a form with no detail entry an empty ability list', () => {
    const noDetails = buildDexListRows(SPECIES, FORMS, { ...details, forms: {} })
    expect(noDetails[0].abilities).toEqual([])
  })
})

describe('filterDexListRows', () => {
  const rows = buildDexListRows(SPECIES, FORMS, details)

  it('returns everything for a blank query', () => {
    expect(filterDexListRows(rows, '  ')).toBe(rows)
  })

  it('matches name, dex # substring, and ability name case-insensitively', () => {
    expect(filterDexListRows(rows, 'CHAR').map((r) => r.speciesId)).toEqual([4])
    expect(filterDexListRows(rows, '15').map((r) => r.speciesId)).toEqual([152])
    expect(filterDexListRows(rows, 'thick').map((r) => r.displayName)).toEqual(['Bulbasaur (Mega)'])
    expect(filterDexListRows(rows, 'overgrow').map((r) => r.speciesId)).toEqual([1, 152])
  })
})

describe('sortDexListRows', () => {
  const rows = buildDexListRows(SPECIES, FORMS, details)

  it('sorts by name ascending and descending', () => {
    expect(sortDexListRows(rows, { key: 'name', direction: 'asc' })[0].displayName).toBe('Bulbasaur')
    expect(sortDexListRows(rows, { key: 'name', direction: 'desc' })[0].displayName).toBe('Chikorita')
  })

  it('sorts by first ability, breaking ties by dex #', () => {
    const sorted = sortDexListRows(rows, { key: 'abilities', direction: 'asc' })
    expect(sorted.map((r) => r.displayName)).toEqual(['Charmander', 'Bulbasaur', 'Chikorita', 'Bulbasaur (Mega)'])
  })

  it("reverses dex order without scrambling a species' own forms", () => {
    const sorted = sortDexListRows(rows, { key: 'dex', direction: 'desc' })
    expect(sorted.map((r) => r.speciesId)).toEqual([152, 4, 1, 1])
    expect(sorted.slice(2).map((r) => r.formName)).toEqual(['base', 'mega'])
  })

  it('does not mutate its input', () => {
    const copy = [...rows]
    sortDexListRows(rows, { key: 'name', direction: 'desc' })
    expect(rows).toEqual(copy)
  })
})

describe('groupRowsByGeneration', () => {
  it('opens a new group whenever the generation changes', () => {
    const groups = groupRowsByGeneration(buildDexListRows(SPECIES, FORMS, details))
    expect(groups.map((g) => [g.generation, g.rows.length])).toEqual([
      [1, 3],
      [2, 1]
    ])
  })
})
