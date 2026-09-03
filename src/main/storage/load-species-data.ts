import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'

export interface SeedSpecies {
  id: number
  name: string
  generation: number
}

export interface SeedForm {
  speciesId: number
  formName: string
  formCategory: 'dex_distinct' | 'cosmetic_variant' | 'non_boxable'
  homeBoxable: boolean
  hasGenderDifference: boolean
  firstAvailableGeneration: number
  regionalGroup: 'alolan' | 'galarian' | 'hisuian' | 'paldean' | null
  pokeapiId: number
  spriteFormSuffix: string | null
  shinyLocked: boolean
  alwaysShiny: boolean
}

/**
 * Which species are obtainable in a given origin game (Leg 4 — see TODO.md's "Per-Game
 * Species-Availability Dataset"), written by `npm run fetch-species-availability`.
 * `pokedexes` is keyed by PokeAPI regional-dex name rather than by game so games sharing
 * a dex (e.g. Gold/Silver/Crystal all resolving to "original-johto") store that species
 * list once; `gameToPokedexes` maps an origin-games.ts id to the dex name(s) whose union
 * defines that game's available species. A game absent from `gameToPokedexes`, or mapped
 * to an empty array, has no availability data (Colosseum, XD, and Pokémon GO all fall
 * into this — see the fetch script's header comment) — callers must treat that as "no
 * data for this game," never as "nothing is available there."
 */
export interface SpeciesAvailabilityData {
  pokedexes: Record<string, number[]>
  gameToPokedexes: Record<string, string[]>
}

// Unpackaged (dev and local `npm run build`), the main bundle lives at
// <projectRoot>/out/main/index.cjs — __dirname is stable there, unlike `app.getAppPath()`.
// Packaged, electron-builder.yml's `extraResources` entry ships data/pokemon/ outside
// app.asar, landing at process.resourcesPath/data/pokemon. Pattern matches GW2-Squaded's
// src/main/game-data/load-game-data.ts.
const DATA_DIR = app.isPackaged
  ? join(process.resourcesPath, 'data', 'pokemon')
  : join(__dirname, '..', '..', 'data', 'pokemon')

/** Loads the static species list written by `npm run fetch-pokemon-species`. */
export function loadSpeciesData(): SeedSpecies[] {
  const filePath = join(DATA_DIR, 'species.json')
  return JSON.parse(readFileSync(filePath, 'utf-8')) as SeedSpecies[]
}

/** Loads the static per-species form list written by `npm run fetch-pokemon-forms`. */
export function loadFormsData(): SeedForm[] {
  const filePath = join(DATA_DIR, 'forms.json')
  return JSON.parse(readFileSync(filePath, 'utf-8')) as SeedForm[]
}

/** Loads the static per-game species-availability data written by
 * `npm run fetch-species-availability`. */
export function loadSpeciesAvailabilityData(): SpeciesAvailabilityData {
  const filePath = join(DATA_DIR, 'species-availability.json')
  return JSON.parse(readFileSync(filePath, 'utf-8')) as SpeciesAvailabilityData
}
