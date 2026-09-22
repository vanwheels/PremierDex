import { describe, expect, it } from 'vitest'
import { metLocationsForGame } from './met-locations'

describe('metLocationsForGame', () => {
  it('returns the curated Johto+Kanto list for Pokémon Gold (Leg 6)', () => {
    const locations = metLocationsForGame('Pokémon Gold')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 1')
    expect(locations).toContain('Route 29')
    expect(locations).toContain('New Bark Town')
    expect(locations).toContain('Silver Cave')
    // Gen II's stripped-down Kanto remake drops several Gen I-only locations.
    expect(locations).not.toContain('Cerulean Cave')
    expect(locations).not.toContain('Pokémon Mansion')
    expect(locations).not.toContain('Safari Zone')
    expect(locations).not.toContain('Silph Co.')
    expect(locations).not.toContain('Rocket Hideout')
    expect(locations).not.toContain('S.S. Anne')
    expect(locations).not.toContain('Viridian Forest')
    expect(locations).not.toContain('Underground Path (Routes 7–8)')
    // Battle Tower is a Crystal-exclusive addition, layered in at Leg 7.
    expect(locations).not.toContain('Battle Tower')
    // Renamed from Gen I's Pokémon Tower.
    expect(locations).toContain('Lavender Radio Tower')
    expect(locations).not.toContain('Pokémon Tower')
  })

  it('returns the same Johto+Kanto Gen 2 list for Pokémon Silver (paired versions share a base list)', () => {
    const gold = metLocationsForGame('Pokémon Gold')
    const silver = metLocationsForGame('Pokémon Silver')
    expect(silver).toEqual(gold)
  })

  it('appends Fateful Encounter to Pokémon Gold too (Leg 6)', () => {
    expect(metLocationsForGame('Pokémon Gold')).toContain('Fateful Encounter')
  })

  it('returns Gold/Silver\'s Johto+Kanto list plus Battle Tower for Pokémon Crystal (Leg 7)', () => {
    const gold = metLocationsForGame('Pokémon Gold')
    const crystal = metLocationsForGame('Pokémon Crystal')
    expect(crystal).toBeDefined()
    expect(crystal).toContain('Battle Tower')
    // Crystal does not rename Silver Cave to Mt. Silver (that split naming is HGSS-only).
    expect(crystal).toContain('Silver Cave')
    expect(crystal).not.toContain('Mt. Silver')
    // Everything else carries over unchanged from Gold/Silver.
    expect(crystal).toEqual(expect.arrayContaining(gold as string[]))
    expect(crystal?.length).toBe((gold?.length ?? 0) + 1)
  })

  it('appends Fateful Encounter to Pokémon Crystal too (Leg 7)', () => {
    expect(metLocationsForGame('Pokémon Crystal')).toContain('Fateful Encounter')
  })

  it('returns the curated Johto+Kanto list for Pokémon HeartGold (Leg 15)', () => {
    const locations = metLocationsForGame('Pokémon HeartGold')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 1')
    expect(locations).toContain('Route 48')
    expect(locations).toContain('New Bark Town')
    expect(locations).toContain('Pallet Town')
    expect(locations).toContain('Mt. Silver')
    // Sinnoh isn't accessible from HGSS's own map at all.
    expect(locations).not.toContain('Route 201')
    expect(locations).not.toContain('Twinleaf Town')
  })

  it("uses HGSS's own renamed/remade locations rather than Generation II's names (Leg 15)", () => {
    const locations = metLocationsForGame('Pokémon HeartGold')
    // Tin Tower (Gen II) was renamed Bell Tower in the remake.
    expect(locations).toContain('Bell Tower')
    expect(locations).not.toContain('Tin Tower')
    // Silver Cave (Gen II) split into the exterior Mt. Silver and interior Mt. Silver Cave.
    expect(locations).toContain('Mt. Silver')
    expect(locations).toContain('Mt. Silver Cave')
    expect(locations).not.toContain('Silver Cave')
    // Lavender's former Pokémon Tower/Lavender Radio Tower has no index in HGSS at all —
    // only Goldenrod's Radio Tower is a selectable Met Location here.
    expect(locations).toContain('Goldenrod Radio Tower')
    expect(locations).not.toContain('Lavender Radio Tower')
  })

  it('includes Route 47/48 and the rebuilt Johto Safari Zone area, all HGSS-exclusive (Leg 15)', () => {
    const locations = metLocationsForGame('Pokémon HeartGold')
    expect(locations).toContain('Route 47')
    expect(locations).toContain('Route 48')
    expect(locations).toContain('Safari Zone')
    expect(locations).toContain('Safari Zone Gate')
    expect(locations).toContain('Cliff Cave')
    expect(locations).toContain('Cliff Edge Gate')
    expect(locations).toContain('Frontier Access')
    expect(locations).toContain('Bellchime Trail')
    expect(locations).toContain('Sinjoh Ruins')
    expect(locations).toContain('Embedded Tower')
    expect(locations).toContain('Pokéwalker')
  })

  it('excludes the Mr. Pokémon/Primo gift-context indices as non-places (Leg 15)', () => {
    const locations = metLocationsForGame('Pokémon HeartGold')
    expect(locations).not.toContain('Mr. Pokémon')
    expect(locations).not.toContain('Primo')
  })

  it('returns the same Johto+Kanto Gen 4 list for Pokémon SoulSilver (paired versions share a base list)', () => {
    const heartGold = metLocationsForGame('Pokémon HeartGold')
    const soulSilver = metLocationsForGame('Pokémon SoulSilver')
    expect(soulSilver).toEqual(heartGold)
  })

  it('appends Fateful Encounter to Pokémon HeartGold and SoulSilver too (Leg 15)', () => {
    expect(metLocationsForGame('Pokémon HeartGold')).toContain('Fateful Encounter')
    expect(metLocationsForGame('Pokémon SoulSilver')).toContain('Fateful Encounter')
  })
})
