import { describe, expect, it } from 'vitest'
import { metLocationsForGame } from './met-locations'

describe('metLocationsForGame', () => {
  it('returns the curated Hisui list for Pokémon Legends: Arceus (Leg 25)', () => {
    const locations = metLocationsForGame('Pokémon Legends: Arceus')
    expect(locations).toBeDefined()
    expect(locations).toContain('Jubilife Village')
    expect(locations).toContain('Obsidian Fieldlands')
    expect(locations).toContain('Crimson Mirelands')
    expect(locations).toContain('Cobalt Coastlands')
    expect(locations).toContain('Coronet Highlands')
    expect(locations).toContain('Alabaster Icelands')
  })

  it('includes Galaxy Hall\'s individually-indexed floors as their own entries (Leg 25)', () => {
    const locations = metLocationsForGame('Pokémon Legends: Arceus')
    expect(locations).toContain('Galaxy Hall')
    expect(locations).toContain('First Floor')
    expect(locations).toContain('Second Floor')
    expect(locations).toContain('Third Floor')
    expect(locations).toContain('Basement')
  })

  it('excludes non-place special indices from Pokémon Legends: Arceus\'s list (Leg 25)', () => {
    const locations = metLocationsForGame('Pokémon Legends: Arceus')
    expect(locations).not.toContain('Mystery Zone')
    expect(locations).not.toContain('Faraway place')
    expect(locations).not.toContain('Faraway Place')
  })

  it('excludes cross-game transfer/event categories from Pokémon Legends: Arceus\'s list (Leg 25)', () => {
    const locations = metLocationsForGame('Pokémon Legends: Arceus')
    expect(locations).not.toContain('the Kanto region')
    expect(locations).not.toContain('the Sinnoh region')
    expect(locations).not.toContain('Pokémon HOME')
    expect(locations).not.toContain('Pokémon GO')
    expect(locations).not.toContain('a Link Trade')
  })

  it('appends Fateful Encounter to Pokémon Legends: Arceus too (Leg 25)', () => {
    expect(metLocationsForGame('Pokémon Legends: Arceus')).toContain('Fateful Encounter')
  })
})
