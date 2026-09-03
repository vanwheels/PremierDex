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
  'Beast Ball',
  // Legends Arceus's own crafted balls (Leg 5 — see TODO.md's "Legends Arceus Ball
  // Pool"). Heavy Ball/Poké Ball/Great Ball/Ultra Ball are reused names already covered
  // above (same string, different in-game mechanic — this is a name list, not a
  // per-game item ID list, so no duplicate entry). Origin Ball is the game's
  // Master-Ball-equivalent, earned late rather than crafted.
  'Feather Ball',
  'Wing Ball',
  'Jet Ball',
  'Leaden Ball',
  'Gigaton Ball',
  'Origin Ball'
] as const

export type PokeBall = (typeof POKE_BALLS)[number]

/**
 * Legends Arceus's full legal ball pool, in-game crafting order (Leg 5). Deliberately
 * narrow — see TODO.md's "the per-game validity dataset ships narrow... Legends Arceus's
 * ball pool only" — every other game has no defined pool yet and falls through to the
 * full POKE_BALLS list in ballPoolForGame below. Keyed by exact ORIGIN_GAMES `name` text
 * rather than `id`, matching how OriginModal.tsx already resolves the typed-in game
 * string (findOriginGame matches by name, not id).
 */
const BALL_POOLS: Record<string, readonly PokeBall[]> = {
  'Pokémon Legends: Arceus': [
    'Poké Ball',
    'Great Ball',
    'Ultra Ball',
    'Feather Ball',
    'Wing Ball',
    'Jet Ball',
    'Heavy Ball',
    'Leaden Ball',
    'Gigaton Ball',
    'Origin Ball'
  ]
}

/**
 * Legal "Caught In" options for a given origin-game name (OriginModal.tsx's picker). A
 * game with no defined pool above (i.e. every game except Legends Arceus right now)
 * falls back to the full flat POKE_BALLS list, preserving today's behavior rather than
 * silently emptying the picker for games this leg doesn't cover.
 */
export function ballPoolForGame(gameName: string): readonly PokeBall[] {
  return BALL_POOLS[gameName] ?? POKE_BALLS
}

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
