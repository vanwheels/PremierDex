import { describe, expect, it } from 'vitest'
import type { CollectionEntry } from '@shared/types/pokemon'
import { activeNicknameEntry } from './DexRow'
import type { DexRowData } from './types'

function makeRow(overrides: Partial<DexRowData>): DexRowData {
  return {
    key: 'a',
    formId: 1,
    dexNumber: 1,
    displayName: 'Test',
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

function ownedEntry(id: number, shiny: boolean, nickname: string | null = null): CollectionEntry {
  return {
    id,
    formId: 1,
    gender: 'unknown',
    shiny,
    owned: true,
    trainerProfileId: null,
    originGame: null,
    otName: null,
    tid: null,
    sid: null,
    language: null,
    nickname,
    caughtBall: null
  }
}

// See DexRow.tsx's own doc comment on activeNicknameEntry for the "shiny wins" rationale
// (Leg 10, per Vanny's call).
describe('activeNicknameEntry', () => {
  it('returns null when neither entry is owned', () => {
    const row = makeRow({ regular: { ...ownedEntry(1, false), owned: false } })
    expect(activeNicknameEntry(row)).toBeNull()
  })

  it('returns the regular entry when only it is owned', () => {
    const regular = ownedEntry(1, false, 'Bulby')
    const row = makeRow({ regular })
    expect(activeNicknameEntry(row)).toBe(regular)
  })

  it('returns the shiny entry when only it is owned', () => {
    const shinyEntry = ownedEntry(2, true, 'Shiny Bulby')
    const row = makeRow({ shinyEntry })
    expect(activeNicknameEntry(row)).toBe(shinyEntry)
  })

  it('prefers the shiny entry when both are owned', () => {
    const regular = ownedEntry(1, false, 'Bulby')
    const shinyEntry = ownedEntry(2, true, 'Shiny Bulby')
    const row = makeRow({ regular, shinyEntry })
    expect(activeNicknameEntry(row)).toBe(shinyEntry)
  })
})
