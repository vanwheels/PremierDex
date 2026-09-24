import { describe, expect, it } from 'vitest'
import { CURRENT_MAX_GENERATION } from './sprites'
import { defaultSpriteSource, GENERATION_SOURCES } from './spriteSources'

describe('GENERATION_SOURCES', () => {
  it('covers every generation from 1 through CURRENT_MAX_GENERATION with at least one source', () => {
    for (let gen = 1; gen <= CURRENT_MAX_GENERATION; gen++) {
      expect(GENERATION_SOURCES[gen]?.length).toBeGreaterThan(0)
    }
  })

  it('offers more than one version only for generations 1-4 and 6', () => {
    const multi = Object.entries(GENERATION_SOURCES)
      .filter(([, sources]) => sources.length > 1)
      .map(([gen]) => Number(gen))
    expect(multi).toEqual([1, 2, 3, 4, 6])
  })

  it('has unique source ids within each generation', () => {
    for (const sources of Object.values(GENERATION_SOURCES)) {
      expect(new Set(sources.map((s) => s.id)).size).toBe(sources.length)
    }
  })
})

describe('defaultSpriteSource', () => {
  it('returns the first source for a generation', () => {
    expect(defaultSpriteSource(3).id).toBe('emerald')
  })

  it('throws for a generation outside the table', () => {
    expect(() => defaultSpriteSource(10)).toThrow()
  })
})
