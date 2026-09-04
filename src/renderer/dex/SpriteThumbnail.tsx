import { useState } from 'react'
import { defaultSpriteUrl } from './sprites'

interface SpriteThumbnailProps {
  pokeapiId: number
  spriteFormSuffix: string | null
  /** True for a split-out female dex/collection row — see Form.hasGenderDifference and
   * sprites.ts's module comment for the CDN's "female/" subfolder convention. */
  female: boolean
  displayName: string
  onClick: () => void
  /** Defaults to false: DexRow's single leftmost sprite column is a row-identity icon
   * shared by both the regular and shiny entry, not entry-specific. Leg 8's Hybrid grid
   * passes true for its shiny-slot tiles, where the two slots really are two different
   * sprites. */
  shiny?: boolean
  /** Defaults to THUMBNAIL_SIZE (32) — DexRow's row icon size. Leg 8's Hybrid grid passes
   * a larger size, since sprites are the entire tile there rather than one column among
   * many. */
  size?: number
  /** Extra class(es) appended to the button — Leg 8's Hybrid grid uses this for its
   * unowned-placeholder/selected tile treatment rather than adding its own prop for each
   * visual state. */
  className?: string
  /** Overrides the default "Enlarge {name} sprite" label — DexRow's click opens
   * SpriteModal, but Leg 8's Hybrid grid click selects the tile for its bottom detail
   * panel instead, which isn't "enlarging" anything. */
  ariaLabel?: string
}

const THUMBNAIL_SIZE = 32

/**
 * Row-level sprite icon. A <button> (not a bare clickable <img>) so it's keyboard-
 * focusable/activatable for free. Falls back to a plain glyph on load error rather
 * than showing the browser's broken-image icon — see sprites.ts for why some ids
 * legitimately have no file at a given path.
 */
export function SpriteThumbnail({
  pokeapiId,
  spriteFormSuffix,
  female,
  displayName,
  onClick,
  shiny = false,
  size = THUMBNAIL_SIZE,
  className,
  ariaLabel
}: SpriteThumbnailProps): JSX.Element {
  const [failed, setFailed] = useState(false)

  return (
    <button
      type="button"
      className={className ? `sprite-thumbnail ${className}` : 'sprite-thumbnail'}
      onClick={onClick}
      aria-label={failed ? `${displayName} sprite unavailable` : ariaLabel ?? `Enlarge ${displayName} sprite`}
    >
      {failed ? (
        '?'
      ) : (
        <img
          src={defaultSpriteUrl(pokeapiId, spriteFormSuffix, shiny, female)}
          alt={displayName}
          loading="lazy"
          width={size}
          height={size}
          onError={() => setFailed(true)}
        />
      )}
    </button>
  )
}
