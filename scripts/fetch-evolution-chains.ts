/**
 * Fetches evolution-chain membership from PokeAPI's /evolution-chain endpoint and writes
 * two committed static files (both loaded at runtime by src/main/storage/load-species-data.ts):
 *
 * data/pokemon/species-evolution.json — one row per species that appears in some chain,
 * recording:
 * - `isFinalEvolutionStage` — whether it's the end of its evolutionary line, i.e. has no
 *   `evolves_to` children. That's the "Pre Evos" axis from
 *   docs/investigations/dex-completeness-tiers.md's source spreadsheet (Pre Evos = Pichu,
 *   Pikachu, & Raichu all counting toward completeness, vs. just Raichu when the axis is
 *   off — a species is a pre-evolution exactly when it's NOT the final stage).
 * - `evolvesFromSpeciesId` — the direct parent species in its chain, or null for a chain's
 *   root (Leg 1 of the Evolution-Chain Reachability milestone). Lets a consumer walk a
 *   species' ancestors one parent pointer at a time without needing the full tree; see
 *   `checkEntryValidity`'s ancestor-reachability check (Leg 2 of that milestone).
 * This file stays species-id-keyed (one row per species, no branching) — every existing
 * consumer relies on that shape, so regional-form branching (below) is kept out of it
 * entirely rather than risking a shape change here.
 *
 * data/pokemon/evolution-edges.json — one row per (fromSpecies+fromForm) -> (toSpecies+
 * toForm) edge, each with a human-readable `method` string (Leg 1 of the Species Detail
 * Popup + Evolution Family Tree milestone). PokeAPI's chain tree is species-only — Raichu
 * vs. Raichu-Alola is one `raichu` node, not two — but its evolution_details carry
 * `required_pokemon_form`/`evolved_pokemon_form` per entry (e.g. Pikachu -> Raichu's
 * Sun-Moon-era entry has `evolved_pokemon_form: raichu-alola`), which is enough to recover
 * the branch PokeAPI doesn't model as a chain node. See groupEdgesByForm below: every
 * child's evolution_details are bucketed by (required_pokemon_form, evolved_pokemon_form)
 * pair (defaulting to 'base' when unset) into one edge per distinct form pairing — this is
 * also what splits cross-species region-gated evolutions like Meowth (Galar) -> Perrserker
 * from the plain Meowth -> Persian edge, confirmed live 2026-09-22. `method` strings are
 * built by evolution-method-format.ts (see its doc comment) from every remaining condition
 * field on the bucket's evolution_details entries, deduped and joined with " or " when a
 * form pairing has more than one distinct way to reach it (e.g. Feebas -> Milotic via
 * trade-holding-Prism-Scale or a beauty threshold).
 *
 * `fromFormName`/`toFormName` have to match forms.json's formName convention exactly (Leg 2's
 * tree UI joins on it to find each bubble's sprite/label) — verified live 2026-09-22 by
 * cross-checking every edge's forms against forms.json directly, which is what surfaced the
 * two cases plain slug-stripping gets wrong:
 *   - A species with multiple already-distinct base formes (Toxtricity Amped/Low Key,
 *     Basculin, ...) has a default variety whose own slug does NOT match the species slug
 *     (Toxtricity's default is "toxtricity-amped", not "toxtricity"), so it doesn't hit
 *     fetch-pokemon-forms.ts's hardcoded 'base' the way a species-slug-equality check would
 *     assume. resolveDefaultVarietySlug fetches each referenced species' real default variety
 *     slug (pokemon-species' `varieties` list) instead of assuming the shortcut holds.
 *   - A species using fetch-pokemon-forms.ts's "sub-form" path (Burmy's cloaks, Deerling's
 *     seasons, Flabébé's colors, Sinistea's antique/phony, ... — one shared variety/pokemon
 *     with several `forms` entries instead of several varieties) stores every sub-form's
 *     formName as its raw, unprefixed `form_name` (`summer`, not `deerling-summer`), with
 *     only the `is_default` sub-form mapped to 'base' — not a prefix-strip of any slug.
 *     main fetches each referenced pokemon-form resource directly, via collectFormUrls
 *     (rather than trusting the reference's own `name` field, which is a full slug either
 *     way and doesn't distinguish the two cases), to read its `is_default`/`form_name`/
 *     owning `pokemon.name`, and formNameFromForm below picks the right convention by
 *     comparing that owning pokemon against the species' resolved default variety.
 *
 * Walks every chain's full tree, not just its first branch: branching evolutions (Eevee's
 * 8 eeveelutions, Tyrogue's 3, item-based branches like Slowpoke -> Slowbro/Slowking) each
 * mark their own target species as final, and every node along the way — not just leaves
 * — gets a row, so a mid-chain species (Pikachu, between Pichu and Raichu) correctly comes
 * back non-final. A species with no evolutions at all (e.g. Farfetch'd pre-Sirfetch'd
 * additions, or any one-stage species) is still exactly one chain node with no
 * evolves_to, so it correctly comes back final.
 *
 * Fetches the full chain list up front rather than assuming ids are dense from 1: verified
 * live 2026-09-04 that /evolution-chain's `count` (541) undercounts the max valid id (549)
 * — ids 210/222/225/226/227/231/238/251 are gaps (retired/merged chains), so looping
 * 1..count would both skip real ids past 541 and waste requests on the gaps. The list
 * endpoint's `results` gives the real, complete set of chain URLs to fetch instead.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatEvolutionMethod, type PokeApiEvolutionDetail } from './evolution-method-format'

interface PokeApiEvolutionChainListResponse {
  count: number
  results: Array<{ url: string }>
}

interface PokeApiChainLink {
  species: { name: string; url: string }
  evolution_details: PokeApiEvolutionDetail[]
  evolves_to: PokeApiChainLink[]
}

interface PokeApiEvolutionChainResponse {
  chain: PokeApiChainLink
}

interface SpeciesEvolutionInfo {
  speciesId: number
  isFinalEvolutionStage: boolean
  evolvesFromSpeciesId: number | null
}

interface EvolutionEdge {
  fromSpeciesId: number
  fromFormName: string
  toSpeciesId: number
  toFormName: string
  method: string
}

/** One parent-to-child link, not yet bucketed by form pairing — bucketing needs
 * resolveDefaultVarietySlug's results first, which in turn needs to know which species are
 * referenced at all, so the chain walk and the bucketing pass happen in two steps. */
interface RawEdge {
  fromSpeciesId: number
  fromSlug: string
  toSpeciesId: number
  toSlug: string
  details: PokeApiEvolutionDetail[]
}

interface PokeApiSpeciesVarietiesResponse {
  varieties: Array<{ is_default: boolean; pokemon: { name: string } }>
}

/** The fields of a /pokemon-form/{id} response this script needs — see the module doc
 * comment's second bullet for why `name` alone (a full slug either way) can't distinguish a
 * genuine alternate variety from a same-variety sub-form, but `pokemon.name` + `is_default` +
 * `form_name` together can. */
interface PokeApiFormDetail {
  form_name: string
  is_default: boolean
  pokemon: { name: string }
}

const CONCURRENCY = 10
const MAX_ATTEMPTS = 3

/** PokeAPI resource URLs end in .../pokemon-species/{id}/ or .../evolution-chain/{id}/ */
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

/** Resolves one required_pokemon_form/evolved_pokemon_form reference to a forms.json-
 * convention formName — see the module doc comment's second bullet for the two conventions
 * this picks between. No form set at all (a plain species-to-species evolution, or a
 * variety-target with no regional split) is always the default variety. */
function formNameFromForm(
  speciesSlug: string,
  defaultVarietySlug: string,
  formRef: { name: string; url: string } | null,
  formDetails: Map<string, PokeApiFormDetail>
): string {
  if (!formRef) return 'base'
  const detail = formDetails.get(formRef.url)
  if (!detail) return 'base'

  if (detail.pokemon.name !== defaultVarietySlug) {
    // A genuine alternate variety (Raichu-Alola, Toxtricity Low Key, ...) — same convention
    // as fetch-pokemon-forms.ts's formNameFromVariety: strip the species slug prefix.
    const prefix = `${speciesSlug}-`
    return detail.pokemon.name.startsWith(prefix) ? detail.pokemon.name.slice(prefix.length) : detail.pokemon.name
  }
  // Same pokemon as the species' default variety — either the sole ordinary form (always
  // is_default), or one of several sub-forms sharing that one variety (Burmy's cloaks,
  // Deerling's seasons, ...), stored as form_name verbatim per fetchDefaultVarietySubForms.
  return detail.is_default ? 'base' : detail.form_name
}

/** Buckets one child link's evolution_details by (required_pokemon_form, evolved_pokemon_
 * form) pair into one EvolutionEdge per distinct form pairing — see the module doc comment
 * for why this is the mechanism that recovers regional-variety branches (Raichu vs.
 * Raichu-Alola) that PokeAPI's chain tree doesn't model as separate nodes. A pairing with
 * more than one evolution_details entry (different games reaching the same form pairing by
 * different means, e.g. Feebas -> Milotic via trade-holding-Prism-Scale or a beauty
 * threshold) gets every distinct method string joined with " or ". */
function groupEdgesByForm(
  edge: RawEdge,
  defaultVarietySlug: Map<number, string>,
  formDetails: Map<string, PokeApiFormDetail>
): EvolutionEdge[] {
  const fromDefault = defaultVarietySlug.get(edge.fromSpeciesId) ?? edge.fromSlug
  const toDefault = defaultVarietySlug.get(edge.toSpeciesId) ?? edge.toSlug

  const buckets = new Map<string, PokeApiEvolutionDetail[]>()
  for (const d of edge.details) {
    const fromForm = formNameFromForm(edge.fromSlug, fromDefault, d.required_pokemon_form, formDetails)
    const toForm = formNameFromForm(edge.toSlug, toDefault, d.evolved_pokemon_form, formDetails)
    const key = `${fromForm}|${toForm}`
    const bucket = buckets.get(key)
    if (bucket) bucket.push(d)
    else buckets.set(key, [d])
  }

  return [...buckets.entries()].map(([key, group]) => {
    const [fromFormName, toFormName] = key.split('|')
    const methods = [...new Set(group.map(formatEvolutionMethod))]
    return { fromSpeciesId: edge.fromSpeciesId, fromFormName, toSpeciesId: edge.toSpeciesId, toFormName, method: methods.join(' or ') }
  })
}

/** Depth-first walk of one chain's tree, appending one SpeciesEvolutionInfo per node
 * (including branches) to `speciesOut`, and one un-bucketed RawEdge per parent-to-child link
 * to `edgesOut`. `parentSpeciesId` is null for the chain's root. */
function walkChain(
  link: PokeApiChainLink,
  speciesOut: SpeciesEvolutionInfo[],
  edgesOut: RawEdge[],
  parentSpeciesId: number | null
): void {
  const speciesId = idFromUrl(link.species.url)
  speciesOut.push({
    speciesId,
    isFinalEvolutionStage: link.evolves_to.length === 0,
    evolvesFromSpeciesId: parentSpeciesId
  })
  for (const child of link.evolves_to) {
    const childSpeciesId = idFromUrl(child.species.url)
    edgesOut.push({
      fromSpeciesId: speciesId,
      fromSlug: link.species.name,
      toSpeciesId: childSpeciesId,
      toSlug: child.species.name,
      details: child.evolution_details
    })
    walkChain(child, speciesOut, edgesOut, speciesId)
  }
}

/** Fetches `speciesId`'s pokemon-species data to find its default variety's own pokemon
 * slug (e.g. "toxtricity-amped") — see the module doc comment for why that slug, not the
 * plain species slug, is what maps to forms.json's 'base' formName. Only called for species
 * that actually need disambiguating (see main below), not all ~1000 chain species. */
async function resolveDefaultVarietySlug(speciesId: number): Promise<string> {
  const data = await fetchJson<PokeApiSpeciesVarietiesResponse>(`https://pokeapi.co/api/v2/pokemon-species/${speciesId}/`)
  const defaultVariety = data.varieties.find((v) => v.is_default) ?? data.varieties[0]
  return defaultVariety.pokemon.name
}

/** Every distinct required_pokemon_form/evolved_pokemon_form URL referenced anywhere in
 * `edges` — deduped, since the same form (e.g. "pikachu") can gate more than one edge. */
function collectFormUrls(edges: RawEdge[]): string[] {
  const urls = new Set<string>()
  for (const edge of edges) {
    for (const d of edge.details) {
      if (d.required_pokemon_form) urls.add(d.required_pokemon_form.url)
      if (d.evolved_pokemon_form) urls.add(d.evolved_pokemon_form.url)
    }
  }
  return [...urls]
}

async function main(): Promise<void> {
  console.log('Fetching evolution-chain list...')
  const list = await fetchJson<PokeApiEvolutionChainListResponse>('https://pokeapi.co/api/v2/evolution-chain?limit=600')
  console.log(`Fetching ${list.results.length} evolution chains (concurrency ${CONCURRENCY})...`)

  let done = 0
  const perChain = await mapWithConcurrency(list.results, async (chain) => {
    const data = await fetchJson<PokeApiEvolutionChainResponse>(chain.url)
    const species: SpeciesEvolutionInfo[] = []
    const edges: RawEdge[] = []
    walkChain(data.chain, species, edges, null)
    done++
    if (done % 100 === 0) console.log(`  ${done}/${list.results.length} chains done`)
    return { species, edges }
  })

  const allSpecies = perChain
    .flatMap((c) => c.species)
    .sort((a, b) => a.speciesId - b.speciesId)
  const allRawEdges = perChain.flatMap((c) => c.edges)

  // Only species referenced by a non-null required_pokemon_form (as a from-side gate) or
  // evolved_pokemon_form (as a to-side target) need their default variety's slug resolved —
  // every other species' rows are already unambiguous 'base' (see formNameFromForm).
  const speciesNeedingDefaultSlug = new Set<number>()
  for (const edge of allRawEdges) {
    for (const d of edge.details) {
      if (d.required_pokemon_form) speciesNeedingDefaultSlug.add(edge.fromSpeciesId)
      if (d.evolved_pokemon_form) speciesNeedingDefaultSlug.add(edge.toSpeciesId)
    }
  }
  console.log(`Resolving default-variety slugs for ${speciesNeedingDefaultSlug.size} species...`)
  const defaultVarietySlug = new Map<number, string>()
  await mapWithConcurrency([...speciesNeedingDefaultSlug], async (speciesId) => {
    defaultVarietySlug.set(speciesId, await resolveDefaultVarietySlug(speciesId))
  })

  const formUrls = collectFormUrls(allRawEdges)
  console.log(`Resolving ${formUrls.length} referenced pokemon-form details...`)
  const formDetails = new Map<string, PokeApiFormDetail>()
  await mapWithConcurrency(formUrls, async (url) => {
    formDetails.set(url, await fetchJson<PokeApiFormDetail>(url))
  })

  const allEdges = allRawEdges
    .flatMap((edge) => groupEdgesByForm(edge, defaultVarietySlug, formDetails))
    .sort((a, b) => a.fromSpeciesId - b.fromSpeciesId || a.toSpeciesId - b.toSpeciesId)

  const scriptDir = dirname(fileURLToPath(import.meta.url))
  const outDir = join(scriptDir, '..', 'data', 'pokemon')
  mkdirSync(outDir, { recursive: true })

  const speciesPath = join(outDir, 'species-evolution.json')
  writeFileSync(speciesPath, JSON.stringify(allSpecies, null, 2) + '\n')
  console.log(`Wrote ${allSpecies.length} species (${list.results.length} chains) to ${speciesPath}`)

  const edgesPath = join(outDir, 'evolution-edges.json')
  writeFileSync(edgesPath, JSON.stringify(allEdges, null, 2) + '\n')
  console.log(`Wrote ${allEdges.length} evolution edges to ${edgesPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
