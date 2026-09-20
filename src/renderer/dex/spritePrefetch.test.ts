import { describe, expect, it } from 'vitest'
import type { CollectionEntry } from '@shared/types/pokemon'
import type { BoxCell, BoxPlaceholderCell, Box } from './types'
import { collectBoxSpriteUrls } from './spritePrefetch'
import { defaultSpriteUrl } from './sprites'

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
    boxNumber: 1,
    boxSlot: 0,
    genderConfirmed: false,
    isAlpha: false,
    captureDate: null,
    sizeClass: null,
    ...overrides
  }
}

function entryCell(overrides: Partial<BoxCell> = {}): BoxCell {
  return {
    kind: 'entry',
    boxNumber: 1,
    slot: 0,
    entry: makeEntry({ id: 1, formId: 1 }),
    dexNumber: 1,
    displayName: 'Bulbasaur',
    pokeapiId: 1,
    spriteFormSuffix: null,
    femaleSprite: false,
    homeBoxable: true,
    shinyLocked: false,
    alwaysShiny: false,
    ...overrides
  }
}

function placeholderCell(overrides: Partial<BoxPlaceholderCell> = {}): BoxPlaceholderCell {
  return {
    kind: 'placeholder',
    boxNumber: 1,
    slot: 1,
    speciesId: 25,
    gender: 'unknown',
    shiny: false,
    displayName: 'Pikachu',
    pokeapiId: 25,
    spriteFormSuffix: null,
    ...overrides
  }
}

function makeBox(cells: Box['cells']): Box {
  return { id: 1, boxNumber: 1, name: null, cells }
}

describe('collectBoxSpriteUrls', () => {
  it('skips empty slots', () => {
    expect(collectBoxSpriteUrls(makeBox([null, null]))).toEqual([])
  })

  it('builds a real entry cell\'s sprite URL, respecting its own shiny/female flags', () => {
    const cell = entryCell({ pokeapiId: 1, entry: makeEntry({ id: 1, formId: 1, shiny: true }), femaleSprite: true })
    expect(collectBoxSpriteUrls(makeBox([cell]))).toEqual([defaultSpriteUrl(1, null, true, true)])
  })

  it('builds a placeholder cell\'s sprite URL as plain base-form art regardless of its planned gender/shiny', () => {
    const cell = placeholderCell({ pokeapiId: 25, gender: 'female', shiny: true })
    expect(collectBoxSpriteUrls(makeBox([cell]))).toEqual([defaultSpriteUrl(25, null, false, false)])
  })

  it('collects one URL per filled slot, in slot order', () => {
    const a = entryCell({ pokeapiId: 1 })
    const b = placeholderCell({ pokeapiId: 25 })
    expect(collectBoxSpriteUrls(makeBox([a, null, b]))).toEqual([
      defaultSpriteUrl(1, null, false, false),
      defaultSpriteUrl(25, null, false, false)
    ])
  })
})
