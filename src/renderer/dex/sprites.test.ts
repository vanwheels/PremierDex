import { describe, expect, it } from 'vitest'
import { availableGenerations, CURRENT_MAX_GENERATION, defaultSpriteUrl, generationSpriteUrl } from './sprites'

describe('availableGenerations', () => {
  it('runs from firstAvailableGeneration through the current generation', () => {
    expect(availableGenerations(7)).toEqual([7, 8, 9])
  })

  it('starts at 1 for gen-1 forms and ends at CURRENT_MAX_GENERATION', () => {
    const result = availableGenerations(1)
    expect(result[0]).toBe(1)
    expect(result[result.length - 1]).toBe(CURRENT_MAX_GENERATION)
    expect(result).toHaveLength(CURRENT_MAX_GENERATION)
  })

  it('clamps a firstAvailableGeneration below 1 to 1', () => {
    expect(availableGenerations(0)[0]).toBe(1)
  })
})

describe('defaultSpriteUrl', () => {
  it('builds the evergreen default sprite URL', () => {
    expect(defaultSpriteUrl(25, null, false)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'
    )
  })

  it('builds the shiny variant under /shiny/', () => {
    expect(defaultSpriteUrl(25, null, true)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png'
    )
  })

  it('appends spriteFormSuffix to the id for a cosmetic sub-form', () => {
    expect(defaultSpriteUrl(201, 'b', false)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/201-b.png'
    )
  })
})

describe('generationSpriteUrl', () => {
  it('builds a generation-specific URL using that generation’s representative game', () => {
    expect(generationSpriteUrl(25, null, 5, false)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/25.png'
    )
  })

  it('builds the shiny variant under a nested /shiny/ subfolder', () => {
    expect(generationSpriteUrl(25, null, 5, true)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/shiny/25.png'
    )
  })

  it('gen 1 has no shiny subfolder in the real CDN — the URL is still built, expected to 404', () => {
    // Gen 1 games predate shiny Pokemon entirely; sprites.ts doesn't special-case
    // this, the <img onError> fallback in SpriteModal handles the resulting 404.
    expect(generationSpriteUrl(25, null, 1, true)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/shiny/25.png'
    )
  })

  it('throws for a generation outside the known map', () => {
    expect(() => generationSpriteUrl(25, null, 10, false)).toThrow()
  })

  it('appends spriteFormSuffix to the id for a cosmetic sub-form', () => {
    expect(generationSpriteUrl(666, 'icy-snow', 9, false)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/scarlet-violet/666-icy-snow.png'
    )
  })
})
