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

  it('returns the curated Hoenn list for Pokémon Ruby (Leg 8)', () => {
    const locations = metLocationsForGame('Pokémon Ruby')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 101')
    expect(locations).toContain('Route 134')
    expect(locations).toContain('Littleroot Town')
    expect(locations).toContain('Sky Pillar')
    // Ruby/Sapphire's Hoenn is distinct from Kanto/Johto — no bleed-through.
    expect(locations).not.toContain('Route 1')
    // Emerald/ORAS-only additions shouldn't be present yet.
    expect(locations).not.toContain('Battle Frontier')
    expect(locations).not.toContain('Battle Resort')
    expect(locations).not.toContain('Sea Mauville')
    expect(locations).not.toContain('Trainer Hill')
  })

  it('gives Ruby the Team Magma Hideout and Sapphire the Team Aqua Hideout (the one within-pair split found at Leg 8, besides Black City/White Forest)', () => {
    const ruby = metLocationsForGame('Pokémon Ruby')
    const sapphire = metLocationsForGame('Pokémon Sapphire')
    expect(ruby).toContain('Team Magma Hideout')
    expect(ruby).not.toContain('Team Aqua Hideout')
    expect(sapphire).toContain('Team Aqua Hideout')
    expect(sapphire).not.toContain('Team Magma Hideout')
  })

  it('returns the same Hoenn Gen 3 list for Ruby and Sapphire aside from the hideout split', () => {
    const ruby = metLocationsForGame('Pokémon Ruby') as string[]
    const sapphire = metLocationsForGame('Pokémon Sapphire') as string[]
    expect(ruby.length).toBe(sapphire.length)
    const rubyWithoutHideout = ruby.filter((location) => location !== 'Team Magma Hideout')
    const sapphireWithoutHideout = sapphire.filter((location) => location !== 'Team Aqua Hideout')
    expect(rubyWithoutHideout).toEqual(sapphireWithoutHideout)
  })

  it('appends Fateful Encounter to Pokémon Ruby and Sapphire too (Leg 8)', () => {
    expect(metLocationsForGame('Pokémon Ruby')).toContain('Fateful Encounter')
    expect(metLocationsForGame('Pokémon Sapphire')).toContain('Fateful Encounter')
  })
})
