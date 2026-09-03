/**
 * Fixed list of Poké Ball types a Collection Entry can record as "caught in" (Leg 28).
 * A genuinely closed set — every ball a mainline game or Pal Park/Entralink/Ultra Wormhole
 * lets a Pokémon arrive in is enumerable — so this follows shared/data/languages.ts's flat
 * CHECK-constrained-string approach rather than origin-games.ts's open-ended free-text
 * field (see schema.ts's `game` column comment for why that one stays unconstrained).
 *
 * Includes balls that are generation- or method-restricted (Safari/Sport: Safari
 * Zone/Bug-Catching Contest; Dream Ball: Gen V Entralink; Beast Ball: Gen VII+ Ultra
 * Beasts; Park Ball: Gen IV Pal Park transfer, not player-thrown; Cherish Ball: event
 * distributions) without cross-referencing origin_game/generation, same "don't
 * cross-reference the game field" reasoning as ORIGIN_LANGUAGES.
 */
export const POKE_BALLS = [
  'Poké Ball',
  'Great Ball',
  'Ultra Ball',
  'Master Ball',
  'Premier Ball',
  'Heal Ball',
  'Net Ball',
  'Nest Ball',
  'Dive Ball',
  'Repeat Ball',
  'Timer Ball',
  'Luxury Ball',
  'Quick Ball',
  'Dusk Ball',
  'Cherish Ball',
  'Fast Ball',
  'Level Ball',
  'Lure Ball',
  'Heavy Ball',
  'Love Ball',
  'Friend Ball',
  'Moon Ball',
  'Sport Ball',
  'Safari Ball',
  'Park Ball',
  'Dream Ball',
  'Beast Ball'
] as const

export type PokeBall = (typeof POKE_BALLS)[number]

/**
 * CDN icon slug for the PokeAPI/sprites items/ folder (see renderer/dex/sprites.ts for
 * the same repo's pokemon-sprite conventions) — kebab-case English name with the é in
 * "Poké Ball" folded to a plain e (the CDN's own filenames use no accents).
 */
export function pokeBallIconSlug(name: string): string {
  return name
    .replace(/é/g, 'e')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
