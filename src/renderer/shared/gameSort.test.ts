import { describe, expect, it } from 'vitest'
import { compareGames } from './gameSort'

describe('compareGames', () => {
  it('orders by release date under game-release', () => {
    expect(compareGames('Pokémon Red', 'Pokémon Scarlet', 'game-release')).toBeLessThan(0)
    expect(compareGames('Pokémon Scarlet', 'Pokémon Red', 'game-release')).toBeGreaterThan(0)
  })

  it('orders alphabetically under game-alpha, ignoring release date', () => {
    // Yellow releases before Gold (Gen I vs Gen II) but sorts after it alphabetically.
    expect(compareGames('Pokémon Yellow', 'Pokémon Gold', 'game-release')).toBeLessThan(0)
    expect(compareGames('Pokémon Yellow', 'Pokémon Gold', 'game-alpha')).toBeGreaterThan(0)
  })

  it('sorts a null game after every real game, regardless of mode', () => {
    expect(compareGames(null, 'Pokémon Red', 'game-release')).toBeGreaterThan(0)
    expect(compareGames('Pokémon Red', null, 'game-release')).toBeLessThan(0)
    expect(compareGames(null, 'Pokémon Red', 'game-alpha')).toBeGreaterThan(0)
  })

  it('treats two null games as equal', () => {
    expect(compareGames(null, null, 'game-release')).toBe(0)
  })

  it('breaks ties on the same game by name under game-release', () => {
    // Same origin game order (0), so it falls through to localeCompare on the name itself.
    expect(compareGames('Pokémon Red', 'Pokémon Red', 'game-release')).toBe(0)
  })
})
