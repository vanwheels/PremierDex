import { describe, expect, it } from 'vitest'
import { metLocationsForGame } from './met-locations'

describe('metLocationsForGame', () => {
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

  it('returns the curated Hoenn list for Pokémon Emerald (Leg 9)', () => {
    const locations = metLocationsForGame('Pokémon Emerald')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 101')
    expect(locations).toContain('Route 134')
    expect(locations).toContain('Littleroot Town')
    expect(locations).toContain('Sky Pillar')
    // Emerald-only additions layered onto Ruby/Sapphire's Hoenn base.
    expect(locations).toContain('Battle Frontier')
    expect(locations).toContain('Trainer Hill')
    expect(locations).toContain('Mirage Tower')
    expect(locations).toContain('Desert Underpass')
    expect(locations).toContain('Artisan Cave')
    expect(locations).toContain('Marine Cave')
    expect(locations).toContain('Terra Cave')
    expect(locations).toContain('Altering Cave')
    expect(locations).toContain('Birth Island')
    expect(locations).toContain('Faraway Island')
    expect(locations).toContain('Navel Rock')
    // Index 0x3A is renamed, not duplicated: Battle Tower doesn't also appear alongside
    // Battle Frontier.
    expect(locations).not.toContain('Battle Tower')
  })

  it('gives Emerald both teams\' hideouts, not a version-exclusive split (Leg 9)', () => {
    const emerald = metLocationsForGame('Pokémon Emerald')
    expect(emerald).toContain('Team Aqua Hideout')
    expect(emerald).toContain('Team Magma Hideout (Jagged Pass)')
    // Distinct string from Ruby's Lilycove-area hideout — a different physical location.
    expect(emerald).not.toContain('Team Magma Hideout')
  })

  it('returns Ruby\'s Hoenn Gen 3 base list plus Emerald\'s additions, aside from the Battle Tower/Frontier rename and hideouts (Leg 9)', () => {
    const ruby = metLocationsForGame('Pokémon Ruby') as string[]
    const emerald = metLocationsForGame('Pokémon Emerald') as string[]
    const rubyBase = ruby.filter(
      (location) => location !== 'Team Magma Hideout' && location !== 'Battle Tower' && location !== 'Fateful Encounter'
    )
    for (const location of rubyBase) {
      expect(emerald).toContain(location)
    }
  })

  it('appends Fateful Encounter to Pokémon Emerald too (Leg 9)', () => {
    expect(metLocationsForGame('Pokémon Emerald')).toContain('Fateful Encounter')
  })

  it('returns the curated Hoenn list for Pokémon Omega Ruby (Leg 19)', () => {
    const locations = metLocationsForGame('Pokémon Omega Ruby')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 101')
    expect(locations).toContain('Route 134')
    expect(locations).toContain('Littleroot Town')
    expect(locations).toContain('Sky Pillar')
    // ORAS's engine recognizes X/Y's Kalos indices for trade-display purposes, but they
    // aren't part of ORAS's own map any more than HGSS's Johto/Kanto was part of Platinum's.
    expect(locations).not.toContain('Route 1')
    expect(locations).not.toContain('Vaniville Town')
    expect(locations).not.toContain('Lumiose City')
  })

  it('returns the same Hoenn ORAS list for Pokémon Alpha Sapphire (paired versions share a base list)', () => {
    const omegaRuby = metLocationsForGame('Pokémon Omega Ruby')
    const alphaSapphire = metLocationsForGame('Pokémon Alpha Sapphire')
    expect(alphaSapphire).toEqual(omegaRuby)
  })

  it('gives Omega Ruby/Alpha Sapphire both teams\' hideouts, not a version-exclusive split like original Ruby/Sapphire (Leg 19)', () => {
    const locations = metLocationsForGame('Pokémon Omega Ruby')
    expect(locations).toContain('Team Aqua Hideout')
    expect(locations).toContain('Team Magma Hideout')
    // At Ruby/Sapphire's original Lilycove-area location, not Emerald's relocated one.
    expect(locations).not.toContain('Team Magma Hideout (Jagged Pass)')
  })

  it('includes the remade Hoenn-only locations absent from the original Ruby/Sapphire/Emerald maps (Leg 19)', () => {
    const locations = metLocationsForGame('Pokémon Omega Ruby')
    expect(locations).toContain('Sea Mauville')
    expect(locations).toContain('Battle Resort')
    expect(locations).toContain('Soaring in the sky')
  })

  it('includes every Mirage Spot area, replacing the original static Mirage Island (Leg 19)', () => {
    const locations = metLocationsForGame('Pokémon Omega Ruby')
    expect(locations).toContain('Mirage Forest')
    expect(locations).toContain('Mirage Cave')
    expect(locations).toContain('Mirage Island')
    expect(locations).toContain('Mirage Mountain')
    expect(locations).toContain('Trackless Forest')
    expect(locations).toContain('Pathless Plain')
    expect(locations).toContain('Nameless Cavern')
    expect(locations).toContain('Fabled Cave')
    expect(locations).toContain('Gnarled Den')
    expect(locations).toContain('Crescent Isle')
    expect(locations).toContain('Secret Islet')
    expect(locations).toContain('Secret Shore')
    expect(locations).toContain('Secret Meadow')
  })

  it('excludes non-place special indices from Pokémon Omega Ruby\'s list (Leg 19)', () => {
    const locations = metLocationsForGame('Pokémon Omega Ruby')
    expect(locations).not.toContain('Inside of Truck')
    expect(locations).not.toContain('Secret Base')
    expect(locations).not.toContain('Day-Care Couple')
  })

  it('appends Fateful Encounter to Pokémon Omega Ruby and Alpha Sapphire too (Leg 19)', () => {
    expect(metLocationsForGame('Pokémon Omega Ruby')).toContain('Fateful Encounter')
    expect(metLocationsForGame('Pokémon Alpha Sapphire')).toContain('Fateful Encounter')
  })
})
