import type { CollectionEntry } from '@shared/types/pokemon'

/** One renderable grid row: either a whole form, or one gender split of a form. */
export interface DexRowData {
  key: string
  formId: number
  dexNumber: number
  displayName: string
  regular: CollectionEntry | null // shiny = false
  shinyEntry: CollectionEntry | null // shiny = true
  pokeapiId: number
  spriteFormSuffix: string | null
  firstAvailableGeneration: number
  /** False for the handful of real, dex_distinct forms Home doesn't accept deposits of
   * yet (Origin formes, Necrozma Dawn/Dusk, Calyrex Riders, Ogerpon masks, Minior cores)
   * — see docs/investigations/home-depositability-audit.md section 2. Still a normal,
   * fully-checkable row; DexRow just flags it with a badge. */
  homeBoxable: boolean
}

/**
 * A contiguous block of rows in the grid: either one species (heading = species name,
 * speciesId set — cosmetic-variant expand/collapse applies here) or, only in
 * regionalMode: 'grouped', one regional-group cluster (speciesId null, no cosmetic rows
 * — cosmetic variants always stay attached to their own species section).
 */
export interface DexSection {
  key: string
  heading: string
  speciesId: number | null
  rows: DexRowData[]
  cosmeticRows: DexRowData[]
}

export interface DexOptions {
  /** Off by default: a gender-diff form collapses to one row (using the male entry). */
  splitGenderRows: boolean
  regionalMode: 'inline' | 'grouped'
}
