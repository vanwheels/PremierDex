import { describe, expect, it, vi } from 'vitest'
import type { CollectionEntry, Form, Species } from '@shared/types/pokemon'
import type { BoxPlaceholder, StorageBox } from '@shared/types/box'
import { applyTemplate } from './applyTemplate'

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
    isAlpha: false,
    captureDate: null,
    sizeClass: null,
    ...overrides
  }
}

function makeBox(boxNumber: number): StorageBox {
  return { id: boxNumber, storageLocationId: 1, boxNumber, name: null }
}

describe('applyTemplate', () => {
  it('is a no-op when the tier is already fully satisfied in this location', async () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 1 })]
    const species: Species[] = []
    const entries: CollectionEntry[] = [makeEntry({ id: 1, formId: 1, boxNumber: 1, boxSlot: 0 })]
    const onAddBox = vi.fn()
    const onSetBoxPlaceholders = vi.fn()

    await applyTemplate({
      tier: 'living',
      color: 'regular',
      forms,
      species,
      entries,
      boxPlaceholders: [],
      storageBoxes: [makeBox(1)],
      storageLocationId: 1,
      onAddBox,
      onSetBoxPlaceholders
    })

    expect(onAddBox).not.toHaveBeenCalled()
    expect(onSetBoxPlaceholders).not.toHaveBeenCalled()
  })

  it('places units into existing empty slots without creating boxes when there is enough room', async () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 1 }), makeForm({ id: 2, speciesId: 2 })]
    const onAddBox = vi.fn()
    const onSetBoxPlaceholders = vi.fn()

    await applyTemplate({
      tier: 'living',
      color: 'regular',
      forms,
      species: [],
      entries: [],
      boxPlaceholders: [],
      storageBoxes: [makeBox(1)],
      storageLocationId: 7,
      onAddBox,
      onSetBoxPlaceholders
    })

    expect(onAddBox).not.toHaveBeenCalled()
    expect(onSetBoxPlaceholders).toHaveBeenCalledWith(7, [
      { boxNumber: 1, boxSlot: 0, formId: 1, gender: 'unknown', shiny: false },
      { boxNumber: 1, boxSlot: 1, formId: 2, gender: 'unknown', shiny: false }
    ])
  })

  it('creates new boxes sequentially via onAddBox to fit units that overflow existing boxes', async () => {
    // BOX_SIZE is 30 (5x6) — 31 required units overflow a single existing box by one slot.
    const forms: Form[] = Array.from({ length: 31 }, (_, i) => makeForm({ id: i + 1, speciesId: i + 1 }))
    const onAddBox = vi.fn(async () => makeBox(2))
    const onSetBoxPlaceholders = vi.fn()

    await applyTemplate({
      tier: 'living',
      color: 'regular',
      forms,
      species: [],
      entries: [],
      boxPlaceholders: [],
      storageBoxes: [makeBox(1)],
      storageLocationId: 3,
      onAddBox,
      onSetBoxPlaceholders
    })

    expect(onAddBox).toHaveBeenCalledTimes(1)
    expect(onAddBox).toHaveBeenCalledWith(3)
    const placements = onSetBoxPlaceholders.mock.calls[0][1]
    expect(placements).toHaveLength(31)
    expect(placements[30]).toEqual({ boxNumber: 2, boxSlot: 0, formId: 31, gender: 'unknown', shiny: false })
  })

  it('skips slots already occupied by a real entry or an existing placeholder', async () => {
    const forms: Form[] = [makeForm({ id: 1, speciesId: 1 }), makeForm({ id: 2, speciesId: 2 })]
    const entries: CollectionEntry[] = [makeEntry({ id: 1, formId: 99, boxNumber: 1, boxSlot: 0 })]
    const boxPlaceholders: BoxPlaceholder[] = [
      { id: 1, storageLocationId: 1, boxNumber: 1, boxSlot: 1, formId: 98, gender: 'unknown', shiny: false }
    ]
    const onAddBox = vi.fn()
    const onSetBoxPlaceholders = vi.fn()

    await applyTemplate({
      tier: 'living',
      color: 'regular',
      forms,
      species: [],
      entries,
      boxPlaceholders,
      storageBoxes: [makeBox(1)],
      storageLocationId: 1,
      onAddBox,
      onSetBoxPlaceholders
    })

    expect(onSetBoxPlaceholders).toHaveBeenCalledWith(1, [
      { boxNumber: 1, boxSlot: 2, formId: 1, gender: 'unknown', shiny: false },
      { boxNumber: 1, boxSlot: 3, formId: 2, gender: 'unknown', shiny: false }
    ])
  })
})
