import { useEffect, useState } from 'react'
import type { Form, Species } from '@shared/types/pokemon'
import type { EvolutionEdge } from '@shared/types/evolution'
import type { FormeSwitchGroup } from '@shared/types/forme-switch-groups'
import { EvolutionTree } from './EvolutionTree'
import { FormeSwitchGroupView } from './FormeSwitchGroupView'
import { formDisplayName, speciesDisplayName } from './formNames'
import { defaultSpriteUrl } from './sprites'
import { SpriteModal } from './SpriteModal'

export interface SpeciesDetailTarget {
  speciesId: number
  formName: string
  /** Generation the opener was viewing (e.g. the Dex Locations game's); SpeciesPage starts on it
   * instead of the current max. Omitted = current max. */
  generation?: number
}

interface SpeciesDetailPopupProps {
  target: SpeciesDetailTarget
  species: Species[]
  forms: Form[]
  evolutionEdges: EvolutionEdge[]
  formeSwitchGroups: FormeSwitchGroup[]
  onClose: () => void
  /** Leg 3 of the Species database milestone: "View Full Page" in the info view — opens
   * the new full species page (App.tsx's 'species' AppView) on the currently-viewed
   * species/form (`current` below, not the original `target` prop, so browsing the
   * evolution tree/forme switcher before clicking through lands on the right one). */
  onOpenFullPage: (target: SpeciesDetailTarget) => void
}

const SPRITE_SIZE = 96

/**
 * Leg 3 of the Species detail popup + evolution family tree milestone: the popup shell —
 * species name/sprite plus a button into Leg 2's EvolutionTree. `current` tracks
 * navigation within the tree independently of the `target` prop the popup was originally
 * opened for — EvolutionTree's onSelectSpecies re-centers the popup on a different family
 * member (see that component's own doc comment) without closing the tree view, so a chain
 * can be browsed bubble to bubble before backing out to the info view.
 *
 * Leg 8 adds a second, sibling view — Leg 7's non-evolutionary forme-switch groups
 * (FormeSwitchGroupView) — reachable the same way as the evolution tree (its own button
 * from the info view, its own Back button), but deliberately not merged into the tree: a
 * forme switch isn't an evolution, and only 14 species have a group at all, so the button
 * only renders when `formeSwitchGroups` has an entry for the current species.
 *
 * Leg 12: the info view's sprite is clickable, opening the same SpriteModal every other
 * sprite in the app uses (generation stepper, shiny/animated toggles, back-sprite
 * toggle, and — for a gender-diff form — the male/female side-by-side layout) instead of
 * the plain static image this view rendered before.
 */
export function SpeciesDetailPopup({
  target,
  species,
  forms,
  evolutionEdges,
  formeSwitchGroups,
  onClose,
  onOpenFullPage
}: SpeciesDetailPopupProps): JSX.Element {
  const [current, setCurrent] = useState(target)
  const [view, setView] = useState<'info' | 'tree' | 'formes'>('info')
  const [spriteModalOpen, setSpriteModalOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const sp = species.find((s) => s.id === current.speciesId)
  const form = forms.find((f) => f.speciesId === current.speciesId && f.formName === current.formName)
  const displayName = sp && form ? formDisplayName(speciesDisplayName(sp.name), form) : `#${current.speciesId}`
  const formeSwitchGroup = formeSwitchGroups.find((g) => g.speciesId === current.speciesId)

  return (
    <div className="species-detail-modal-backdrop" onClick={onClose}>
      <div className="species-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="species-detail-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        {view === 'tree' && (
          <>
            <button type="button" className="species-detail-back" onClick={() => setView('info')}>
              ‹ Back
            </button>
            <h2>{displayName}</h2>
            <EvolutionTree
              speciesId={current.speciesId}
              formName={current.formName}
              species={species}
              forms={forms}
              evolutionEdges={evolutionEdges}
              onSelectSpecies={(speciesId, formName) => setCurrent({ speciesId, formName })}
            />
          </>
        )}
        {view === 'formes' && formeSwitchGroup && sp && (
          <>
            <button type="button" className="species-detail-back" onClick={() => setView('info')}>
              ‹ Back
            </button>
            <h2>{displayName}</h2>
            <FormeSwitchGroupView
              group={formeSwitchGroup}
              species={sp}
              forms={forms}
              currentFormName={current.formName}
              onSelectForm={(formName) => setCurrent({ speciesId: current.speciesId, formName })}
            />
          </>
        )}
        {view === 'info' && (
          <>
            {form ? (
              <button
                type="button"
                className="species-detail-sprite-button"
                onClick={() => setSpriteModalOpen(true)}
                aria-label={`Enlarge ${displayName} sprite`}
              >
                <img
                  className="species-detail-sprite"
                  src={defaultSpriteUrl(form.pokeapiId, form.spriteFormSuffix, false, false)}
                  alt={displayName}
                  width={SPRITE_SIZE}
                  height={SPRITE_SIZE}
                />
              </button>
            ) : (
              <div className="species-detail-sprite-missing" style={{ width: SPRITE_SIZE, height: SPRITE_SIZE }} />
            )}
            <h2>{displayName}</h2>
            <div className="species-detail-actions">
              <button type="button" onClick={() => setView('tree')}>
                View Evolution Family
              </button>
              {formeSwitchGroup && (
                <button type="button" onClick={() => setView('formes')}>
                  View Alternate Formes
                </button>
              )}
              <button type="button" onClick={() => onOpenFullPage(current)}>
                View Full Page
              </button>
            </div>
          </>
        )}
      </div>
      {spriteModalOpen && form && (
        <SpriteModal
          target={{
            pokeapiId: form.pokeapiId,
            spriteFormSuffix: form.spriteFormSuffix,
            hasGenderDifference: form.hasGenderDifference,
            displayName,
            firstAvailableGeneration: form.firstAvailableGeneration
          }}
          onClose={() => setSpriteModalOpen(false)}
        />
      )}
    </div>
  )
}
