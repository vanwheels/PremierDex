import { useEffect, useState } from 'react'
import { safariFleeRatesForSpecies } from '@shared/data/safari-flee-rates'
import type { Form, Species } from '@shared/types/pokemon'
import type { SpeciesDetailsData } from '@shared/types/species-details'
import type { SpeciesDetailTarget } from './SpeciesDetailPopup'
import {
  CATCH_CALC_BALLS,
  CATCH_CALC_BALL_LABELS,
  CATCH_CALC_STATUSES,
  CATCH_CALC_STATUS_LABELS,
  calculateCatchProbability,
  type CatchCalcBall,
  type CatchCalcStatus
} from './catchProbability'
import { formDisplayName, speciesDisplayName } from './formNames'
import { formatCatchProbability, formatEvYield, formatGenderRatio, slugDisplayName } from './speciesPageFormat'
import { defaultSpriteUrl } from './sprites'
import { SpriteModal } from './SpriteModal'
import type { SpriteModalTarget } from './SpriteModal'

export interface SpeciesPageProps {
  target: SpeciesDetailTarget
  species: Species[]
  forms: Form[]
  speciesDetails: SpeciesDetailsData
  onClose: () => void
}

const SPRITE_SIZE = 120

/**
 * Leg 3 of the Species database milestone: the full species page — a sibling AppView
 * (App.tsx), reached via SpeciesDetailPopup's "View Full Page" button, not a modal.
 * Renders the fields Vanny confirmed wanted in the 2026-09-22 triage (ability +
 * description, base happiness, experience growth, EVs earned, gender ratio, base catch
 * rate) off the SpeciesDetailsData dataset Leg 1/2 fetched and wired through IPC, plus
 * Leg 4's catch-probability calculator on top of the base catch rate (see
 * catchProbability.ts).
 *
 * The normal/shiny thumbnails reuse SpriteModal for the enlarge-and-browse-generations
 * behavior (same click-to-open pattern as SpeciesDetailPopup's own sprite), passing
 * `initialShiny` so clicking the shiny thumbnail opens the modal already showing shiny
 * art instead of always defaulting non-shiny.
 */
export function SpeciesPage({ target, species, forms, speciesDetails, onClose }: SpeciesPageProps): JSX.Element {
  const [spriteModalShiny, setSpriteModalShiny] = useState<boolean | null>(null)
  const [calcHpPercent, setCalcHpPercent] = useState(100)
  const [calcStatus, setCalcStatus] = useState<CatchCalcStatus>('none')
  const [calcBall, setCalcBall] = useState<CatchCalcBall>('poke')

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && spriteModalShiny === null) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, spriteModalShiny])

  const sp = species.find((s) => s.id === target.speciesId)
  const form = forms.find((f) => f.speciesId === target.speciesId && f.formName === target.formName)
  const displayName = sp && form ? formDisplayName(speciesDisplayName(sp.name), form) : `#${target.speciesId}`

  const speciesDetail = speciesDetails.species[target.speciesId]
  const formDetail = form ? speciesDetails.forms[form.pokeapiId] : undefined
  const safariFleeRates = safariFleeRatesForSpecies(target.speciesId)

  const spriteModalTarget: SpriteModalTarget | null = form
    ? {
        pokeapiId: form.pokeapiId,
        spriteFormSuffix: form.spriteFormSuffix,
        hasGenderDifference: form.hasGenderDifference,
        displayName,
        firstAvailableGeneration: form.firstAvailableGeneration
      }
    : null

  return (
    <section className="species-page">
      <button type="button" className="species-page-back" onClick={onClose}>
        ‹ Back
      </button>
      <h2 className="species-page-title">{displayName}</h2>
      <div className="species-page-sprites">
        {form ? (
          <>
            <button type="button" className="species-page-sprite-button" onClick={() => setSpriteModalShiny(false)}>
              <img
                src={defaultSpriteUrl(form.pokeapiId, form.spriteFormSuffix, false, false)}
                alt={displayName}
                width={SPRITE_SIZE}
                height={SPRITE_SIZE}
              />
              <span>Normal</span>
            </button>
            <button type="button" className="species-page-sprite-button" onClick={() => setSpriteModalShiny(true)}>
              <img
                src={defaultSpriteUrl(form.pokeapiId, form.spriteFormSuffix, true, false)}
                alt={`${displayName} shiny`}
                width={SPRITE_SIZE}
                height={SPRITE_SIZE}
              />
              <span>Shiny</span>
            </button>
          </>
        ) : (
          <div className="species-page-sprite-missing" style={{ width: SPRITE_SIZE, height: SPRITE_SIZE }} />
        )}
      </div>
      {!speciesDetail || !formDetail ? (
        <p>No detail data available for this species/form yet.</p>
      ) : (
        <dl className="species-page-fields">
          <div className="species-page-field">
            <dt>Abilities</dt>
            <dd>
              <ul className="species-page-abilities">
                {formDetail.abilities.map(({ name, isHidden }) => (
                  <li key={name}>
                    <strong>
                      {slugDisplayName(name)}
                      {isHidden && ' (Hidden)'}
                    </strong>
                    {speciesDetails.abilities[name] && <p>{speciesDetails.abilities[name]}</p>}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div className="species-page-field">
            <dt>Base Happiness</dt>
            <dd>{speciesDetail.baseHappiness}</dd>
          </div>
          <div className="species-page-field">
            <dt>Experience Growth</dt>
            <dd>
              {slugDisplayName(speciesDetail.growthRateName)}
              {speciesDetails.growthRates[speciesDetail.growthRateName] !== undefined &&
                ` (${speciesDetails.growthRates[speciesDetail.growthRateName].toLocaleString()} EXP to level 100)`}
            </dd>
          </div>
          <div className="species-page-field">
            <dt>EVs Earned</dt>
            <dd>
              {formatEvYield(formDetail.evYield)
                .map((entry) => `${entry.value} ${entry.label}`)
                .join(', ') || 'None'}
            </dd>
          </div>
          <div className="species-page-field">
            <dt>Gender Ratio</dt>
            <dd>{formatGenderRatio(speciesDetail.genderRate)}</dd>
          </div>
          <div className="species-page-field">
            <dt>Base Catch Rate</dt>
            <dd>{speciesDetail.captureRate}</dd>
          </div>
          {safariFleeRates.length > 0 && (
            <div className="species-page-field">
              <dt>Safari Zone Flee Rate</dt>
              <dd>
                <ul className="species-page-flee-rates">
                  {safariFleeRates.map((entry) => (
                    <li key={entry.location}>
                      {entry.location} ({entry.gamesLabel}): {entry.fleeRate}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>
      )}
      {speciesDetail && (
        <fieldset className="species-page-calc">
          <legend>Catch Probability Calculator</legend>
          <label className="origin-modal-field">
            Current HP (%)
            <input
              type="number"
              min={0}
              max={100}
              value={calcHpPercent}
              onChange={(e) => setCalcHpPercent(Number(e.target.value))}
            />
          </label>
          <label className="origin-modal-field">
            Status Condition
            <select value={calcStatus} onChange={(e) => setCalcStatus(e.target.value as CatchCalcStatus)}>
              {CATCH_CALC_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {CATCH_CALC_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
          <label className="origin-modal-field">
            Poké Ball
            <select value={calcBall} onChange={(e) => setCalcBall(e.target.value as CatchCalcBall)}>
              {CATCH_CALC_BALLS.map((ball) => (
                <option key={ball} value={ball}>
                  {CATCH_CALC_BALL_LABELS[ball]}
                </option>
              ))}
            </select>
          </label>
          <p className="species-page-calc-result">
            Catch Probability:{' '}
            <strong>
              {formatCatchProbability(
                calculateCatchProbability({
                  captureRate: speciesDetail.captureRate,
                  hpPercent: calcHpPercent,
                  ball: calcBall,
                  status: calcStatus
                })
              )}
            </strong>
          </p>
        </fieldset>
      )}
      {spriteModalShiny !== null && spriteModalTarget && (
        <SpriteModal target={spriteModalTarget} initialShiny={spriteModalShiny} onClose={() => setSpriteModalShiny(null)} />
      )}
    </section>
  )
}
