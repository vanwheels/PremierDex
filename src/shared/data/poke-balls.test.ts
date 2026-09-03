import { describe, expect, it } from 'vitest'
import { POKE_BALLS, ballPoolForGame, pokeBallIconSlug } from './poke-balls'

describe('POKE_BALLS', () => {
  it('has no duplicate names', () => {
    expect(new Set(POKE_BALLS).size).toBe(POKE_BALLS.length)
  })
})

describe('ballPoolForGame', () => {
  it("returns Legends Arceus's own crafted-ball pool for that game", () => {
    const pool = ballPoolForGame('Pokémon Legends: Arceus')
    expect(pool).toContain('Origin Ball')
    expect(pool).toContain('Feather Ball')
    expect(pool).not.toContain('Dusk Ball')
  })

  it('falls back to the full flat list for a game with no defined pool', () => {
    expect(ballPoolForGame('Pokémon Sword')).toBe(POKE_BALLS)
  })

  it('falls back to the full flat list for an unrecognized/blank game', () => {
    expect(ballPoolForGame('')).toBe(POKE_BALLS)
  })
})

describe('pokeBallIconSlug', () => {
  it('lowercases and hyphenates a plain multi-word name', () => {
    expect(pokeBallIconSlug('Great Ball')).toBe('great-ball')
  })

  it('folds the é in Poké Ball to a plain e with no leftover accent', () => {
    expect(pokeBallIconSlug('Poké Ball')).toBe('poke-ball')
  })

  it('produces a unique slug for every entry in POKE_BALLS', () => {
    const slugs = POKE_BALLS.map(pokeBallIconSlug)
    expect(new Set(slugs).size).toBe(POKE_BALLS.length)
  })
})
