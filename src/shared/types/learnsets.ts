/**
 * Per-form learnsets (Leg 3 of the Species/Dex reference data layer milestone — see TODO.md),
 * written by `npm run fetch-species-details` into `data/pokemon/learnsets.json` and loaded at
 * runtime by `main/storage/load-species-data.ts`. Its own file/IPC channel rather than part of
 * `species-details.json` because it is by far the largest table.
 *
 * `learnsets` is keyed by pokeapiId (same key as `SpeciesDetailsData.forms`). Move, method and
 * version-group names are deduped into lookup tables, and every learnset entry references them
 * by index — same approach as `encounters.json`. Granularity is per version group (PokeAPI's
 * native unit: "red-blue", "sword-shield", ...). Entries that are identical across version
 * groups (same move, method and level) are merged into one entry listing all of them, which is
 * what keeps the file small — a typical move is learned at the same level in most groups.
 *
 * Build/parse logic lives in `shared/learnsets.ts` so it can be unit-tested.
 */
export interface LearnsetData {
  /** Move slugs (PokeAPI's `/move/{name}`), alphabetical. Index = `LearnsetEntry[0]`. */
  moves: string[]
  /** Learn-method slugs (e.g. "level-up", "machine", "egg", "tutor"), alphabetical. */
  methods: string[]
  /** Version groups in PokeAPI's chronological `order`. Japan-only groups (red-green-japan,
   * blue-japan) are dropped — they duplicate red-blue. */
  versionGroups: LearnsetVersionGroup[]
  /** pokeapiId -> that form's learnset entries, sorted by move, then method, then level. */
  learnsets: Record<number, LearnsetEntry[]>
}

export interface LearnsetVersionGroup {
  name: string
  generation: number
}

/** `[moveIndex, methodIndex, level, versionGroupIndexes]`. `level` is the level-up level and
 * 0 for every other method. `versionGroupIndexes` is ascending, index into `versionGroups`. */
export type LearnsetEntry = [number, number, number, number[]]
