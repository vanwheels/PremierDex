import { describe, expect, it } from 'vitest'
import { metLocationsForGame } from './met-locations'

describe('metLocationsForGame', () => {
  it('returns the curated Sinnoh list for Pokémon Diamond (Leg 13)', () => {
    const locations = metLocationsForGame('Pokémon Diamond')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 201')
    expect(locations).toContain('Route 230')
    expect(locations).toContain('Twinleaf Town')
    expect(locations).toContain('Mt. Coronet')
    // Sinnoh is distinct from every prior region — no bleed-through.
    expect(locations).not.toContain('Route 1')
    expect(locations).not.toContain('Route 101')
  })

  it("includes Diamond/Pearl's Battle Zone and Stark Mountain, contrary to the assumption they're Platinum-only (Leg 13)", () => {
    const locations = metLocationsForGame('Pokémon Diamond')
    expect(locations).toContain('Fight Area')
    expect(locations).toContain('Survival Area')
    expect(locations).toContain('Resort Area')
    expect(locations).toContain('Stark Mountain')
    expect(locations).toContain('Battle Tower')
    expect(locations).toContain('Hall of Origin')
    expect(locations).toContain('Verity Cavern')
    expect(locations).toContain('Valor Cavern')
    expect(locations).toContain('Acuity Cavern')
  })

  it('excludes Platinum-exclusive locations from Pokémon Diamond\'s list (Leg 13)', () => {
    const locations = metLocationsForGame('Pokémon Diamond')
    expect(locations).not.toContain('Battle Frontier')
    expect(locations).not.toContain('Distortion World')
    expect(locations).not.toContain('Global Terminal')
    expect(locations).not.toContain('Villa')
    expect(locations).not.toContain('Battleground')
    expect(locations).not.toContain('Iron Ruins')
    expect(locations).not.toContain('Iceberg Ruins')
    expect(locations).not.toContain('Rock Peak Ruins')
  })

  it('excludes non-place special indices from Pokémon Diamond\'s list (Leg 13)', () => {
    const locations = metLocationsForGame('Pokémon Diamond')
    expect(locations).not.toContain('Mystery Zone')
    expect(locations).not.toContain('Day-Care Couple')
    expect(locations).not.toContain('Sinnoh')
    expect(locations).not.toContain('Kanto')
    expect(locations).not.toContain('Johto')
    expect(locations).not.toContain('Hoenn')
  })

  it("uses Diamond/Pearl's own building-interior names, resolved from the FB template's display text (Leg 13)", () => {
    const locations = metLocationsForGame('Pokémon Diamond')
    expect(locations).toContain('Galactic HQ')
    expect(locations).not.toContain('Team Galactic HQ')
    expect(locations).toContain('Cafe')
    expect(locations).not.toContain('Café')
    expect(locations).toContain('GTS')
    expect(locations).toContain('Game Corner')
  })

  it('returns the same Sinnoh Gen 4 list for Pokémon Pearl (paired versions share a base list)', () => {
    const diamond = metLocationsForGame('Pokémon Diamond')
    const pearl = metLocationsForGame('Pokémon Pearl')
    expect(pearl).toEqual(diamond)
  })

  it('appends Fateful Encounter to Pokémon Diamond and Pearl too (Leg 13)', () => {
    expect(metLocationsForGame('Pokémon Diamond')).toContain('Fateful Encounter')
    expect(metLocationsForGame('Pokémon Pearl')).toContain('Fateful Encounter')
  })

  it('returns the curated Sinnoh list for Pokémon Platinum (Leg 14)', () => {
    const locations = metLocationsForGame('Pokémon Platinum')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 201')
    expect(locations).toContain('Route 230')
    expect(locations).toContain('Twinleaf Town')
    expect(locations).toContain('Mt. Coronet')
    expect(locations).not.toContain('Route 1')
    expect(locations).not.toContain('Route 101')
  })

  it('includes Platinum-exclusive Battle Frontier facilities and other grey-index additions (Leg 14)', () => {
    const locations = metLocationsForGame('Pokémon Platinum')
    expect(locations).toContain('Battle Frontier')
    expect(locations).toContain('Battle Arcade')
    expect(locations).toContain('Battle Castle')
    expect(locations).toContain('Battle Factory')
    expect(locations).toContain('Battle Hall')
    expect(locations).toContain('Distortion World')
    expect(locations).toContain('Global Terminal')
    expect(locations).toContain('Villa')
    expect(locations).toContain('Battleground')
    expect(locations).toContain("Rotom's Room")
    expect(locations).toContain('T.G. Eterna Bldg')
    expect(locations).toContain('Iron Ruins')
    expect(locations).toContain('Iceberg Ruins')
    expect(locations).toContain('Rock Peak Ruins')
  })

  it('replaces Diamond/Pearl-only names with their Platinum equivalents (Leg 14)', () => {
    const locations = metLocationsForGame('Pokémon Platinum')
    expect(locations).not.toContain('Battle Tower')
    expect(locations).not.toContain('GTS')
    expect(locations).not.toContain('Cafe')
    expect(locations).toContain('Café')
  })

  it('keeps Diamond/Pearl-shared locations that Platinum does not replace (Leg 14)', () => {
    const locations = metLocationsForGame('Pokémon Platinum')
    expect(locations).toContain('Turnback Cave')
    expect(locations).toContain('Fight Area')
    expect(locations).toContain('Survival Area')
    expect(locations).toContain('Resort Area')
    expect(locations).toContain('Stark Mountain')
    expect(locations).toContain('Hall of Origin')
  })

  it('appends Fateful Encounter to Pokémon Platinum too (Leg 14)', () => {
    expect(metLocationsForGame('Pokémon Platinum')).toContain('Fateful Encounter')
  })

  it('returns the curated Sinnoh list for Pokémon Brilliant Diamond (Leg 24)', () => {
    const locations = metLocationsForGame('Pokémon Brilliant Diamond')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 201')
    expect(locations).toContain('Route 230')
    expect(locations).toContain('Twinleaf Town')
    expect(locations).toContain('Mount Coronet')
  })

  it('shares the same Sinnoh list between Brilliant Diamond and Shining Pearl (Leg 24)', () => {
    const bd = metLocationsForGame('Pokémon Brilliant Diamond')
    const sp = metLocationsForGame('Pokémon Shining Pearl')
    expect(sp).toEqual(bd)
  })

  it('includes Grand Underground and Ramanas Park, BDSP-specific additions over Diamond/Pearl (Leg 24)', () => {
    const locations = metLocationsForGame('Pokémon Brilliant Diamond')
    expect(locations).toContain('Grand Underground')
    expect(locations).toContain('Ramanas Park')
    expect(locations).not.toContain('Pal Park')
  })

  it("renames Diamond/Pearl's Mt. Coronet to this game's own Mount Coronet spelling (Leg 24)", () => {
    const locations = metLocationsForGame('Pokémon Brilliant Diamond')
    expect(locations).toContain('Mount Coronet')
    expect(locations).not.toContain('Mt. Coronet')
  })

  it('folds Diamond/Pearl building interiors and lake-guardian caverns into their parent city/lake (Leg 24)', () => {
    const locations = metLocationsForGame('Pokémon Brilliant Diamond')
    expect(locations).not.toContain('Cafe')
    expect(locations).not.toContain('Canalave Library')
    expect(locations).not.toContain('Contest Hall')
    expect(locations).not.toContain('Cycle Shop')
    expect(locations).not.toContain('Flower Shop')
    expect(locations).not.toContain('Footstep House')
    expect(locations).not.toContain('Foreign Building')
    expect(locations).not.toContain('Game Corner')
    expect(locations).not.toContain('Grand Lake')
    expect(locations).not.toContain('GTS')
    expect(locations).not.toContain('Jubilife TV')
    expect(locations).not.toContain('Mining Museum')
    expect(locations).not.toContain('Poffin House')
    expect(locations).not.toContain('Pokémon Day Care')
    expect(locations).not.toContain('Pokémon Mansion')
    expect(locations).not.toContain('Pokétch Co.')
    expect(locations).not.toContain('Restaurant')
    expect(locations).not.toContain('Sunyshore Market')
    expect(locations).not.toContain("Trainers' School")
    expect(locations).not.toContain('Veilstone Store')
    expect(locations).not.toContain('Vista Lighthouse')
    expect(locations).not.toContain('Acuity Cavern')
    expect(locations).not.toContain('Valor Cavern')
    expect(locations).not.toContain('Verity Cavern')
  })

  it('excludes non-place special indices from Pokémon Brilliant Diamond\'s list (Leg 24)', () => {
    const locations = metLocationsForGame('Pokémon Brilliant Diamond')
    expect(locations).not.toContain('Mystery Zone')
  })

  it('appends Fateful Encounter to Pokémon Brilliant Diamond/Shining Pearl too (Leg 24)', () => {
    expect(metLocationsForGame('Pokémon Brilliant Diamond')).toContain('Fateful Encounter')
    expect(metLocationsForGame('Pokémon Shining Pearl')).toContain('Fateful Encounter')
  })
})
