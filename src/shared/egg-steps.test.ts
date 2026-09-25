import { describe, expect, it } from 'vitest'
import { baseEggSteps } from './egg-steps'

describe('baseEggSteps', () => {
  it('adds one extra cycle on top of the base cycle count', () => {
    expect(baseEggSteps(10)).toBe(2805)
    expect(baseEggSteps(20)).toBe(5355)
  })

  it('handles the 120-cycle legendary-tier maximum and the 0-cycle floor', () => {
    expect(baseEggSteps(120)).toBe(30855)
    expect(baseEggSteps(0)).toBe(255)
  })
})
