import { describe, expect, it } from 'vitest'
import {
  animatedSpriteUrl,
  availableGenerations,
  CURRENT_MAX_GENERATION,
  defaultSpriteUrl,
  generationSpriteUrl,
  hasBlackWhiteAnimatedSprites
} from './sprites'

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

  it('uses the real omegaruby-alphasapphire folder name for generation 6', () => {
    expect(generationSpriteUrl(25, null, 6, false)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-vi/omegaruby-alphasapphire/25.png'
    )
  })

  it.each([1, 8, 9])(
    'falls back to the evergreen shiny sprite for generation %i — the CDN has no shiny subfolder there',
    (generation) => {
      expect(generationSpriteUrl(25, null, generation, true)).toBe(
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png'
      )
    }
  )

  it('does not fall back for a non-shiny request in a shiny-less generation', () => {
    expect(generationSpriteUrl(25, null, 1, false)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/25.png'
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

describe('hasBlackWhiteAnimatedSprites', () => {
  it('is true only for generation 5', () => {
    expect(hasBlackWhiteAnimatedSprites(5)).toBe(true)
  })

  it('is false for every other generation', () => {
    expect(hasBlackWhiteAnimatedSprites(1)).toBe(false)
    expect(hasBlackWhiteAnimatedSprites(9)).toBe(false)
  })
})

describe('animatedSpriteUrl', () => {
  it('builds the gen-5 black-white animated URL as a .gif', () => {
    expect(animatedSpriteUrl(25, null, false, 'black-white')).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/25.gif'
    )
  })

  it('builds the black-white shiny variant under a nested /shiny/ subfolder', () => {
    expect(animatedSpriteUrl(25, null, true, 'black-white')).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/shiny/25.gif'
    )
  })

  it('appends spriteFormSuffix to the id for a cosmetic sub-form', () => {
    expect(animatedSpriteUrl(201, 'b', false, 'black-white')).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/201-b.gif'
    )
  })

  it('builds the Showdown animated URL, generation-independent', () => {
    expect(animatedSpriteUrl(25, null, false, 'showdown')).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/25.gif'
    )
  })

  it('builds the Showdown shiny variant under a nested /shiny/ subfolder', () => {
    expect(animatedSpriteUrl(25, null, true, 'showdown')).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/shiny/25.gif'
    )
  })
})
