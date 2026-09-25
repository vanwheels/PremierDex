import { describe, expect, it } from 'vitest'
import { sortRecord } from './sort-record'

describe('sortRecord', () => {
  it('emits keys in sorted order regardless of insertion order', () => {
    const sorted = sortRecord({ zeta: 1, alpha: 2, mid: 3 })
    expect(Object.keys(sorted)).toEqual(['alpha', 'mid', 'zeta'])
    expect(JSON.stringify(sorted)).toBe('{"alpha":2,"mid":3,"zeta":1}')
  })

  it('preserves values and does not mutate the input', () => {
    const input = { b: 'x', a: 'y' }
    const sorted = sortRecord(input)
    expect(sorted).toEqual({ a: 'y', b: 'x' })
    expect(Object.keys(input)).toEqual(['b', 'a'])
  })

  it('sorts hyphenated names by code point, like PokeAPI slugs', () => {
    expect(Object.keys(sortRecord({ 'water-1': 1, 'water-3': 2, 'water-2': 3, ditto: 4 }))).toEqual([
      'ditto',
      'water-1',
      'water-2',
      'water-3'
    ])
  })
})
