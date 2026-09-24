import { describe, expect, it } from 'vitest'
import {
  animatedSpriteUrl,
  hasAnimatedSprites,
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
    expect(defaultSpriteUrl(25, null, false, false)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'
    )
  })

  it('builds the shiny variant under /shiny/', () => {
    expect(defaultSpriteUrl(25, null, true, false)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png'
    )
  })

  it('appends spriteFormSuffix to the id for a cosmetic sub-form', () => {
    expect(defaultSpriteUrl(201, 'b', false, false)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/201-b.png'
    )
  })

  it('builds the female variant under /female/', () => {
    expect(defaultSpriteUrl(593, null, false, true)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/female/593.png'
    )
  })

  it('nests shiny female as /shiny/female/, not /female/shiny/', () => {
    expect(defaultSpriteUrl(593, null, true, true)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/female/593.png'
    )
  })

  it('builds the back variant under /back/', () => {
    expect(defaultSpriteUrl(25, null, false, false, true)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/25.png'
    )
  })

  it('nests back shiny female as /back/shiny/female/', () => {
    expect(defaultSpriteUrl(593, null, true, true, true)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/female/593.png'
    )
  })
})

describe('generationSpriteUrl', () => {
  it('builds a generation-specific URL using that generation’s representative game', () => {
    expect(generationSpriteUrl(25, null, 5, false, false)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/25.png'
    )
  })

  it('builds the shiny variant under a nested /shiny/ subfolder', () => {
    expect(generationSpriteUrl(25, null, 5, true, false)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/shiny/25.png'
    )
  })

  it('builds the URL from a chosen alternate version, including its shiny/back subfolders', () => {
    expect(generationSpriteUrl(25, null, 4, true, false, true, 'heartgold-soulsilver')).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/heartgold-soulsilver/back/shiny/25.png'
    )
  })

  it('applies the chosen version’s coverage: Yellow has no shiny, so it falls back like Red/Blue', () => {
    expect(generationSpriteUrl(25, null, 1, true, false, false, 'yellow')).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png'
    )
  })

  it('uses the real omegaruby-alphasapphire folder name for generation 6', () => {
    expect(generationSpriteUrl(25, null, 6, false, false)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-vi/omegaruby-alphasapphire/25.png'
    )
  })

  it('falls back to the evergreen shiny sprite for generation 1 — the CDN has no shiny subfolder there', () => {
    expect(generationSpriteUrl(25, null, 1, true, false)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png'
    )
  })

  it('uses the .gif extension for generation 7 — ultra-sun-ultra-moon has no .png files', () => {
    expect(generationSpriteUrl(25, null, 7, false, false)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-vii/ultra-sun-ultra-moon/25.gif'
    )
    expect(generationSpriteUrl(593, null, 7, true, true, true)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-vii/ultra-sun-ultra-moon/back/shiny/female/593.gif'
    )
  })

  it('uses the transparent subfolder for generation 2, including shiny and back', () => {
    expect(generationSpriteUrl(25, null, 2, false, false)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/crystal/transparent/25.png'
    )
    expect(generationSpriteUrl(25, null, 2, true, false, true)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/crystal/transparent/back/shiny/25.png'
    )
  })

  it.each([8, 9])('serves generation %i from the HOME renders, with a real shiny folder', (generation) => {
    expect(generationSpriteUrl(25, null, generation, false, false)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/25.png'
    )
    expect(generationSpriteUrl(593, null, generation, true, true)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/female/593.png'
    )
  })

  it('does not fall back for a non-shiny request in a shiny-less generation', () => {
    expect(generationSpriteUrl(25, null, 1, false, false)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/transparent/25.png'
    )
  })

  it('throws for a generation outside the known map', () => {
    expect(() => generationSpriteUrl(25, null, 10, false, false)).toThrow()
  })

  it('appends spriteFormSuffix to the id for a cosmetic sub-form', () => {
    expect(generationSpriteUrl(666, 'icy-snow', 9, false, false)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/666-icy-snow.png'
    )
  })

  it('builds the female variant under a nested /female/ subfolder', () => {
    expect(generationSpriteUrl(593, null, 5, false, true)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/female/593.png'
    )
  })

  it('falls back to the evergreen shiny-female sprite for a shiny-less generation', () => {
    expect(generationSpriteUrl(593, null, 1, true, true)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/female/593.png'
    )
  })

  it('builds the back variant nested under /back/ before shiny/female', () => {
    expect(generationSpriteUrl(593, null, 5, true, true, true)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/back/shiny/female/593.png'
    )
  })

  it('falls back to the evergreen shiny back sprite for generation 1 — back/ exists but inherits the shiny gap', () => {
    expect(generationSpriteUrl(25, null, 1, true, false, true)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/25.png'
    )
  })

  it.each([8, 9])(
    'falls back to the evergreen back sprite for generation %i — HOME has no back/ subfolder',
    (generation) => {
      expect(generationSpriteUrl(25, null, generation, false, false, true)).toBe(
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/25.png'
      )
    }
  )

  it('falls back to the evergreen shiny back sprite for a HOME generation', () => {
    expect(generationSpriteUrl(25, null, 9, true, false, true)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/25.png'
    )
  })

  it('does not fall back for a non-shiny back request in generation 1, which does have back/', () => {
    expect(generationSpriteUrl(25, null, 1, false, false, true)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/transparent/back/25.png'
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
    expect(animatedSpriteUrl(25, null, false, 'black-white', false)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/25.gif'
    )
  })

  it('builds the black-white shiny variant under a nested /shiny/ subfolder', () => {
    expect(animatedSpriteUrl(25, null, true, 'black-white', false)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/shiny/25.gif'
    )
  })

  it('appends spriteFormSuffix to the id for a cosmetic sub-form', () => {
    expect(animatedSpriteUrl(201, 'b', false, 'black-white', false)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/201-b.gif'
    )
  })

  it('builds the Showdown animated URL, generation-independent', () => {
    expect(animatedSpriteUrl(25, null, false, 'showdown', false)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/25.gif'
    )
  })

  it('builds the Showdown shiny variant under a nested /shiny/ subfolder', () => {
    expect(animatedSpriteUrl(25, null, true, 'showdown', false)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/shiny/25.gif'
    )
  })

  it('builds the black-white female variant under a nested /female/ subfolder', () => {
    expect(animatedSpriteUrl(593, null, false, 'black-white', true)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/female/593.gif'
    )
  })

  it('builds the Showdown shiny-female variant nested as /shiny/female/', () => {
    expect(animatedSpriteUrl(593, null, true, 'showdown', true)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/shiny/female/593.gif'
    )
  })

  it('builds the black-white back variant under /back/', () => {
    expect(animatedSpriteUrl(25, null, false, 'black-white', false, true)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/back/25.gif'
    )
  })

  it('builds the Showdown back shiny-female variant nested as /back/shiny/female/', () => {
    expect(animatedSpriteUrl(593, null, true, 'showdown', true, true)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/shiny/female/593.gif'
    )
  })
})

describe('hasAnimatedSprites', () => {
  it('is false before Gen 5 and true from Gen 5 onward', () => {
    expect([1, 2, 3, 4].some(hasAnimatedSprites)).toBe(false)
    expect([5, 6, 7, 8, 9].every(hasAnimatedSprites)).toBe(true)
  })
})
