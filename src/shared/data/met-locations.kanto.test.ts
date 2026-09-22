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
    expect(metLocationsForGame('Pokémon Stadium')).toBeUndefined()
  })

  it('returns undefined for an unrecognized/blank game', () => {
    expect(metLocationsForGame('')).toBeUndefined()
  })

  it('returns the curated Kanto+Sevii Islands list for Pokémon FireRed (Leg 10)', () => {
    const locations = metLocationsForGame('Pokémon FireRed')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 1')
    expect(locations).toContain('Route 25')
    expect(locations).toContain('Pallet Town')
    expect(locations).toContain('Cerulean Cave')
    // Mainland Kanto is unchanged from Red/Blue/Yellow — no Johto connectors.
    expect(locations).not.toContain('Route 26')
    // "Pokémon League" is not a separate Met Location from Indigo Plateau.
    expect(locations).not.toContain('Pokémon League')
  })

  it('includes every Sevii Islands settlement and sub-area for Pokémon FireRed (Leg 10)', () => {
    const locations = metLocationsForGame('Pokémon FireRed')
    expect(locations).toContain('One Island')
    expect(locations).toContain('Two Island')
    expect(locations).toContain('Three Island')
    expect(locations).toContain('Four Island')
    expect(locations).toContain('Five Island')
    expect(locations).toContain('Six Island')
    expect(locations).toContain('Seven Island')
    expect(locations).toContain('Kindle Road')
    expect(locations).toContain('Icefall Cave')
    expect(locations).toContain('Tanoby Ruins')
    expect(locations).toContain('Tanoby Key')
    expect(locations).toContain('Navel Rock')
    expect(locations).toContain('Birth Island')
    // Six Island's Altering Cave is a distinct physical location from Emerald's.
    expect(locations).toContain('Altering Cave')
  })

  it("lists the seven Tanoby Chambers individually rather than under one umbrella name (Leg 10)", () => {
    const locations = metLocationsForGame('Pokémon FireRed')
    expect(locations).toContain('Monean Chamber')
    expect(locations).toContain('Liptoo Chamber')
    expect(locations).toContain('Weepth Chamber')
    expect(locations).toContain('Dilford Chamber')
    expect(locations).toContain('Scufib Chamber')
    expect(locations).toContain('Rixy Chamber')
    expect(locations).toContain('Viapois Chamber')
    expect(locations).not.toContain('Tanoby Chambers')
  })

  it('returns the same Kanto+Sevii Islands list for Pokémon LeafGreen (paired versions share a base list)', () => {
    const fireRed = metLocationsForGame('Pokémon FireRed')
    const leafGreen = metLocationsForGame('Pokémon LeafGreen')
    expect(leafGreen).toEqual(fireRed)
  })

  it('appends Fateful Encounter to Pokémon FireRed and LeafGreen too (Leg 10)', () => {
    expect(metLocationsForGame('Pokémon FireRed')).toContain('Fateful Encounter')
    expect(metLocationsForGame('Pokémon LeafGreen')).toContain('Fateful Encounter')
  })

  it("returns the curated Kanto list for Pokémon Let's Go, Pikachu! (Leg 22)", () => {
    const locations = metLocationsForGame("Pokémon Let's Go, Pikachu!")
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 1')
    expect(locations).toContain('Route 25')
    expect(locations).toContain('Pallet Town')
    expect(locations).toContain('Victory Road')
  })

  it("shares the same Kanto list between Let's Go, Pikachu! and Let's Go, Eevee! (Leg 22)", () => {
    const pikachu = metLocationsForGame("Pokémon Let's Go, Pikachu!")
    const eevee = metLocationsForGame("Pokémon Let's Go, Eevee!")
    expect(pikachu).toEqual(eevee)
  })

  it("normalizes Bulbapedia's Kanto disambiguation prefixes/suffixes to plain in-game names (Leg 22)", () => {
    const locations = metLocationsForGame("Pokémon Let's Go, Pikachu!")
    expect(locations).toContain('Power Plant')
    expect(locations).toContain('Pokémon Mansion')
    expect(locations).toContain('Victory Road')
    expect(locations).toContain('Underground Path (Routes 5–6)')
    expect(locations).toContain('Underground Path (Routes 7–8)')
    expect(locations).not.toContain('Kanto Power Plant')
    expect(locations).not.toContain('Pokémon Mansion (Kanto)')
    expect(locations).not.toContain('Victory Road (Kanto)')
  })

  it("uses Team Rocket Hideout, this game's name for Generation I's Rocket Hideout (Leg 22)", () => {
    const locations = metLocationsForGame("Pokémon Let's Go, Pikachu!")
    expect(locations).toContain('Team Rocket Hideout')
    expect(locations).not.toContain('Rocket Hideout')
  })

  it('keeps the fossil-revival labs and Professor Oak\'s Laboratory as genuine gift locations (Leg 22)', () => {
    const locations = metLocationsForGame("Pokémon Let's Go, Pikachu!")
    expect(locations).toContain('Cinnabar Lab')
    expect(locations).toContain('Pewter Museum of Science')
    expect(locations).toContain("Professor Oak's Laboratory")
  })

  it('includes GO Park as a genuine catch location for Pokémon GO transfers (Leg 22)', () => {
    const locations = metLocationsForGame("Pokémon Let's Go, Pikachu!")
    expect(locations).toContain('GO Park')
  })

  it('excludes the Safari Zone, replaced by GO Park in this game (Leg 22)', () => {
    const locations = metLocationsForGame("Pokémon Let's Go, Pikachu!")
    expect(locations).not.toContain('Safari Zone')
  })

  it('excludes generic buildings with no confirmed catch/gift and non-place category entries (Leg 22)', () => {
    const locations = metLocationsForGame("Pokémon Let's Go, Pikachu!")
    expect(locations).not.toContain('Celadon Condominiums')
    expect(locations).not.toContain('Celadon Department Store')
    expect(locations).not.toContain('Celadon Game Corner')
    expect(locations).not.toContain("Player's house")
    expect(locations).not.toContain('Poké Mart')
    expect(locations).not.toContain('Pokémon Center')
    expect(locations).not.toContain('Kanto')
    expect(locations).not.toContain('Hometown')
    expect(locations).not.toContain('Pokémon Day Care')
    expect(locations).not.toContain('Pokémon League Reception Gate')
    expect(locations).not.toContain('Sea Cottage')
  })

  it("appends Fateful Encounter to Pokémon Let's Go, Pikachu!/Let's Go, Eevee! too (Leg 22)", () => {
    expect(metLocationsForGame("Pokémon Let's Go, Pikachu!")).toContain('Fateful Encounter')
    expect(metLocationsForGame("Pokémon Let's Go, Eevee!")).toContain('Fateful Encounter')
  })
})
