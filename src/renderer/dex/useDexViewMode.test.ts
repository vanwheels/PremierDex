import { describe, expect, it } from 'vitest'
import { isDexViewMode } from './useDexViewMode'

describe('isDexViewMode', () => {
  it('accepts all three real modes', () => {
    expect(isDexViewMode('list')).toBe(true)
    expect(isDexViewMode('hybrid')).toBe(true)
    expect(isDexViewMode('box')).toBe(true)
  })

  it('rejects a garbage value', () => {
    expect(isDexViewMode('garbage')).toBe(false)
    expect(isDexViewMode(null)).toBe(false)
  })
})
