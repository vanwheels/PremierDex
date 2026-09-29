/**
 * One row per (species+form) -> (species+form) evolution edge, written by
 * `scripts/fetch-evolution-chains.ts` into `data/pokemon/evolution-edges.json` and loaded
 * at runtime by `main/storage/load-species-data.ts`. Shared (rather than main-only) because
 * the Evolution Family Tree component needs the same shape in the renderer — see
 * `renderer/dex/evolutionTree.ts`.
 *
 * Unlike `Species.evolvesFromSpeciesId` (species-keyed, one parent per species), this is
 * form-aware: `fromFormName`/`toFormName` recover regional-form branches PokeAPI otherwise
 * flattens into varieties of one species (e.g. Pikachu -> Raichu splits into a "base"
 * edge and a separate "alola" edge targeting raichu-alola specifically). `method` is
 * already a human-readable string (e.g. "Level 16", "Thunder Stone") — see
 * `scripts/evolution-method-format.ts`.
 */
export interface EvolutionEdge {
  fromSpeciesId: number
  fromFormName: string
  toSpeciesId: number
  toFormName: string
  method: string
  /** Set only when the edge has more than one distinct method (Magnezone/Leafeon/Glaceon/
   * Probopass-style location-or-stone alternatives, ~60 of ~700 edges) — one entry per
   * distinct method string in `method`'s " or "-joined list, each with the version group(s)
   * PokeAPI's evolution_details tags it under (deduped, sorted). The tag is "first appeared
   * in", not an exhaustive per-game list (see
   * docs/investigations/per-version-variance.md) — an untagged later version group inherits
   * whichever method's tag most recently precedes it, which this field doesn't resolve on
   * its own; a consumer needs a version-group ordering to do that. Undefined, not just
   * absent-shaped, for every single-method edge, so most rows stay exactly as lean as
   * before this field existed. */
  methodsByVersionGroup?: Array<{ method: string; versionGroups: string[] }>
}
