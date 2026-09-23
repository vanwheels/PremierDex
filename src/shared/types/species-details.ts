/**
 * Per-species and per-form detail fields (Leg 1 of the Species database: full per-species
 * pages milestone — see TODO.md), written by `npm run fetch-species-details` into
 * `data/pokemon/species-details.json` and loaded at runtime by
 * `main/storage/load-species-data.ts`.
 *
 * `species` is keyed by pokemon-species id (same id space as `species.json`/SeedSpecies).
 * `forms` is keyed by pokeapiId (SeedForm's `pokeapiId`, not speciesId) because abilities
 * and EV yield vary per form/variety, not per species — e.g. Rotom's forms have different
 * types but PokeAPI still reports abilities/stats per `/pokemon/{id}`, not per species. A
 * handful of SeedForm rows share a pokeapiId (cosmetic sub-forms keyed off a shared base
 * variety, per forms.json's spriteFormSuffix convention) — those rows all resolve to the
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
  /** Ability name (PokeAPI's `/ability/{name}`) -> English `short_effect` text. */
  abilities: Record<string, string>
}

export interface SpeciesDetailEntry {
  captureRate: number
  baseHappiness: number
  growthRateName: string
  /** PokeAPI's raw `gender_rate`: -1 means genderless, otherwise the number of eighths
   * that are female (0 = always male, 8 = always female). */
  genderRate: number
}

export interface FormDetailEntry {
  abilities: Array<{ name: string; isHidden: boolean }>
  /** EV yield per stat name (PokeAPI's stat slugs: hp, attack, defense, special-attack,
   * special-defense, speed) — stats with zero effort are omitted rather than stored as 0. */
  evYield: Record<string, number>
}
