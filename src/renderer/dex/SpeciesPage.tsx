import { useEffect, useState } from 'react'
import { safariFleeRatesForSpecies } from '@shared/data/safari-flee-rates'
import type { Form, Species } from '@shared/types/pokemon'
import type { EncounterData } from '@shared/types/encounters'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import type { SpeciesDetailsData } from '@shared/types/species-details'
import type { SpeciesDetailTarget } from './SpeciesDetailPopup'
import { CatchProbabilityCalculator } from './CatchProbabilityCalculator'
import { encounterSectionsForForm } from './encountersFormat'
import { WhereToFindBox } from './WhereToFindBox'
import { formDisplayName, formShortLabel, speciesDisplayName } from './formNames'
import { regionalDexNumbersForGeneration } from './regionalDexNumbers'
import { formatEvYield, formatGenderRatio, slugDisplayName } from './speciesPageFormat'
import { CURRENT_MAX_GENERATION } from './sprites'
import { SpriteModal } from './SpriteModal'
import type { SpriteModalTarget } from './SpriteModal'
import { SpeciesSpriteStrip } from './SpeciesSpriteStrip'

export interface SpeciesPageProps {
  target: SpeciesDetailTarget
  species: Species[]
  forms: Form[]
  speciesDetails: SpeciesDetailsData
  encounterData: EncounterData
  speciesAvailability: SpeciesAvailabilityData
  onClose: () => void
}

/** Sketch layout's labelled box: a titled panel around one field group. */
function Box({ title, className, children }: { title: string; className?: string; children: React.ReactNode }): JSX.Element {
  return (
    <section className={className ? `species-page-box ${className}` : 'species-page-box'}>
      <h3>{title}</h3>
      {children}
    </section>
  )
}

/**
 * The full species page — a sibling AppView (App.tsx), reached via SpeciesDetailPopup's
 * "View Full Page" button, not a modal. Full UI/UX pass Leg 3 reflowed it into the sketched
 * layout (docs/design/ui-ux-pass/sketch-2-species-page.jpg): title with National Dex #,
 * inline Gen I-IX sprite strip (SpeciesSpriteStrip), an Abilities box beside a
 * gender-ratio box, then one box per remaining field group.
 *
 * Clicking either sprite still opens SpriteModal, now as the place for the extras the strip
 * doesn't carry (Animated, Back, male/female pair), starting on the strip's generation.
 * Types and base stats from the sketch aren't in the data model yet — see TODO.md's
 * Species/Dex reference data layer.
 */
export function SpeciesPage({
  target,
  species,
  forms,
  speciesDetails,
  encounterData,
  speciesAvailability,
  onClose
}: SpeciesPageProps): JSX.Element {
  const [spriteModalShiny, setSpriteModalShiny] = useState<boolean | null>(null)
  // Starts on the generation the opener was viewing (clamped up to when this form first
  // existed), else the current max.
  const [generation, setGeneration] = useState(() => {
    const opened = forms.find((f) => f.speciesId === target.speciesId && f.formName === target.formName)
    return Math.max(target.generation ?? CURRENT_MAX_GENERATION, opened?.firstAvailableGeneration ?? 1)
  })
  // Starts on the form the page was opened for; the form strip below switches it.
  const [formName, setFormName] = useState(target.formName)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && spriteModalShiny === null) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, spriteModalShiny])

  const sp = species.find((s) => s.id === target.speciesId)
  const form = forms.find((f) => f.speciesId === target.speciesId && f.formName === formName)
  const displayName = sp && form ? formDisplayName(speciesDisplayName(sp.name), form) : `#${target.speciesId}`

  const speciesDetail = speciesDetails.species[target.speciesId]
  const formDetail = form ? speciesDetails.forms[form.pokeapiId] : undefined
  const safariFleeRates = safariFleeRatesForSpecies(target.speciesId)
  const whereToFind = form ? encounterSectionsForForm(encounterData, form.pokeapiId) : []
  // Cosmetic variants share their base form's data, so only real forms get a toggle.
  const speciesForms = forms.filter((f) => f.speciesId === target.speciesId && f.formCategory !== 'cosmetic_variant')
  const regionalDexes = regionalDexNumbersForGeneration(target.speciesId, generation, speciesAvailability)

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
      <h2 className="species-page-title">
        {displayName} #{String(target.speciesId).padStart(3, '0')}
      </h2>
      {speciesForms.length > 1 && (
        <div className="species-page-gen-strip" role="group" aria-label="Form">
          {speciesForms.map((f) => (
            <button
              key={f.formName}
              type="button"
              className={f.formName === formName ? 'species-page-gen-button active' : 'species-page-gen-button'}
              aria-pressed={f.formName === formName}
              onClick={() => {
                setFormName(f.formName)
                // A later-introduced form (e.g. a Gen 6 Mega) has earlier generations disabled.
                setGeneration((g) => Math.max(g, f.firstAvailableGeneration))
              }}
            >
              {formShortLabel(f)}
            </button>
          ))}
        </div>
      )}
      {form && (
        <SpeciesSpriteStrip
          form={form}
          displayName={displayName}
          generation={generation}
          onGenerationChange={setGeneration}
          onEnlarge={setSpriteModalShiny}
        />
      )}
      {!speciesDetail || !formDetail ? (
        <p>No detail data available for this species/form yet.</p>
      ) : (
        <div className="species-page-layout">
          <Box title="Abilities" className="species-page-box-abilities">
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
          </Box>
          <Box title="Gender Ratio">
            <p className="species-page-value">{formatGenderRatio(speciesDetail.genderRate)}</p>
          </Box>
          <Box title="Training" className="species-page-box-wide">
            <dl className="species-page-fields">
              <div className="species-page-field">
                <dt>Base Happiness</dt>
                <dd>{speciesDetail.baseHappiness}</dd>
              </div>
              <div className="species-page-field">
                <dt>Base Catch Rate</dt>
                <dd>{speciesDetail.captureRate}</dd>
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
            </dl>
          </Box>
          {regionalDexes.length > 0 && (
            <Box title={`Regional Dex # (Gen ${generation})`} className="species-page-box-wide">
              <dl className="species-page-fields species-page-fields-grid">
                {regionalDexes.map((dex) => (
                  <div key={dex.dexDisplayName} className="species-page-field">
                    <dt>{dex.dexDisplayName}</dt>
                    <dd>{dex.entryNumbers.map((n) => `#${n}`).join(' / ')}</dd>
                  </div>
                ))}
              </dl>
            </Box>
          )}
          {safariFleeRates.length > 0 && (
            <Box title="Safari Zone Flee Rate" className="species-page-box-wide">
              <ul className="species-page-flee-rates">
                {safariFleeRates.map((entry) => (
                  <li key={entry.location}>
                    {entry.location} ({entry.gamesLabel}): {entry.fleeRate}
                  </li>
                ))}
              </ul>
            </Box>
          )}
          {whereToFind.length > 0 && (
            <Box title="Where to Find" className="species-page-box-wide">
              <WhereToFindBox sections={whereToFind} generation={generation} />
            </Box>
          )}
        </div>
      )}
      {speciesDetail && <CatchProbabilityCalculator captureRate={speciesDetail.captureRate} />}
      {spriteModalShiny !== null && spriteModalTarget && (
        <SpriteModal
          target={spriteModalTarget}
          initialShiny={spriteModalShiny}
          initialGeneration={generation}
          onClose={() => setSpriteModalShiny(null)}
        />
      )}
    </section>
  )
}
