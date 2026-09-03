/**
 * Which species are obtainable in a given origin game (Leg 4 — see TODO.md's "Per-Game
 * Species-Availability Dataset"), written by `npm run fetch-species-availability` into
 * `data/pokemon/species-availability.json` and loaded at runtime by
 * `main/storage/load-species-data.ts`. Shared (rather than main-only) because Leg 6's
 * invalid-combo check needs the same shape in the renderer — see
 * `renderer/dex/invalidCombo.ts`.
 *
 * `pokedexes` is keyed by PokeAPI regional-dex name rather than by game so games sharing
 * a dex (e.g. Gold/Silver/Crystal all resolving to "original-johto") store that species
 * list once; `gameToPokedexes` maps an origin-games.ts id to the dex name(s) whose union
 * defines that game's available species. A game absent from `gameToPokedexes`, or mapped
 * to an empty array, has no availability data (Colosseum, XD, and Pokémon GO all fall
 * into this — see the fetch script's header comment) — callers must treat that as "no
 * data for this game," never as "nothing is available there."
 */
export interface SpeciesAvailabilityData {
  pokedexes: Record<string, number[]>
  gameToPokedexes: Record<string, string[]>
}
