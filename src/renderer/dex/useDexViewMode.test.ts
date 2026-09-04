import { describe, expect, it } from 'vitest'
import { isDexViewMode } from './useDexViewMode'

describe('isDexViewMode', () => {
  it('accepts both real modes', () => {
    expect(isDexViewMode('list')).toBe(true)
    expect(isDexViewMode('hybrid')).toBe(true)
  })

  it('rejects a future/garbage value', () => {
    expect(isDexViewMode('box')).toBe(false)
    expect(isDexViewMode(null)).toBe(false)
  })
})
