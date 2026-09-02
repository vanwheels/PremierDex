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
  hasGenderDifference: boolean
  firstAvailableGeneration: number
  regionalGroup: 'alolan' | 'galarian' | 'hisuian' | 'paldean' | null
  pokeapiId: number
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
