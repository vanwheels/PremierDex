import { describe, expect, it } from 'vitest'
import type { CollectionEntry, Form, Species } from '@shared/types/pokemon'
import type { BoxPlaceholder } from '@shared/types/box'
import { TIER_CONFIGS } from './completionStats'
import {
  buildOccupiedUnitIndex,
  buildPlaceholderKeys,
  canonicalPlaceholderForm,
  computeFillInPlacements,
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

function makeSpecies(overrides: Partial<Species> & Pick<Species, 'id'>): Species {
  return { name: 'species', generation: 1, collapsedDisplayFormId: null, isFinalEvolutionStage: true, ...overrides }
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
    isAlpha: false,
    captureDate: null,
    ...overrides
  }
}

describe('requiredUnits', () => {
  it('excludes non_boxable forms under every tier', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 1, formCategory: 'non_boxable' })]
    expect(requiredUnits(TIER_CONFIGS.living, 'regular', forms, [])).toEqual([])
  })

  it('excludes cosmetic_variant forms unless the tier includes them', () => {
    const forms: Form[] = [
      makeForm({ id: 1, speciesId: 1 }),
      makeForm({ id: 2, speciesId: 1, formCategory: 'cosmetic_variant' })
    ]
    expect(requiredUnits(TIER_CONFIGS.living, 'regular', forms, [])).toEqual([{ formId: 1, gender: 'unknown', shiny: false }])
    expect(requiredUnits(TIER_CONFIGS.livingFormLite, 'regular', forms, [])).toEqual([
      { formId: 1, gender: 'unknown', shiny: false },
      { formId: 2, gender: 'unknown', shiny: false }
    ])
  })

  it('collapses a gender-diff form to one male-keyed unit when the tier doesn\'t split by gender', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 1, hasGenderDifference: true })]
    expect(requiredUnits(TIER_CONFIGS.living, 'regular', forms, [])).toEqual([{ formId: 1, gender: 'male', shiny: false }])
  })

  it('splits a gender-diff form into male and female units when the tier does', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 1, hasGenderDifference: true })]
    expect(requiredUnits(TIER_CONFIGS.livingForm, 'regular', forms, [])).toEqual([
      { formId: 1, gender: 'male', shiny: false },
      { formId: 1, gender: 'female', shiny: false }
    ])
  })

  it('excludes an alwaysShiny form from the regular color, a shinyLocked one from shiny', () => {
    const forms: Form[] = [
      makeForm({ id: 1, speciesId: 1, alwaysShiny: true }),
      makeForm({ id: 2, speciesId: 2, shinyLocked: true })
    ]
    expect(requiredUnits(TIER_CONFIGS.living, 'regular', forms, [])).toEqual([{ formId: 2, gender: 'unknown', shiny: false }])
    expect(requiredUnits(TIER_CONFIGS.living, 'shiny', forms, [])).toEqual([{ formId: 1, gender: 'unknown', shiny: true }])
  })

  it('excludes a pre-evolution species when the tier excludes pre-evolutions', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 1 }), makeForm({ id: 2, speciesId: 2 })]
    const species: Species[] = [
      makeSpecies({ id: 1, isFinalEvolutionStage: false }),
      makeSpecies({ id: 2, isFinalEvolutionStage: true })
    ]
    expect(requiredUnits(TIER_CONFIGS.finalForm, 'regular', forms, species)).toEqual([{ formId: 2, gender: 'unknown', shiny: false }])
  })

  it('does not exclude pre-evolutions when the tier leaves excludePreEvolutions off', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 1 })]
    const species: Species[] = [makeSpecies({ id: 1, isFinalEvolutionStage: false })]
    expect(requiredUnits(TIER_CONFIGS.living, 'regular', forms, species)).toEqual([{ formId: 1, gender: 'unknown', shiny: false }])
  })

  it('treats a form whose species is missing from the list as a pre-evolution (excluded)', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 1 })]
    expect(requiredUnits(TIER_CONFIGS.finalForm, 'regular', forms, [])).toEqual([])
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
      species: [],
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
      species: [],
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
      species: [],
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
      species: [],
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
      species: [],
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

function makePlaceholder(overrides: Partial<BoxPlaceholder> & Pick<BoxPlaceholder, 'id' | 'boxNumber' | 'boxSlot' | 'formId'>): BoxPlaceholder {
  return { storageLocationId: 1, gender: 'unknown', shiny: false, ...overrides }
}

describe('computeFillInPlacements', () => {
  it('fills a placeholder from an unboxed owned individual matching its exact key', () => {
    const placeholders = [makePlaceholder({ id: 1, boxNumber: 1, boxSlot: 0, formId: 1 })]
    const entries = [makeEntry({ id: 10, formId: 1 })]
    expect(computeFillInPlacements({ placeholders, entries, forms: [] })).toEqual([
      { entryId: 10, boxNumber: 1, boxSlot: 0 }
    ])
  })

  it('leaves the placeholder a ghost when only an already-boxed copy matches', () => {
    const placeholders = [makePlaceholder({ id: 1, boxNumber: 1, boxSlot: 0, formId: 1 })]
    const entries = [makeEntry({ id: 10, formId: 1, boxNumber: 2, boxSlot: 5 })]
    expect(computeFillInPlacements({ placeholders, entries, forms: [] })).toEqual([])
  })

  it('ignores an unowned entry even if it otherwise matches', () => {
    const placeholders = [makePlaceholder({ id: 1, boxNumber: 1, boxSlot: 0, formId: 1 })]
    const entries = [makeEntry({ id: 10, formId: 1, owned: false })]
    expect(computeFillInPlacements({ placeholders, entries, forms: [] })).toEqual([])
  })

  it('picks the lowest-id candidate and leaves the rest untouched', () => {
    const placeholders = [makePlaceholder({ id: 1, boxNumber: 1, boxSlot: 0, formId: 1 })]
    const entries = [makeEntry({ id: 20, formId: 1 }), makeEntry({ id: 10, formId: 1 }), makeEntry({ id: 30, formId: 1 })]
    expect(computeFillInPlacements({ placeholders, entries, forms: [] })).toEqual([{ entryId: 10, boxNumber: 1, boxSlot: 0 }])
  })

  it('never consumes the same candidate twice across two placeholders', () => {
    const placeholders = [
      makePlaceholder({ id: 1, boxNumber: 1, boxSlot: 0, formId: 1 }),
      makePlaceholder({ id: 2, boxNumber: 1, boxSlot: 1, formId: 1 })
    ]
    const entries = [makeEntry({ id: 10, formId: 1 })]
    expect(computeFillInPlacements({ placeholders, entries, forms: [] })).toEqual([{ entryId: 10, boxNumber: 1, boxSlot: 0 }])
  })

  it('a male-keyed placeholder on a gender-diff form is satisfied by an unboxed female individual', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 1, hasGenderDifference: true })]
    const placeholders = [makePlaceholder({ id: 1, boxNumber: 1, boxSlot: 0, formId: 1, gender: 'male' })]
    const entries = [makeEntry({ id: 10, formId: 1, gender: 'female' })]
    expect(computeFillInPlacements({ placeholders, entries, forms })).toEqual([{ entryId: 10, boxNumber: 1, boxSlot: 0 }])
  })

  it('a female-keyed placeholder is NOT satisfied by an unboxed male individual (strict)', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 1, hasGenderDifference: true })]
    const placeholders = [makePlaceholder({ id: 1, boxNumber: 1, boxSlot: 0, formId: 1, gender: 'female' })]
    const entries = [makeEntry({ id: 10, formId: 1, gender: 'male' })]
    expect(computeFillInPlacements({ placeholders, entries, forms })).toEqual([])
  })

  it('a male-keyed collapsed placeholder prefers the lowest id across both gender pools', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 1, hasGenderDifference: true })]
    const placeholders = [makePlaceholder({ id: 1, boxNumber: 1, boxSlot: 0, formId: 1, gender: 'male' })]
    const entries = [makeEntry({ id: 20, formId: 1, gender: 'male' }), makeEntry({ id: 10, formId: 1, gender: 'female' })]
    expect(computeFillInPlacements({ placeholders, entries, forms })).toEqual([{ entryId: 10, boxNumber: 1, boxSlot: 0 }])
  })

  // Bug report: "Duplicate Storage Location" clones every entry as a fresh (higher-id) row
  // landing unboxed in the new location — a plain lowest-id rule reaches past that brand-new
  // local clone and raids the *original* location's own (lower-id) individual instead,
  // stranding the local clone unboxed while the raided original lands in this location's box.
  it('prefers a candidate already unboxed in the placeholder\'s own location over a lower id elsewhere', () => {
    const placeholders = [makePlaceholder({ id: 1, boxNumber: 1, boxSlot: 0, formId: 1, storageLocationId: 5 })]
    const entries = [
      makeEntry({ id: 10, formId: 1, storageLocationId: 1 }), // lower id, but a different location
      makeEntry({ id: 20, formId: 1, storageLocationId: 5 }) // higher id, but local to the placeholder
    ]
    expect(computeFillInPlacements({ placeholders, entries, forms: [] })).toEqual([{ entryId: 20, boxNumber: 1, boxSlot: 0 }])
  })

  it('falls back to the lowest id collection-wide when the placeholder\'s own location has no unboxed match', () => {
    const placeholders = [makePlaceholder({ id: 1, boxNumber: 1, boxSlot: 0, formId: 1, storageLocationId: 5 })]
    const entries = [makeEntry({ id: 20, formId: 1, storageLocationId: 1 }), makeEntry({ id: 10, formId: 1, storageLocationId: 2 })]
    expect(computeFillInPlacements({ placeholders, entries, forms: [] })).toEqual([{ entryId: 10, boxNumber: 1, boxSlot: 0 }])
  })

  it('the local-first preference also applies across a male-keyed collapsed placeholder\'s two gender pools', () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 1, hasGenderDifference: true })]
    const placeholders = [makePlaceholder({ id: 1, boxNumber: 1, boxSlot: 0, formId: 1, gender: 'male', storageLocationId: 5 })]
    const entries = [
      makeEntry({ id: 10, formId: 1, gender: 'male', storageLocationId: 1 }), // lower id, elsewhere
      makeEntry({ id: 20, formId: 1, gender: 'female', storageLocationId: 5 }) // higher id, but local
    ]
    expect(computeFillInPlacements({ placeholders, entries, forms })).toEqual([{ entryId: 20, boxNumber: 1, boxSlot: 0 }])
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
