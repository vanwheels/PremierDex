/**
 * Per-generation sprite source table for `raw.githubusercontent.com/PokeAPI/sprites`. Replaces
 * the old one-game-per-generation map plus its hardcoded `.png` and shiny/back exception sets:
 * each source carries its own folder, file extension, and shiny/back coverage. Every entry was
 * verified live (see docs/investigations/sprite-sources.md for the per-generation decisions).
 *
 * A generation's first source is its default; later ones are the alternate versions the
 * Sprite system overhaul's version-chip leg (Leg 4) switches among.
 */

export interface SpriteSource {
  /** Stable key for the version chip row. */
  id: string
  label: string
  /** Folder under the CDN's `sprites/pokemon/`, including any `transparent/` subfolder. */
  folder: string
  ext: 'png' | 'gif'
  /** False when the CDN has no `shiny/` subfolder (Gen 1 predates shiny Pokémon). */
  hasShiny: boolean
  /** False when the CDN has no `back/` subfolder (HOME renders). */
  hasBack: boolean
}

function source(
  id: string,
  label: string,
  folder: string,
  overrides: Partial<Pick<SpriteSource, 'ext' | 'hasShiny' | 'hasBack'>> = {}
): SpriteSource {
  return { id, label, folder, ext: 'png', hasShiny: true, hasBack: true, ...overrides }
}

/** Gen 8 and 9 share one generation-independent HOME render set — see the investigation doc. */
const HOME = source('home', 'HOME', 'other/home', { hasBack: false })

export const GENERATION_SOURCES: Record<number, SpriteSource[]> = {
  1: [
    source('red-blue', 'Red/Blue', 'versions/generation-i/red-blue', { hasShiny: false }),
    source('yellow', 'Yellow', 'versions/generation-i/yellow', { hasShiny: false })
  ],
  2: [
    source('crystal', 'Crystal', 'versions/generation-ii/crystal/transparent'),
    source('gold', 'Gold', 'versions/generation-ii/gold/transparent'),
    source('silver', 'Silver', 'versions/generation-ii/silver/transparent')
  ],
  3: [
    source('emerald', 'Emerald', 'versions/generation-iii/emerald'),
    source('firered-leafgreen', 'FireRed/LeafGreen', 'versions/generation-iii/firered-leafgreen'),
    source('ruby-sapphire', 'Ruby/Sapphire', 'versions/generation-iii/ruby-sapphire')
  ],
  4: [
    source('platinum', 'Platinum', 'versions/generation-iv/platinum'),
    source('heartgold-soulsilver', 'HeartGold/SoulSilver', 'versions/generation-iv/heartgold-soulsilver'),
    source('diamond-pearl', 'Diamond/Pearl', 'versions/generation-iv/diamond-pearl')
  ],
  5: [source('black-white', 'Black/White', 'versions/generation-v/black-white')],
  6: [
    source('omegaruby-alphasapphire', 'Omega Ruby/Alpha Sapphire', 'versions/generation-vi/omegaruby-alphasapphire'),
    source('x-y', 'X/Y', 'versions/generation-vi/x-y')
  ],
  7: [source('ultra-sun-ultra-moon', 'Ultra Sun/Ultra Moon', 'versions/generation-vii/ultra-sun-ultra-moon', { ext: 'gif' })],
  8: [HOME],
  9: [HOME]
}

/** Every generation's default source is its first entry. Throws for an unmapped generation. */
export function defaultSpriteSource(generation: number): SpriteSource {
  const sources = GENERATION_SOURCES[generation]
  if (!sources) throw new Error(`No sprite mapping for generation ${generation}`)
  return sources[0]
}

/** Caption for generations whose art isn't game-specific (Gen 8/9 share HOME renders), so the
 * strip doesn't imply per-game art. Null for every other generation. */
export function generationArtNote(generation: number): string | null {
  return defaultSpriteSource(generation).id === HOME.id ? 'Pokémon HOME art (shared by Gen 8 and 9)' : null
}
