import { useEffect, useState } from 'react'
import type { Form, Species } from '@shared/types/pokemon'
import type { EvolutionEdge } from '@shared/types/evolution'
import { EvolutionTree } from './EvolutionTree'
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
 */
export function SpeciesDetailPopup({ target, species, forms, evolutionEdges, onClose }: SpeciesDetailPopupProps): JSX.Element {
  const [current, setCurrent] = useState(target)
  const [view, setView] = useState<'info' | 'tree'>('info')

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

  return (
    <div className="species-detail-modal-backdrop" onClick={onClose}>
      <div className="species-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="species-detail-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        {view === 'tree' ? (
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
        ) : (
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
            <button type="button" onClick={() => setView('tree')}>
              View Evolution Family
            </button>
          </>
        )}
      </div>
    </div>
  )
}
