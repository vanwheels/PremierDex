import { describe, expect, it } from 'vitest'
import { metLocationsForGame } from './met-locations'

describe('metLocationsForGame', () => {
  it('returns the curated Unova list for Pokémon Black (Leg 16)', () => {
    const locations = metLocationsForGame('Pokémon Black')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 1')
    expect(locations).toContain('Route 18')
    expect(locations).toContain('Nuvema Town')
    expect(locations).toContain('N\'s Castle')
    expect(locations).toContain('Victory Road')
    // Black 2/White 2-exclusive routes/locations aren't part of the original pair.
    expect(locations).not.toContain('Route 19')
    expect(locations).not.toContain('Aspertia City')
    expect(locations).not.toContain('Pokémon World Tournament')
  })

  it('gives Black the Black City/Black Gate pair and White the White Forest/White Gate pair (Leg 16 within-pair split)', () => {
    const black = metLocationsForGame('Pokémon Black')
    const white = metLocationsForGame('Pokémon White')
    expect(black).toContain('Black City')
    expect(black).toContain('Black Gate')
    expect(black).not.toContain('White Forest')
    expect(black).not.toContain('White Gate')
    expect(white).toContain('White Forest')
    expect(white).toContain('White Gate')
    expect(white).not.toContain('Black City')
    expect(white).not.toContain('Black Gate')
  })

  it('returns the same Unova Gen 5 list for Black and White aside from the City/Gate split (Leg 16)', () => {
    const black = metLocationsForGame('Pokémon Black') as string[]
    const white = metLocationsForGame('Pokémon White') as string[]
    expect(black.length).toBe(white.length)
    const blackWithoutSplit = black.filter((location) => location !== 'Black City' && location !== 'Black Gate')
    const whiteWithoutSplit = white.filter((location) => location !== 'White Forest' && location !== 'White Gate')
    expect(blackWithoutSplit).toEqual(whiteWithoutSplit)
  })

  it('excludes Entralink-duplicate and non-place indices from Pokémon Black\'s list (Leg 16)', () => {
    const locations = metLocationsForGame('Pokémon Black')
    expect(locations).not.toContain('Mystery Zone')
    expect(locations).not.toContain('Faraway place')
    expect(locations).not.toContain('Kanto')
    expect(locations).not.toContain('Johto')
    expect(locations).not.toContain('Hoenn')
    expect(locations).not.toContain('Sinnoh')
    expect(locations).not.toContain('Day-Care Couple')
  })

  it('includes dedicated-index buildings and gates for Pokémon Black (Leg 16)', () => {
    const locations = metLocationsForGame('Pokémon Black')
    expect(locations).toContain('Musical Theater')
    expect(locations).toContain('Gear Station')
    expect(locations).toContain('Unity Tower')
    expect(locations).toContain('Accumula Gate')
    expect(locations).toContain('Undella Gate')
    expect(locations).toContain('Nacrene Gate')
    expect(locations).toContain('Castelia Gate')
    expect(locations).toContain('Nimbasa Gate')
    expect(locations).toContain('Opelucid Gate')
    expect(locations).toContain('Bridge Gate')
    expect(locations).toContain('Route Gate')
  })

  it('appends Fateful Encounter to Pokémon Black and White too (Leg 16)', () => {
    expect(metLocationsForGame('Pokémon Black')).toContain('Fateful Encounter')
    expect(metLocationsForGame('Pokémon White')).toContain('Fateful Encounter')
  })

  it('returns the curated Unova list for Pokémon Black 2, including its own new routes/areas (Leg 17)', () => {
    const locations = metLocationsForGame('Pokémon Black 2')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 1')
    expect(locations).toContain('Route 18')
    expect(locations).toContain('Route 19')
    expect(locations).toContain('Route 23')
    expect(locations).toContain('Aspertia City')
    expect(locations).toContain('Virbank City')
    expect(locations).toContain('Humilau City')
    expect(locations).toContain('Victory Road')
  })

  it('renames Cold Storage to Pokémon World Tournament for Black 2/White 2 (Leg 17)', () => {
    const black2 = metLocationsForGame('Pokémon Black 2')
    const white2 = metLocationsForGame('Pokémon White 2')
    expect(black2).toContain('Pokémon World Tournament')
    expect(black2).not.toContain('Cold Storage')
    expect(white2).toContain('Pokémon World Tournament')
    expect(white2).not.toContain('Cold Storage')
  })

  it('includes Pokémon Dream Radar for both Black 2 and White 2 (Leg 17)', () => {
    expect(metLocationsForGame('Pokémon Black 2')).toContain('Pokémon Dream Radar')
    expect(metLocationsForGame('Pokémon White 2')).toContain('Pokémon Dream Radar')
  })

  it('gives Black 2 the Black City/Black Gate/Black Tower trio and White 2 the White Forest/White Gate/White Treehollow trio (Leg 17 within-pair split)', () => {
    const black2 = metLocationsForGame('Pokémon Black 2')
    const white2 = metLocationsForGame('Pokémon White 2')
    expect(black2).toContain('Black City')
    expect(black2).toContain('Black Gate')
    expect(black2).toContain('Black Tower')
    expect(black2).not.toContain('White Forest')
    expect(black2).not.toContain('White Gate')
    expect(black2).not.toContain('White Treehollow')
    expect(white2).toContain('White Forest')
    expect(white2).toContain('White Gate')
    expect(white2).toContain('White Treehollow')
    expect(white2).not.toContain('Black City')
    expect(white2).not.toContain('Black Gate')
    expect(white2).not.toContain('Black Tower')
  })

  it('returns the same Black 2/White 2 base list aside from the City/Gate/Tower split (Leg 17)', () => {
    const black2 = metLocationsForGame('Pokémon Black 2') as string[]
    const white2 = metLocationsForGame('Pokémon White 2') as string[]
    expect(black2.length).toBe(white2.length)
    const black2WithoutSplit = black2.filter(
      (location) => location !== 'Black City' && location !== 'Black Gate' && location !== 'Black Tower'
    )
    const white2WithoutSplit = white2.filter(
      (location) => location !== 'White Forest' && location !== 'White Gate' && location !== 'White Treehollow'
    )
    expect(black2WithoutSplit).toEqual(white2WithoutSplit)
  })

  it("does not carry over Black/White's own Black City/Black Gate/White Forest/White Gate distinction incorrectly (Leg 17)", () => {
    // Black 2/White 2 is its own array, built fresh rather than reusing UNOVA_BLACK/UNOVA_WHITE.
    const black2 = metLocationsForGame('Pokémon Black 2')
    const white2 = metLocationsForGame('Pokémon White 2')
    expect(black2).not.toBe(metLocationsForGame('Pokémon Black'))
    expect(white2).not.toBe(metLocationsForGame('Pokémon White'))
  })

  it('appends Fateful Encounter to Pokémon Black 2 and White 2 too (Leg 17)', () => {
    expect(metLocationsForGame('Pokémon Black 2')).toContain('Fateful Encounter')
    expect(metLocationsForGame('Pokémon White 2')).toContain('Fateful Encounter')
  })
})
