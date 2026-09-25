/**
 * Move metadata (Leg 4 of the Species/Dex reference data layer milestone — see TODO.md),
 * written by `npm run fetch-move-data` into `data/pokemon/moves.json` and loaded at runtime by
 * `main/storage/load-species-data.ts`. Keyed by the same move slugs as `LearnsetData.moves`
 * (PokeAPI's `/move/{name}`), and covers exactly that set. Parse logic lives in
 * `shared/moves.ts` so it can be unit-tested.
 */
export interface MoveData {
  moves: Record<string, MoveEntry>
}

export interface MoveEntry {
  /** In-game English display name ("Double-Edge", "U-turn") — slugs don't title-case to it. */
  name: string
  /** Type slug ("fire", "dark", ...). */
  type: string
  /** "physical", "special" or "status". */
  damageClass: string
  /** Null for moves with no fixed base power (status moves, variable-power moves like Gyro Ball). */
  power: number | null
  /** Null for moves that never miss (Swift, most status moves aimed at the user). */
  accuracy: number | null
  pp: number | null
  /** English short effect with PokeAPI's `$effect_chance` placeholder already substituted. For the
   * ~88 Gen VIII/IX moves (Tera Blast, Salt Cure, ...) PokeAPI has no `effect_entries` for, this is
   * the newest English in-game flavor text instead (longer and less mechanical than a short
   * effect). Null only if a move has neither. */
  effect: string | null
  /** Omitted when the move never changed. Ordered oldest to newest by `untilVersionGroup`
   * (PokeAPI's own order). */
  pastValues?: MovePastValue[]
}

/**
 * A previous set of values for a move, as PokeAPI reports it in `past_values`. The values were in
 * effect up to and including `untilVersionGroup` (a slug matching `LearnsetData.versionGroups`);
 * the move's top-level values apply after the last entry. Only the fields that differed are
 * present — PokeAPI reports unchanged stats as null, so a stat that changed *to or from* null
 * can't be represented (PokeAPI doesn't model it either).
 */
export interface MovePastValue {
  untilVersionGroup: string
  type?: string
  power?: number
  accuracy?: number
  pp?: number
  effect?: string
}
