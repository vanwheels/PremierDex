import type { CollectionEntry } from '@shared/types/pokemon'

/** Which dimension the Collection view (Leg 18, dexNumber added Leg 21) currently groups
 * owned entries by. Ribbon/Alpha are deliberately not options yet — blocked on those
 * markers existing in the schema at all (see TODO.md's Ribbons/Alpha future-milestone
 * item). */
export type CollectionGroupBy = 'originGame' | 'ot' | 'shiny' | 'dexNumber'

export const DEFAULT_COLLECTION_GROUP_BY: CollectionGroupBy = 'originGame'

/** One renderable Collection-view row: exactly one owned CollectionEntry (unlike
 * DexRowData, which pairs a form's regular + shiny slots into one row). */
export interface CollectionRowData {
  key: string
  entry: CollectionEntry
  dexNumber: number
  /** Species + form name, already carrying the entry's own gender symbol and shiny
   * marker — a Collection row shows one specific individual, not a form pairing, so
   * those live in the name rather than in separate row fields. */
  displayName: string
  pokeapiId: number
  spriteFormSuffix: string | null
  firstAvailableGeneration: number
}

export interface CollectionGroup {
  key: string
  label: string
  rows: CollectionRowData[]
}
