/**
 * Sprite URL construction for `raw.githubusercontent.com/PokeAPI/sprites`, keyed on a
 * form's `pokeapiId` (PokeAPI's own numeric pokemon id — see Form.pokeapiId) plus an
 * optional `spriteFormSuffix` for the cosmetic sub-forms that share a pokeapiId with
 * their siblings (Unown's letters, Vivillon's patterns, Alcremie's cream/sweet combos,
 * etc. — see Form.spriteFormSuffix): the CDN keys those as
 * "{pokeapiId}-{spriteFormSuffix}.png" instead of the plain "{pokeapiId}.png" every
 * other form uses. Pure and network-free: the actual fetch/caching happens via plain
 * `<img src>` tags in SpriteThumbnail/SpriteModal, which fall back to a placeholder on
 * load error rather than this module trying to know in advance which files exist.
 *
 * Per-generation folders, extensions and shiny/back coverage live in spriteSources.ts.
 * generationSpriteUrl falls back to the evergreen defaultSpriteUrl art when a generation's
 * source has no shiny/ or back/ subfolder (Gen 1 shiny, HOME back) rather than building a
 * URL guaranteed to 404.
 *
 * `female` selects Form.hasGenderDifference's distinct female art, which the CDN keys as a
 * "female/" *subfolder* rather than a filename suffix like spriteFormSuffix — e.g.
 * sprites/pokemon/female/593.png for Jellicent — nested after shiny ("shiny/female/", never
 * "female/shiny/"). A species/generation combo with no distinct female art simply 404s and
 * falls back to the "sprite unavailable" handling SpriteThumbnail/SpriteModal already use.
 *
 * `back` selects the back-of-battle-sprite art under a "back/" subfolder, nested before
 * shiny/female ("back/shiny/female/", never "female/back/" or "shiny/back/").
 */

import { spriteSourceFor } from './spriteSources'

export const CURRENT_MAX_GENERATION = 9

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'
const ITEM_SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items'

/** Caught-in Poké Ball icon (Leg 28) — same CDN repo as SPRITE_BASE above, just its
 * items/ folder instead of pokemon/. Takes the already-computed slug (shared/data/
 * poke-balls.ts's pokeBallIconSlug) rather than the display name, so this module stays
 * free of any Poké-Ball-specific string logic. */
export function pokeBallIconUrl(slug: string): string {
  return `${ITEM_SPRITE_BASE}/${slug}.png`
}

/** The CDN's file-naming key for a form: pokeapiId alone, or "{pokeapiId}-{suffix}" for
 * a cosmetic sub-form that shares its pokeapiId with siblings. */
function spriteFileId(pokeapiId: number, spriteFormSuffix: string | null): string {
  return spriteFormSuffix ? `${pokeapiId}-${spriteFormSuffix}` : `${pokeapiId}`
}

/** The shiny/female subfolder path shared by every sprite variant below — "shiny",
 * "female", both nested as "shiny/female" (that order, confirmed live), or neither. */
function genderShinyFolder(shiny: boolean, female: boolean): string {
  const parts = [shiny && 'shiny', female && 'female'].filter((p): p is string => p !== false)
  return parts.length ? `/${parts.join('/')}` : ''
}

/** The back/ subfolder prefix shared by every sprite variant below, nested *before*
 * genderShinyFolder's path (confirmed live — "back/shiny/female", never
 * "shiny/back" or "female/back"). */
function backFolder(back: boolean): string {
  return back ? '/back' : ''
}

/** The row-thumbnail sprite: PokeAPI's evergreen "current" default artwork. */
export function defaultSpriteUrl(
  pokeapiId: number,
  spriteFormSuffix: string | null,
  shiny: boolean,
  female: boolean,
  back = false
): string {
  const id = spriteFileId(pokeapiId, spriteFormSuffix)
  return `${SPRITE_BASE}${backFolder(back)}${genderShinyFolder(shiny, female)}/${id}.png`
}

/** The modal/strip's generation-stepped sprite, from the chosen version's source (the
 * generation's default when `sourceId` is omitted). Falls back to defaultSpriteUrl's evergreen
 * art when that source lacks shiny/ or back/. */
export function generationSpriteUrl(
  pokeapiId: number,
  spriteFormSuffix: string | null,
  generation: number,
  shiny: boolean,
  female: boolean,
  back = false,
  sourceId?: string
): string {
  const source = spriteSourceFor(generation, sourceId)
  if ((shiny && !source.hasShiny) || (back && !source.hasBack)) {
    return defaultSpriteUrl(pokeapiId, spriteFormSuffix, shiny, female, back)
  }
  const id = spriteFileId(pokeapiId, spriteFormSuffix)
  return `${SPRITE_BASE}/${source.folder}${backFolder(back)}${genderShinyFolder(shiny, female)}/${id}.${source.ext}`
}

/**
 * Generations the modal's stepper can show for a form: its firstAvailableGeneration
 * through the current generation. Forms can't predate the generation they were
 * introduced in, so the range never starts earlier than that.
 */
export function availableGenerations(firstAvailableGeneration: number): number[] {
  const start = Math.max(1, firstAvailableGeneration)
  const length = CURRENT_MAX_GENERATION - start + 1
  return Array.from({ length }, (_, i) => start + i)
}

/** Two animated sources on the CDN: the authentic per-game 'black-white' set (gen 5
 * only — B/W was the last 2D-sprite generation before games moved to 3D models) and
 * Pokemon Showdown's 'showdown' set (sprites/pokemon/other/showdown/ — generation-
 * independent, covers every species/form, confirmed live to have shiny/ and back/
 * subfolders too, though this module only needs front). Both are .gif, not .png. */
export type AnimatedSource = 'black-white' | 'showdown'

/** Generations with the authentic black-white animated set — confirmed during Leg
 * 4/11 research to be gen 5 only. Showdown's animated set has no such restriction;
 * callers should use it for every other generation. */
const BLACK_WHITE_ANIMATED_GENERATIONS = new Set([5])

/** Animated art starts with Gen 5 (B/W); Gen 1-4 games only had static sprites, so the modal
 * offers no Animated option there even though Showdown's set covers every generation. */
export const FIRST_ANIMATED_GENERATION = 5

export function hasAnimatedSprites(generation: number): boolean {
  return generation >= FIRST_ANIMATED_GENERATION
}

export function hasBlackWhiteAnimatedSprites(generation: number): boolean {
  return BLACK_WHITE_ANIMATED_GENERATIONS.has(generation)
}

/** The modal's animated-sprite variant. For 'black-white', only valid for a generation
 * where hasBlackWhiteAnimatedSprites is true — callers must gate on that first;
 * 'showdown' is always valid. */
export function animatedSpriteUrl(
  pokeapiId: number,
  spriteFormSuffix: string | null,
  shiny: boolean,
  source: AnimatedSource,
  female: boolean,
  back = false
): string {
  const id = spriteFileId(pokeapiId, spriteFormSuffix)
  const folder = source === 'showdown' ? `${SPRITE_BASE}/other/showdown` : `${SPRITE_BASE}/versions/generation-v/black-white/animated`
  return `${folder}${backFolder(back)}${genderShinyFolder(shiny, female)}/${id}.gif`
}
