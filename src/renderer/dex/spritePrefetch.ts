import { defaultSpriteUrl } from './sprites'
import type { Box } from './types'

/**
 * Box view scroller lag (Leg 4 of the Box View Quick-Wins Sweep): the pager's Prev/Next
 * feels laggy on the *first* visit to a box each session, then instant on every repeat
 * visit — confirmed by Vanny (2026-09-19) to be first-visit-only. That pattern points at
 * the sprites themselves: every cell's <img> pulls from raw.githubusercontent.com (see
 * sprites.ts) with no app-side caching, so a never-before-seen box pays for up to
 * BOX_SIZE (30) cold network fetches before the browser's own HTTP cache takes over on
 * later visits. Rather than build a real caching layer, this warms that same browser
 * cache one box ahead of need: whenever DexBoxPane lands on a box, it fires off `Image()`
 * loads for the immediately adjacent (index-1/index+1) box's sprites in the background,
 * so by the time Prev/Next actually gets clicked those requests have often already
 * resolved.
 *
 * Module-level (not per-pane) `prefetched` set: two open panes independently landing on
 * neighboring boxes shouldn't both re-issue the same fetches, and the whole point is a
 * cache that outlives any one component's lifetime within the session.
 */
const prefetched = new Set<string>()

/** Exported for testing — the pure "which sprite URLs does this box need" logic, kept
 * separate from prefetchBoxSprites' `Image()` side effect below. */
export function collectBoxSpriteUrls(box: Box): string[] {
  const urls: string[] = []
  for (const cell of box.cells) {
    if (!cell) continue
    if (cell.kind === 'entry') {
      urls.push(defaultSpriteUrl(cell.pokeapiId, cell.spriteFormSuffix, cell.entry.shiny, cell.femaleSprite))
    } else {
      // Placeholder cells always render plain base-form art, never shiny/female — see
      // BoxPlaceholderCell's doc comment and DexBoxGridCell's placeholder render branch.
      urls.push(defaultSpriteUrl(cell.pokeapiId, cell.spriteFormSuffix, false, false))
    }
  }
  return urls
}

/** Fires off background `Image()` loads for every sprite in `box` not already prefetched
 * this session. Fire-and-forget — a failed/404'd sprite here just means SpriteThumbnail's
 * own onError handles it again for real, same as any other cache miss. */
export function prefetchBoxSprites(box: Box | undefined): void {
  if (!box) return
  for (const url of collectBoxSpriteUrls(box)) {
    if (prefetched.has(url)) continue
    prefetched.add(url)
    const img = new Image()
    img.src = url
  }
}
