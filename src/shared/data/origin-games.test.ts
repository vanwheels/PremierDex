import { describe, expect, it } from 'vitest'
import { findOriginGame, ORIGIN_GAMES } from './origin-games'

describe('ORIGIN_GAMES', () => {
  it('has unique ids and unique display names', () => {
    expect(new Set(ORIGIN_GAMES.map((g) => g.id)).size).toBe(ORIGIN_GAMES.length)
    expect(new Set(ORIGIN_GAMES.map((g) => g.name)).size).toBe(ORIGIN_GAMES.length)
  })

  it('marks Pokémon GO as having neither a Trainer ID nor a Secret ID', () => {
    const go = findOriginGame('Pokémon GO')
    expect(go).toEqual({ id: 'go', name: 'Pokémon GO', generation: null, hasTrainerId: false, hasSecretId: false })
  })

  it('marks every Gen I-VI mainline/spinoff game as having a Trainer ID but no visible Secret ID', () => {
    const preGen7 = ORIGIN_GAMES.filter((g) => g.generation !== null && g.generation < 7)
    expect(preGen7.length).toBeGreaterThan(0)
    for (const game of preGen7) {
      expect(game.hasTrainerId).toBe(true)
      expect(game.hasSecretId).toBe(false)
    }
  })

  it('marks every Gen VII+ mainline game as having both a Trainer ID and a Secret ID', () => {
    const gen7Plus = ORIGIN_GAMES.filter((g) => g.generation !== null && g.generation >= 7)
    expect(gen7Plus.length).toBeGreaterThan(0)
    for (const game of gen7Plus) {
      expect(game.hasTrainerId).toBe(true)
      expect(game.hasSecretId).toBe(true)
    }
  })

  it('returns undefined for an unlisted game name', () => {
    expect(findOriginGame('Not A Real Pokémon Game')).toBeUndefined()
  })
})
