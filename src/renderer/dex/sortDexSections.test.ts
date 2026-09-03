import { describe, expect, it } from 'vitest'
import type { CollectionEntry } from '@shared/types/pokemon'
import { sortDexSections } from './sortDexSections'
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

function makeSection(overrides: Partial<DexSection> & Pick<DexSection, 'key' | 'rows'>): DexSection {
  return { heading: overrides.key, speciesId: 1, cosmeticRows: [], collapsedDisplayFormId: null, ...overrides }
}

describe('sortDexSections', () => {
  it('leaves the input order untouched when sort is null', () => {
    const a = makeSection({ key: 'a', rows: [makeRow({ key: 'r1', dexNumber: 2, displayName: 'B' })] })
    const b = makeSection({ key: 'b', rows: [makeRow({ key: 'r2', dexNumber: 1, displayName: 'A' })] })
    expect(sortDexSections([a, b], null)).toEqual([a, b])
  })

  it('sorts by dex number, ascending and descending', () => {
    const a = makeSection({ key: 'a', rows: [makeRow({ key: 'r1', dexNumber: 25, displayName: 'Pikachu' })] })
    const b = makeSection({ key: 'b', rows: [makeRow({ key: 'r2', dexNumber: 1, displayName: 'Bulbasaur' })] })
    expect(sortDexSections([a, b], { key: 'dexNumber', direction: 'asc' }).map((s) => s.key)).toEqual(['b', 'a'])
    expect(sortDexSections([a, b], { key: 'dexNumber', direction: 'desc' }).map((s) => s.key)).toEqual(['a', 'b'])
  })

  it('sorts by name, case-insensitively, using the section heading', () => {
    const zed = makeSection({ heading: 'Zubat', key: 'z', rows: [makeRow({ key: 'r1', dexNumber: 41, displayName: 'Zubat' })] })
    const abra = makeSection({ heading: 'abra', key: 'a', rows: [makeRow({ key: 'r2', dexNumber: 63, displayName: 'abra' })] })
    expect(sortDexSections([zed, abra], { key: 'name', direction: 'asc' }).map((s) => s.key)).toEqual(['a', 'z'])
  })

  it('sorts by generation using the first row', () => {
    const gen3 = makeSection({ key: 'g3', rows: [makeRow({ key: 'r1', dexNumber: 1, displayName: 'A', firstAvailableGeneration: 3 })] })
    const gen1 = makeSection({ key: 'g1', rows: [makeRow({ key: 'r2', dexNumber: 2, displayName: 'B', firstAvailableGeneration: 1 })] })
    expect(sortDexSections([gen3, gen1], { key: 'generation', direction: 'asc' }).map((s) => s.key)).toEqual(['g1', 'g3'])
  })

  it('sorts by owned status: true if any row in the section has an owned regular entry', () => {
    const owned = makeSection({
      key: 'owned',
      rows: [
        makeRow({ key: 'r1', dexNumber: 1, displayName: 'A', regular: makeEntry({ id: 1, owned: false }) }),
        makeRow({ key: 'r2', dexNumber: 1, displayName: 'A', regular: makeEntry({ id: 2, owned: true }) })
      ]
    })
    const unowned = makeSection({
      key: 'unowned',
      rows: [makeRow({ key: 'r3', dexNumber: 2, displayName: 'B', regular: makeEntry({ id: 3, owned: false }) })]
    })
    expect(sortDexSections([unowned, owned], { key: 'owned', direction: 'desc' }).map((s) => s.key)).toEqual(['owned', 'unowned'])
  })

  it('sorts by shiny status independently of owned status', () => {
    const shinyOwned = makeSection({
      key: 'shiny',
      rows: [makeRow({ key: 'r1', dexNumber: 1, displayName: 'A', shinyEntry: makeEntry({ id: 1, owned: true, shiny: true }) })]
    })
    const notShiny = makeSection({
      key: 'not-shiny',
      rows: [makeRow({ key: 'r2', dexNumber: 2, displayName: 'B', regular: makeEntry({ id: 2, owned: true }) })]
    })
    expect(sortDexSections([notShiny, shinyOwned], { key: 'shiny', direction: 'desc' }).map((s) => s.key)).toEqual([
      'shiny',
      'not-shiny'
    ])
  })

  it('is a stable sort, preserving natural order among equal keys', () => {
    const first = makeSection({ key: 'first', rows: [makeRow({ key: 'r1', dexNumber: 1, displayName: 'A', firstAvailableGeneration: 1 })] })
    const second = makeSection({ key: 'second', rows: [makeRow({ key: 'r2', dexNumber: 2, displayName: 'B', firstAvailableGeneration: 1 })] })
    expect(sortDexSections([first, second], { key: 'generation', direction: 'asc' }).map((s) => s.key)).toEqual(['first', 'second'])
  })

  it('does not mutate the input array', () => {
    const a = makeSection({ key: 'a', rows: [makeRow({ key: 'r1', dexNumber: 2, displayName: 'B' })] })
    const b = makeSection({ key: 'b', rows: [makeRow({ key: 'r2', dexNumber: 1, displayName: 'A' })] })
    const input = [a, b]
    sortDexSections(input, { key: 'dexNumber', direction: 'asc' })
    expect(input).toEqual([a, b])
  })
})
