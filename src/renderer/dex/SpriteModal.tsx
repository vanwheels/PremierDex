import { useEffect, useState } from 'react'
import { availableGenerations, generationSpriteUrl } from './sprites'

export interface SpriteModalTarget {
  pokeapiId: number
  spriteFormSuffix: string | null
  displayName: string
  firstAvailableGeneration: number
}

interface SpriteModalProps {
  target: SpriteModalTarget
  onClose: () => void
}

const MODAL_SIZE = 200

/**
 * Click-to-enlarge overlay with the generation stepper. Defaults to the most current
 * generation (most recognizable art) and non-shiny; closes on Escape, backdrop click,
 * or the close button. A generation/shiny combo with no sprite file shows a text
 * fallback rather than a broken image — see sprites.ts.
 */
export function SpriteModal({ target, onClose }: SpriteModalProps): JSX.Element {
  const generations = availableGenerations(target.firstAvailableGeneration)
  const [generation, setGeneration] = useState(generations[generations.length - 1])
  const [shiny, setShiny] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const index = generations.indexOf(generation)

  const stepTo = (nextGeneration: number): void => {
    setGeneration(nextGeneration)
    setFailed(false)
  }

  return (
    <div className="sprite-modal-backdrop" onClick={onClose}>
      <div className="sprite-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="sprite-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2>{target.displayName}</h2>
        <div className="sprite-modal-image">
          {failed ? (
            <p>Sprite unavailable for this generation.</p>
          ) : (
            <img
              src={generationSpriteUrl(target.pokeapiId, target.spriteFormSuffix, generation, shiny)}
              alt={`${target.displayName} — generation ${generation}${shiny ? ' shiny' : ''}`}
              width={MODAL_SIZE}
              height={MODAL_SIZE}
              onError={() => setFailed(true)}
            />
          )}
        </div>
        <div className="sprite-modal-controls">
          <button type="button" onClick={() => stepTo(generations[index - 1])} disabled={index === 0} aria-label="Previous generation">
            ‹
          </button>
          <span>Generation {generation}</span>
          <button
            type="button"
            onClick={() => stepTo(generations[index + 1])}
            disabled={index === generations.length - 1}
            aria-label="Next generation"
          >
            ›
          </button>
        </div>
        <label>
          <input
            type="checkbox"
            checked={shiny}
            onChange={(e) => {
              setShiny(e.target.checked)
              setFailed(false)
            }}
          />
          Shiny
        </label>
      </div>
    </div>
  )
}
