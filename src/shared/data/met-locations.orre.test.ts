import { describe, expect, it } from 'vitest'
import { metLocationsForGame } from './met-locations'

describe('metLocationsForGame', () => {
  it('returns the curated Orre list for Pokémon Colosseum (Leg 11)', () => {
    const locations = metLocationsForGame('Pokémon Colosseum')
    expect(locations).toBeDefined()
    expect(locations).toContain('Agate Village')
    expect(locations).toContain('Outskirt Stand')
    expect(locations).toContain('Phenac City')
    expect(locations).toContain('Pyrite Town')
    expect(locations).toContain('The Under')
    expect(locations).toContain('Snagem Hideout')
    expect(locations).toContain('Mt. Battle')
    // Colosseum has no wild encounters and no overland Route locations at all.
    expect(locations).not.toContain('Route 1')
  })

  it('distinguishes Colosseum\'s Tower Colosseum from Under Colosseum and Deep Colosseum (Leg 11)', () => {
    const locations = metLocationsForGame('Pokémon Colosseum')
    expect(locations).toContain('Tower Colosseum')
    expect(locations).toContain('Under Colosseum')
    expect(locations).toContain('Deep Colosseum')
    // XD's name for the Realgam Tower arena, not Colosseum's own name for it.
    expect(locations).not.toContain('Realgam Colosseum')
  })

  it('excludes XD-exclusive locations from Pokémon Colosseum\'s list (Leg 11)', () => {
    const locations = metLocationsForGame('Pokémon Colosseum')
    expect(locations).not.toContain('S.S. Libra')
    expect(locations).not.toContain("Kaminko's House")
    expect(locations).not.toContain('Citadark Isle')
    expect(locations).not.toContain('Cipher Key Lair')
  })

  it('excludes generic building interiors that are not distinct Met Locations (Leg 11)', () => {
    const locations = metLocationsForGame('Pokémon Colosseum')
    expect(locations).not.toContain("Mayor's House")
    expect(locations).not.toContain('Pyrite Bldg')
    expect(locations).not.toContain('Card e Room')
  })

  it('appends Fateful Encounter to Pokémon Colosseum too (Leg 11)', () => {
    expect(metLocationsForGame('Pokémon Colosseum')).toContain('Fateful Encounter')
  })

  it('returns the curated Orre list for Pokémon XD: Gale of Darkness (Leg 12)', () => {
    const locations = metLocationsForGame('Pokémon XD: Gale of Darkness')
    expect(locations).toBeDefined()
    expect(locations).toContain('Agate Village')
    expect(locations).toContain('Gateon Port')
    expect(locations).toContain('Pokémon HQ Lab')
    expect(locations).toContain('Phenac City')
    expect(locations).toContain('Pyrite Town')
    expect(locations).toContain('Snagem Hideout')
    // XD has no wild-encounter Route locations either.
    expect(locations).not.toContain('Route 1')
  })

  it('includes XD\'s three Poké Spots — its only wild encounters (Leg 12)', () => {
    const locations = metLocationsForGame('Pokémon XD: Gale of Darkness')
    expect(locations).toContain('Rock Poké Spot')
    expect(locations).toContain('Oasis Poké Spot')
    expect(locations).toContain('Cave Poké Spot')
  })

  it('includes XD-exclusive story locations absent from Colosseum\'s list (Leg 12)', () => {
    const locations = metLocationsForGame('Pokémon XD: Gale of Darkness')
    expect(locations).toContain('S.S. Libra')
    expect(locations).toContain("Kaminko's House")
    expect(locations).toContain('Citadark Isle')
    expect(locations).toContain('Cipher Key Lair')
  })

  it('uses Realgam Tower, not Realgam Colosseum, for XD (Leg 12)', () => {
    const locations = metLocationsForGame('Pokémon XD: Gale of Darkness')
    expect(locations).toContain('Realgam Tower')
    // XD's index table has no separate index for the arena room, unlike Colosseum's
    // dedicated "Tower Colosseum" index.
    expect(locations).not.toContain('Realgam Colosseum')
    expect(locations).not.toContain('Tower Colosseum')
  })

  it('excludes Colosseum-only facilities from Pokémon XD\'s list (Leg 12)', () => {
    const locations = metLocationsForGame('Pokémon XD: Gale of Darkness')
    expect(locations).not.toContain('The Under')
    expect(locations).not.toContain('The Under Subway')
    expect(locations).not.toContain('Under Colosseum')
    expect(locations).not.toContain('Deep Colosseum')
    expect(locations).not.toContain('Phenac Stadium')
    expect(locations).not.toContain('Pyrite Colosseum')
    expect(locations).not.toContain('Prestige Precept Center')
  })

  it('shares Agate Village\'s Relic Stone landmark and Orre Colosseum with Colosseum\'s list (Leg 12)', () => {
    const locations = metLocationsForGame('Pokémon XD: Gale of Darkness')
    expect(locations).toContain('Relic Stone')
    expect(locations).toContain('Orre Colosseum')
  })

  it('appends Fateful Encounter to Pokémon XD too (Leg 12)', () => {
    expect(metLocationsForGame('Pokémon XD: Gale of Darkness')).toContain('Fateful Encounter')
  })
})
