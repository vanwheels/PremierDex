import { describe, expect, it } from 'vitest'
import type { CollectionEntry } from '@shared/types/pokemon'
import { filterDexSections } from './filterDexSections'
import type { DexFilters, DexRowData, DexSection } from './types'
import { DEFAULT_DEX_FILTERS } from './types'

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
    ...overrides
  }
}

function makeSection(overrides: Partial<DexSection> & Pick<DexSection, 'key'>): DexSection {
  return { heading: overrides.key, speciesId: 1, rows: [], cosmeticRows: [], collapsedDisplayFormId: null, ...overrides }
}

function filters(overrides: Partial<DexFilters>): DexFilters {
  return { ...DEFAULT_DEX_FILTERS, ...overrides }
}

describe('filterDexSections', () => {
  it('passes everything through unfiltered when every dimension is "any"/blank', () => {
    const sections = [makeSection({ key: 's1', rows: [makeRow({ key: 'r1', dexNumber: 1, displayName: 'Bulbasaur' })] })]
    expect(filterDexSections(sections, DEFAULT_DEX_FILTERS)).toEqual(sections)
  })

  it('matches the free-text query against the display name, case-insensitively', () => {
    const rowA = makeRow({ key: 'r1', dexNumber: 1, displayName: 'Bulbasaur' })
    const rowB = makeRow({ key: 'r2', dexNumber: 2, displayName: 'Ivysaur' })
    const sections = [makeSection({ key: 's1', rows: [rowA] }), makeSection({ key: 's2', rows: [rowB] })]
    const result = filterDexSections(sections, filters({ query: 'bulba' }))
    expect(result.map((s) => s.key)).toEqual(['s1'])
  })

  it('matches the free-text query against the dex number', () => {
    const rowA = makeRow({ key: 'r1', dexNumber: 25, displayName: 'Pikachu' })
    const rowB = makeRow({ key: 'r2', dexNumber: 250, displayName: 'Ho-Oh' })
    const sections = [makeSection({ key: 's1', rows: [rowA] }), makeSection({ key: 's2', rows: [rowB] })]
    const result = filterDexSections(sections, filters({ query: '25' }))
    expect(result.map((s) => s.key)).toEqual(['s1', 's2'])
  })

  it('matches the free-text query against nickname and origin fields', () => {
    const nicknamed = makeRow({
      key: 'r1',
      dexNumber: 1,
      displayName: 'Bulbasaur',
      regular: makeEntry({ id: 1, owned: true, nickname: 'Sprout' })
    })
    const withOt = makeRow({
      key: 'r2',
      dexNumber: 2,
      displayName: 'Ivysaur',
      regular: makeEntry({ id: 2, owned: true, otName: 'Vanny' })
    })
    const plain = makeRow({ key: 'r3', dexNumber: 3, displayName: 'Venusaur' })
    const sections = [makeSection({ key: 's', rows: [nicknamed, withOt, plain] })]

    expect(filterDexSections(sections, filters({ query: 'sprout' }))[0].rows.map((r) => r.key)).toEqual(['r1'])
    expect(filterDexSections(sections, filters({ query: 'vanny' }))[0].rows.map((r) => r.key)).toEqual(['r2'])
  })

  it('filters on the owned tri-state using the regular entry', () => {
    const owned = makeRow({ key: 'r1', dexNumber: 1, displayName: 'A', regular: makeEntry({ id: 1, owned: true }) })
    const unowned = makeRow({ key: 'r2', dexNumber: 2, displayName: 'B', regular: makeEntry({ id: 2, owned: false }) })
    const sections = [makeSection({ key: 's', rows: [owned, unowned] })]

    expect(filterDexSections(sections, filters({ owned: 'yes' }))[0].rows.map((r) => r.key)).toEqual(['r1'])
    expect(filterDexSections(sections, filters({ owned: 'no' }))[0].rows.map((r) => r.key)).toEqual(['r2'])
  })

  it('filters on the shiny tri-state using the shiny entry, independent of owned', () => {
    const shinyOwned = makeRow({ key: 'r1', dexNumber: 1, displayName: 'A', shinyEntry: makeEntry({ id: 1, owned: true, shiny: true }) })
    const notShiny = makeRow({ key: 'r2', dexNumber: 2, displayName: 'B' })
    const sections = [makeSection({ key: 's', rows: [shinyOwned, notShiny] })]

    expect(filterDexSections(sections, filters({ shiny: 'yes' }))[0].rows.map((r) => r.key)).toEqual(['r1'])
  })

  it('filters on regional group presence', () => {
    const regional = makeRow({ key: 'r1', dexNumber: 1, displayName: 'Alolan Vulpix', regionalGroup: 'alolan' })
    const notRegional = makeRow({ key: 'r2', dexNumber: 2, displayName: 'Vulpix' })
    const sections = [makeSection({ key: 's', rows: [regional, notRegional] })]

    expect(filterDexSections(sections, filters({ regional: 'yes' }))[0].rows.map((r) => r.key)).toEqual(['r1'])
    expect(filterDexSections(sections, filters({ regional: 'no' }))[0].rows.map((r) => r.key)).toEqual(['r2'])
  })

  it('filters on generation', () => {
    const gen1 = makeRow({ key: 'r1', dexNumber: 1, displayName: 'A', firstAvailableGeneration: 1 })
    const gen3 = makeRow({ key: 'r2', dexNumber: 2, displayName: 'B', firstAvailableGeneration: 3 })
    const sections = [makeSection({ key: 's', rows: [gen1, gen3] })]

    expect(filterDexSections(sections, filters({ generation: 3 }))[0].rows.map((r) => r.key)).toEqual(['r2'])
  })

  it('filters on homeBoxable and shinyLocked tri-states', () => {
    const notBoxable = makeRow({ key: 'r1', dexNumber: 1, displayName: 'A', homeBoxable: false })
    const boxable = makeRow({ key: 'r2', dexNumber: 2, displayName: 'B' })
    const shinyLocked = makeRow({ key: 'r3', dexNumber: 3, displayName: 'C', shinyLocked: true })
    const sections = [makeSection({ key: 's', rows: [notBoxable, boxable, shinyLocked] })]

    expect(filterDexSections(sections, filters({ homeBoxable: 'no' }))[0].rows.map((r) => r.key)).toEqual(['r1'])
    expect(filterDexSections(sections, filters({ shinyLocked: 'yes' }))[0].rows.map((r) => r.key)).toEqual(['r3'])
  })

  it('drops a section entirely when nothing in it matches', () => {
    const row = makeRow({ key: 'r1', dexNumber: 1, displayName: 'Bulbasaur' })
    const sections = [makeSection({ key: 's', rows: [row] })]
    expect(filterDexSections(sections, filters({ query: 'zzz-no-match' }))).toEqual([])
  })

  it('promotes a matching cosmetic row into rows when the base row does not match', () => {
    const base = makeRow({ key: 'base', dexNumber: 201, displayName: 'Unown' })
    const letterA = makeRow({ key: 'a', dexNumber: 201, displayName: 'Unown (A)' })
    const letterZ = makeRow({ key: 'z', dexNumber: 201, displayName: 'Unown (Z)' })
    const sections = [makeSection({ key: 's', rows: [base], cosmeticRows: [letterA, letterZ] })]

    const result = filterDexSections(sections, filters({ query: '(z)' }))
    expect(result).toHaveLength(1)
    expect(result[0].rows.map((r) => r.key)).toEqual(['z'])
    expect(result[0].cosmeticRows).toEqual([])
  })

  it('keeps only matching cosmeticRows alongside a matching base row', () => {
    const base = makeRow({ key: 'base', dexNumber: 201, displayName: 'Unown' })
    const letterA = makeRow({ key: 'a', dexNumber: 201, displayName: 'Unown (A)' })
    const letterZ = makeRow({ key: 'z', dexNumber: 201, displayName: 'Unown (Z)' })
    const sections = [makeSection({ key: 's', rows: [base], cosmeticRows: [letterA, letterZ] })]

    const result = filterDexSections(sections, filters({ query: 'unown' }))
    expect(result[0].rows.map((r) => r.key)).toEqual(['base'])
    expect(result[0].cosmeticRows.map((r) => r.key)).toEqual(['a', 'z'])
  })
})
