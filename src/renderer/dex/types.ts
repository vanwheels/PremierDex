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
  /** True for the split-out female row of a gender-diff form (splitGenderRows on) — see
   * SpriteThumbnail's prop of the same name. Always false for the male row and for
   * gender-less forms' single 'unknown'-gender row. */
  femaleSprite: boolean
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
  /** True when a form has never legitimately existed as non-shiny (e.g. Spiky-Eared
   * Pichu) — see Form.alwaysShiny's doc comment for the definition. DexRow disables the
   * *regular* checkbox and flags it with a badge, the mirror-image treatment of
   * shinyLocked. */
  alwaysShiny: boolean
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
  /** Leg 27's user-facing override on pickCollapsedRow's auto-pick — mirrors
   * Species.collapsedDisplayFormId. Always null for a regional-group section (speciesId
   * null); those never carry cosmetic rows. */
  collapsedDisplayFormId: number | null
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

/** Which of the sortable grid columns to order sections by (Leg 16) — clicking a header
 * in DexTable sets this. 'owned'/'shiny' sort on whether *any* row in the section has an
 * owned regular/shiny entry (Vanny's call), not whether every row does. */
export type DexSortKey = 'dexNumber' | 'name' | 'generation' | 'owned' | 'shiny'

export interface DexSort {
  key: DexSortKey
  direction: 'asc' | 'desc'
}

/** No sort applied: sections render in buildDexSections' natural order (species/dex
 * order, with grouped-mode regional clusters appended after). */
export const DEFAULT_DEX_SORT: DexSort | null = null

/** One occupied slot in a Box view grid (Leg 6 of the Box Arrangement milestone) — always
 * backed by a real CollectionEntry, owned or not (an unowned placeholder can occupy a box
 * slot too, see CollectionEntry's doc comment). Denormalizes the same display fields
 * DexRowData/CollectionRowData already carry rather than joining Species/Form at render
 * time, same convention both of those follow. */
export interface BoxCell {
  boxNumber: number
  /** 0-based position within the box, matching CollectionEntry.boxSlot. */
  slot: number
  entry: CollectionEntry
  dexNumber: number
  /** Species + form name, already carrying the entry's own gender symbol and shiny
   * marker, same as CollectionRowData.displayName — a box cell shows one specific
   * individual, not a form pairing. */
  displayName: string
  pokeapiId: number
  spriteFormSuffix: string | null
  femaleSprite: boolean
  homeBoxable: boolean
  shinyLocked: boolean
  alwaysShiny: boolean
}

/** One paginated box (see buildBoxes.ts's BOX_SIZE) — `cells` is always exactly
 * BOX_SIZE long, indexed by slot, with `null` for an empty slot. */
export interface Box {
  boxNumber: number
  cells: (BoxCell | null)[]
}
