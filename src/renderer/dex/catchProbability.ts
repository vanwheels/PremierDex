/**
 * Leg 4 of the Species database milestone: catch-probability calculator, on top of Leg 3's
 * base catch rate display. Implements the Generation III+ "shake check" formula (Bulbapedia's
 * published "Catch rate" article; unchanged from Gen III through Gen VII) rather than
 * deriving one from scratch, per Vanny's milestone note.
 *
 * Deliberately scoped to the five balls whose catch-rate bonus is a fixed constant under
 * that formula. Net/Nest/Dive/Repeat/Timer/Quick/Dusk/Fast/Level/Lure/Heavy/Love/Friend/
 * Moon/Sport Balls (see shared/data/poke-balls.ts's full "Caught In" list) all have
 * conditional bonuses — turn count, location, target level/weight/species, time of day —
 * this calculator doesn't collect inputs for, and Legends Arceus's crafted balls use an
 * entirely different real-time, non-shake-check catch mechanic. Left for a follow-on leg
 * if wanted (see TODO.md) rather than guessing at conditional multipliers or applying the
 * wrong formula to LA's balls.
 */

export const CATCH_CALC_BALLS = ['poke', 'great', 'ultra', 'safari', 'master'] as const
export type CatchCalcBall = (typeof CATCH_CALC_BALLS)[number]

export const CATCH_CALC_BALL_LABELS: Record<CatchCalcBall, string> = {
  poke: 'Poké Ball',
  great: 'Great Ball',
  ultra: 'Ultra Ball',
  safari: 'Safari Ball',
  master: 'Master Ball'
}

const BALL_BONUS: Record<CatchCalcBall, number> = {
  poke: 1,
  great: 1.5,
  ultra: 2,
  safari: 1.5,
  master: Number.POSITIVE_INFINITY
}

export const CATCH_CALC_STATUSES = ['none', 'paralysis', 'poison', 'burn', 'sleep', 'freeze'] as const
export type CatchCalcStatus = (typeof CATCH_CALC_STATUSES)[number]

export const CATCH_CALC_STATUS_LABELS: Record<CatchCalcStatus, string> = {
  none: 'None',
  paralysis: 'Paralysis',
  poison: 'Poison',
  burn: 'Burn',
  sleep: 'Sleep',
  freeze: 'Freeze'
}

const STATUS_BONUS: Record<CatchCalcStatus, number> = {
  none: 1,
  paralysis: 1.5,
  poison: 1.5,
  burn: 1.5,
  sleep: 2,
  freeze: 2
}

export interface CatchProbabilityInput {
  captureRate: number
  /** Current HP as a percent (0-100) of max HP. Raw current/max HP aren't asked for
   * because the app has no base-stat data to validate a max HP against (stats are out of
   * this milestone's scope — see TODO.md); the formula's floor steps are evaluated against
   * a nominal 100 max HP, which only introduces negligible rounding drift from a real max
   * HP at the same percentage. */
  hpPercent: number
  ball: CatchCalcBall
  status: CatchCalcStatus
}

/** Returns the probability (0-1) of a successful catch. */
export function calculateCatchProbability({ captureRate, hpPercent, ball, status }: CatchProbabilityInput): number {
  if (ball === 'master') return 1

  const hp = Math.min(Math.max(hpPercent, 0), 100)
  const modifiedRate = Math.floor((Math.floor(300 - 2 * hp) * captureRate * BALL_BONUS[ball]) / 300)
  const a = Math.floor(modifiedRate * STATUS_BONUS[status])
  if (a >= 255) return 1

  const b = Math.floor(1048560 / Math.sqrt(Math.sqrt(16711680 / a)))
  return Math.pow(Math.min(b, 65535) / 65536, 4)
}
