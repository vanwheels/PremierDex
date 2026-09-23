import { describe, expect, it } from 'vitest'
import { safariFleeRatesForSpecies } from './safari-flee-rates'

describe('safariFleeRatesForSpecies', () => {
  it('returns no data for a species absent from every curated Safari Zone', () => {
    expect(safariFleeRatesForSpecies(1)).toEqual([]) // Bulbasaur
  })

  it('returns a single entry for a species curated in only one location', () => {
    // Chansey (113) — Kanto Safari Zone (FireRed/LeafGreen) only, not in the Hoenn list.
    expect(safariFleeRatesForSpecies(113)).toEqual([
      { location: 'Kanto Safari Zone', gamesLabel: 'FireRed/LeafGreen', fleeRate: 125 }
    ])
  })

  it('returns one entry per location for a species curated in both', () => {
    // Rhyhorn (111) appears in both the Hoenn and Kanto Safari Zone tables, on different
    // numeric scales (4 vs. 75) — both should surface, Hoenn first (release order).
    expect(safariFleeRatesForSpecies(111)).toEqual([
      { location: 'Hoenn Safari Zone', gamesLabel: 'Ruby/Sapphire/Emerald', fleeRate: 4 },
      { location: 'Kanto Safari Zone', gamesLabel: 'FireRed/LeafGreen', fleeRate: 75 }
    ])
  })

  it("joins a location's game names in ORIGIN_GAMES order with the Pokémon prefix stripped", () => {
    // Pikachu (25) is Hoenn Safari Zone only.
    expect(safariFleeRatesForSpecies(25)).toEqual([
      { location: 'Hoenn Safari Zone', gamesLabel: 'Ruby/Sapphire/Emerald', fleeRate: 6 }
    ])
  })
})
