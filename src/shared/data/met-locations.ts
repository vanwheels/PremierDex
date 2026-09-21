/**
 * Curated per-game Met Location lists (Leg 2 of the Curated Met Location dataset
 * milestone — see docs/investigations/curated-met-location.md for why this can't reuse
 * poke-balls.ts's BALL_POOLS shape as-is). Keyed by exact ORIGIN_GAMES `name` text, same
 * convention as BALL_POOLS — OriginModal.tsx resolves the typed-in game string by name,
 * not id.
 *
 * Curated one "map family" at a time (games that share an identical or near-identical
 * named-location set), in ORIGIN_GAMES release-date order (TODO.md's Legs 4-28 as of the
 * Leg 4 restructure) — a paired version (Red/Blue, Gold/Silver, Ruby/Sapphire, etc.) points
 * both names at the same base array rather than duplicating it, since same-generation
 * paired versions share the same map; a family's 3rd version/expansion (Yellow, Crystal,
 * Emerald, Platinum, Ultra Sun/Ultra Moon) gets its own leg to verify+layer in whatever
 * locations it actually adds or removes rather than assuming identity. The one confirmed
 * within-pair location split (not just an added/removed set) is Generation V's Black
 * City/White Forest, exclusive to Black/White respectively. Each list is Route 1..N in
 * numeric order followed by every other named city/town/landmark alphabetically — this
 * mirrors Serebii's own per-region location listing (routes first, then alphabetical),
 * rather than in-game story/traversal order, since reconstructing exact route-connection
 * order from wiki prose per game is a much easier source of transcription error than a
 * numeric-then-alphabetical sort.
 */

/**
 * Kanto, Generation I (Red/Blue/Yellow all share this same map). Routes 1-25 only — Routes
 * 26-28 are the Johto-Kanto connectors added in Generation II, not present in Red/Blue/
 * Yellow. Verified against Bulbapedia (Kanto, Cerulean Cave, Underground Path, Rocket
 * Hideout, Route 11, Route 22) and Serebii's Kanto map page (serebii.net/pokearth/kanto),
 * 2026-09-20. Re-verified for Leg 5 (Yellow): Yellow's changes from Red/Blue (a Route 19
 * house for the Pikachu-Surf minigame, a redesigned Cerulean Cave interior, a swapped
 * Viridian Forest item/trainer roster) are all sub-location content within named places
 * already on this list, not a new or removed named location — no layering needed.
 */
const KANTO_GEN1: readonly string[] = [
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

const MET_LOCATIONS: Record<string, readonly string[]> = {
  'Pokémon Red': KANTO_GEN1,
  'Pokémon Blue': KANTO_GEN1,
  'Pokémon Yellow': KANTO_GEN1
}

/**
 * Gift Pokémon and Mystery Gift distributions record their Met Location in-game as
 * "Fateful Encounter" rather than a real place — not a location at all, so it isn't part
 * of any per-game array above. Appended as an extra option for every curated game instead
 * of living in the per-game data, since it applies identically regardless of game/region.
 */
const FATEFUL_ENCOUNTER = 'Fateful Encounter'

/**
 * Curated Met Location list for a given origin-game name, or undefined if that game
 * isn't curated yet. Deliberately does not fall back to a flat superset the way
 * ballPoolForGame does — unlike Poké Balls, there's no closed set of "every location
 * across every game" to fall back to, so an uncurated game falls through to
 * OriginModal's free-text input instead of a restricted list.
 */
export function metLocationsForGame(gameName: string): readonly string[] | undefined {
  const locations = MET_LOCATIONS[gameName]
  return locations && [...locations, FATEFUL_ENCOUNTER]
}
