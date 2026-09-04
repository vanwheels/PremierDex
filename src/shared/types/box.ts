import type { Gender } from './pokemon'

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
 * the user's intent to eventually put some form/gender/color in a given empty box slot, set
 * either via a right-click in Box view (species-only picker, resolved to a canonical
 * form/gender — see boxTemplates.ts's canonicalPlaceholderForm) or, since Leg 2 of the Dex
 * completeness tier migration, auto-stamped by applying a Box Template (a tier + color
 * pair) against `boxTemplates.ts`'s `requiredUnits()`. Distinct from a real (owned or
 * unowned) CollectionEntry: it carries no individual identity (nickname/origin/etc.), never
 * counts toward completion stats, and never appears in the unboxed tray — see
 * schema.ts's `box_placeholders` table comment. At most one of a real entry or a
 * placeholder occupies a given (storageLocationId, boxNumber, boxSlot) triple at a time.
 *
 * Widened from species-only (Leg 5) to (formId, gender, shiny) by Leg 2 of the Dex
 * completeness tier migration — a bare species can't distinguish Alolan Ninetales from
 * regular Ninetales, let alone a gender split or shiny color, all of which a dex-tier
 * template needs to represent. `gender` follows the same "male is the collapsed
 * representative" convention `requiredUnits()` uses for an unsplit gender-diff
 * requirement — a manually-set placeholder on a gender-diff species also uses `'male'`
 * (never `'unknown'`) so it dedupes against a template-stamped one for the same form/color.
 */
export interface BoxPlaceholder {
  id: number
  storageLocationId: number
  boxNumber: number
  boxSlot: number
  formId: number
  gender: Gender
  shiny: boolean
}
