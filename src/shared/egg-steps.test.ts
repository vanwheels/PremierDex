import { describe, expect, it } from 'vitest'
import { baseEggSteps } from './egg-steps'

describe('baseEggSteps', () => {
  it('adds one extra cycle on top of the base cycle count', () => {
    expect(baseEggSteps(10, 4)).toBe(2805)
    expect(baseEggSteps(20, 4)).toBe(5355)
  })

  it('uses each generation\'s steps per cycle', () => {
    expect(baseEggSteps(20, 2)).toBe(5376)
    expect(baseEggSteps(20, 3)).toBe(5376)
    expect(baseEggSteps(20, 4)).toBe(5355)
    expect(baseEggSteps(20, 5)).toBe(5397)
    expect(baseEggSteps(20, 6)).toBe(5397)
    expect(baseEggSteps(20, 7)).toBe(5376)
    expect(baseEggSteps(20, 8)).toBe(2688)
    expect(baseEggSteps(20, 9)).toBe(2688)
  })

  it('defaults to the latest generation when none is given', () => {
    expect(baseEggSteps(20)).toBe(baseEggSteps(20, 9))
  })

  it('falls back to the Gen II value for Gen I, which has no breeding', () => {
    expect(baseEggSteps(20, 1)).toBe(baseEggSteps(20, 2))
  })

  it('handles the 120-cycle legendary-tier maximum and the 0-cycle floor', () => {
    expect(baseEggSteps(120, 4)).toBe(30855)
    expect(baseEggSteps(0, 4)).toBe(255)
  })
})
