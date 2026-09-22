import { describe, expect, it } from 'vitest'
import { metLocationsForGame } from './met-locations'

describe('metLocationsForGame', () => {
  it('returns the curated Kalos list for Pokémon X (Leg 18)', () => {
    const locations = metLocationsForGame('Pokémon X')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 1')
    expect(locations).toContain('Route 22')
    expect(locations).toContain('Vaniville Town')
    expect(locations).toContain('Lumiose City')
    expect(locations).toContain('Victory Road')
    // Omega Ruby/Alpha Sapphire-only additions aren't part of X/Y's own map.
    expect(locations).not.toContain('Littleroot Town')
    expect(locations).not.toContain('Battle Resort')
    expect(locations).not.toContain('Team Aqua Hideout')
  })

  it('returns the same Kalos Gen 6 list for Pokémon Y (paired versions share a base list)', () => {
    const x = metLocationsForGame('Pokémon X')
    const y = metLocationsForGame('Pokémon Y')
    expect(y).toEqual(x)
  })

  it('excludes non-place special indices from Pokémon X\'s list (Leg 18)', () => {
    const locations = metLocationsForGame('Pokémon X')
    expect(locations).not.toContain('Mystery Zone')
    expect(locations).not.toContain('Faraway Place')
  })

  it("includes each Kalos route's alternate name as its own entry, distinct from Generation V's excluded Entralink duplicates (Leg 18)", () => {
    const locations = metLocationsForGame('Pokémon X')
    expect(locations).toContain('Vaniville Pathway')
    expect(locations).toContain('Menhir Trail')
    // Bulbapedia's index-table template call for this row is a typo (invokes Route 21's
    // template) but the row belongs to Route 22, confirmed via Kalos Route 22's own article.
    expect(locations).toContain('Détourner Way')
  })

  it('includes dedicated-index sub-areas and facilities for Pokémon X (Leg 18)', () => {
    const locations = metLocationsForGame('Pokémon X')
    expect(locations).toContain('Zubat Roost')
    expect(locations).toContain('Lumiose Station')
    expect(locations).toContain('Kiloude Station')
    expect(locations).toContain('Ambrette Aquarium')
    expect(locations).toContain('Blazing Chamber')
    expect(locations).toContain('Flood Chamber')
    expect(locations).toContain('Ironworks Chamber')
    expect(locations).toContain('Dragonmark Chamber')
    expect(locations).toContain('Radiant Chamber')
    // A real, small postgame Mewtwo cave, not a placeholder despite the generic name.
    expect(locations).toContain('Unknown Dungeon')
  })

  it('appends Fateful Encounter to Pokémon X and Y too (Leg 18)', () => {
    expect(metLocationsForGame('Pokémon X')).toContain('Fateful Encounter')
    expect(metLocationsForGame('Pokémon Y')).toContain('Fateful Encounter')
  })

  it('returns the curated Lumiose City list for Pokémon Legends: Z-A (Leg 27)', () => {
    const locations = metLocationsForGame('Pokémon Legends: Z-A')
    expect(locations).toBeDefined()
    expect(locations).toContain('Centrico Plaza')
    expect(locations).toContain('Vert District')
    expect(locations).toContain('Lysandre Labs')
    expect(locations).toContain('Prism Tower')
  })

  it('has no numbered routes for Lumiose City, like Paldea (Leg 27)', () => {
    const locations = metLocationsForGame('Pokémon Legends: Z-A')
    expect(locations).not.toContain('Route 1')
  })

  it('sorts Sector N and Wild Zone N groups numerically, not by raw string order (Leg 27)', () => {
    const locations = metLocationsForGame('Pokémon Legends: Z-A')!
    const bleuSector2 = locations.indexOf('Bleu Sector 2')
    const bleuSector10 = locations.indexOf('Bleu Sector 10')
    expect(bleuSector10).toBeGreaterThan(bleuSector2)
    const wildZone2 = locations.indexOf('Wild Zone 2')
    const wildZone10 = locations.indexOf('Wild Zone 10')
    expect(wildZone10).toBeGreaterThan(wildZone2)
  })

  it('includes named businesses with their own index entries, unlike Paldea\'s generic-chain exclusion (Leg 27)', () => {
    const locations = metLocationsForGame('Pokémon Legends: Z-A')
    expect(locations).toContain('Café Cyclone')
    expect(locations).toContain('Sushi High Roller')
    expect(locations).toContain('Pokémon Center')
    expect(locations).toContain('Restaurant')
  })

  it('includes the Mega Dimension DLC\'s Hyperspace locations in the shared list (Leg 27)', () => {
    const locations = metLocationsForGame('Pokémon Legends: Z-A')
    expect(locations).toContain('Hyperspace Lumiose')
    expect(locations).toContain('Hyperspace Desolate Land')
    expect(locations).toContain('Hyperspace Sky Pillar')
  })

  it('excludes non-place special indices and unnamed placeholders from Pokémon Legends: Z-A\'s list (Leg 27)', () => {
    const locations = metLocationsForGame('Pokémon Legends: Z-A')
    expect(locations).not.toContain('Mystery Zone')
    expect(locations).not.toContain('Faraway place')
    expect(locations).not.toContain('???')
  })

  it('excludes cross-game transfer/event categories from Pokémon Legends: Z-A\'s list (Leg 27)', () => {
    const locations = metLocationsForGame('Pokémon Legends: Z-A')
    expect(locations).not.toContain('a Link Trade')
    expect(locations).not.toContain('Pokémon HOME')
    expect(locations).not.toContain('Pokémon GO')
    expect(locations).not.toContain('the Kanto region')
  })

  it('appends Fateful Encounter to Pokémon Legends: Z-A too (Leg 27)', () => {
    expect(metLocationsForGame('Pokémon Legends: Z-A')).toContain('Fateful Encounter')
  })
})
