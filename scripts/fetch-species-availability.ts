/**
 * Fetches, per origin game, the set of species obtainable in that game and writes
 * data/pokemon/species-availability.json (committed static data, loaded at runtime by
 * src/main/storage/load-species-data.ts). v1 slice: species-availability only — no
 * form/gender/ball-combo legality (see docs/investigations/held-item-form-change-gap.md
 * for why held-item-driven formes specifically are out of scope here).
 *
 * PokeAPI's /version-group/{name} exposes the regional Pokedex(es) valid for that
 * version group, and /pokedex/{name} lists every species with a dex entry in it. Storage
 * is keyed by pokedex name rather than by game so games sharing a dex (e.g. Gold/Silver/
 * Crystal all resolving to "original-johto", confirmed live 2026-09-03) store that
 * species list once, not once per game.
 *
 * Colosseum and XD both resolve to pokedexes: [] (confirmed live) — GameCube spinoffs
 * with no regional Pokedex in PokeAPI at all — and Pokémon GO has no /version-group
 * entry whatsoever (confirmed live via /version). All three intentionally end up with no
 * (or an empty) entry in gameToPokedexes; loadSpeciesAvailabilityData's consumers must
 * read that as "no data for this game," never as "nothing is available there."
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ORIGIN_GAMES } from '../src/shared/data/origin-games'

interface PokeApiVersionGroupResponse {
  pokedexes: Array<{ name: string }>
}

interface PokeApiPokedexResponse {
  pokemon_entries: Array<{ pokemon_species: { url: string } }>
}

interface SpeciesAvailabilityData {
  pokedexes: Record<string, number[]>
  gameToPokedexes: Record<string, string[]>
}

/**
 * Hand-maintained structural mapping from ORIGIN_GAMES id to PokeAPI version-group
 * name — not "obtainability" data itself, just which game belongs to which version
 * group, so this is fine to hand-write (same category as fetch-pokemon-forms.ts's
 * VERSION_GROUP_GENERATION). Pokémon GO ('go') is deliberately absent: PokeAPI has no
 * version-group for it at all (confirmed live via /version) — main()'s completeness
 * check below special-cases that one id rather than requiring an entry for it.
 */
const ORIGIN_GAME_VERSION_GROUP: Record<string, string> = {
  red: 'red-blue',
  blue: 'red-blue',
  yellow: 'yellow',
  gold: 'gold-silver',
  silver: 'gold-silver',
  crystal: 'crystal',
  ruby: 'ruby-sapphire',
  sapphire: 'ruby-sapphire',
  firered: 'firered-leafgreen',
  leafgreen: 'firered-leafgreen',
  emerald: 'emerald',
  colosseum: 'colosseum',
  xd: 'xd',
  diamond: 'diamond-pearl',
  pearl: 'diamond-pearl',
  platinum: 'platinum',
  heartgold: 'heartgold-soulsilver',
  soulsilver: 'heartgold-soulsilver',
  black: 'black-white',
  white: 'black-white',
  'black-2': 'black-2-white-2',
  'white-2': 'black-2-white-2',
  x: 'x-y',
  y: 'x-y',
  'omega-ruby': 'omega-ruby-alpha-sapphire',
  'alpha-sapphire': 'omega-ruby-alpha-sapphire',
  sun: 'sun-moon',
  moon: 'sun-moon',
  'ultra-sun': 'ultra-sun-ultra-moon',
  'ultra-moon': 'ultra-sun-ultra-moon',
  'lets-go-pikachu': 'lets-go-pikachu-lets-go-eevee',
  'lets-go-eevee': 'lets-go-pikachu-lets-go-eevee',
  sword: 'sword-shield',
  shield: 'sword-shield',
  'brilliant-diamond': 'brilliant-diamond-shining-pearl',
  'shining-pearl': 'brilliant-diamond-shining-pearl',
  'legends-arceus': 'legends-arceus',
  scarlet: 'scarlet-violet',
  violet: 'scarlet-violet',
  'legends-za': 'legends-za'
}

const MAX_ATTEMPTS = 3
const CONCURRENCY = 10

/** PokeAPI resource URLs end in .../pokemon-species/{id}/ */
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

async function main(): Promise<void> {
  const unmappedGameIds = ORIGIN_GAMES.map((g) => g.id).filter(
    (id) => id !== 'go' && !(id in ORIGIN_GAME_VERSION_GROUP)
  )
  if (unmappedGameIds.length > 0) {
    throw new Error(
      `ORIGIN_GAME_VERSION_GROUP is missing an entry for: ${unmappedGameIds.join(', ')} — ` +
        `add its PokeAPI version-group name (or confirm live it genuinely has none, like "go")`
    )
  }

  const gameEntries = Object.entries(ORIGIN_GAME_VERSION_GROUP)
  console.log(`Fetching version groups for ${gameEntries.length} games...`)
  const gameToDexNames = new Map<string, string[]>()
  await mapWithConcurrency(gameEntries, async ([gameId, versionGroup]) => {
    const data = await fetchJson<PokeApiVersionGroupResponse>(
      `https://pokeapi.co/api/v2/version-group/${versionGroup}`
    )
    gameToDexNames.set(
      gameId,
      data.pokedexes.map((d) => d.name)
    )
  })

  const allDexNames = [...new Set([...gameToDexNames.values()].flat())].sort()
  console.log(`Fetching ${allDexNames.length} distinct pokedexes...`)
  const pokedexes: Record<string, number[]> = {}
  await mapWithConcurrency(allDexNames, async (dexName) => {
    const data = await fetchJson<PokeApiPokedexResponse>(`https://pokeapi.co/api/v2/pokedex/${dexName}`)
    pokedexes[dexName] = data.pokemon_entries.map((e) => idFromUrl(e.pokemon_species.url)).sort((a, b) => a - b)
  })

  const gameToPokedexes: Record<string, string[]> = {}
  for (const [gameId, dexNames] of gameToDexNames) {
    gameToPokedexes[gameId] = dexNames
  }

  const output: SpeciesAvailabilityData = { pokedexes, gameToPokedexes }

  const scriptDir = dirname(fileURLToPath(import.meta.url))
  const outDir = join(scriptDir, '..', 'data', 'pokemon')
  mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, 'species-availability.json')
  writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n')

  console.log(`Wrote ${allDexNames.length} pokedexes covering ${gameEntries.length} games to ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
