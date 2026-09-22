import { describe, expect, it } from 'vitest'
import { metLocationsForGame } from './met-locations'

describe('metLocationsForGame', () => {
  it('returns the curated Galar list for Pokémon Sword (Leg 23)', () => {
    const locations = metLocationsForGame('Pokémon Sword')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 1')
    expect(locations).toContain('Route 10')
    expect(locations).toContain('Postwick')
    expect(locations).toContain('Wyndon')
  })

  it('shares the same Galar list between Sword and Shield (Leg 23)', () => {
    const sword = metLocationsForGame('Pokémon Sword')
    const shield = metLocationsForGame('Pokémon Shield')
    expect(sword).toEqual(shield)
  })

  it('includes the Isle of Armor and Crown Tundra DLC areas alongside base Galar (Leg 23)', () => {
    const locations = metLocationsForGame('Pokémon Sword')
    expect(locations).toContain('Fields of Honor')
    expect(locations).toContain('Master Dojo')
    expect(locations).toContain('Freezington')
    expect(locations).toContain('Crown Shrine')
  })

  it('normalizes Bulbapedia disambiguation suffixes/prefixes to plain in-game names (Leg 23)', () => {
    const locations = metLocationsForGame('Pokémon Sword')
    expect(locations).toContain('Iceberg Ruins')
    expect(locations).toContain('Iron Ruins')
    expect(locations).toContain('Rock Peak Ruins')
    expect(locations).not.toContain('Iceberg Ruins (Galar)')
    expect(locations).not.toContain('Iron Ruins (Galar)')
    expect(locations).not.toContain('Rock Peak Ruins (Galar)')
    expect(locations).not.toContain('Galar Route 1')
  })

  it('finds no version-exclusive location split between Sword and Shield (Leg 23)', () => {
    const locations = metLocationsForGame('Pokémon Sword')
    expect(locations).toContain('Tower summit')
    expect(locations).toContain('Split-Decision Ruins')
    expect(locations).toContain('Galar Mine')
    expect(locations).toContain('Galar Mine No. 2')
  })

  it('keeps Pokémon Nursery and Meetup Spot as genuine breeding/gift locations (Leg 23)', () => {
    const locations = metLocationsForGame('Pokémon Sword')
    expect(locations).toContain('Pokémon Nursery')
    expect(locations).toContain('Meetup Spot')
  })

  it('excludes pure battle facilities with no confirmed catch/gift Pokémon (Leg 23)', () => {
    const locations = metLocationsForGame('Pokémon Sword')
    expect(locations).not.toContain('Battle Tower (Galar)')
    expect(locations).not.toContain('Rose Tower')
    expect(locations).not.toContain('Energy Plant')
    expect(locations).not.toContain('Tower of Darkness')
    expect(locations).not.toContain('Tower of Waters')
    expect(locations).not.toContain('Towers of Two Fists')
    expect(locations).not.toContain('Restricted Sparring')
    expect(locations).not.toContain('Wyndon Stadium')
    expect(locations).not.toContain('Turffield Stadium')
  })

  it('excludes generic buildings, non-place region names, and anime-only locations (Leg 23)', () => {
    const locations = metLocationsForGame('Pokémon Sword')
    expect(locations).not.toContain("Player's house")
    expect(locations).not.toContain('Poké Mart')
    expect(locations).not.toContain('Pokémon Center')
    expect(locations).not.toContain('Battle Café')
    expect(locations).not.toContain('Herb Shop')
    expect(locations).not.toContain('Galar')
    expect(locations).not.toContain('Wild Area')
    expect(locations).not.toContain('Isle of Armor')
    expect(locations).not.toContain('Crown Tundra')
    expect(locations).not.toContain('Hometown')
    expect(locations).not.toContain('Faraway place')
    expect(locations).not.toContain('Pokémon Den')
    expect(locations).not.toContain('Ancient castle')
    expect(locations).not.toContain("Karna's Poké Ball factory")
  })

  it('appends Fateful Encounter to Pokémon Sword/Shield too (Leg 23)', () => {
    expect(metLocationsForGame('Pokémon Sword')).toContain('Fateful Encounter')
    expect(metLocationsForGame('Pokémon Shield')).toContain('Fateful Encounter')
  })
})
