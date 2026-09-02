import { useState } from 'react'
import { defaultSpriteUrl } from './sprites'

interface SpriteThumbnailProps {
  pokeapiId: number
  displayName: string
  onClick: () => void
}

const THUMBNAIL_SIZE = 32

/**
 * Row-level sprite icon. A <button> (not a bare clickable <img>) so it's keyboard-
 * focusable/activatable for free. Falls back to a plain glyph on load error rather
 * than showing the browser's broken-image icon — see sprites.ts for why some ids
 * legitimately have no file at a given path.
 */
export function SpriteThumbnail({ pokeapiId, displayName, onClick }: SpriteThumbnailProps): JSX.Element {
  const [failed, setFailed] = useState(false)

  return (
    <button
      type="button"
      className="sprite-thumbnail"
      onClick={onClick}
      aria-label={failed ? `${displayName} sprite unavailable` : `Enlarge ${displayName} sprite`}
    >
      {failed ? (
        '?'
      ) : (
        <img
          src={defaultSpriteUrl(pokeapiId, false)}
          alt={displayName}
          loading="lazy"
          width={THUMBNAIL_SIZE}
          height={THUMBNAIL_SIZE}
          onError={() => setFailed(true)}
        />
      )}
    </button>
  )
}
