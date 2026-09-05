import { describe, expect, it } from 'vitest'
import type { CollectionEntry, Form } from '@shared/types/pokemon'
import { findAmbiguousGenderEntries } from './genderResolution'

function makeForm(overrides: Partial<Form> & Pick<Form, 'id' | 'speciesId'>): Form {
  return {
    formName: 'base',
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

describe('findAmbiguousGenderEntries', () => {
  it('flags an owned male-keyed entry on a gender-diff form', () => {
    const forms = [makeForm({ id: 1, speciesId: 1, hasGenderDifference: true })]
    const entries = [makeEntry({ id: 1, formId: 1, gender: 'male', owned: true })]

    const result = findAmbiguousGenderEntries(forms, entries)

    expect(result).toEqual([{ entry: entries[0], form: forms[0] }])
  })

  it('flags each duplicate owned male-keyed entry independently', () => {
    const forms = [makeForm({ id: 1, speciesId: 1, hasGenderDifference: true })]
    const entries = [
      makeEntry({ id: 1, formId: 1, gender: 'male', owned: true }),
      makeEntry({ id: 2, formId: 1, gender: 'male', owned: true })
    ]

    expect(findAmbiguousGenderEntries(forms, entries)).toHaveLength(2)
  })

  it('ignores an unowned male-keyed entry', () => {
    const forms = [makeForm({ id: 1, speciesId: 1, hasGenderDifference: true })]
    const entries = [makeEntry({ id: 1, formId: 1, gender: 'male', owned: false })]

    expect(findAmbiguousGenderEntries(forms, entries)).toEqual([])
  })

  it('ignores an owned female-keyed entry — only the collapsed male key is ambiguous', () => {
    const forms = [makeForm({ id: 1, speciesId: 1, hasGenderDifference: true })]
    const entries = [makeEntry({ id: 1, formId: 1, gender: 'female', owned: true })]

    expect(findAmbiguousGenderEntries(forms, entries)).toEqual([])
  })

  it('ignores an owned male-keyed entry on a form with no gender difference', () => {
    const forms = [makeForm({ id: 1, speciesId: 1, hasGenderDifference: false })]
    const entries = [makeEntry({ id: 1, formId: 1, gender: 'male', owned: true })]

    expect(findAmbiguousGenderEntries(forms, entries)).toEqual([])
  })

  it('ignores a confirmed male-keyed entry — genderConfirmed is what Resolve actually clears', () => {
    const forms = [makeForm({ id: 1, speciesId: 1, hasGenderDifference: true })]
    const entries = [makeEntry({ id: 1, formId: 1, gender: 'male', owned: true, genderConfirmed: true })]

    expect(findAmbiguousGenderEntries(forms, entries)).toEqual([])
  })
})
