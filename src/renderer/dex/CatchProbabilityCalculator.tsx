import { useState } from 'react'
import {
  CATCH_CALC_BALLS,
  CATCH_CALC_BALL_LABELS,
  CATCH_CALC_STATUSES,
  CATCH_CALC_STATUS_LABELS,
  calculateCatchProbability,
  type CatchCalcBall,
  type CatchCalcStatus
} from './catchProbability'
import { formatCatchProbability } from './speciesPageFormat'

/** Leg 4 of the Species database milestone's calculator, extracted from SpeciesPage in
 * Full UI/UX pass Leg 3 to keep that file under the line cap — behavior unchanged. */
export function CatchProbabilityCalculator({ captureRate }: { captureRate: number }): JSX.Element {
  const [hpPercent, setHpPercent] = useState(100)
  const [status, setStatus] = useState<CatchCalcStatus>('none')
  const [ball, setBall] = useState<CatchCalcBall>('poke')

  return (
    <fieldset className="species-page-calc">
      <legend>Catch Probability Calculator</legend>
      <label className="origin-modal-field">
        Current HP (%)
        <input type="number" min={0} max={100} value={hpPercent} onChange={(e) => setHpPercent(Number(e.target.value))} />
      </label>
      <label className="origin-modal-field">
        Status Condition
        <select value={status} onChange={(e) => setStatus(e.target.value as CatchCalcStatus)}>
          {CATCH_CALC_STATUSES.map((s) => (
            <option key={s} value={s}>
              {CATCH_CALC_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="origin-modal-field">
        Poké Ball
        <select value={ball} onChange={(e) => setBall(e.target.value as CatchCalcBall)}>
          {CATCH_CALC_BALLS.map((b) => (
            <option key={b} value={b}>
              {CATCH_CALC_BALL_LABELS[b]}
            </option>
          ))}
        </select>
      </label>
      <p className="species-page-calc-result">
        Catch Probability: <strong>{formatCatchProbability(calculateCatchProbability({ captureRate, hpPercent, ball, status }))}</strong>
      </p>
    </fieldset>
  )
}
