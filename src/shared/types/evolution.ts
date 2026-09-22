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
}
