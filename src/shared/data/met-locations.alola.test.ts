import { describe, expect, it } from 'vitest'
import { metLocationsForGame } from './met-locations'

describe('metLocationsForGame', () => {
  it('returns the curated Alola list for Pokémon Sun (Leg 20)', () => {
    const locations = metLocationsForGame('Pokémon Sun')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 1')
    expect(locations).toContain('Route 17')
    expect(locations).toContain('Iki Town')
    expect(locations).toContain('Vast Poni Canyon')
  })

  it('returns the same Alola list for Pokémon Moon (paired versions share a base list)', () => {
    const sun = metLocationsForGame('Pokémon Sun')
    const moon = metLocationsForGame('Pokémon Moon')
    expect(moon).toEqual(sun)
  })

  it('includes Seafolk Village despite its absence from the Alola settlements table (Leg 20)', () => {
    // Initially assumed Ultra Sun/Ultra Moon-exclusive; its own catch/item data confirmed
    // otherwise — see the ALOLA_SM comment for the full correction.
    const locations = metLocationsForGame('Pokémon Sun')
    expect(locations).toContain('Seafolk Village')
  })

  it("resolves Sun/Moon's own Ultra Beast encounters to already-curated Alola locations, not Ultra-space names (Leg 20)", () => {
    const locations = metLocationsForGame('Pokémon Sun')
    expect(locations).toContain("Diglett's Tunnel")
    expect(locations).toContain('Wela Volcano Park')
    expect(locations).toContain('Melemele Meadow')
    expect(locations).toContain('Verdant Cavern')
    expect(locations).toContain('Lush Jungle')
    expect(locations).toContain('Memorial Hill')
    expect(locations).toContain('Ultra Space')
    expect(locations).not.toContain('Ultra Deep Sea')
    expect(locations).not.toContain('Ultra Forest')
    expect(locations).not.toContain('Ultra Crater')
  })

  it('keeps both halves of the Sunne/Moone landmark pairs on the shared list, not split by version (Leg 20)', () => {
    const locations = metLocationsForGame('Pokémon Sun')
    expect(locations).toContain('Altar of the Sunne')
    expect(locations).toContain('Altar of the Moone')
    expect(locations).toContain('Lake of the Sunne')
    expect(locations).toContain('Lake of the Moone')
  })

  it('excludes locations confirmed Ultra Sun/Ultra Moon-exclusive from Pokémon Sun (Leg 20)', () => {
    const locations = metLocationsForGame('Pokémon Sun')
    expect(locations).not.toContain('Big Wave Beach')
    expect(locations).not.toContain('Sandy Cave')
    expect(locations).not.toContain('Heahea Beach')
    expect(locations).not.toContain('Pikachu Valley')
    expect(locations).not.toContain('Poni Beach')
    expect(locations).not.toContain('Plains Grotto')
    expect(locations).not.toContain("Team Rocket's Castle")
    expect(locations).not.toContain('Dividing Peak Tunnel')
    expect(locations).not.toContain('Ultra Megalopolis')
  })

  it('excludes generic repeated building types and non-place fallback strings from Pokémon Sun (Leg 20)', () => {
    const locations = metLocationsForGame('Pokémon Sun')
    expect(locations).not.toContain('Poké Mart')
    expect(locations).not.toContain('Pokémon Center')
    expect(locations).not.toContain('Aether Base')
    expect(locations).not.toContain("Player's house")
    expect(locations).not.toContain('Faraway place')
    expect(locations).not.toContain('Melemele Island')
    expect(locations).not.toContain('Festival Plaza')
  })

  it('appends Fateful Encounter to Pokémon Sun and Moon too (Leg 20)', () => {
    expect(metLocationsForGame('Pokémon Sun')).toContain('Fateful Encounter')
    expect(metLocationsForGame('Pokémon Moon')).toContain('Fateful Encounter')
  })

  it('returns the curated Alola list for Pokémon Ultra Sun (Leg 21)', () => {
    const locations = metLocationsForGame('Pokémon Ultra Sun')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 1')
    expect(locations).toContain('Route 17')
    expect(locations).toContain('Iki Town')
    expect(locations).toContain('Vast Poni Canyon')
  })

  it('keeps Poni Plains despite its absence from the USUM locations category (Leg 21)', () => {
    // Same category-tagging gap Seafolk Village had in SM (Leg 20) — its own article's full
    // USUM encounter/item/Trainer data confirms it, not the category tag.
    const locations = metLocationsForGame('Pokémon Ultra Sun')
    expect(locations).toContain('Poni Plains')
  })

  it('includes USUM-exclusive additions confirmed via ALOLA_SM\'s forward-looking note (Leg 21)', () => {
    const locations = metLocationsForGame('Pokémon Ultra Sun')
    expect(locations).toContain('Big Wave Beach')
    expect(locations).toContain('Sandy Cave')
    expect(locations).toContain('Heahea Beach')
    expect(locations).toContain('Pikachu Valley')
    expect(locations).toContain('Poni Beach')
    expect(locations).toContain('Plains Grotto')
    expect(locations).toContain('Dividing Peak Tunnel')
    expect(locations).toContain("Team Rocket's Castle")
  })

  it('includes the three USUM additions the category sweep turned up beyond ALOLA_SM\'s note (Leg 21)', () => {
    const locations = metLocationsForGame('Pokémon Ultra Sun')
    expect(locations).toContain('Battle Agency')
    expect(locations).toContain('Kantonian Gym')
    expect(locations).toContain('Megalo Tower')
  })

  it('excludes Alola Photo Club as a generic repeated building type, not a single fixed place (Leg 21)', () => {
    const locations = metLocationsForGame('Pokémon Ultra Sun')
    expect(locations).not.toContain('Alola Photo Club')
  })

  it('applies the Secluded Shore/Ula\'ula Beach and Ultra Space/Ultra Deep Sea renames (Leg 21)', () => {
    const locations = metLocationsForGame('Pokémon Ultra Sun')
    expect(locations).toContain("Ula'ula Beach")
    expect(locations).not.toContain('Secluded Shore')
    expect(locations).toContain('Ultra Deep Sea')
    expect(locations).not.toContain('Ultra Space')
  })

  it('gives Ultra Sun the Ultra Forest/Ultra Jungle pair and Ultra Moon the Ultra Crater/Ultra Desert pair (Leg 21 within-pair split)', () => {
    const ultraSun = metLocationsForGame('Pokémon Ultra Sun')
    const ultraMoon = metLocationsForGame('Pokémon Ultra Moon')
    expect(ultraSun).toContain('Ultra Forest')
    expect(ultraSun).toContain('Ultra Jungle')
    expect(ultraSun).not.toContain('Ultra Crater')
    expect(ultraSun).not.toContain('Ultra Desert')
    expect(ultraMoon).toContain('Ultra Crater')
    expect(ultraMoon).toContain('Ultra Desert')
    expect(ultraMoon).not.toContain('Ultra Forest')
    expect(ultraMoon).not.toContain('Ultra Jungle')
  })

  it('returns the same Alola USUM list for Ultra Sun/Ultra Moon aside from the realm split (Leg 21)', () => {
    const ultraSun = metLocationsForGame('Pokémon Ultra Sun') as string[]
    const ultraMoon = metLocationsForGame('Pokémon Ultra Moon') as string[]
    expect(ultraSun.length).toBe(ultraMoon.length)
    const sunWithoutSplit = ultraSun.filter(
      (location) => location !== 'Ultra Forest' && location !== 'Ultra Jungle'
    )
    const moonWithoutSplit = ultraMoon.filter(
      (location) => location !== 'Ultra Crater' && location !== 'Ultra Desert'
    )
    expect(sunWithoutSplit).toEqual(moonWithoutSplit)
  })

  it('appends Fateful Encounter to Pokémon Ultra Sun and Ultra Moon too (Leg 21)', () => {
    expect(metLocationsForGame('Pokémon Ultra Sun')).toContain('Fateful Encounter')
    expect(metLocationsForGame('Pokémon Ultra Moon')).toContain('Fateful Encounter')
  })
})
