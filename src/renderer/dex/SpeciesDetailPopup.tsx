import { useEffect, useState } from 'react'
import type { Form, Species } from '@shared/types/pokemon'
import type { EvolutionEdge } from '@shared/types/evolution'
import type { FormeSwitchGroup } from '@shared/types/forme-switch-groups'
import { EvolutionTree } from './EvolutionTree'
import { FormeSwitchGroupView } from './FormeSwitchGroupView'
import { formDisplayName, speciesDisplayName } from './formNames'
import { defaultSpriteUrl } from './sprites'

export interface SpeciesDetailTarget {
  speciesId: number
  formName: string
}

interface SpeciesDetailPopupProps {
  target: SpeciesDetailTarget
  species: Species[]
  forms: Form[]
  evolutionEdges: EvolutionEdge[]
  formeSwitchGroups: FormeSwitchGroup[]
  onClose: () => void
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
 */
export function SpeciesDetailPopup({
  target,
  species,
  forms,
  evolutionEdges,
  formeSwitchGroups,
  onClose
}: SpeciesDetailPopupProps): JSX.Element {
  const [current, setCurrent] = useState(target)
  const [view, setView] = useState<'info' | 'tree' | 'formes'>('info')

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
              <img
                className="species-detail-sprite"
                src={defaultSpriteUrl(form.pokeapiId, form.spriteFormSuffix, false, false)}
                alt={displayName}
                width={SPRITE_SIZE}
                height={SPRITE_SIZE}
              />
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
            </div>
          </>
        )}
      </div>
    </div>
  )
}
