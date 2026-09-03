import { describe, expect, it } from 'vitest'
import type { CollectionEntry, Form } from '@shared/types/pokemon'
import { computeCompletionStats } from './completionStats'

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
    ...overrides
  }
}

describe('computeCompletionStats', () => {
  it('excludes non_boxable forms from every bucket', () => {
    const forms: Form[] = [
      makeForm({ id: 1, speciesId: 25, formName: 'base' }),
      makeForm({ id: 2, speciesId: 25, formName: 'gmax', formCategory: 'non_boxable' })
    ]
    const stats = computeCompletionStats(forms, [])
    expect(stats.overall.regular.total).toBe(1)
  })

  it('counts a gender-diff form as one unit, owned if either gender is, when splitByGender is off', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 25, formName: 'base', hasGenderDifference: true })]
    const entries: CollectionEntry[] = [
      makeEntry({ id: 10, formId: 1, gender: 'male', owned: true }),
      makeEntry({ id: 11, formId: 1, gender: 'female', owned: false })
    ]
    const stats = computeCompletionStats(forms, entries)
    expect(stats.overall.regular.total).toBe(1)
    expect(stats.overall.regular.owned).toBe(1)
  })

  it('counts a gender-diff form as two units when splitByGender is on', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 25, formName: 'base', hasGenderDifference: true })]
    const entries: CollectionEntry[] = [
      makeEntry({ id: 10, formId: 1, gender: 'male', owned: true }),
      makeEntry({ id: 11, formId: 1, gender: 'female', owned: false })
    ]
    const stats = computeCompletionStats(forms, entries, {
      includeCosmeticVariants: false,
      splitByGender: true,
      foldRegionalIntoGeneration: false
    })
    expect(stats.overall.regular.total).toBe(2)
    expect(stats.overall.regular.owned).toBe(1)
  })

  it('excludes cosmetic_variant forms by default, includes them when includeCosmeticVariants is on', () => {
    const forms: Form[] = [
      makeForm({ id: 1, speciesId: 666, formName: 'meadow' }),
      makeForm({ id: 2, speciesId: 666, formName: 'icy-snow', formCategory: 'cosmetic_variant' })
    ]
    const stats = computeCompletionStats(forms, [])
    expect(stats.overall.regular.total).toBe(1)

    const withCosmetics = computeCompletionStats(forms, [], {
      includeCosmeticVariants: true,
      splitByGender: false,
      foldRegionalIntoGeneration: false
    })
    expect(withCosmetics.overall.regular.total).toBe(2)
  })

  it('excludes regional forms from their generation bucket by default, includes them when foldRegionalIntoGeneration is on', () => {
    const forms: Form[] = [
      makeForm({ id: 1, speciesId: 26, formName: 'alolan', regionalGroup: 'alolan', firstAvailableGeneration: 7 })
    ]
    const stats = computeCompletionStats(forms, [])
    expect(stats.byGeneration).toEqual([])
    expect(stats.byRegionalGroup[0].regular.total).toBe(1)

    const folded = computeCompletionStats(forms, [], {
      includeCosmeticVariants: false,
      splitByGender: false,
      foldRegionalIntoGeneration: true
    })
    expect(folded.byGeneration.map((b) => b.key)).toEqual(['7'])
    expect(folded.byGeneration[0].regular.total).toBe(1)
    expect(folded.byRegionalGroup[0].regular.total).toBe(1)
  })

  it('excludes an alwaysShiny form from the regular denominator', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 172, formName: 'spiky-eared', alwaysShiny: true })]
    const entries: CollectionEntry[] = [makeEntry({ id: 10, formId: 1, gender: 'unknown', shiny: true, owned: true })]
    const stats = computeCompletionStats(forms, entries)
    expect(stats.overall.regular.total).toBe(0)
    expect(stats.overall.regular.owned).toBe(0)
    expect(stats.overall.shiny.total).toBe(1)
    expect(stats.overall.shiny.owned).toBe(1)
  })

  it('excludes a shinyLocked form from the shiny denominator', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 25, formName: 'base', shinyLocked: true })]
    const entries: CollectionEntry[] = [makeEntry({ id: 10, formId: 1, owned: true })]
    const stats = computeCompletionStats(forms, entries)
    expect(stats.overall.shiny.total).toBe(0)
    expect(stats.overall.regular.total).toBe(1)
    expect(stats.overall.regular.owned).toBe(1)
  })

  it('buckets by firstAvailableGeneration, sorted ascending', () => {
    const forms: Form[] = [
      makeForm({ id: 1, speciesId: 3, formName: 'base', firstAvailableGeneration: 3 }),
      makeForm({ id: 2, speciesId: 1, formName: 'base', firstAvailableGeneration: 1 })
    ]
    const stats = computeCompletionStats(forms, [])
    expect(stats.byGeneration.map((b) => b.key)).toEqual(['1', '3'])
  })

  it('buckets by regional group in REGIONAL_ORDER, omitting groups with no forms', () => {
    const forms: Form[] = [
      makeForm({ id: 1, speciesId: 26, formName: 'alolan', regionalGroup: 'alolan' }),
      makeForm({ id: 2, speciesId: 37, formName: 'base' }) // no regional group
    ]
    const stats = computeCompletionStats(forms, [])
    expect(stats.byRegionalGroup.map((b) => b.key)).toEqual(['alolan'])
    expect(stats.byRegionalGroup[0].regular.total).toBe(1)
  })

  it('leaves byRegionalGroup empty when no form has a regional group', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 1, formName: 'base' })]
    const stats = computeCompletionStats(forms, [])
    expect(stats.byRegionalGroup).toEqual([])
  })
})
