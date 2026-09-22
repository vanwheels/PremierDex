import { describe, expect, it } from 'vitest'
import { metLocationsForGame } from './met-locations'

describe('metLocationsForGame', () => {
  it('returns the curated Paldea list for Pokémon Scarlet (Leg 26)', () => {
    const locations = metLocationsForGame('Pokémon Scarlet')
    expect(locations).toBeDefined()
    expect(locations).toContain('Mesagoza')
    expect(locations).toContain('South Province (Area One)')
    expect(locations).toContain('Area Zero')
    expect(locations).toContain('Great Crater of Paldea')
  })

  it('has no numbered routes for Paldea, unlike every prior region (Leg 26)', () => {
    const locations = metLocationsForGame('Pokémon Scarlet')
    expect(locations).not.toContain('Route 1')
  })

  it('includes the Kitakami and Blueberry Academy/Terarium DLC areas in the shared Scarlet/Violet list (Leg 26)', () => {
    const locations = metLocationsForGame('Pokémon Scarlet')
    expect(locations).toContain('Kitakami Hall')
    expect(locations).toContain('Oni Mountain')
    expect(locations).toContain('Savanna Biome')
    expect(locations).toContain('Central Plaza')
    expect(locations).toContain('Chargestone Cavern')
  })

  it("splits Mesagoza's academy by version: Naranja Academy in Scarlet, Uva Academy in Violet (Leg 26)", () => {
    const scarlet = metLocationsForGame('Pokémon Scarlet')
    const violet = metLocationsForGame('Pokémon Violet')
    expect(scarlet).toContain('Naranja Academy')
    expect(scarlet).not.toContain('Uva Academy')
    expect(violet).toContain('Uva Academy')
    expect(violet).not.toContain('Naranja Academy')
  })

  it('shares every other Paldea location between Scarlet and Violet (Leg 26)', () => {
    const scarlet = metLocationsForGame('Pokémon Scarlet')!.filter((loc) => loc !== 'Naranja Academy')
    const violet = metLocationsForGame('Pokémon Violet')!.filter((loc) => loc !== 'Uva Academy')
    expect(scarlet).toEqual(violet)
  })

  it('excludes Team Star bases as pure battle facilities with no catchable Pokémon (Leg 26)', () => {
    const locations = metLocationsForGame('Pokémon Scarlet')
    expect(locations).not.toContain("Segin Squad's Base")
    expect(locations).not.toContain("Schedar Squad's Base")
    expect(locations).not.toContain("Navi Squad's Base")
    expect(locations).not.toContain("Ruchbah Squad's Base")
    expect(locations).not.toContain("Caph Squad's Base")
  })

  it('excludes region-name containers and umbrella checklist names from the Paldea list (Leg 26)', () => {
    const locations = metLocationsForGame('Pokémon Scarlet')
    expect(locations).not.toContain('Paldea')
    expect(locations).not.toContain('Kitakami')
    expect(locations).not.toContain('Blueberry Academy')
    expect(locations).not.toContain('Terarium')
    expect(locations).not.toContain('Ten Sights of Paldea')
    expect(locations).not.toContain('Six Wonders of Kitakami')
  })

  it('excludes generic shop/restaurant chains and non-catch social rooms from the Paldea list (Leg 26)', () => {
    const locations = metLocationsForGame('Pokémon Scarlet')
    expect(locations).not.toContain('Poké Mart')
    expect(locations).not.toContain('Pokémon Center')
    expect(locations).not.toContain('Delibird Presents')
    expect(locations).not.toContain('Chansey Supply')
    expect(locations).not.toContain('Blueberry Academy Cafeteria')
    expect(locations).not.toContain('League Club Room')
  })

  it('appends Fateful Encounter to Pokémon Scarlet/Violet too (Leg 26)', () => {
    expect(metLocationsForGame('Pokémon Scarlet')).toContain('Fateful Encounter')
    expect(metLocationsForGame('Pokémon Violet')).toContain('Fateful Encounter')
  })
})
