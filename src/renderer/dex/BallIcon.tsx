import { useEffect, useState } from 'react'
import { pokeBallIconSlug } from '@shared/data/poke-balls'
import { pokeBallIconUrl } from './sprites'

interface BallIconProps {
  ball: string
}

const ICON_SIZE = 20

/**
 * Read-only caught-in-ball icon (Leg 28) — CollectionRow only, next to the Origin
 * button. Renders nothing when there's no ball recorded, rather than a placeholder slot
 * like SpriteThumbnail's '?': most entries won't have this set for a long while, and an
 * empty icon column on every row would be noisier than just omitting it. Falls back to
 * the ball's plain name (still no placeholder glyph) on a load error, same "some ids
 * legitimately have no file" reasoning as SpriteThumbnail.
 */
export function BallIcon({ ball }: BallIconProps): JSX.Element | null {
  const [failed, setFailed] = useState(false)

  // Re-arm on a different ball value (e.g. switching entries) rather than getting stuck
  // showing the previous ball's fallback text.
  useEffect(() => setFailed(false), [ball])

  if (failed) {
    return (
      <span className="ball-icon-fallback" title={ball}>
        {ball}
      </span>
    )
  }

  return (
    <img
      className="ball-icon"
      src={pokeBallIconUrl(pokeBallIconSlug(ball))}
      alt={ball}
      title={ball}
      loading="lazy"
      width={ICON_SIZE}
      height={ICON_SIZE}
      onError={() => setFailed(true)}
    />
  )
}
