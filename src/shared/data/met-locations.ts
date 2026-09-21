/**
 * Curated per-game Met Location lists (Leg 2 of the Curated Met Location dataset
 * milestone — see docs/investigations/curated-met-location.md for why this can't reuse
 * poke-balls.ts's BALL_POOLS shape as-is). Keyed by exact ORIGIN_GAMES `name` text, same
 * convention as BALL_POOLS — OriginModal.tsx resolves the typed-in game string by name,
 * not id.
 *
 * Curated one game at a time, in ORIGIN_GAMES release-date order (TODO.md's Legs 3-43),
 * each verified against Bulbapedia/Serebii before committing. Each list is Route 1..N in
 * numeric order followed by every other named city/town/landmark alphabetically — this
 * mirrors Serebii's own per-region location listing (routes first, then alphabetical),
 * rather than in-game story/traversal order, since reconstructing exact route-connection
 * order from wiki prose per game is a much easier source of transcription error than a
 * numeric-then-alphabetical sort.
 */
const MET_LOCATIONS: Record<string, readonly string[]> = {
  /**
   * Kanto, Generation I (Red/Blue/Yellow all share this same map — but curated per game
   * per the milestone's leg sequence rather than aliased, since a future gen-specific
   * divergence, e.g. Yellow's own quirks, shouldn't require unwinding a shared reference).
   * Routes 1-25 only — Routes 26-28 are the Johto-Kanto connectors added in Generation II,
   * not present in Red/Blue. Verified against Bulbapedia (Kanto, Cerulean Cave,
   * Underground Path, Rocket Hideout, Route 11, Route 22) and Serebii's Kanto map page
   * (serebii.net/pokearth/kanto), 2026-09-20.
   */
  'Pokémon Red': [
    'Route 1',
    'Route 2',
    'Route 3',
    'Route 4',
    'Route 5',
    'Route 6',
    'Route 7',
    'Route 8',
    'Route 9',
    'Route 10',
    'Route 11',
    'Route 12',
    'Route 13',
    'Route 14',
    'Route 15',
    'Route 16',
    'Route 17',
    'Route 18',
    'Route 19',
    'Route 20',
    'Route 21',
    'Route 22',
    'Route 23',
    'Route 24',
    'Route 25',
    'Celadon City',
    'Cerulean Cave',
    'Cerulean City',
    'Cinnabar Island',
    "Diglett's Cave",
    'Fuchsia City',
    'Indigo Plateau',
    'Lavender Town',
    'Mt. Moon',
    'Pallet Town',
    'Pewter City',
    'Pokémon Mansion',
    'Pokémon Tower',
    'Power Plant',
    'Rock Tunnel',
    'Rocket Hideout',
    'Safari Zone',
    'Saffron City',
    'Seafoam Islands',
    'Silph Co.',
    'S.S. Anne',
    'Underground Path (Routes 5–6)',
    'Underground Path (Routes 7–8)',
    'Vermilion City',
    'Victory Road',
    'Viridian City',
    'Viridian Forest'
  ]
}

/**
 * Curated Met Location list for a given origin-game name, or undefined if that game
 * isn't curated yet. Deliberately does not fall back to a flat superset the way
 * ballPoolForGame does — unlike Poké Balls, there's no closed set of "every location
 * across every game" to fall back to, so an uncurated game falls through to
 * OriginModal's free-text input instead of a restricted list.
 */
export function metLocationsForGame(gameName: string): readonly string[] | undefined {
  return MET_LOCATIONS[gameName]
}
