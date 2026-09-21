import { describe, expect, it } from 'vitest'
import { metLocationsForGame } from './met-locations'

describe('metLocationsForGame', () => {
  it('returns undefined for a game with no curated list yet (every game, until Leg 3+)', () => {
    expect(metLocationsForGame('Pokémon Sword')).toBeUndefined()
  })

  it('returns undefined for an unrecognized/blank game', () => {
    expect(metLocationsForGame('')).toBeUndefined()
  })
})
