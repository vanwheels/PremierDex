/**
 * Wild/snag encounter data (Leg 1 of the Encounter data + Where to Find milestone — see
 * TODO.md), written by `npm run fetch-encounters` into `data/pokemon/encounters.json` and
 * loaded at runtime by `main/storage/load-species-data.ts` (Leg 2).
 *
 * Mirrors PokeAPI's `/pokemon/{id}/encounters` shape directly: per location-area, a list of
 * per-version encounter_details (level range, chance, method, condition_values for
 * time-of-day/weather/radar/etc). `encounters` is keyed by pokeapiId (SeedForm's
 * `pokeapiId`, not speciesId) rather than species id, because the encounters endpoint is
 * per-`/pokemon/{id}` resource — same reasoning as `FormDetailEntry` in species-details.ts.
 * A base form's pokeapiId equals its species id; alternate varieties with their own wild
 * encounters (e.g. regional formes) get their own entry under their own pokeapiId.
 *
 * `locationAreas`, `methods`, and `versions` are dedup tables, same pattern as
 * species-details.ts's `growthRates`/`abilities`: a handful of distinct location-area/
 * method/version names are otherwise repeated across thousands of encounter rows.
 * `condition_values` isn't deduped the same way — it's usually empty or one short string
 * per encounter detail, not worth a table — so it's stored as plain PokeAPI names.
 *
 * Restricted to the PokeAPI-covered version groups only (Gen 1-7, Let's Go, Sword/Shield
 * + DLC, Colosseum/XD — see `ALLOWED_VERSION_GROUPS` in `scripts/fetch-encounters.ts`).
 * Brilliant Diamond/Shining Pearl, Legends Arceus, Scarlet/Violet (+ DLC), and Legends Z-A
 * have zero PokeAPI encounter data (confirmed live — see
 * docs/investigations/pokeapi-encounter-coverage.md) and are deferred to a later
 * hand-curation pass; this dataset has no entries for those games' versions at all.
 */
export interface EncounterData {
  encounters: Record<number, LocationAreaEncounters[]>
  /** Index -> PokeAPI location-area name (e.g. "kanto-route-1-area"). */
  locationAreas: string[]
  /** Index -> PokeAPI encounter-method name (e.g. "walk", "surf", "snag"). */
  methods: string[]
  /** Index -> PokeAPI version name (e.g. "red", "the-crown-tundra-sword"). */
  versions: string[]
}

export interface LocationAreaEncounters {
  locationAreaIndex: number
  versionDetails: VersionEncounterDetails[]
}

export interface VersionEncounterDetails {
  versionIndex: number
  maxChance: number
  encounterDetails: EncounterDetail[]
}

export interface EncounterDetail {
  minLevel: number
  maxLevel: number
  chance: number
  methodIndex: number
  /** PokeAPI encounter-condition-value names (e.g. "time-day", "radar-on",
   * "weather-intense-sun"); empty when the encounter has no condition. */
  conditionValues: string[]
}
