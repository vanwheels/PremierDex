import { describe, expect, it } from 'vitest'
import { metLocationsForGame } from './met-locations'

describe('metLocationsForGame', () => {
  it('returns a six-continent region list for Pokémon GO, not a map list (Leg 28)', () => {
    const locations = metLocationsForGame('Pokémon GO')
    expect(locations).toBeDefined()
    expect(locations).toContain('Africa')
    expect(locations).toContain('Asia')
    expect(locations).toContain('Europe')
    expect(locations).toContain('North America')
    expect(locations).toContain('Oceania')
    expect(locations).toContain('South America')
  })

  it('does not use per-species free-text regional-exclusive wording for Pokémon GO (Leg 28)', () => {
    const locations = metLocationsForGame('Pokémon GO')
    expect(locations).not.toContain('Iberian Peninsula')
    expect(locations).not.toContain('Eastern Hemisphere')
    expect(locations).not.toContain('New York City')
    expect(locations).not.toContain('Asia-Pacific')
  })

  it('appends Fateful Encounter to Pokémon GO too (Leg 28)', () => {
    expect(metLocationsForGame('Pokémon GO')).toContain('Fateful Encounter')
  })
})
