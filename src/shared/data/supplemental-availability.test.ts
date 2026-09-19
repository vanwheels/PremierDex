import { describe, expect, it } from 'vitest'
import type { SpeciesAvailabilityData } from '../types/species-availability'
import { supplementalSpeciesForGame } from './supplemental-availability'

const AVAILABILITY: SpeciesAvailabilityData = {
  pokedexes: { kanto: [1, 4, 7], hoenn: [252, 255, 258] },
  gameToPokedexes: {}
}

describe('supplementalSpeciesForGame', () => {
  it('returns no data for a game with no curated mechanism', () => {
    expect(supplementalSpeciesForGame('red', AVAILABILITY)).toEqual([])
  })

  it("unions Platinum's Pal Park pool from the Kanto and Hoenn dexes", () => {
    const result = supplementalSpeciesForGame('platinum', AVAILABILITY)
    expect(result).toEqual(expect.arrayContaining([1, 4, 7, 252, 255, 258]))
  })

  it("includes Emerald's own supplemental species in Platinum's Pal Park pool", () => {
    // 151 (Mew) is one of Emerald's event legendaries, reachable via a Pal Park transfer
    // from an Emerald cartridge that already caught it.
    const result = supplementalSpeciesForGame('platinum', AVAILABILITY)
    expect(result).toContain(151)
  })

  it("includes Platinum's own dex-omitted Sinnoh legendaries", () => {
    // 492 (Shaymin) — genuinely catchable in Platinum but absent from PokeAPI's
    // extended-sinnoh dex data.
    const result = supplementalSpeciesForGame('platinum', AVAILABILITY)
    expect(result).toContain(492)
  })

  it("returns Emerald's Safari Zone Johto species plus its event legendaries", () => {
    const result = supplementalSpeciesForGame('emerald', AVAILABILITY)
    expect(result).toEqual(expect.arrayContaining([165, 151, 249, 250]))
  })

  it('splits the Ultra Wormhole pool by version for Ultra Sun vs Ultra Moon', () => {
    const ultraSun = supplementalSpeciesForGame('ultra-sun', AVAILABILITY)
    const ultraMoon = supplementalSpeciesForGame('ultra-moon', AVAILABILITY)
    expect(ultraSun).toContain(641) // Tornadus, Ultra Sun only
    expect(ultraSun).not.toContain(642) // Thundurus, Ultra Moon only
    expect(ultraMoon).toContain(642)
    expect(ultraMoon).not.toContain(641)
    // Both share the same Island Scan starters and the un-gated wormhole pool.
    expect(ultraSun).toContain(1)
    expect(ultraMoon).toContain(1)
    expect(ultraSun).toContain(144)
    expect(ultraMoon).toContain(144)
  })
})
