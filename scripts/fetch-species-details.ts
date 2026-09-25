/**
 * Fetches per-species capture rate/base happiness/growth rate/gender rate and per-form
 * abilities/EV yield for every species in data/pokemon/species.json and form in
 * data/pokemon/forms.json, and writes data/pokemon/species-details.json (committed static
 * data, loaded at runtime by src/main/storage/load-species-data.ts). Same retry/concurrency
 * pattern as fetch-species-availability.ts. See src/shared/types/species-details.ts for the
 * output shape and why growth rates/abilities are deduped into their own tables.
 *
 * Confirmed live 2026-09-23: `/pokemon-species/{id}` has capture_rate, base_happiness,
 * growth_rate, gender_rate; `/pokemon/{id}` has abilities and `stats[].effort` (EV yield);
 * `/growth-rate/{name}` has `levels[]` (experience needed per level, up to 100);
 * `/ability/{id}` has `effect_entries[]` with a `short_effect` per language.
 * Confirmed live 2026-09-25: `/pokemon-species/{id}` also has `egg_groups[]` and
 * `hatch_counter`; `/egg-group/{name}` has `names[]` (English display name per group).
 * `/pokemon/{id}` also has `types`, `stats[].base_stat`, and
 * `past_types`/`past_stats`/`past_abilities` (see FormDetailEntry for their semantics); the
 * parsing lives in src/shared/form-history.ts so it can be unit-tested.
 * Confirmed live 2026-09-25: `/pokemon/{id}` `moves[]` carries per-version-group
 * `level_learned_at`/`move_learn_method`; `/version-group/{name}` has `order` and
 * `generation`. The same `/pokemon/{id}` response feeds data/pokemon/learnsets.json (see
 * src/shared/types/learnsets.ts and src/shared/learnsets.ts), so learnsets add no extra fetches.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseFormDetails, type PokeApiPokemonResponse } from '../src/shared/form-history'
import {
  buildLearnsetData,
  parseLearnset,
  type PokeApiMoveEntry,
  type RawLearnsetEntry
} from '../src/shared/learnsets'
import type { LearnsetData, LearnsetVersionGroup } from '../src/shared/types/learnsets'
import type { FormDetailEntry, SpeciesDetailEntry, SpeciesDetailsData } from '../src/shared/types/species-details'

interface SeedSpecies {
  id: number
  name: string
  generation: number
}

interface SeedForm {
  pokeapiId: number
}

interface PokeApiSpeciesResponse {
  capture_rate: number
  base_happiness: number
  gender_rate: number
  growth_rate: { name: string }
  hatch_counter: number
  egg_groups: Array<{ name: string }>
}

interface PokeApiEggGroupResponse {
  names: Array<{ name: string; language: { name: string } }>
}

interface PokeApiVersionGroupResponse {
  order: number
  generation: { name: string }
}

interface PokeApiGrowthRateResponse {
  levels: Array<{ level: number; experience: number }>
}

interface PokeApiAbilityResponse {
  effect_entries: Array<{ short_effect: string; language: { name: string } }>
}

const ROMAN_GENERATIONS: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9 }

const MAX_ATTEMPTS = 3
const CONCURRENCY = 10

/** PokeAPI resource URLs end in .../ability/{id}/ */
function idFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/)
  if (!match) throw new Error(`Could not parse id from PokeAPI url: ${url}`)
  return Number(match[1])
}

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

/** One line per form (and per table) keeps the file compact but diffable form-by-form. */
function stringifyLearnsets(data: LearnsetData): string {
  const forms = Object.entries(data.learnsets).map(([id, entries]) => `    "${id}": ${JSON.stringify(entries)}`)
  const lines = [
    '{',
    `  "moves": ${JSON.stringify(data.moves)},`,
    `  "methods": ${JSON.stringify(data.methods)},`,
    `  "versionGroups": ${JSON.stringify(data.versionGroups)},`,
    '  "learnsets": {',
    forms.join(',\n'),
    '  }',
    '}'
  ]
  return lines.join('\n') + '\n'
}

async function main(): Promise<void> {
  const scriptDir = dirname(fileURLToPath(import.meta.url))
  const dataDir = join(scriptDir, '..', 'data', 'pokemon')
  const species = JSON.parse(readFileSync(join(dataDir, 'species.json'), 'utf-8')) as SeedSpecies[]
  const forms = JSON.parse(readFileSync(join(dataDir, 'forms.json'), 'utf-8')) as SeedForm[]

  console.log(`Fetching species details for ${species.length} species (concurrency ${CONCURRENCY})...`)
  const speciesEntries: Record<number, SpeciesDetailEntry> = {}
  const growthRateNames = new Set<string>()
  const eggGroupNames = new Set<string>()
  await mapWithConcurrency(species, async (s) => {
    const data = await fetchJson<PokeApiSpeciesResponse>(`https://pokeapi.co/api/v2/pokemon-species/${s.id}`)
    growthRateNames.add(data.growth_rate.name)
    const eggGroups = data.egg_groups.map((g) => g.name)
    for (const name of eggGroups) eggGroupNames.add(name)
    speciesEntries[s.id] = {
      captureRate: data.capture_rate,
      baseHappiness: data.base_happiness,
      growthRateName: data.growth_rate.name,
      genderRate: data.gender_rate,
      eggGroups,
      hatchCounter: data.hatch_counter
    }
  })

  console.log(`Fetching ${eggGroupNames.size} distinct egg groups...`)
  const eggGroups: Record<string, string> = {}
  await mapWithConcurrency([...eggGroupNames], async (name) => {
    const data = await fetchJson<PokeApiEggGroupResponse>(`https://pokeapi.co/api/v2/egg-group/${name}`)
    const english = data.names.find((n) => n.language.name === 'en')
    if (!english) throw new Error(`Egg group "${name}" has no English name`)
    eggGroups[name] = english.name
  })

  console.log(`Fetching ${growthRateNames.size} distinct growth rates...`)
  const growthRates: Record<string, number> = {}
  await mapWithConcurrency([...growthRateNames], async (name) => {
    const data = await fetchJson<PokeApiGrowthRateResponse>(`https://pokeapi.co/api/v2/growth-rate/${name}`)
    const level100 = data.levels.find((l) => l.level === 100)
    if (!level100) throw new Error(`Growth rate "${name}" has no level-100 entry`)
    growthRates[name] = level100.experience
  })

  const pokeapiIds = [...new Set(forms.map((f) => f.pokeapiId))]
  console.log(`Fetching form details for ${pokeapiIds.length} distinct forms...`)
  const formEntries: Record<number, FormDetailEntry> = {}
  const rawLearnsets: Record<number, RawLearnsetEntry[]> = {}
  const versionGroupNames = new Set<string>()
  const abilityUrls = new Map<string, string>()
  await mapWithConcurrency(pokeapiIds, async (pokeapiId) => {
    const data = await fetchJson<PokeApiPokemonResponse & { moves: PokeApiMoveEntry[] }>(`https://pokeapi.co/api/v2/pokemon/${pokeapiId}`)
    const { entry, abilityRefs } = parseFormDetails(data)
    for (const ref of abilityRefs) abilityUrls.set(ref.name, ref.url)
    formEntries[pokeapiId] = entry
    const learnset = parseLearnset(data.moves)
    for (const [, , , groups] of learnset) for (const g of groups) versionGroupNames.add(g)
    rawLearnsets[pokeapiId] = learnset
  })

  console.log(`Fetching ${versionGroupNames.size} distinct version groups...`)
  const versionGroupMeta: Array<LearnsetVersionGroup & { order: number }> = []
  await mapWithConcurrency([...versionGroupNames], async (name) => {
    const data = await fetchJson<PokeApiVersionGroupResponse>(`https://pokeapi.co/api/v2/version-group/${name}`)
    const generation = ROMAN_GENERATIONS[data.generation.name.replace('generation-', '')]
    if (!generation) throw new Error(`Version group "${name}" has unrecognised generation "${data.generation.name}"`)
    versionGroupMeta.push({ name, generation, order: data.order })
  })

  console.log(`Fetching ${abilityUrls.size} distinct abilities...`)
  const abilities: Record<string, string> = {}
  await mapWithConcurrency([...abilityUrls.entries()], async ([name, url]) => {
    const data = await fetchJson<PokeApiAbilityResponse>(url)
    const english = data.effect_entries.find((e) => e.language.name === 'en')
    if (!english) throw new Error(`Ability "${name}" (${idFromUrl(url)}) has no English effect entry`)
    abilities[name] = english.short_effect
  })

  const output: SpeciesDetailsData = { species: speciesEntries, forms: formEntries, growthRates, eggGroups, abilities }

  mkdirSync(dataDir, { recursive: true })
  const outPath = join(dataDir, 'species-details.json')
  writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n')

  const learnsetData = buildLearnsetData(rawLearnsets, versionGroupMeta)
  const learnsetPath = join(dataDir, 'learnsets.json')
  writeFileSync(learnsetPath, stringifyLearnsets(learnsetData))
  console.log(
    `Wrote learnsets for ${pokeapiIds.length} forms (${learnsetData.moves.length} moves, ` +
      `${learnsetData.versionGroups.length} version groups) to ${learnsetPath}`
  )

  console.log(
    `Wrote details for ${species.length} species, ${pokeapiIds.length} forms, ` +
      `${growthRateNames.size} growth rates, ${abilityUrls.size} abilities to ${outPath}`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
