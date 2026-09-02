/**
 * Core data model shared between main and renderer, per the locked v1 schema:
 * Species -> Form (FK species_id) -> CollectionEntry (FK form_id). See
 * src/main/storage/schema.ts for the SQLite table definitions these mirror.
 */

/**
 * Whether a form is its own Living Dex row (dex_distinct — e.g. Alolan Ninetales),
 * a display-only cosmetic variant of its base form (cosmetic_variant — e.g. Vivillon
 * patterns), or not boxable in HOME at all (non_boxable — e.g. some battle-only forms).
 * All forms are seeded as 'dex_distinct' placeholders until the real categorization
 * pass (see TODO.md) assigns accurate values.
 */
export type FormCategory = 'dex_distinct' | 'cosmetic_variant' | 'non_boxable'

/** Only meaningful when the owning Form's hasGenderDifference is true. */
export type Gender = 'male' | 'female' | 'unknown'

export interface Species {
  id: number // National Dex number
  name: string
  generation: number // generation introduced
}

export interface Form {
  id: number
  speciesId: number
  formName: string
  formCategory: FormCategory
  homeBoxable: boolean
  hasGenderDifference: boolean
  firstAvailableGeneration: number
  regionalGroup: string | null
}

export interface CollectionEntry {
  id: number
  formId: number
  gender: Gender
  shiny: boolean
  owned: boolean
}
