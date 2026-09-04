/**
 * One numbered box within a Storage Location (Leg 2 of the Box View Polish & Multi-Box
 * Editing milestone) — a real persisted row, not derived from which entries happen to sit
 * in it (buildBoxes.ts's old pre-Leg-2 rule). A row's mere existence is what makes a box
 * navigable in Box view, independent of whether anything is placed in it yet — see
 * schema.ts's `boxes` table comment. Every Storage Location always has at least a Box 1
 * row (schema.ts's backfillBoxes, and createStorageLocation seeds one on create).
 */
export interface StorageBox {
  id: number
  storageLocationId: number
  boxNumber: number
  /** User-given label ("Rename box" in DexBoxGrid); null means unnamed, shown there as
   * plain "Box N". */
  name: string | null
}

/**
 * A "planned" placeholder (Leg 5 of the Box View Polish & Multi-Box Editing milestone) —
 * the user's intent to eventually put some species in a given empty box slot, set via a
 * right-click in Box view. Distinct from a real (owned or unowned) CollectionEntry: it
 * carries no gender/shiny/individual data, never counts toward completion stats, and
 * never appears in the unboxed tray — see schema.ts's `box_placeholders` table comment.
 * At most one of a real entry or a placeholder occupies a given (storageLocationId,
 * boxNumber, boxSlot) triple at a time.
 */
export interface BoxPlaceholder {
  id: number
  storageLocationId: number
  boxNumber: number
  boxSlot: number
  speciesId: number
}
