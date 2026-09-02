import { describe, expect, it } from 'vitest'
import type { CollectionEntry, Form, Species } from '@shared/types/pokemon'
import { buildDexSections } from './buildDexSections'
import type { DexOptions } from './types'

const OPTIONS_DEFAULT: DexOptions = { splitGenderRows: false, regionalMode: 'inline' }

const SPECIES: Species[] = [
  { id: 25, name: 'Pikachu', generation: 1 },
  { id: 26, name: 'Raichu', generation: 1 },
  { id: 386, name: 'Deoxys', generation: 3 }
]

function makeForm(overrides: Partial<Form> & Pick<Form, 'id' | 'speciesId' | 'formName'>): Form {
  return {
    formCategory: 'dex_distinct',
    homeBoxable: true,
    shinyLocked: false,
    alwaysShiny: false,
    hasGenderDifference: false,
    firstAvailableGeneration: 1,
    regionalGroup: null,
    pokeapiId: overrides.id,
    spriteFormSuffix: null,
    ...overrides
  }
}

function makeEntry(overrides: Partial<CollectionEntry> & Pick<CollectionEntry, 'id' | 'formId'>): CollectionEntry {
  return {
    gender: 'unknown',
    shiny: false,
    owned: false,
    trainerProfileId: null,
    originGame: null,
    otName: null,
    tid: null,
    sid: null,
    nickname: null,
    ...overrides
  }
}

describe('buildDexSections', () => {
  it('filters out non_boxable forms entirely', () => {
    const forms: Form[] = [
      makeForm({ id: 1, speciesId: 25, formName: 'base' }),
      makeForm({ id: 2, speciesId: 25, formName: 'gmax', formCategory: 'non_boxable' })
    ]
    const sections = buildDexSections(SPECIES, forms, [], OPTIONS_DEFAULT)
    const pikachuSection = sections.find((s) => s.speciesId === 25)!
    expect(pikachuSection.rows.map((r) => r.formId)).toEqual([1])
    expect(pikachuSection.cosmeticRows).toEqual([])
  })

  it('puts cosmetic_variant forms in cosmeticRows, not rows', () => {
    const forms: Form[] = [
      makeForm({ id: 1, speciesId: 25, formName: 'base' }),
      makeForm({ id: 2, speciesId: 25, formName: 'cosplay', formCategory: 'cosmetic_variant' })
    ]
    const sections = buildDexSections(SPECIES, forms, [], OPTIONS_DEFAULT)
    const pikachuSection = sections.find((s) => s.speciesId === 25)!
    expect(pikachuSection.rows.map((r) => r.formId)).toEqual([1])
    expect(pikachuSection.cosmeticRows.map((r) => r.formId)).toEqual([2])
  })

  it('collapses a gender-diff form to one row using the male entry by default', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 25, formName: 'base', hasGenderDifference: true })]
    const entries: CollectionEntry[] = [
      makeEntry({ id: 10, formId: 1, gender: 'male', shiny: false, owned: true }),
      makeEntry({ id: 11, formId: 1, gender: 'male', shiny: true, owned: false }),
      makeEntry({ id: 12, formId: 1, gender: 'female', shiny: false, owned: false }),
      makeEntry({ id: 13, formId: 1, gender: 'female', shiny: true, owned: false })
    ]
    const sections = buildDexSections(SPECIES, forms, entries, OPTIONS_DEFAULT)
    const rows = sections.find((s) => s.speciesId === 25)!.rows
    expect(rows).toHaveLength(1)
    expect(rows[0].displayName).toBe('Pikachu')
    expect(rows[0].regular?.id).toBe(10)
  })

  it('splits a gender-diff form into ♂/♀ rows when splitGenderRows is on', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 25, formName: 'base', hasGenderDifference: true })]
    const entries: CollectionEntry[] = [
      makeEntry({ id: 10, formId: 1, gender: 'male', shiny: false }),
      makeEntry({ id: 11, formId: 1, gender: 'male', shiny: true }),
      makeEntry({ id: 12, formId: 1, gender: 'female', shiny: false }),
      makeEntry({ id: 13, formId: 1, gender: 'female', shiny: true })
    ]
    const sections = buildDexSections(SPECIES, forms, entries, { ...OPTIONS_DEFAULT, splitGenderRows: true })
    const rows = sections.find((s) => s.speciesId === 25)!.rows
    expect(rows.map((r) => r.displayName)).toEqual(['Pikachu ♂', 'Pikachu ♀'])
    expect(rows[0].regular?.id).toBe(10)
    expect(rows[1].regular?.id).toBe(12)
  })

  it('keeps regional forms inline within their species section by default', () => {
    const forms: Form[] = [
      makeForm({ id: 1, speciesId: 26, formName: 'base' }),
      makeForm({ id: 2, speciesId: 26, formName: 'alola', regionalGroup: 'alolan' })
    ]
    const sections = buildDexSections(SPECIES, forms, [], OPTIONS_DEFAULT)
    expect(sections.some((s) => s.speciesId === null)).toBe(false)
    const raichuSection = sections.find((s) => s.speciesId === 26)!
    expect(raichuSection.rows.map((r) => r.formId)).toEqual([1, 2])
  })

  it('pulls regional forms into a separate regional-group section when grouped', () => {
    const forms: Form[] = [
      makeForm({ id: 1, speciesId: 26, formName: 'base' }),
      makeForm({ id: 2, speciesId: 26, formName: 'alola', regionalGroup: 'alolan' })
    ]
    const sections = buildDexSections(SPECIES, forms, [], { ...OPTIONS_DEFAULT, regionalMode: 'grouped' })
    const raichuSection = sections.find((s) => s.speciesId === 26)!
    expect(raichuSection.rows.map((r) => r.formId)).toEqual([1])

    const regionalSection = sections.find((s) => s.key === 'regional-alolan')!
    expect(regionalSection).toBeDefined()
    expect(regionalSection.heading).toBe('Alolan Forms')
    expect(regionalSection.rows.map((r) => r.formId)).toEqual([2])
    expect(regionalSection.rows[0].displayName).toBe('Raichu (alola)')
  })

  it('gives a named base forme its real display label instead of the bare species name', () => {
    const forms: Form[] = [
      makeForm({ id: 1, speciesId: 386, formName: 'base' }),
      makeForm({ id: 2, speciesId: 386, formName: 'attack' })
    ]
    const sections = buildDexSections(SPECIES, forms, [], OPTIONS_DEFAULT)
    const deoxysSection = sections.find((s) => s.speciesId === 386)!
    expect(deoxysSection.rows.map((r) => r.displayName)).toEqual(['Deoxys (normal)', 'Deoxys (attack)'])
  })

  it('leaves the bare species name for base forms with no entry in BASE_FORM_NAMES', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 25, formName: 'base' })]
    const sections = buildDexSections(SPECIES, forms, [], OPTIONS_DEFAULT)
    expect(sections.find((s) => s.speciesId === 25)!.rows[0].displayName).toBe('Pikachu')
  })

  it('passes homeBoxable through onto the row instead of filtering on it', () => {
    const forms: Form[] = [
      makeForm({ id: 1, speciesId: 25, formName: 'base' }),
      makeForm({ id: 2, speciesId: 26, formName: 'base', homeBoxable: false })
    ]
    const sections = buildDexSections(SPECIES, forms, [], OPTIONS_DEFAULT)
    expect(sections.find((s) => s.speciesId === 25)!.rows[0].homeBoxable).toBe(true)
    expect(sections.find((s) => s.speciesId === 26)!.rows[0].homeBoxable).toBe(false)
  })

  it('passes shinyLocked through onto the row instead of filtering on it', () => {
    const forms: Form[] = [
      makeForm({ id: 1, speciesId: 25, formName: 'base' }),
      makeForm({ id: 2, speciesId: 26, formName: 'base', shinyLocked: true })
    ]
    const sections = buildDexSections(SPECIES, forms, [], OPTIONS_DEFAULT)
    expect(sections.find((s) => s.speciesId === 25)!.rows[0].shinyLocked).toBe(false)
    expect(sections.find((s) => s.speciesId === 26)!.rows[0].shinyLocked).toBe(true)
  })
})
