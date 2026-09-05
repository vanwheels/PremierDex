import { describe, expect, it } from 'vitest'
import type { CollectionEntry } from '@shared/types/pokemon'
import { buildHybridTiles } from './buildHybridTiles'
import type { DexRowData, DexSection } from './types'

function makeEntry(overrides: Partial<CollectionEntry> & Pick<CollectionEntry, 'id'>): CollectionEntry {
  return {
    formId: 1,
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
    genderConfirmed: false,
    ...overrides
  }
}

function makeRow(overrides: Partial<DexRowData> & Pick<DexRowData, 'key' | 'dexNumber' | 'displayName'>): DexRowData {
  return {
    formId: 1,
    regular: null,
    shinyEntry: null,
    pokeapiId: 1,
    spriteFormSuffix: null,
    femaleSprite: false,
    firstAvailableGeneration: 1,
    homeBoxable: true,
    shinyLocked: false,
    alwaysShiny: false,
    regionalGroup: null,
    hasGenderDifference: false,
    ...overrides
  }
}

function makeSection(overrides: Partial<DexSection> & Pick<DexSection, 'key'>): DexSection {
  return { heading: overrides.key, speciesId: 1, rows: [], cosmeticRows: [], collapsedDisplayFormId: null, ...overrides }
}

describe('buildHybridTiles', () => {
  it('emits both a regular and a shiny tile for a fully-seeded row', () => {
    const row = makeRow({
      key: 'r1',
      dexNumber: 1,
      displayName: 'Bulbasaur',
      regular: makeEntry({ id: 1, owned: true }),
      shinyEntry: makeEntry({ id: 2, shiny: true, owned: false })
    })
    const tiles = buildHybridTiles([makeSection({ key: 's', rows: [row] })])
    expect(tiles.map((t) => [t.key, t.shiny, t.entry.owned])).toEqual([
      ['r1-regular', false, true],
      ['r1-shiny', true, false]
    ])
  })

  it('skips a slot entirely when no CollectionEntry exists for it', () => {
    const alwaysShinyRow = makeRow({
      key: 'r1',
      dexNumber: 1,
      displayName: 'Spiky-eared Pichu',
      regular: null,
      shinyEntry: makeEntry({ id: 1, shiny: true, owned: true })
    })
    const shinyLockedRow = makeRow({
      key: 'r2',
      dexNumber: 2,
      displayName: 'A',
      regular: makeEntry({ id: 2, owned: false }),
      shinyEntry: null
    })
    const tiles = buildHybridTiles([makeSection({ key: 's', rows: [alwaysShinyRow, shinyLockedRow] })])
    expect(tiles.map((t) => t.key)).toEqual(['r1-shiny', 'r2-regular'])
  })

  it('produces no tiles for a row with neither entry owned nor placed', () => {
    const row = makeRow({ key: 'r1', dexNumber: 1, displayName: 'A', regular: null, shinyEntry: null })
    expect(buildHybridTiles([makeSection({ key: 's', rows: [row] })])).toEqual([])
  })

  it('ignores cosmeticRows — Hybrid has no expand/collapse affordance', () => {
    const base = makeRow({ key: 'base', dexNumber: 201, displayName: 'Unown', regular: makeEntry({ id: 1, owned: true }) })
    const letterA = makeRow({ key: 'a', dexNumber: 201, displayName: 'Unown (A)', regular: makeEntry({ id: 2, owned: true }) })
    const tiles = buildHybridTiles([makeSection({ key: 's', rows: [base], cosmeticRows: [letterA] })])
    expect(tiles.map((t) => t.key)).toEqual(['base-regular'])
  })

  it('flattens tiles across multiple sections in order', () => {
    const rowA = makeRow({ key: 'a', dexNumber: 1, displayName: 'A', regular: makeEntry({ id: 1, owned: true }) })
    const rowB = makeRow({ key: 'b', dexNumber: 2, displayName: 'B', regular: makeEntry({ id: 2, owned: true }) })
    const sections = [makeSection({ key: 's1', rows: [rowA] }), makeSection({ key: 's2', rows: [rowB] })]
    expect(buildHybridTiles(sections).map((t) => t.key)).toEqual(['a-regular', 'b-regular'])
  })
})
