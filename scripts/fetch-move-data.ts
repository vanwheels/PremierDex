/**
 * Fetches `/move/{name}` for every move slug in data/pokemon/learnsets.json's `moves` table and
 * writes data/pokemon/moves.json (committed static data, loaded at runtime by
 * src/main/storage/load-species-data.ts). Run `npm run fetch-species-details` first — this
 * reads its output. Same retry/concurrency pattern as fetch-species-details.ts. See
 * src/shared/types/moves.ts for the output shape and src/shared/moves.ts for the parsing.
 *
 * Confirmed live 2026-09-25: `/move/{name}` has type, damage_class, power, accuracy, pp,
 * effect_chance, English `effect_entries[].short_effect` (with a `$effect_chance` placeholder),
 * and `past_values[]` (changed stats only, null = unchanged, `version_group` = last group the
 * old values applied in — Tackle's 35 power/95 accuracy is tagged black-white). Also `names[]`
 * (English display name) and, for moves with no `effect_entries`, `flavor_text_entries`.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildMoveData, parseMove, type PokeApiMoveResponse } from '../src/shared/moves'
import type { MoveEntry } from '../src/shared/types/moves'

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
async function mapWithConcurrency<T>(items: T[], fn: (item: T) => Promise<void>): Promise<void> {
  let next = 0
  async function worker(): Promise<void> {
    while (true) {
      const i = next++
      if (i >= items.length) return
      await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker))
}

async function main(): Promise<void> {
  const scriptDir = dirname(fileURLToPath(import.meta.url))
  const dataDir = join(scriptDir, '..', 'data', 'pokemon')
  const { moves: slugs } = JSON.parse(readFileSync(join(dataDir, 'learnsets.json'), 'utf-8')) as { moves: string[] }

  console.log(`Fetching ${slugs.length} moves (concurrency ${CONCURRENCY})...`)
  const entries: Record<string, MoveEntry> = {}
  await mapWithConcurrency(slugs, async (slug) => {
    entries[slug] = parseMove(await fetchJson<PokeApiMoveResponse>(`https://pokeapi.co/api/v2/move/${slug}`))
  })

  const data = buildMoveData(entries)
  // One line per move keeps the file compact but diffable move-by-move.
  const lines = Object.entries(data.moves).map(([slug, entry]) => `    ${JSON.stringify(slug)}: ${JSON.stringify(entry)}`)
  mkdirSync(dataDir, { recursive: true })
  const outPath = join(dataDir, 'moves.json')
  writeFileSync(outPath, `{\n  "moves": {\n${lines.join(',\n')}\n  }\n}\n`)
  const withPast = Object.values(data.moves).filter((m) => m.pastValues).length
  const noEffect = Object.values(data.moves).filter((m) => m.effect === null).length
  console.log(`Wrote ${slugs.length} moves (${withPast} with past values, ${noEffect} without an English effect) to ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
