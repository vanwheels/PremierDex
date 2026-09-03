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
 * Verified live against the repo (see TODO.md's Sprite display leg): generation
 * folders exist through generation-ix, but generation-viii has no Sword/Shield sprite
 * set (those games used 3D models — brilliant-diamond-shining-pearl is the only
 * gen-8 sprite source). Also verified live: generation-i/red-blue,
 * generation-viii/brilliant-diamond-shining-pearl, and generation-ix/scarlet-violet
 * have no shiny/ subfolder at all on the CDN (0 files — Gen 1 predates shiny Pokemon;
 * BDSP and SV simply never got shiny recolors uploaded). generationSpriteUrl falls
 * back to the evergreen defaultSpriteUrl shiny art for those three generations rather
 * than building a URL guaranteed to 404.
 *
 * `female` (see TODO.md's "Female-form sprites missing" leg) selects Form.hasGenderDifference's
 * distinct female art, which the CDN keys as a "female/" *subfolder* rather than a
 * filename suffix like spriteFormSuffix — confirmed live (e.g.
 * sprites/pokemon/female/593.png for Jellicent) at every layer this module builds:
 * evergreen, shiny (nested as shiny/female/, not female/shiny/), per-generation, and
 * both animated sources. A species/generation combo with no distinct female art (e.g.
 * Pikachu's gender difference wasn't drawn until generation IV, despite the species
 * existing since gen 1) simply 404s and falls back to the same "sprite unavailable"
 * handling SpriteThumbnail/SpriteModal already use for any other missing file — no
 * special-cased fallback set needed here, unlike GENERATIONS_WITHOUT_SHINY below.
 */

export const CURRENT_MAX_GENERATION = 9

/** One representative game per generation, chosen for sprite-set completeness. */
const GENERATION_GAME: Record<number, string> = {
  1: 'red-blue',
  2: 'crystal',
  3: 'emerald',
  4: 'platinum',
  5: 'black-white',
  6: 'omegaruby-alphasapphire',
  7: 'ultra-sun-ultra-moon',
  8: 'brilliant-diamond-shining-pearl',
  9: 'scarlet-violet'
}

const ROMAN_NUMERALS: Record<number, string> = {
  1: 'i',
  2: 'ii',
  3: 'iii',
  4: 'iv',
  5: 'v',
  6: 'vi',
  7: 'vii',
  8: 'viii',
  9: 'ix'
}

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

/** The row-thumbnail sprite: PokeAPI's evergreen "current" default artwork. */
export function defaultSpriteUrl(
  pokeapiId: number,
  spriteFormSuffix: string | null,
  shiny: boolean,
  female: boolean
): string {
  const id = spriteFileId(pokeapiId, spriteFormSuffix)
  return `${SPRITE_BASE}${genderShinyFolder(shiny, female)}/${id}.png`
}

/** Generations with no shiny/ subfolder at all on the CDN (verified live — see the
 * module comment above). generationSpriteUrl falls back to defaultSpriteUrl's
 * evergreen shiny art for these rather than building a URL that can never resolve. */
const GENERATIONS_WITHOUT_SHINY = new Set([1, 8, 9])

/** The modal's generation-stepped sprite, per GENERATION_GAME's representative game. */
export function generationSpriteUrl(
  pokeapiId: number,
  spriteFormSuffix: string | null,
  generation: number,
  shiny: boolean,
  female: boolean
): string {
  const game = GENERATION_GAME[generation]
  const roman = ROMAN_NUMERALS[generation]
  if (!game || !roman) throw new Error(`No sprite mapping for generation ${generation}`)
  if (shiny && GENERATIONS_WITHOUT_SHINY.has(generation)) {
    return defaultSpriteUrl(pokeapiId, spriteFormSuffix, true, female)
  }
  const id = spriteFileId(pokeapiId, spriteFormSuffix)
  return `${SPRITE_BASE}/versions/generation-${roman}/${game}${genderShinyFolder(shiny, female)}/${id}.png`
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
  female: boolean
): string {
  const id = spriteFileId(pokeapiId, spriteFormSuffix)
  const folder = source === 'showdown' ? `${SPRITE_BASE}/other/showdown` : `${SPRITE_BASE}/versions/generation-v/black-white/animated`
  return `${folder}${genderShinyFolder(shiny, female)}/${id}.gif`
}
