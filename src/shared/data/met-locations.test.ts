import { describe, expect, it } from 'vitest'
import { metLocationsForGame } from './met-locations'

describe('metLocationsForGame', () => {
  it('returns the curated list for Pokémon Red (Leg 3)', () => {
    const locations = metLocationsForGame('Pokémon Red')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 1')
    expect(locations).toContain('Pallet Town')
    expect(locations).toContain('Cerulean Cave')
    // Routes 26-28 are Generation II's Johto-Kanto connectors, not part of Red/Blue.
    expect(locations).not.toContain('Route 26')
  })

  it('returns the same Kanto Gen 1 list for Pokémon Blue (Leg 4 restructure: paired versions share a base list)', () => {
    const red = metLocationsForGame('Pokémon Red')
    const blue = metLocationsForGame('Pokémon Blue')
    expect(blue).toEqual(red)
  })

  it('returns the same Kanto Gen 1 list for Pokémon Yellow (Leg 5: no map differences from Red/Blue)', () => {
    const red = metLocationsForGame('Pokémon Red')
    const yellow = metLocationsForGame('Pokémon Yellow')
    expect(yellow).toEqual(red)
  })

  it('appends Fateful Encounter to every curated game, for Gift Pokémon/Mystery Gift (Leg 4)', () => {
    expect(metLocationsForGame('Pokémon Red')).toContain('Fateful Encounter')
    expect(metLocationsForGame('Pokémon Blue')).toContain('Fateful Encounter')
  })

  it('returns undefined (not just a Fateful Encounter list) for a game with no curated list yet', () => {
    expect(metLocationsForGame('Pokémon Sword')).toBeUndefined()
  })

  it('returns undefined for an unrecognized/blank game', () => {
    expect(metLocationsForGame('')).toBeUndefined()
  })
})
