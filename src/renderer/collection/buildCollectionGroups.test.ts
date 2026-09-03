import { describe, expect, it } from 'vitest'
import type { CollectionEntry, Form, Species } from '@shared/types/pokemon'
import { buildCollectionGroups } from './buildCollectionGroups'

const SPECIES: Species[] = [
  { id: 1, name: 'bulbasaur', generation: 1 },
  { id: 4, name: 'charmander', generation: 1 },
  { id: 25, name: 'pikachu', generation: 1 }
]

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
    ...overrides
  }
}

const FORMS: Form[] = [
  makeForm({ id: 1, speciesId: 1 }),
  makeForm({ id: 4, speciesId: 4 }),
  makeForm({ id: 25, speciesId: 25 })
]

describe('buildCollectionGroups', () => {
  it('excludes unowned entries', () => {
    const entries = [makeEntry({ id: 1, formId: 1, owned: false })]
    expect(buildCollectionGroups(SPECIES, FORMS, entries, 'originGame')).toEqual([])
  })

  it('groups by shiny with Regular before Shiny', () => {
    const entries = [
      makeEntry({ id: 1, formId: 1, shiny: true }),
      makeEntry({ id: 2, formId: 4, shiny: false })
    ]
    const groups = buildCollectionGroups(SPECIES, FORMS, entries, 'shiny')
    expect(groups.map((g) => g.label)).toEqual(['Regular', 'Shiny'])
    expect(groups[0].rows[0].entry.id).toBe(2)
    expect(groups[1].rows[0].entry.id).toBe(1)
  })

  it('groups by origin game in release order, with unset origin last', () => {
    const entries = [
      makeEntry({ id: 1, formId: 1, originGame: null }),
      makeEntry({ id: 2, formId: 4, originGame: 'Pokémon Scarlet' }),
      makeEntry({ id: 3, formId: 25, originGame: 'Pokémon Red' })
    ]
    const groups = buildCollectionGroups(SPECIES, FORMS, entries, 'originGame')
    expect(groups.map((g) => g.label)).toEqual(['Pokémon Red', 'Pokémon Scarlet', 'No origin set'])
  })

  it('groups by OT alphabetically, with unset OT last', () => {
    const entries = [
      makeEntry({ id: 1, formId: 1, otName: null }),
      makeEntry({ id: 2, formId: 4, otName: 'Zoe' }),
      makeEntry({ id: 3, formId: 25, otName: 'Ash' })
    ]
    const groups = buildCollectionGroups(SPECIES, FORMS, entries, 'ot')
    expect(groups.map((g) => g.label)).toEqual(['Ash', 'Zoe', 'No OT set'])
  })

  it('groups by OT on the TID/SID pair, keeping same-named-but-distinct trainers apart', () => {
    const entries = [
      makeEntry({ id: 1, formId: 1, otName: 'Vanny', tid: 11111, sid: 1 }),
      makeEntry({ id: 2, formId: 4, otName: 'Vanny', tid: 22222, sid: 2 }),
      makeEntry({ id: 3, formId: 25, otName: 'Vanny', tid: 11111, sid: 1 })
    ]
    const groups = buildCollectionGroups(SPECIES, FORMS, entries, 'ot')
    expect(groups).toHaveLength(2)
    const trainerGroups = groups.filter((g) => g.label === 'Vanny')
    expect(trainerGroups).toHaveLength(2)
    const idsByGroup = trainerGroups.map((g) => g.rows.map((r) => r.entry.id).sort())
    expect(idsByGroup).toContainEqual([1, 3])
    expect(idsByGroup).toContainEqual([2])
  })

  it('groups by OT name when tid/sid are unset, unaffected by unrelated same-name entries with tid/sid', () => {
    const entries = [
      makeEntry({ id: 1, formId: 1, otName: 'Ash', tid: null, sid: null }),
      makeEntry({ id: 2, formId: 4, otName: 'Ash', tid: 12345, sid: 6 })
    ]
    const groups = buildCollectionGroups(SPECIES, FORMS, entries, 'ot')
    expect(groups).toHaveLength(2)
    expect(groups.every((g) => g.label === 'Ash')).toBe(true)
  })

  it('orders rows within a group by dex number', () => {
    const entries = [
      makeEntry({ id: 1, formId: 25, otName: 'Ash' }),
      makeEntry({ id: 2, formId: 1, otName: 'Ash' })
    ]
    const groups = buildCollectionGroups(SPECIES, FORMS, entries, 'ot')
    expect(groups[0].rows.map((r) => r.dexNumber)).toEqual([1, 25])
  })

  it('marks the display name with gender symbol and shiny sparkle', () => {
    const genderForm = makeForm({ id: 26, speciesId: 25, hasGenderDifference: true })
    const entries = [makeEntry({ id: 1, formId: 26, gender: 'female', shiny: true })]
    const groups = buildCollectionGroups(SPECIES, [...FORMS, genderForm], entries, 'shiny')
    expect(groups[0].rows[0].displayName).toBe('Pikachu ♀ ✨')
  })
})
