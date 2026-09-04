import { describe, expect, it } from 'vitest'
import { isDexViewMode } from './useDexViewMode'

describe('isDexViewMode', () => {
  it('accepts the one real mode', () => {
    expect(isDexViewMode('list')).toBe(true)
  })

  it('rejects a future/garbage value', () => {
    expect(isDexViewMode('hybrid')).toBe(false)
    expect(isDexViewMode('box')).toBe(false)
    expect(isDexViewMode(null)).toBe(false)
  })
})
