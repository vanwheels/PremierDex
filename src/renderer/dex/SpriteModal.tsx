import { useEffect, useState } from 'react'
import {
  animatedSpriteUrl,
  AnimatedSource,
  availableGenerations,
  generationSpriteUrl,
  hasBlackWhiteAnimatedSprites
} from './sprites'

export interface SpriteModalTarget {
  pokeapiId: number
  spriteFormSuffix: string | null
  /** True for a split-out female dex/collection row — see SpriteThumbnail's prop of the
   * same name. */
  female: boolean
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
 * fallback rather than a broken image — see sprites.ts (which itself falls back to
 * evergreen shiny art for the three generations with no shiny set at all).
 *
 * Animated has two sources (see AnimatedSource in sprites.ts): the authentic gen-5
 * black-white set, and Pokemon Showdown's generation-independent set. The Animated
 * checkbox is always enabled; the black-white/Showdown radio choice only appears when
 * generation 5 is selected; outside gen 5, Showdown is the only option.
 */
export function SpriteModal({ target, onClose }: SpriteModalProps): JSX.Element {
  const generations = availableGenerations(target.firstAvailableGeneration)
  const [generation, setGeneration] = useState(generations[generations.length - 1])
  const [shiny, setShiny] = useState(false)
  const [animated, setAnimated] = useState(false)
  const [preferredSource, setPreferredSource] = useState<AnimatedSource>('black-white')
  const [failed, setFailed] = useState(false)

  const canUseBlackWhite = hasBlackWhiteAnimatedSprites(generation)
  const animatedSource: AnimatedSource = canUseBlackWhite ? preferredSource : 'showdown'

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
              src={
                animated
                  ? animatedSpriteUrl(target.pokeapiId, target.spriteFormSuffix, shiny, animatedSource, target.female)
                  : generationSpriteUrl(target.pokeapiId, target.spriteFormSuffix, generation, shiny, target.female)
              }
              alt={`${target.displayName} — generation ${generation}${shiny ? ' shiny' : ''}${animated ? ' animated' : ''}`}
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
        <div className="sprite-modal-options">
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
          <label>
            <input
              type="checkbox"
              checked={animated}
              onChange={(e) => {
                setAnimated(e.target.checked)
                setFailed(false)
              }}
            />
            Animated
          </label>
          {animated && canUseBlackWhite && (
            <span className="sprite-modal-animated-source">
              <label>
                <input
                  type="radio"
                  name="animated-source"
                  checked={preferredSource === 'black-white'}
                  onChange={() => {
                    setPreferredSource('black-white')
                    setFailed(false)
                  }}
                />
                Black &amp; White
              </label>
              <label>
                <input
                  type="radio"
                  name="animated-source"
                  checked={preferredSource === 'showdown'}
                  onChange={() => {
                    setPreferredSource('showdown')
                    setFailed(false)
                  }}
                />
                Showdown
              </label>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
