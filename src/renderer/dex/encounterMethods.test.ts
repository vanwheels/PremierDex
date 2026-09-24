import { describe, expect, it } from 'vitest'
import { methodCategory, splitByMethodCategory } from './encounterMethods'
import type { EncounterRow } from './encountersFormat'

const row = (category: string, method = 'X'): EncounterRow => ({ method, category, levels: 'Lv. 5 (100%)', conditions: null })

describe('methodCategory', () => {
  it('maps common methods and sends unlisted ones to Special', () => {
    expect(methodCategory('walk').key).toBe('wild')
    expect(methodCategory('surf').key).toBe('surfing')
    expect(methodCategory('super-rod').key).toBe('fishing')
    expect(methodCategory('headbutt-low').key).toBe('headbutt')
    expect(methodCategory('rock-smash').key).toBe('rock-smash')
    expect(methodCategory('gift').key).toBe('special')
    expect(methodCategory('overworld-special').key).toBe('special')
  })
})

describe('splitByMethodCategory', () => {
  const entries = [
    { speciesId: 1, rows: [row('wild'), row('fishing', 'Old Rod')] },
    { speciesId: 2, rows: [row('fishing', 'Good Rod')] }
  ]

  it('builds tables in fixed category order, omitting empty ones', () => {
    expect(splitByMethodCategory(entries).map((t) => t.category.key)).toEqual(['wild', 'fishing'])
  })

  it('narrows each entry to its rows in the category and keeps species order', () => {
    const fishing = splitByMethodCategory(entries)[1]
    expect(fishing.entries.map((e) => [e.speciesId, e.rows.map((r) => r.method)])).toEqual([
      [1, ['Old Rod']],
      [2, ['Good Rod']]
    ])
  })
})
