/**
 * Fetches per-form data (varieties, categorization, gender differences, regional
 * grouping, first-available generation) for every species in data/pokemon/species.json
 * and writes data/pokemon/forms.json (committed static data, loaded at runtime by
 * src/main/storage/load-species-data.ts).
 *
 * Classification rules (see TODO.md's "Form categorization data pass" leg and
 * docs/investigations/form-categorization.md for the full rationale, verified against
 * live PokeAPI responses rather than assumed from memory):
 *   - non_boxable: pokemon-form.is_battle_only === true (Mega, Primal, Gigantamax, Zen
 *     Mode, Ash-Greninja, Eternamax, and similar auto-reverting forms).
 *   - dex_distinct: not battle-only, and either its form_name is an exact regional token
 *     (alola/galar/hisui/paldea) or its types/stats differ from the species' default
 *     variety (Rotom, Deoxys, Wormadam, Giratina, Basculin's ability differences don't
 *     count — only type/stat diffs do, but every real alternate forme also differs in at
 *     least one of those).
 *   - cosmetic_variant: not battle-only, types and stats identical to the default variety
 *     (Vivillon patterns, Pikachu cap/cosplay forms, Alcremie, Unown, Furfrou trims).
 *   - regional_group: set whenever form_name exactly equals alola/galar/hisui/paldea —
 *     an EXACT match, not a substring check. pikachu-alola-cap's form_name is
 *     "alola-cap", which would false-positive a naive .includes('alola') test.
 *   - has_gender_difference: sprites.front_female is set AND differs from
 *     sprites.front_default on that variety's own /pokemon/{name} response (per-form,
 *     not just per-species). Not just non-null: PokeAPI duplicates front_default into
 *     front_female for strictly single-gender species like Wormadam (always female)
 *     rather than leaving it null.
 *   - first_available_generation: the default variety reuses species.generation
 *     (already correct); non-default varieties look up pokemon-form.version_group.name
 *     in VERSION_GROUP_GENERATION below.
 *   - The default variety's form_name stays 'base', matching the Leg 1 seed convention.
 *     Non-default varieties store the variety's own pokemon slug with the species-name
 *     prefix stripped, NOT pokemon-form.form_name verbatim: form_name collides within a
 *     species that has multiple already-distinct base formes each with their own
 *     Gmax/Mega (Toxtricity Amped/Low Key, Urshifu Single/Rapid Strike, Tatsugiri
 *     Curly/Droopy/Stretchy all report form_name "gmax"/"mega" on every variant).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

interface SeedSpecies {
  id: number
  name: string
  generation: number
}

interface SeedForm {
  speciesId: number
  formName: string
  formCategory: 'dex_distinct' | 'cosmetic_variant' | 'non_boxable'
  hasGenderDifference: boolean
  firstAvailableGeneration: number
  regionalGroup: 'alolan' | 'galarian' | 'hisuian' | 'paldean' | null
}

interface PokeApiSpeciesResponse {
  varieties: Array<{ is_default: boolean; pokemon: { name: string; url: string } }>
}

interface PokeApiPokemonResponse {
  types: Array<{ type: { name: string } }>
  stats: Array<{ base_stat: number }>
  sprites: { front_default: string | null; front_female: string | null }
  forms: Array<{ url: string }>
}

interface PokeApiFormResponse {
  form_name: string
  is_battle_only: boolean
  version_group: { name: string }
}

/** speciesId:formName -> field overrides, applied after the heuristic below. Starts
 * empty; the escape hatch for anything a spot-check finds the heuristic got wrong. */
const OVERRIDES: Record<string, Partial<SeedForm>> = {}

/** Captured from PokeAPI's /version-group list + each entry's .generation during
 * planning — small and stable enough to hardcode rather than fetch per form. */
const VERSION_GROUP_GENERATION: Record<string, number> = {
  'red-blue': 1,
  yellow: 1,
  'red-green-japan': 1,
  'blue-japan': 1,
  'gold-silver': 2,
  crystal: 2,
  'ruby-sapphire': 3,
  emerald: 3,
  'firered-leafgreen': 3,
  colosseum: 3,
  xd: 3,
  'diamond-pearl': 4,
  platinum: 4,
  'heartgold-soulsilver': 4,
  'black-white': 5,
  'black-2-white-2': 5,
  'x-y': 6,
  'omega-ruby-alpha-sapphire': 6,
  'sun-moon': 7,
  'ultra-sun-ultra-moon': 7,
  'lets-go-pikachu-lets-go-eevee': 7,
  'sword-shield': 8,
  'the-isle-of-armor': 8,
  'the-crown-tundra': 8,
  'brilliant-diamond-shining-pearl': 8,
  'legends-arceus': 8,
  'scarlet-violet': 9,
  'the-teal-mask': 9,
  'the-indigo-disk': 9,
  'legends-za': 9,
  'mega-dimension': 9,
  champions: 9
}

const REGIONAL_GROUPS: Record<string, SeedForm['regionalGroup']> = {
  alola: 'alolan',
  galar: 'galarian',
  hisui: 'hisuian',
  paldea: 'paldean'
}

const CONCURRENCY = 10
const MAX_ATTEMPTS = 3

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

/**
 * PokeAPI duplicates front_default into front_female for strictly single-gender species
 * (e.g. Wormadam, always female) rather than leaving it null — confirmed live: Wormadam's
 * front_female URL is byte-for-byte the same as its front_default. A distinct female
 * sprite means front_female is set AND differs from front_default, not just non-null.
 */
function hasDistinctFemaleSprite(pokemon: PokeApiPokemonResponse): boolean {
  return pokemon.sprites.front_female !== null && pokemon.sprites.front_female !== pokemon.sprites.front_default
}

/**
 * pokemon-form.form_name is NOT guaranteed unique within a species: a species with
 * multiple already-distinct base formes (e.g. Toxtricity's Amped/Low Key, Urshifu's
 * Single/Rapid Strike, Tatsugiri's Curly/Droopy/Stretchy) that each additionally have a
 * Gmax/Mega variant all get form_name "gmax"/"mega" on those variants — confirmed live,
 * e.g. both toxtricity-amped-gmax and toxtricity-low-key-gmax report form_name "gmax".
 * The variety's own pokemon slug IS guaranteed unique per species (that's how PokeAPI
 * enumerates varieties in the first place), so derive the stored form_name from that —
 * stripping the leading "<species-slug>-" — instead of trusting form_name verbatim.
 */
function formNameFromVariety(speciesSlug: string, varietyPokemonName: string): string {
  const prefix = `${speciesSlug}-`
  return varietyPokemonName.startsWith(prefix) ? varietyPokemonName.slice(prefix.length) : varietyPokemonName
}

function sameTypesAndStats(a: PokeApiPokemonResponse, b: PokeApiPokemonResponse): boolean {
  const typesA = a.types.map((t) => t.type.name).sort()
  const typesB = b.types.map((t) => t.type.name).sort()
  if (typesA.length !== typesB.length || typesA.some((t, i) => t !== typesB[i])) return false
  if (a.stats.length !== b.stats.length) return false
  return a.stats.every((s, i) => s.base_stat === b.stats[i].base_stat)
}

async function fetchSpeciesForms(species: SeedSpecies): Promise<SeedForm[]> {
  const speciesData = await fetchJson<PokeApiSpeciesResponse>(
    `https://pokeapi.co/api/v2/pokemon-species/${species.id}`
  )

  const defaultVariety = speciesData.varieties.find((v) => v.is_default) ?? speciesData.varieties[0]
  const defaultPokemon = await fetchJson<PokeApiPokemonResponse>(defaultVariety.pokemon.url)

  const forms: SeedForm[] = []

  forms.push(
    applyOverride(species.id, 'base', {
      speciesId: species.id,
      formName: 'base',
      formCategory: 'dex_distinct',
      hasGenderDifference: hasDistinctFemaleSprite(defaultPokemon),
      firstAvailableGeneration: species.generation,
      regionalGroup: null
    })
  )

  const nonDefaultVarieties = speciesData.varieties.filter((v) => v !== defaultVariety)
  for (const variety of nonDefaultVarieties) {
    const pokemon = await fetchJson<PokeApiPokemonResponse>(variety.pokemon.url)
    const form = await fetchJson<PokeApiFormResponse>(pokemon.forms[0].url)
    const formName = formNameFromVariety(species.name, variety.pokemon.name)

    const regionalGroup = REGIONAL_GROUPS[form.form_name] ?? null
    const generation =
      VERSION_GROUP_GENERATION[form.version_group.name] ??
      (() => {
        throw new Error(
          `Unknown version_group "${form.version_group.name}" for ${variety.pokemon.name} — add it to VERSION_GROUP_GENERATION`
        )
      })()

    const formCategory: SeedForm['formCategory'] = form.is_battle_only
      ? 'non_boxable'
      : regionalGroup !== null || !sameTypesAndStats(pokemon, defaultPokemon)
        ? 'dex_distinct'
        : 'cosmetic_variant'

    forms.push(
      applyOverride(species.id, formName, {
        speciesId: species.id,
        formName,
        formCategory,
        hasGenderDifference: hasDistinctFemaleSprite(pokemon),
        firstAvailableGeneration: generation,
        regionalGroup
      })
    )
  }

  return forms
}

function applyOverride(speciesId: number, formName: string, form: SeedForm): SeedForm {
  return { ...form, ...OVERRIDES[`${speciesId}:${formName}`] }
}

async function main(): Promise<void> {
  const scriptDir = dirname(fileURLToPath(import.meta.url))
  const dataDir = join(scriptDir, '..', 'data', 'pokemon')
  const species = JSON.parse(readFileSync(join(dataDir, 'species.json'), 'utf-8')) as SeedSpecies[]

  console.log(`Fetching forms for ${species.length} species (concurrency ${CONCURRENCY})...`)
  let done = 0
  const perSpeciesForms = await mapWithConcurrency(species, async (s) => {
    const forms = await fetchSpeciesForms(s)
    done++
    if (done % 100 === 0) console.log(`  ${done}/${species.length} species done`)
    return forms
  })

  const all = perSpeciesForms.flat()
  mkdirSync(dataDir, { recursive: true })
  const outPath = join(dataDir, 'forms.json')
  writeFileSync(outPath, JSON.stringify(all, null, 2) + '\n')

  console.log(`Wrote ${all.length} forms (${species.length} species) to ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
