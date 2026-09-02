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
 * gen-8 sprite source) and generation-i/red-blue has no shiny/ subfolder at all
 * (Gen 1 predates shiny Pokemon).
 */

export const CURRENT_MAX_GENERATION = 9

/** One representative game per generation, chosen for sprite-set completeness. */
const GENERATION_GAME: Record<number, string> = {
  1: 'red-blue',
  2: 'crystal',
  3: 'emerald',
  4: 'platinum',
  5: 'black-white',
  6: 'omega-ruby-alpha-sapphire',
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

/** The CDN's file-naming key for a form: pokeapiId alone, or "{pokeapiId}-{suffix}" for
 * a cosmetic sub-form that shares its pokeapiId with siblings. */
function spriteFileId(pokeapiId: number, spriteFormSuffix: string | null): string {
  return spriteFormSuffix ? `${pokeapiId}-${spriteFormSuffix}` : `${pokeapiId}`
}

/** The row-thumbnail sprite: PokeAPI's evergreen "current" default artwork. */
export function defaultSpriteUrl(pokeapiId: number, spriteFormSuffix: string | null, shiny: boolean): string {
  const id = spriteFileId(pokeapiId, spriteFormSuffix)
  return shiny ? `${SPRITE_BASE}/shiny/${id}.png` : `${SPRITE_BASE}/${id}.png`
}

/** The modal's generation-stepped sprite, per GENERATION_GAME's representative game. */
export function generationSpriteUrl(
  pokeapiId: number,
  spriteFormSuffix: string | null,
  generation: number,
  shiny: boolean
): string {
  const game = GENERATION_GAME[generation]
  const roman = ROMAN_NUMERALS[generation]
  if (!game || !roman) throw new Error(`No sprite mapping for generation ${generation}`)
  const id = spriteFileId(pokeapiId, spriteFormSuffix)
  const shinyPart = shiny ? '/shiny' : ''
  return `${SPRITE_BASE}/versions/generation-${roman}/${game}${shinyPart}/${id}.png`
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
