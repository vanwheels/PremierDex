import { useState } from 'react'
import type { Form } from '@shared/types/pokemon'
import { availableGenerations, generationSpriteUrl } from './sprites'
import { GENERATION_SOURCES, generationArtNote, spriteSourceFor } from './spriteSources'

const SPRITE_SIZE = 120

interface SpeciesSpriteStripProps {
  form: Form
  displayName: string
  generation: number
  /** Chosen version for the current generation; the generation's default when undefined. */
  sourceId?: string
  onGenerationChange: (generation: number) => void
  onSourceChange: (sourceId: string) => void
  onEnlarge: (shiny: boolean) => void
}

/** One sprite button: falls back to text on load error. Keyed by `src` from the caller so
 * `failed` resets whenever the generation changes (same trick as SpriteModal's SpriteSlot). */
function StripSprite({ src, alt, label, onClick }: { src: string; alt: string; label: string; onClick: () => void }): JSX.Element {
  const [failed, setFailed] = useState(false)
  return (
    <button type="button" className="species-page-sprite-button" onClick={onClick}>
      {failed ? (
        <span className="species-page-sprite-missing" style={{ width: SPRITE_SIZE, height: SPRITE_SIZE }}>
          Sprite unavailable for this generation.
        </span>
      ) : (
        <img src={src} alt={alt} width={SPRITE_SIZE} height={SPRITE_SIZE} onError={() => setFailed(true)} />
      )}
      <span>{label}</span>
    </button>
  )
}

/**
 * Full UI/UX pass Leg 3: the sketch's Gen I-IX strip + Normal/Shiny sprite pair, promoted
 * out of SpriteModal's stepper. Generations before the form's firstAvailableGeneration are
 * shown disabled rather than hidden, so the strip always reads as the full I-IX row from the
 * sketch. Sprites-only for now — types/abilities/stats aren't generation-aware in the data
 * model yet (see TODO.md's Species/Dex reference data layer).
 */
export function SpeciesSpriteStrip({
  form,
  displayName,
  generation,
  sourceId,
  onGenerationChange,
  onSourceChange,
  onEnlarge
}: SpeciesSpriteStripProps): JSX.Element {
  const available = availableGenerations(form.firstAvailableGeneration)
  const source = spriteSourceFor(generation, sourceId)
  // Version chips only where the generation has more than one game (Gen 1-4, 6).
  const versions = GENERATION_SOURCES[generation]
  // Gen 1 has no shiny art: drop the slot (the flex row centers the lone sprite) rather than
  // showing the evergreen shiny fallback next to 1990s art.
  const variants = source.hasShiny ? [false, true] : [false]
  const artNote = generationArtNote(generation)
  return (
    <>
      <div className="species-page-gen-strip" role="group" aria-label="Sprite generation">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((gen) => (
          <button
            key={gen}
            type="button"
            className={gen === generation ? 'species-page-gen-button active' : 'species-page-gen-button'}
            aria-pressed={gen === generation}
            disabled={!available.includes(gen)}
            onClick={() => onGenerationChange(gen)}
          >
            Gen {gen}
          </button>
        ))}
      </div>
      {versions.length > 1 && (
        <div className="species-page-gen-strip species-page-version-strip" role="group" aria-label="Sprite version">
          {versions.map((v) => (
            <button
              key={v.id}
              type="button"
              className={v.id === source.id ? 'species-page-gen-button active' : 'species-page-gen-button'}
              aria-pressed={v.id === source.id}
              onClick={() => onSourceChange(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}
      <div className="species-page-sprites">
        {variants.map((shiny) => {
          const src = generationSpriteUrl(form.pokeapiId, form.spriteFormSuffix, generation, shiny, false, false, source.id)
          return (
            <StripSprite
              key={src}
              src={src}
              alt={`${displayName} — generation ${generation}${shiny ? ' shiny' : ''}`}
              label={shiny ? 'Shiny' : 'Normal'}
              onClick={() => onEnlarge(shiny)}
            />
          )
        })}
      </div>
      {artNote && <p className="species-page-sprite-note">{artNote}</p>}
    </>
  )
}
