import { describe, expect, it } from 'vitest'
import type { CollectionEntry, Form } from '@shared/types/pokemon'
import { TIER_CONFIGS } from './completionStats'
import {
  buildOccupiedUnitIndex,
  buildPlaceholderKeys,
  canonicalPlaceholderForm,
  countAvailableSlots,
  extraBoxesNeeded,
  pendingRequiredUnits,
  placeUnitsIntoSlots,
  requiredUnits
} from './boxTemplates'

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

describe('requiredUnits', () => {
  it('excludes non_boxable forms under every tier', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 1, formCategory: 'non_boxable' })]
    expect(requiredUnits(TIER_CONFIGS.living, 'regular', forms)).toEqual([])
  })

  it('excludes cosmetic_variant forms unless the tier includes them', () => {
    const forms: Form[] = [
      makeForm({ id: 1, speciesId: 1 }),
      makeForm({ id: 2, speciesId: 1, formCategory: 'cosmetic_variant' })
    ]
    expect(requiredUnits(TIER_CONFIGS.living, 'regular', forms)).toEqual([{ formId: 1, gender: 'unknown', shiny: false }])
    expect(requiredUnits(TIER_CONFIGS.livingFormLite, 'regular', forms)).toEqual([
      { formId: 1, gender: 'unknown', shiny: false },
      { formId: 2, gender: 'unknown', shiny: false }
    ])
  })

  it('collapses a gender-diff form to one male-keyed unit when the tier doesn\'t split by gender', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 1, hasGenderDifference: true })]
    expect(requiredUnits(TIER_CONFIGS.living, 'regular', forms)).toEqual([{ formId: 1, gender: 'male', shiny: false }])
  })

  it('splits a gender-diff form into male and female units when the tier does', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 1, hasGenderDifference: true })]
    expect(requiredUnits(TIER_CONFIGS.livingForm, 'regular', forms)).toEqual([
      { formId: 1, gender: 'male', shiny: false },
      { formId: 1, gender: 'female', shiny: false }
    ])
  })

  it('excludes an alwaysShiny form from the regular color, a shinyLocked one from shiny', () => {
    const forms: Form[] = [
      makeForm({ id: 1, speciesId: 1, alwaysShiny: true }),
      makeForm({ id: 2, speciesId: 2, shinyLocked: true })
    ]
    expect(requiredUnits(TIER_CONFIGS.living, 'regular', forms)).toEqual([{ formId: 2, gender: 'unknown', shiny: false }])
    expect(requiredUnits(TIER_CONFIGS.living, 'shiny', forms)).toEqual([{ formId: 1, gender: 'unknown', shiny: true }])
  })
})

describe('pendingRequiredUnits', () => {
  const forms: Form[] = [makeForm({ id: 1, speciesId: 1, hasGenderDifference: true })]

  it('drops a unit a real entry already occupies a slot for, under its literal key', () => {
    const occupiedUnitIndex = buildOccupiedUnitIndex([makeEntry({ id: 1, formId: 1, gender: 'male', boxNumber: 1, boxSlot: 0 })])
    const pending = pendingRequiredUnits({
      tierConfig: TIER_CONFIGS.living,
      color: 'regular',
      forms,
      occupiedUnitIndex,
      existingPlaceholderKeys: new Set()
    })
    expect(pending).toEqual([])
  })

  it('collapsed representative: a female occupying a slot also satisfies the male-keyed unit', () => {
    const occupiedUnitIndex = buildOccupiedUnitIndex([makeEntry({ id: 1, formId: 1, gender: 'female', boxNumber: 1, boxSlot: 0 })])
    const pending = pendingRequiredUnits({
      tierConfig: TIER_CONFIGS.living,
      color: 'regular',
      forms,
      occupiedUnitIndex,
      existingPlaceholderKeys: new Set()
    })
    expect(pending).toEqual([])
  })

  it('splitByGender tiers still need the other gender even once one occupies a slot', () => {
    const occupiedUnitIndex = buildOccupiedUnitIndex([makeEntry({ id: 1, formId: 1, gender: 'male', boxNumber: 1, boxSlot: 0 })])
    const pending = pendingRequiredUnits({
      tierConfig: TIER_CONFIGS.livingForm,
      color: 'regular',
      forms,
      occupiedUnitIndex,
      existingPlaceholderKeys: new Set()
    })
    expect(pending).toEqual([{ formId: 1, gender: 'female', shiny: false }])
  })

  it('drops a unit already placeholder\'d — additive-only re-apply', () => {
    const existingPlaceholderKeys = buildPlaceholderKeys([{ formId: 1, gender: 'male', shiny: false }])
    const pending = pendingRequiredUnits({
      tierConfig: TIER_CONFIGS.living,
      color: 'regular',
      forms,
      occupiedUnitIndex: new Set(),
      existingPlaceholderKeys
    })
    expect(pending).toEqual([])
  })

  it('total-based (Leg 6): a unit owned but not boxed in this location is NOT dropped', () => {
    // owned: true but boxNumber/boxSlot null (makeEntry's own defaults) — owned somewhere
    // else, or not currently boxed at all, neither of which excludes it any more.
    const occupiedUnitIndex = buildOccupiedUnitIndex([makeEntry({ id: 1, formId: 1, gender: 'male', owned: true })])
    const pending = pendingRequiredUnits({
      tierConfig: TIER_CONFIGS.living,
      color: 'regular',
      forms,
      occupiedUnitIndex,
      existingPlaceholderKeys: new Set()
    })
    expect(pending).toEqual([{ formId: 1, gender: 'male', shiny: false }])
  })
})

describe('placeUnitsIntoSlots', () => {
  it('fills empty slots in box-then-slot order, skipping occupied ones', () => {
    const units = [
      { formId: 1, gender: 'unknown' as const, shiny: false },
      { formId: 2, gender: 'unknown' as const, shiny: false }
    ]
    const placements = placeUnitsIntoSlots(units, [1], new Set(['1:0']))
    expect(placements).toEqual([
      { boxNumber: 1, boxSlot: 1, formId: 1, gender: 'unknown', shiny: false },
      { boxNumber: 1, boxSlot: 2, formId: 2, gender: 'unknown', shiny: false }
    ])
  })

  it('overflows into a later box once an earlier one is full', () => {
    const units = [{ formId: 1, gender: 'unknown' as const, shiny: false }]
    const occupied = new Set(Array.from({ length: 30 }, (_, i) => `1:${i}`))
    const placements = placeUnitsIntoSlots(units, [1, 2], occupied)
    expect(placements).toEqual([{ boxNumber: 2, boxSlot: 0, formId: 1, gender: 'unknown', shiny: false }])
  })

  it('places fewer than units.length when boxNumbers runs out of room', () => {
    const units = [
      { formId: 1, gender: 'unknown' as const, shiny: false },
      { formId: 2, gender: 'unknown' as const, shiny: false }
    ]
    const occupied = new Set(Array.from({ length: 29 }, (_, i) => `1:${i}`))
    const placements = placeUnitsIntoSlots(units, [1], occupied)
    expect(placements).toEqual([{ boxNumber: 1, boxSlot: 29, formId: 1, gender: 'unknown', shiny: false }])
  })
})

describe('countAvailableSlots / extraBoxesNeeded', () => {
  it('computes remaining capacity across a box count', () => {
    expect(countAvailableSlots(2, 40)).toBe(20)
  })

  it('needs zero extra boxes when capacity already covers the unit count', () => {
    expect(extraBoxesNeeded(10, 20)).toBe(0)
  })

  it('rounds up to a whole extra box for any shortfall', () => {
    expect(extraBoxesNeeded(31, 0)).toBe(2)
  })
})

describe('canonicalPlaceholderForm', () => {
  it('picks the species\' first boxable form', () => {
    const forms: Form[] = [
      makeForm({ id: 1, speciesId: 1, formCategory: 'non_boxable' }),
      makeForm({ id: 2, speciesId: 1 })
    ]
    expect(canonicalPlaceholderForm(1, forms)?.id).toBe(2)
  })

  it('falls back to the first form at all when every one is non_boxable', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 1, formCategory: 'non_boxable' })]
    expect(canonicalPlaceholderForm(1, forms)?.id).toBe(1)
  })

  it('returns undefined when the species has no forms', () => {
    expect(canonicalPlaceholderForm(999, [])).toBeUndefined()
  })
})
