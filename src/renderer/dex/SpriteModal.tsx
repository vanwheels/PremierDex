import { useEffect, useState } from 'react'
import {
  animatedSpriteUrl,
  AnimatedSource,
  availableGenerations,
  generationSpriteUrl,
  hasAnimatedSprites,
  hasBlackWhiteAnimatedSprites
} from './sprites'
import { spriteSourceFor } from './spriteSources'

export interface SpriteModalTarget {
  pokeapiId: number
  spriteFormSuffix: string | null
  /** Mirrors Form.hasGenderDifference — drives the male/female side-by-side layout
   * below. Supersedes the old single-gender `female` target field: since side-by-side
   * always shows both sprites for a gender-diff form regardless of which split row
   * (DexRow's male or female row) was clicked, there's no longer a
   * per-target gender to pick. */
  hasGenderDifference: boolean
  displayName: string
  firstAvailableGeneration: number
}

interface SpriteModalProps {
  target: SpriteModalTarget
  onClose: () => void
  /** Leg 3 of the Species database milestone: lets SpeciesPage's shiny thumbnail open
   * straight into the shiny view instead of always defaulting non-shiny. */
  initialShiny?: boolean
  /** Full UI/UX pass Leg 3: SpeciesPage's inline Gen I-IX strip hands its current
   * selection through so enlarging a sprite opens on the generation already being viewed.
   * Ignored if outside the form's availableGenerations range. */
  initialGeneration?: number
  /** Sprite-version choices from SpeciesPage's version chips (generation → source id), so the
   * enlarged sprite shows the game being viewed. Read-only here; absent = each default. */
  spriteSourceIds?: Record<number, string>
}

const MODAL_SIZE = 200

/** One sprite slot: an <img> that falls back to text on load error. Keyed by `src` from
 * the caller (React remounts on key change), which resets `failed` back to false for
 * free whenever the generation/shiny/animated/back/gender selection changes — no manual
 * reset needed the way the single-image version used to require in every option handler. */
function SpriteSlot({ src, alt, label }: { src: string; alt: string; label?: string }): JSX.Element {
  const [failed, setFailed] = useState(false)
  return (
    <div className="sprite-modal-image-slot">
      {failed ? (
        <p>Sprite unavailable for this generation.</p>
      ) : (
        <img src={src} alt={alt} width={MODAL_SIZE} height={MODAL_SIZE} onError={() => setFailed(true)} />
      )}
      {label && <span className="sprite-modal-image-slot-label">{label}</span>}
    </div>
  )
}

/**
 * Click-to-enlarge overlay with the generation stepper. Defaults to the most current
 * generation (most recognizable art) and non-shiny; closes on Escape, backdrop click,
 * or the close button. A generation/shiny combo with no sprite file shows a text
 * fallback rather than a broken image. Shiny is disabled where the generation has no shiny
 * art (Gen 1) and Animated where it has no animated art (before Gen 5).
 *
 * Animated has two sources (see AnimatedSource in sprites.ts): the authentic gen-5
 * black-white set, and Pokemon Showdown's generation-independent set. The Animated
 * checkbox is always enabled; the black-white/Showdown radio choice only appears when
 * generation 5 is selected; outside gen 5, Showdown is the only option.
 *
 * Leg 12: a gender-diff form (target.hasGenderDifference) shows male and female sprites
 * side by side (Serebii-style, not a toggle) instead of the single image every other
 * form gets — each side tracks its own load failure independently, since gender-specific
 * art can start later than the form itself (e.g. Pikachu's gender difference wasn't
 * drawn until generation IV). A Back checkbox (Leg 11's back-sprite builders) applies to
 * whichever sprite(s) are currently shown, static or animated.
 */
export function SpriteModal({ target, onClose, initialShiny = false, initialGeneration, spriteSourceIds = {} }: SpriteModalProps): JSX.Element {
  const generations = availableGenerations(target.firstAvailableGeneration)
  const [generation, setGeneration] = useState(
    initialGeneration !== undefined && generations.includes(initialGeneration) ? initialGeneration : generations[generations.length - 1]
  )
  const [shiny, setShiny] = useState(initialShiny)
  const [animatedPref, setAnimatedPref] = useState(false)
  const [back, setBack] = useState(false)
  const [preferredSource, setPreferredSource] = useState<AnimatedSource>('black-white')

  // The Animated / Shiny choices persist across generations but only apply where that art
  // exists (no animated art before Gen 5, no shiny art in Gen 1).
  const canAnimate = hasAnimatedSprites(generation)
  const animated = animatedPref && canAnimate
  const source = spriteSourceFor(generation, spriteSourceIds[generation])
  const canShiny = animated || source.hasShiny
  const showShiny = shiny && canShiny
  const canUseBlackWhite = hasBlackWhiteAnimatedSprites(generation)
  const animatedSource: AnimatedSource = canUseBlackWhite ? preferredSource : 'showdown'

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  // HOME renders (Gen 8/9) have no back/ art, so hide the toggle rather than substituting
  // evergreen back art; the animated Showdown set has back sprites for every generation.
  const canBack = animated || source.hasBack
  const showBack = back && canBack

  const index = generations.indexOf(generation)

  const spriteUrl = (female: boolean): string =>
    animated
      ? animatedSpriteUrl(target.pokeapiId, target.spriteFormSuffix, showShiny, animatedSource, female, showBack)
      : generationSpriteUrl(target.pokeapiId, target.spriteFormSuffix, generation, showShiny, female, showBack, source.id)

  const altSuffix = `${showShiny ? ' shiny' : ''}${animated ? ' animated' : ''}${showBack ? ' back' : ''}`

  return (
    <div className="sprite-modal-backdrop" onClick={onClose}>
      <div className="sprite-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="sprite-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2>{target.displayName}</h2>
        <div className="sprite-modal-image">
          {target.hasGenderDifference ? (
            <>
              <SpriteSlot
                key={spriteUrl(false)}
                src={spriteUrl(false)}
                alt={`${target.displayName} — generation ${generation} male${altSuffix}`}
                label="Male"
              />
              <SpriteSlot
                key={spriteUrl(true)}
                src={spriteUrl(true)}
                alt={`${target.displayName} — generation ${generation} female${altSuffix}`}
                label="Female"
              />
            </>
          ) : (
            <SpriteSlot
              key={spriteUrl(false)}
              src={spriteUrl(false)}
              alt={`${target.displayName} — generation ${generation}${altSuffix}`}
            />
          )}
        </div>
        <div className="sprite-modal-controls">
          <button type="button" onClick={() => setGeneration(generations[index - 1])} disabled={index === 0} aria-label="Previous generation">
            ‹
          </button>
          <span>Generation {generation}</span>
          <button
            type="button"
            onClick={() => setGeneration(generations[index + 1])}
            disabled={index === generations.length - 1}
            aria-label="Next generation"
          >
            ›
          </button>
        </div>
        <div className="sprite-modal-options">
          <label>
            <input type="checkbox" checked={showShiny} disabled={!canShiny} onChange={(e) => setShiny(e.target.checked)} />
            Shiny
          </label>
          <label>
            <input type="checkbox" checked={animated} disabled={!canAnimate} onChange={(e) => setAnimatedPref(e.target.checked)} />
            Animated
          </label>
          {canBack && (
            <label>
              <input type="checkbox" checked={back} onChange={(e) => setBack(e.target.checked)} />
              Back
            </label>
          )}
          {animated && canUseBlackWhite && (
            <span className="sprite-modal-animated-source">
              <label>
                <input
                  type="radio"
                  name="animated-source"
                  checked={preferredSource === 'black-white'}
                  onChange={() => setPreferredSource('black-white')}
                />
                Black &amp; White
              </label>
              <label>
                <input
                  type="radio"
                  name="animated-source"
                  checked={preferredSource === 'showdown'}
                  onChange={() => setPreferredSource('showdown')}
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
