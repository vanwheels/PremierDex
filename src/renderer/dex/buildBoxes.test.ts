import { describe, expect, it } from 'vitest'
import type { CollectionEntry, Form, Species } from '@shared/types/pokemon'
import { BOX_SIZE, buildBoxes, buildUnboxedEntries } from './buildBoxes'

const SPECIES: Species[] = [
  { id: 1, name: 'bulbasaur', generation: 1, collapsedDisplayFormId: null },
  { id: 25, name: 'pikachu', generation: 1, collapsedDisplayFormId: null }
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
    caughtBall: null,
    metLocation: null,
    storageLocationId: 1,
    boxNumber: null,
    boxSlot: null,
    ...overrides
  }
}

const FORMS: Form[] = [makeForm({ id: 1, speciesId: 1 }), makeForm({ id: 2, speciesId: 25 })]

describe('buildBoxes', () => {
  it('always includes box 1 even with no boxed entries', () => {
    const boxes = buildBoxes(SPECIES, FORMS, [])
    expect(boxes).toEqual([{ boxNumber: 1, cells: new Array(BOX_SIZE).fill(null) }])
  })

  it('places a boxed entry at its slot, leaving the rest null', () => {
    const entry = makeEntry({ id: 1, formId: 1, boxNumber: 1, boxSlot: 5 })
    const boxes = buildBoxes(SPECIES, FORMS, [entry])
    expect(boxes).toHaveLength(1)
    expect(boxes[0].cells[5]).toMatchObject({ boxNumber: 1, slot: 5, displayName: 'Bulbasaur', entry })
    expect(boxes[0].cells.filter((c) => c !== null)).toHaveLength(1)
  })

  it('renders an unowned placeholder entry as a real cell too', () => {
    const entry = makeEntry({ id: 1, formId: 1, owned: false, boxNumber: 1, boxSlot: 0 })
    const boxes = buildBoxes(SPECIES, FORMS, [entry])
    expect(boxes[0].cells[0]?.entry.owned).toBe(false)
  })

  it('places two entries in the same box at their own independent slots', () => {
    const entries = [
      makeEntry({ id: 1, formId: 1, boxNumber: 1, boxSlot: 0 }),
      makeEntry({ id: 2, formId: 2, boxNumber: 1, boxSlot: 5 })
    ]
    const boxes = buildBoxes(SPECIES, FORMS, entries)
    expect(boxes).toHaveLength(1)
    expect(boxes[0].cells[0]?.entry.id).toBe(1)
    expect(boxes[0].cells[5]?.entry.id).toBe(2)
    expect(boxes[0].cells.filter((c) => c !== null)).toHaveLength(2)
  })

  it('produces one Box per distinct box number, sorted ascending, skipping unused numbers', () => {
    const entries = [
      makeEntry({ id: 1, formId: 1, boxNumber: 3, boxSlot: 0 }),
      makeEntry({ id: 2, formId: 2, boxNumber: 1, boxSlot: 0 })
    ]
    const boxes = buildBoxes(SPECIES, FORMS, entries)
    expect(boxes.map((b) => b.boxNumber)).toEqual([1, 3])
  })

  it('ignores an entry with only one of boxNumber/boxSlot set', () => {
    const entry = makeEntry({ id: 1, formId: 1, boxNumber: 2, boxSlot: null })
    const boxes = buildBoxes(SPECIES, FORMS, [entry])
    expect(boxes).toHaveLength(1) // just the always-present Box 1
  })

  it('skips an entry whose slot is out of the 0-29 range', () => {
    const entry = makeEntry({ id: 1, formId: 1, boxNumber: 1, boxSlot: 30 })
    const boxes = buildBoxes(SPECIES, FORMS, [entry])
    expect(boxes[0].cells.every((c) => c === null)).toBe(true)
  })

  it('skips an entry whose form or species cannot be resolved', () => {
    const entry = makeEntry({ id: 1, formId: 999, boxNumber: 1, boxSlot: 0 })
    const boxes = buildBoxes(SPECIES, FORMS, [entry])
    expect(boxes[0].cells[0]).toBeNull()
  })

  it('appends gender symbol and shiny marker to the display name', () => {
    const genderedForm = makeForm({ id: 3, speciesId: 25, hasGenderDifference: true })
    const entry = makeEntry({ id: 1, formId: 3, gender: 'female', shiny: true, boxNumber: 1, boxSlot: 0 })
    const boxes = buildBoxes(SPECIES, [...FORMS, genderedForm], [entry])
    expect(boxes[0].cells[0]?.displayName).toBe('Pikachu ♀ ✨')
  })
})

describe('buildUnboxedEntries', () => {
  it('excludes entries that already have a box position', () => {
    const entries = [
      makeEntry({ id: 1, formId: 1, boxNumber: 1, boxSlot: 0 }),
      makeEntry({ id: 2, formId: 2 })
    ]
    const result = buildUnboxedEntries(SPECIES, FORMS, entries)
    expect(result.map((e) => e.entry.id)).toEqual([2])
  })

  it('includes an unowned placeholder entry', () => {
    const entry = makeEntry({ id: 1, formId: 1, owned: false })
    const result = buildUnboxedEntries(SPECIES, FORMS, [entry])
    expect(result).toHaveLength(1)
    expect(result[0].entry.owned).toBe(false)
  })

  it('skips an entry whose form or species cannot be resolved', () => {
    const entry = makeEntry({ id: 1, formId: 999 })
    expect(buildUnboxedEntries(SPECIES, FORMS, [entry])).toEqual([])
  })

  it('sorts by dex number, then display name', () => {
    const entries = [
      makeEntry({ id: 1, formId: 2 }), // pikachu, dex 25
      makeEntry({ id: 2, formId: 1 }) // bulbasaur, dex 1
    ]
    const result = buildUnboxedEntries(SPECIES, FORMS, entries)
    expect(result.map((e) => e.entry.id)).toEqual([2, 1])
  })
})
