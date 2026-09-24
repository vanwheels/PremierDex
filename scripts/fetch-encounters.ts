/**
 * Fetches wild/snag encounter data for every distinct form pokeapiId in
 * data/pokemon/forms.json and writes data/pokemon/encounters.json (committed static data,
 * loaded at runtime by src/main/storage/load-species-data.ts). Same retry/concurrency
 * pattern as fetch-species-availability.ts/fetch-species-details.ts. See
 * src/shared/types/encounters.ts for the output shape and why location-area/method/version
 * names are deduped into tables.
 *
 * Restricted to ALLOWED_VERSION_GROUPS below — the PokeAPI-covered version groups per
 * docs/investigations/pokeapi-encounter-coverage.md (Gen 1-7, Let's Go, Sword/Shield + DLC,
 * Colosseum/XD). Brilliant Diamond/Shining Pearl, Legends Arceus, Scarlet/Violet (+ DLC),
 * and Legends Z-A have zero PokeAPI encounter data (confirmed live in that investigation)
 * and are deliberately excluded rather than fetched-and-empty. Sword/Shield's Isle of
 * Armor/Crown Tundra DLC areas use their own version names (e.g.
 * "the-crown-tundra-sword"), not "sword"/"shield" — confirmed live 2026-09-23 — so their
 * version groups are listed separately here even though they share ORIGIN_GAMES' `sword`/
 * `shield` ids with the base game.
 *
 * `/version-group/{name}` is fetched once per allowed group to resolve its member version
 * names (e.g. "sword-shield" -> "sword"/"shield"), since /pokemon/{id}/encounters reports
 * version_details keyed by version name, not version-group. A version name not resolved
 * this way (Japan-exclusive versions, or any excluded game) is dropped from the output
 * entirely, along with any location-area whose version_details end up empty as a result.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { EncounterData, EncounterDetail, LocationAreaEncounters } from '../src/shared/types/encounters'

interface SeedForm {
  pokeapiId: number
}

interface PokeApiVersionGroupResponse {
  versions: Array<{ name: string }>
}

interface PokeApiEncountersResponse {
  location_area: { name: string }
  version_details: Array<{
    version: { name: string }
    max_chance: number
    encounter_details: Array<{
      min_level: number
      max_level: number
      chance: number
      method: { name: string }
      condition_values: Array<{ name: string }>
    }>
  }>
}

const ALLOWED_VERSION_GROUPS = [
  'red-blue',
  'yellow',
  'gold-silver',
  'crystal',
  'ruby-sapphire',
  'emerald',
  'firered-leafgreen',
  'colosseum',
  'xd',
  'diamond-pearl',
  'platinum',
  'heartgold-soulsilver',
  'black-white',
  'black-2-white-2',
  'x-y',
  'omega-ruby-alpha-sapphire',
  'sun-moon',
  'ultra-sun-ultra-moon',
  'lets-go-pikachu-lets-go-eevee',
  'sword-shield',
  'the-isle-of-armor',
  'the-crown-tundra'
]

const MAX_ATTEMPTS = 3
const CONCURRENCY = 10

async function fetchJson<T>(url: string): Promise<T> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`${url} failed: ${res.status} ${res.statusText}`)
      return (await res.json()) as T
    } catch (err) {
      lastErr = err
      if (attempt < MAX_ATTEMPTS) await new Promise((r) => setTimeout(r, 500 * attempt))
    }
  }
  throw lastErr
}

/** Runs `fn` over `items` with at most CONCURRENCY in flight at once. */
async function mapWithConcurrency<T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  async function worker(): Promise<void> {
    while (true) {
      const i = next++
      if (i >= items.length) return
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker))
  return results
}

/** Dedups strings into a table, returning the index for each lookup. */
class DedupTable {
  private readonly indexByName = new Map<string, number>()
  readonly names: string[] = []

  indexFor(name: string): number {
    const existing = this.indexByName.get(name)
    if (existing !== undefined) return existing
    const index = this.names.length
    this.indexByName.set(name, index)
    this.names.push(name)
    return index
  }
}

async function main(): Promise<void> {
  const scriptDir = dirname(fileURLToPath(import.meta.url))
  const dataDir = join(scriptDir, '..', 'data', 'pokemon')
  const forms = JSON.parse(readFileSync(join(dataDir, 'forms.json'), 'utf-8')) as SeedForm[]
  const pokeapiIds = [...new Set(forms.map((f) => f.pokeapiId))].sort((a, b) => a - b)

  console.log(`Resolving allowed versions for ${ALLOWED_VERSION_GROUPS.length} version groups...`)
  const allowedVersionNames = new Set<string>()
  await mapWithConcurrency(ALLOWED_VERSION_GROUPS, async (name) => {
    const data = await fetchJson<PokeApiVersionGroupResponse>(`https://pokeapi.co/api/v2/version-group/${name}`)
    for (const v of data.versions) allowedVersionNames.add(v.name)
  })

  console.log(`Fetching encounters for ${pokeapiIds.length} distinct forms (concurrency ${CONCURRENCY})...`)
  const locationAreas = new DedupTable()
  const methods = new DedupTable()
  const versions = new DedupTable()
  const encounters: Record<number, LocationAreaEncounters[]> = {}

  let done = 0
  await mapWithConcurrency(pokeapiIds, async (pokeapiId) => {
    const data = await fetchJson<PokeApiEncountersResponse[]>(
      `https://pokeapi.co/api/v2/pokemon/${pokeapiId}/encounters`
    )

    const entries: LocationAreaEncounters[] = []
    for (const locationArea of data) {
      const versionDetails = locationArea.version_details
        .filter((vd) => allowedVersionNames.has(vd.version.name))
        .map((vd) => ({
          versionIndex: versions.indexFor(vd.version.name),
          maxChance: vd.max_chance,
          encounterDetails: vd.encounter_details.map(
            (ed): EncounterDetail => ({
              minLevel: ed.min_level,
              maxLevel: ed.max_level,
              chance: ed.chance,
              methodIndex: methods.indexFor(ed.method.name),
              conditionValues: ed.condition_values.map((cv) => cv.name)
            })
          )
        }))

      if (versionDetails.length > 0) {
        entries.push({ locationAreaIndex: locationAreas.indexFor(locationArea.location_area.name), versionDetails })
      }
    }

    if (entries.length > 0) encounters[pokeapiId] = entries

    done++
    if (done % 100 === 0) console.log(`  ${done}/${pokeapiIds.length} forms done`)
  })

  const output: EncounterData = {
    encounters,
    locationAreas: locationAreas.names,
    methods: methods.names,
    versions: versions.names
  }

  mkdirSync(dataDir, { recursive: true })
  const outPath = join(dataDir, 'encounters.json')
  writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n')

  console.log(
    `Wrote encounters for ${Object.keys(encounters).length}/${pokeapiIds.length} forms ` +
      `(${locationAreas.names.length} location areas, ${methods.names.length} methods, ` +
      `${versions.names.length} versions) to ${outPath}`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
