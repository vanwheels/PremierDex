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
  /** True when no legitimate shiny of this form has ever existed, by any means (not
   * merely "not currently obtainable") — see docs/investigations/shiny-locked-audit.md.
   * DexRow disables the shiny checkbox and flags it with a badge, same treatment as
   * homeBoxable. */
  shinyLocked: boolean
  /** Non-null for a dex_distinct regional form (alolan/galarian/hisuian/paldean),
   * mirroring Form.regionalGroup — carried through so the search/filter bar (Leg 15) can
   * filter to regional forms independent of DexOptions.regionalMode's inline/grouped
   * *layout* toggle. Always null for cosmetic-variant rows. */
  regionalGroup: string | null
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

/** A three-way toggle for a boolean row property: no opinion, must be true, or must be
 * false. Used by every yes/no filter dimension below. */
export type FilterTriState = 'any' | 'yes' | 'no'

/**
 * Search/filter state for the Living Dex grid (Leg 15). Presentation-only, same as
 * DexOptions — narrows which built DexSections are visible, never touches stored data,
 * and isn't persisted across a reload.
 *
 * `query` is one free-text field rather than separate boxes per dimension (Vanny's call
 * when folding nickname/origin search in): it matches across name, dex#, nickname, OT
 * name, origin game, language, and TID/SID — see filterDexSections.ts's rowMatches.
 */
export interface DexFilters {
  query: string
  owned: FilterTriState
  shiny: FilterTriState
  regional: FilterTriState
  /** 'any' or one of Species/Form's 1-CURRENT_MAX_GENERATION generation numbers. */
  generation: number | 'any'
  homeBoxable: FilterTriState
  shinyLocked: FilterTriState
}

export const DEFAULT_DEX_FILTERS: DexFilters = {
  query: '',
  owned: 'any',
  shiny: 'any',
  regional: 'any',
  generation: 'any',
  homeBoxable: 'any',
  shinyLocked: 'any'
}
