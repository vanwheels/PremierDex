/**
 * Fetches evolution-chain membership from PokeAPI's /evolution-chain endpoint and writes
 * data/pokemon/species-evolution.json (committed static data, loaded at runtime by
 * src/main/storage/load-species-data.ts). One row per species that appears in some chain,
 * recording `isFinalEvolutionStage` — whether it's the end of its evolutionary line, i.e.
 * has no `evolves_to` children. That's the "Pre Evos" axis from
 * docs/investigations/dex-completeness-tiers.md's source spreadsheet (Pre Evos = Pichu,
 * Pikachu, & Raichu all counting toward completeness, vs. just Raichu when the axis is
 * off — a species is a pre-evolution exactly when it's NOT the final stage).
 *
 * Walks every chain's full tree, not just its first branch: branching evolutions (Eevee's
 * 8 eeveelutions, Tyrogue's 3, item-based branches like Slowpoke -> Slowbro/Slowking) each
 * mark their own target species as final, and every node along the way — not just leaves
 * — gets a row, so a mid-chain species (Pikachu, between Pichu and Raichu) correctly comes
 * back non-final. A species with no evolutions at all (e.g. Farfetch'd pre-Sirfetch'd
 * additions, or any one-stage species) is still exactly one chain node with no
 * evolves_to, so it correctly comes back final. Regional forms (Alolan Ninetales, etc.)
 * aren't separate PokeAPI species — they're varieties of the same species (see
 * fetch-pokemon-forms.ts) — so this stays a plain species-id-keyed fact with nothing
 * form-specific to resolve.
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

interface PokeApiEvolutionChainListResponse {
  count: number
  results: Array<{ url: string }>
}

interface PokeApiChainLink {
  species: { name: string; url: string }
  evolves_to: PokeApiChainLink[]
}

interface PokeApiEvolutionChainResponse {
  chain: PokeApiChainLink
}

interface SpeciesEvolutionInfo {
  speciesId: number
  isFinalEvolutionStage: boolean
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

/** Depth-first walk of one chain's tree, appending one SpeciesEvolutionInfo per node
 * (including branches) to `out`. */
function walkChain(link: PokeApiChainLink, out: SpeciesEvolutionInfo[]): void {
  out.push({
    speciesId: idFromUrl(link.species.url),
    isFinalEvolutionStage: link.evolves_to.length === 0
  })
  for (const child of link.evolves_to) walkChain(child, out)
}

async function main(): Promise<void> {
  console.log('Fetching evolution-chain list...')
  const list = await fetchJson<PokeApiEvolutionChainListResponse>('https://pokeapi.co/api/v2/evolution-chain?limit=600')
  console.log(`Fetching ${list.results.length} evolution chains (concurrency ${CONCURRENCY})...`)

  let done = 0
  const perChain = await mapWithConcurrency(list.results, async (chain) => {
    const data = await fetchJson<PokeApiEvolutionChainResponse>(chain.url)
    const out: SpeciesEvolutionInfo[] = []
    walkChain(data.chain, out)
    done++
    if (done % 100 === 0) console.log(`  ${done}/${list.results.length} chains done`)
    return out
  })

  const all = perChain.flat().sort((a, b) => a.speciesId - b.speciesId)

  const scriptDir = dirname(fileURLToPath(import.meta.url))
  const outDir = join(scriptDir, '..', 'data', 'pokemon')
  mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, 'species-evolution.json')
  writeFileSync(outPath, JSON.stringify(all, null, 2) + '\n')

  console.log(`Wrote ${all.length} species (${list.results.length} chains) to ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
