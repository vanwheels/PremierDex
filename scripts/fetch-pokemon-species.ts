/**
 * Fetches the full National Dex species list from PokeAPI and writes
 * data/pokemon/species.json (committed static data, loaded at runtime by
 * src/main/storage/load-species-data.ts — see docs there for why it's a runtime fs read
 * rather than a bundled import).
 *
 * Uses /generation/{1..9} rather than /pokemon-species/{1..1025} — 9 requests instead of
 * 1025, since each generation response already lists every species introduced in it.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

interface PokeApiGenerationResponse {
  pokemon_species: Array<{ name: string; url: string }>
}

interface SeedSpecies {
  id: number
  name: string
  generation: number
}

const GENERATIONS = Array.from({ length: 9 }, (_, i) => i + 1)

/** PokeAPI resource URLs end in .../pokemon-species/{id}/ */
function idFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/)
  if (!match) throw new Error(`Could not parse id from PokeAPI url: ${url}`)
  return Number(match[1])
}

async function fetchGeneration(gen: number): Promise<SeedSpecies[]> {
  const res = await fetch(`https://pokeapi.co/api/v2/generation/${gen}`)
  if (!res.ok) throw new Error(`PokeAPI /generation/${gen} failed: ${res.status} ${res.statusText}`)
  const data = (await res.json()) as PokeApiGenerationResponse
  return data.pokemon_species.map((s) => ({ id: idFromUrl(s.url), name: s.name, generation: gen }))
}

async function main(): Promise<void> {
  const all: SeedSpecies[] = []
  for (const gen of GENERATIONS) {
    console.log(`Fetching generation ${gen}...`)
    all.push(...(await fetchGeneration(gen)))
  }

  all.sort((a, b) => a.id - b.id)

  const scriptDir = dirname(fileURLToPath(import.meta.url))
  const outDir = join(scriptDir, '..', 'data', 'pokemon')
  mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, 'species.json')
  writeFileSync(outPath, JSON.stringify(all, null, 2) + '\n')

  console.log(`Wrote ${all.length} species to ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
