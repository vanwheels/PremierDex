import { describe, expect, it } from 'vitest'
import type { CollectionEntry, Form, Species } from '@shared/types/pokemon'
import { buildDexSections, pickCollapsedRow } from './buildDexSections'
import type { DexOptions, DexRowData } from './types'

const OPTIONS_DEFAULT: DexOptions = { splitGenderRows: false, regionalMode: 'inline' }

const SPECIES: Species[] = [
  { id: 25, name: 'Pikachu', generation: 1, collapsedDisplayFormId: null },
  { id: 26, name: 'Raichu', generation: 1, collapsedDisplayFormId: null },
  { id: 386, name: 'Deoxys', generation: 3, collapsedDisplayFormId: null }
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
    language: null,
    nickname: null,
    caughtBall: null,
    metLocation: null,
    storageLocationId: null,
    boxNumber: null,
    boxSlot: null,
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

  it('picks an owned entry over an unowned one sharing a slot (Leg 4: duplicates are real post Leg 2)', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 25, formName: 'base' })]
    const entries: CollectionEntry[] = [
      // Seed placeholder, unowned, lowest id — inserted first, same as a real seed run.
      makeEntry({ id: 10, formId: 1, gender: 'unknown', shiny: false, owned: false }),
      // A duplicate owned individual added later, higher id.
      makeEntry({ id: 11, formId: 1, gender: 'unknown', shiny: false, owned: true, nickname: 'Sparky' })
    ]
    const sections = buildDexSections(SPECIES, forms, entries, OPTIONS_DEFAULT)
    const row = sections.find((s) => s.speciesId === 25)!.rows[0]
    expect(row.regular?.id).toBe(11)
    expect(row.regular?.owned).toBe(true)
  })

  it('keeps the already-picked owned entry when a further owned duplicate appears in the same slot', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 25, formName: 'base' })]
    const entries: CollectionEntry[] = [
      makeEntry({ id: 10, formId: 1, gender: 'unknown', shiny: false, owned: true, nickname: 'First' }),
      makeEntry({ id: 11, formId: 1, gender: 'unknown', shiny: false, owned: true, nickname: 'Second' })
    ]
    const sections = buildDexSections(SPECIES, forms, entries, OPTIONS_DEFAULT)
    const row = sections.find((s) => s.speciesId === 25)!.rows[0]
    expect(row.regular?.id).toBe(10)
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
    expect(rows.map((r) => r.femaleSprite)).toEqual([false, true])
  })

  it('only ever sets femaleSprite on the collapsed male-only row when splitGenderRows is off', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 25, formName: 'base', hasGenderDifference: true })]
    const sections = buildDexSections(SPECIES, forms, [], OPTIONS_DEFAULT)
    const rows = sections.find((s) => s.speciesId === 25)!.rows
    expect(rows.map((r) => r.femaleSprite)).toEqual([false])
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
    expect(regionalSection.rows[0].displayName).toBe('Raichu (Alola)')
  })

  it('gives a named base forme its real display label instead of the bare species name', () => {
    const forms: Form[] = [
      makeForm({ id: 1, speciesId: 386, formName: 'base' }),
      makeForm({ id: 2, speciesId: 386, formName: 'attack' })
    ]
    const sections = buildDexSections(SPECIES, forms, [], OPTIONS_DEFAULT)
    const deoxysSection = sections.find((s) => s.speciesId === 386)!
    expect(deoxysSection.rows.map((r) => r.displayName)).toEqual(['Deoxys (Normal)', 'Deoxys (Attack)'])
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

  it('capitalizes raw lowercase species/form slugs, preserving hyphens as word separators', () => {
    const rawSpecies: Species[] = [{ id: 250, name: 'ho-oh', generation: 2, collapsedDisplayFormId: null }]
    const forms: Form[] = [
      makeForm({ id: 1, speciesId: 250, formName: 'base' }),
      makeForm({ id: 2, speciesId: 250, formName: 'test-form' })
    ]
    const sections = buildDexSections(rawSpecies, forms, [], OPTIONS_DEFAULT)
    const section = sections.find((s) => s.speciesId === 250)!
    expect(section.heading).toBe('Ho-Oh')
    expect(section.rows.map((r) => r.displayName)).toEqual(['Ho-Oh', 'Ho-Oh (Test Form)'])
  })

  it('restores punctuation for species with an exception entry (Leg 29)', () => {
    const rawSpecies: Species[] = [{ id: 122, name: 'mr-mime', generation: 1, collapsedDisplayFormId: null }]
    const forms: Form[] = [makeForm({ id: 1, speciesId: 122, formName: 'base' })]
    const sections = buildDexSections(rawSpecies, forms, [], OPTIONS_DEFAULT)
    const section = sections.find((s) => s.speciesId === 122)!
    expect(section.heading).toBe('Mr. Mime')
    expect(section.rows[0].displayName).toBe('Mr. Mime')
  })

  it("carries a species' collapsedDisplayFormId through onto its section", () => {
    const speciesWithOverride: Species[] = [
      { id: 25, name: 'Pikachu', generation: 1, collapsedDisplayFormId: 2 }
    ]
    const forms: Form[] = [makeForm({ id: 1, speciesId: 25, formName: 'base' })]
    const sections = buildDexSections(speciesWithOverride, forms, [], OPTIONS_DEFAULT)
    expect(sections.find((s) => s.speciesId === 25)!.collapsedDisplayFormId).toBe(2)
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

function makeRow(overrides: Partial<DexRowData> & Pick<DexRowData, 'key' | 'displayName'>): DexRowData {
  return {
    formId: 1,
    dexNumber: 201,
    regular: null,
    shinyEntry: null,
    pokeapiId: 201,
    spriteFormSuffix: null,
    femaleSprite: false,
    firstAvailableGeneration: 1,
    homeBoxable: true,
    shinyLocked: false,
    alwaysShiny: false,
    regionalGroup: null,
    ...overrides
  }
}

function ownedEntry(id: number, shiny = false): CollectionEntry {
  return {
    id,
    formId: 1,
    gender: 'unknown',
    shiny,
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
    boxSlot: null
  }
}

describe('pickCollapsedRow', () => {
  it('falls back to rows[0] when nothing is checked off', () => {
    const base = makeRow({ key: 'a', displayName: 'Unown (A)' })
    const cosmetic = makeRow({ key: 'b', displayName: 'Unown (B)' })
    expect(pickCollapsedRow([base], [cosmetic])).toBe(base)
  })

  it('picks the first checked-off cosmetic row when the base form is unchecked', () => {
    const base = makeRow({ key: 'a', displayName: 'Unown (A)' })
    const uncheckedCosmetic = makeRow({ key: 'b', displayName: 'Unown (B)' })
    const checkedCosmetic = makeRow({ key: 'c', displayName: 'Unown (C)', regular: ownedEntry(1) })
    expect(pickCollapsedRow([base], [uncheckedCosmetic, checkedCosmetic])).toBe(checkedCosmetic)
  })

  it('prefers rows[0] over a checked cosmetic row when the base form is itself checked off', () => {
    const base = makeRow({ key: 'a', displayName: 'Unown (A)', regular: ownedEntry(1) })
    const checkedCosmetic = makeRow({ key: 'c', displayName: 'Unown (C)', regular: ownedEntry(2) })
    expect(pickCollapsedRow([base], [checkedCosmetic])).toBe(base)
  })

  it('counts a checked-off shiny entry, not just the regular one', () => {
    const base = makeRow({ key: 'a', displayName: 'Unown (A)' })
    const shinyOnlyCosmetic = makeRow({ key: 'b', displayName: 'Unown (B)', shinyEntry: ownedEntry(1, true) })
    expect(pickCollapsedRow([base], [shinyOnlyCosmetic])).toBe(shinyOnlyCosmetic)
  })

  it("honors a user override (Leg 27) over the auto-pick, even when the override isn't owned", () => {
    const base = makeRow({ key: 'a', displayName: 'Unown (A)', formId: 1, regular: ownedEntry(1) })
    const uncheckedCosmetic = makeRow({ key: 'b', displayName: 'Unown (B)', formId: 2 })
    expect(pickCollapsedRow([base], [uncheckedCosmetic], 2)).toBe(uncheckedCosmetic)
  })

  it('falls back to the auto-pick when the override formId matches no candidate', () => {
    const base = makeRow({ key: 'a', displayName: 'Unown (A)', formId: 1 })
    const checkedCosmetic = makeRow({ key: 'b', displayName: 'Unown (B)', formId: 2, regular: ownedEntry(1) })
    expect(pickCollapsedRow([base], [checkedCosmetic], 999)).toBe(checkedCosmetic)
  })

  it('ignores a null override and falls back to the auto-pick', () => {
    const base = makeRow({ key: 'a', displayName: 'Unown (A)', formId: 1 })
    const checkedCosmetic = makeRow({ key: 'b', displayName: 'Unown (B)', formId: 2, regular: ownedEntry(1) })
    expect(pickCollapsedRow([base], [checkedCosmetic], null)).toBe(checkedCosmetic)
  })
})
