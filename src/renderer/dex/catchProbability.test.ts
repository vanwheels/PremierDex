import { describe, expect, it } from 'vitest'
import { calculateCatchProbability } from './catchProbability'

describe('calculateCatchProbability', () => {
  it('always returns 1 for a Master Ball, regardless of other inputs', () => {
    expect(calculateCatchProbability({ captureRate: 3, hpPercent: 100, ball: 'master', status: 'none' })).toBe(1)
    expect(calculateCatchProbability({ captureRate: 3, hpPercent: 1, ball: 'master', status: 'sleep' })).toBe(1)
  })

  it('returns 1 once the modified rate reaches 255 (a high enough capture rate at low HP)', () => {
    expect(calculateCatchProbability({ captureRate: 255, hpPercent: 1, ball: 'ultra', status: 'sleep' })).toBe(1)
  })

  it('matches the Gen III+ shake-check formula for known inputs (values cross-checked against the formula run independently in Node)', () => {
    expect(calculateCatchProbability({ captureRate: 45, hpPercent: 100, ball: 'poke', status: 'none' })).toBeCloseTo(
      0.05881545433224514
    )
    expect(calculateCatchProbability({ captureRate: 255, hpPercent: 100, ball: 'poke', status: 'none' })).toBeCloseTo(
      0.33329072215532407
    )
    expect(calculateCatchProbability({ captureRate: 3, hpPercent: 100, ball: 'poke', status: 'none' })).toBeCloseTo(
      0.003920574771824805
    )
    expect(calculateCatchProbability({ captureRate: 3, hpPercent: 1, ball: 'ultra', status: 'sleep' })).toBeCloseTo(
      0.039211103886752634
    )
  })

  it('increases catch probability as the ball improves, holding everything else fixed', () => {
    const pokeBall = calculateCatchProbability({ captureRate: 45, hpPercent: 100, ball: 'poke', status: 'none' })
    const ultraBall = calculateCatchProbability({ captureRate: 45, hpPercent: 100, ball: 'ultra', status: 'none' })
    expect(ultraBall).toBeGreaterThan(pokeBall)
  })

  it('increases catch probability as HP drops, holding everything else fixed', () => {
    const fullHp = calculateCatchProbability({ captureRate: 45, hpPercent: 100, ball: 'poke', status: 'none' })
    const lowHp = calculateCatchProbability({ captureRate: 45, hpPercent: 1, ball: 'poke', status: 'none' })
    expect(lowHp).toBeGreaterThan(fullHp)
  })

  it('increases catch probability under a status condition, holding everything else fixed', () => {
    const noStatus = calculateCatchProbability({ captureRate: 45, hpPercent: 100, ball: 'poke', status: 'none' })
    const asleep = calculateCatchProbability({ captureRate: 45, hpPercent: 100, ball: 'poke', status: 'sleep' })
    expect(asleep).toBeGreaterThan(noStatus)
  })

  it('clamps out-of-range HP percentages instead of producing a nonsensical result', () => {
    const belowZero = calculateCatchProbability({ captureRate: 45, hpPercent: -10, ball: 'poke', status: 'none' })
    const zero = calculateCatchProbability({ captureRate: 45, hpPercent: 0, ball: 'poke', status: 'none' })
    expect(belowZero).toBe(zero)

    const above100 = calculateCatchProbability({ captureRate: 45, hpPercent: 150, ball: 'poke', status: 'none' })
    const oneHundred = calculateCatchProbability({ captureRate: 45, hpPercent: 100, ball: 'poke', status: 'none' })
    expect(above100).toBe(oneHundred)
  })
})
