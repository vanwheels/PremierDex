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

  it('marks every mainline/spinoff game as having both a Trainer ID and a Secret ID, even pre-Gen-VII where the Secret ID is never shown in-game but is still extractable with an external tool', () => {
    const mainline = ORIGIN_GAMES.filter((g) => g.generation !== null)
    expect(mainline.length).toBeGreaterThan(0)
    for (const game of mainline) {
      expect(game.hasTrainerId).toBe(true)
      expect(game.hasSecretId).toBe(true)
    }
  })

  it('returns undefined for an unlisted game name', () => {
    expect(findOriginGame('Not A Real Pokémon Game')).toBeUndefined()
  })
})
