/**
 * Per-species and per-form detail fields (Leg 1 of the Species database: full per-species
 * pages milestone — see TODO.md), written by `npm run fetch-species-details` into
 * `data/pokemon/species-details.json` and loaded at runtime by
 * `main/storage/load-species-data.ts`.
 *
 * `species` is keyed by pokemon-species id (same id space as `species.json`/SeedSpecies).
 * `forms` is keyed by pokeapiId (SeedForm's `pokeapiId`, not speciesId) because abilities,
 * EV yield, types and base stats vary per form/variety, not per species — e.g. Rotom's forms
 * have different types, and PokeAPI reports abilities/stats per `/pokemon/{id}`, not per
 * species. A handful of SeedForm rows share a pokeapiId (cosmetic sub-forms keyed off a shared
 * base variety, per forms.json's spriteFormSuffix convention) — those rows all resolve to the
 * same `forms` entry, which is correct: they really do share one `/pokemon/{id}` resource.
 *
 * `growthRates` and `abilities` are dedupe tables rather than being inlined per species/
 * form: PokeAPI only has 6 growth rates and ~300 abilities total, so every species/form
 * would otherwise repeat the same handful of strings thousands of times. `species.growthRateName`
 * and `forms[].abilities[].name` are the join keys into these two tables.
 */
export interface SpeciesDetailsData {
  species: Record<number, SpeciesDetailEntry>
  forms: Record<number, FormDetailEntry>
  /** Growth rate name (PokeAPI's `/growth-rate/{name}`) -> total experience required to
   * reach level 100 under that growth rate. */
  growthRates: Record<string, number>
  /** Egg group slug (PokeAPI's `/egg-group/{name}`) -> English display name. The slugs don't
   * map onto the in-game names by title-casing (`plant` -> "Grass", `no-eggs` ->
   * "Undiscovered", `humanshape` -> "Human-Like"), hence a table rather than a helper. */
  eggGroups: Record<string, string>
  /** Ability name (PokeAPI's `/ability/{name}`) -> English `short_effect` text. Includes
   * abilities that only appear in `pastAbilities`. */
  abilities: Record<string, string>
}

export interface SpeciesDetailEntry {
  captureRate: number
  baseHappiness: number
  growthRateName: string
  /** PokeAPI's raw `gender_rate`: -1 means genderless, otherwise the number of eighths
   * that are female (0 = always male, 8 = always female). */
  genderRate: number
  /** Egg group slugs (1 or 2; join key into `eggGroups`). */
  eggGroups: string[]
  /** PokeAPI's raw `hatch_counter` (base egg cycles). Steps depend on the generation's cycle
   * length — use `baseEggSteps` in `shared/egg-steps.ts` rather than converting inline. */
  hatchCounter: number
}

export interface FormAbility {
  name: string
  isHidden: boolean
  /** PokeAPI ability slot (1, 2 = regular, 3 = hidden). The join key `pastAbilities` diffs
   * against. */
  slot: number
}

/**
 * Every `past*` field below follows PokeAPI's convention, confirmed live 2026-09-25 (Clefairy's
 * Normal->Fairy type change, Pikachu's Gen V Defense/Sp. Def): `untilGeneration` is the LAST
 * generation the old value applied in, inclusive — so `pastTypes: [{ untilGeneration: 5, types:
 * ['normal'] }]` means Normal through Gen V, and the top-level `types` from Gen VI on. Entries
 * are sorted by `untilGeneration` ascending and omitted (not `[]`) when the form has none. Use
 * `resolveFormAtGeneration` in `shared/form-history.ts` rather than reading these directly.
 */
export interface FormDetailEntry {
  abilities: FormAbility[]
  /** EV yield per stat name (PokeAPI's stat slugs: hp, attack, defense, special-attack,
   * special-defense, speed) — stats with zero effort are omitted rather than stored as 0. */
  evYield: Record<string, number>
  /** Current types in slot order (1 or 2 entries). */
  types: string[]
  /** Current base stats, keyed by the same six stat slugs as `evYield` (all six present). */
  baseStats: Record<string, number>
  pastTypes?: Array<{ untilGeneration: number; types: string[] }>
  /** Partial diffs: only the stats PokeAPI lists for that era. `stats` is base stat, `evYield`
   * is that era's EV yield for the same listed stats (zeros kept — a listed 0 means "yielded
   * nothing then", e.g. Raichu's Speed before Gen VI; omitted only when the era lists nothing
   * but `special`). Gen I entries use the `special` slug (the single Special stat, which
   * PokeAPI doesn't map onto the modern six). */
  pastStats?: Array<{
    untilGeneration: number
    stats: Record<string, number>
    evYield?: Record<string, number>
  }>
  /** Partial diffs by slot; `name: null` means that slot had no ability in that era (e.g. no
   * hidden ability before Gen V, or Clefairy's second slot before Gen IV). */
  pastAbilities?: Array<{
    untilGeneration: number
    abilities: Array<{ slot: number; name: string | null; isHidden: boolean }>
  }>
}
