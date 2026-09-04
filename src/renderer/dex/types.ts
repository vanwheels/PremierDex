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

/** Display info for one real individual, resolved from its CollectionEntry + Species/Form
 * (Leg 6 of the Box Arrangement milestone) — always backed by a real CollectionEntry,
 * owned or not (an unowned placeholder can occupy a box slot too, see CollectionEntry's
 * doc comment). Denormalizes the same display fields DexRowData/CollectionRowData already
 * carry rather than joining Species/Form at render time, same convention both of those
 * follow. Shared base for BoxCell (a placed individual) and UnboxedEntry (Leg 7: one not
 * yet placed in any box) — see buildBoxes.ts's buildEntryDisplayInfo. */
export interface EntryDisplayInfo {
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

/** One occupied slot in a Box view grid, backed by a real CollectionEntry. `kind`
 * discriminates it from BoxPlaceholderCell below within Box.cells' union type. */
export interface BoxCell extends EntryDisplayInfo {
  kind: 'entry'
  boxNumber: number
  /** 0-based position within the box, matching CollectionEntry.boxSlot. */
  slot: number
}

/** A "planned" placeholder slot (Leg 5 of the Box View Polish milestone) — the user's
 * intent to eventually put some species here, set via a right-click on an empty slot. See
 * shared/types/box.ts's BoxPlaceholder. No gender/shiny/individual data to denormalize
 * (unlike BoxCell), so this doesn't extend EntryDisplayInfo — just enough to render a
 * dimmed sprite and label. pokeapiId/spriteFormSuffix come from buildBoxes.ts's own pick
 * of a representative form for the species (there's no real Form tied to a placeholder). */
export interface BoxPlaceholderCell {
  kind: 'placeholder'
  boxNumber: number
  slot: number
  speciesId: number
  displayName: string
  pokeapiId: number
  spriteFormSuffix: string | null
}

/** One entry in a Storage Location with no box position yet (Leg 7 of the Box Arrangement
 * milestone) — DexBoxTray's drag source for the "add to box" flow. See buildBoxes.ts's
 * buildUnboxedEntries. */
export type UnboxedEntry = EntryDisplayInfo

/** Which cell a Box view right-click (context menu) or the placeholder modal targets — a
 * real entry, an existing "planned" placeholder, or an empty slot with neither (Leg 5 of
 * the Box View Polish milestone). Shared between DexBoxPane and DexBoxGridCell so both
 * agree on the same "what did the user right-click" shape. */
export type CellTarget =
  | { kind: 'entry'; slot: number; entryId: number }
  | { kind: 'placeholder'; slot: number; speciesId: number }
  | { kind: 'empty'; slot: number }

/** One paginated box (see buildBoxes.ts's BOX_SIZE) — `cells` is always exactly
 * BOX_SIZE long, indexed by slot, with `null` for an empty slot. `id`/`name` come straight
 * from the backing StorageBox row (Leg 2 of the Box View Polish milestone) — `id` is what
 * DexBoxGrid's rename control writes back through, `name` is the optional user label
 * shown alongside "Box N", null meaning unnamed. */
export interface Box {
  id: number
  boxNumber: number
  name: string | null
  /** Leg 5 of the Box View Polish milestone: a slot is a real entry, a "planned"
   * placeholder, or empty (null) — never more than one at once, see BoxPlaceholder's own
   * doc comment. */
  cells: (BoxCell | BoxPlaceholderCell | null)[]
}
