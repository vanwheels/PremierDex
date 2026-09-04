import type { CollectionEntry, Form, Gender } from '@shared/types/pokemon'
import type { DexTierConfig } from './completionStats'
import { BOX_SIZE } from './buildBoxes'

/** Regular vs. shiny — the color a Box Template's required-unit set is computed against.
 * Mirrors `CompletionBucket`'s `regular`/`shiny` split (completionStats.ts), which is
 * already the same "same axis config, two independent counts" shape Leg 1's investigation
 * describes a tier riding on top of. */
export type DexColor = 'regular' | 'shiny'

/** One collectible unit a dex-completeness tier requires — the same
 * `(formId, gender, shiny)` triple `CollectionEntry`/`collection_entries` key on. See
 * docs/investigations/dex-completeness-tiers.md's `requiredUnits` pseudocode. */
export interface RequiredUnit {
  formId: number
  gender: Gender
  shiny: boolean
}

function unitKey(formId: number, gender: Gender, shiny: boolean): string {
  return `${formId}|${gender}|${shiny}`
}

/** `${boxNumber}:${boxSlot}` — identifies one slot within a Storage Location, independent
 * of which box row backs it. */
export function slotKey(boxNumber: number, boxSlot: number): string {
  return `${boxNumber}:${boxSlot}`
}

/**
 * Every unit a tier/color combo requires, transcribing Leg 1's `requiredUnits` pseudocode
 * directly (docs/investigations/dex-completeness-tiers.md) — same skip rules
 * `computeCompletionStats` already applies (non_boxable forms never count; cosmetic
 * variants only count when the tier includes them; a color a form can never legitimately
 * exist in is excluded outright), plus the gender-diff collapse rule: a tier that doesn't
 * split by gender still requires *a* unit for a gender-diff form, keyed on the male
 * placeholder gender as the collapsed representative — either the male or female
 * individual satisfies it (see isUnitSatisfied below). `forms` is assumed already in dex
 * order (species_id then id ascending, per sqlite-storage.ts's listFormsStmt), which is
 * what keeps the result — and everything downstream that walks it in order — in dex order
 * too. A fresh implementation rather than refactoring computeCompletionStats to share this
 * loop (Leg 1 flagged that factoring as optional, not required): same shape, smaller diff.
 *
 * `excludePreEvolutions` is never true for `BUILDABLE_TIERS`, so it's not implemented as a
 * real filter yet — that needs the evolution-chain data the separate, unscheduled
 * [Evolution-chain data (Pre-Evos axis)] TODO item will add.
 */
export function requiredUnits(tierConfig: DexTierConfig, color: DexColor, forms: Form[]): RequiredUnit[] {
  const shiny = color === 'shiny'
  const units: RequiredUnit[] = []
  for (const form of forms) {
    if (form.formCategory === 'non_boxable') continue
    if (form.formCategory === 'cosmetic_variant' && !tierConfig.includeCosmeticVariants) continue
    if (shiny && form.shinyLocked) continue
    if (!shiny && form.alwaysShiny) continue
    if (form.hasGenderDifference && tierConfig.splitByGender) {
      units.push({ formId: form.id, gender: 'male', shiny })
      units.push({ formId: form.id, gender: 'female', shiny })
    } else if (form.hasGenderDifference) {
      // Collapsed representative — see this function's own doc comment.
      units.push({ formId: form.id, gender: 'male', shiny })
    } else {
      units.push({ formId: form.id, gender: 'unknown', shiny })
    }
  }
  return units
}

/** One `formId|gender|shiny` key per **owned** entry, from an unscoped (every Storage
 * Location, including unboxed) entry list — ownership is location-independent, so a mon
 * owned anywhere shouldn't get a duplicate ghost stamped into a different location. */
export function buildOwnedUnitIndex(entries: CollectionEntry[]): Set<string> {
  const index = new Set<string>()
  for (const entry of entries) {
    if (entry.owned) index.add(unitKey(entry.formId, entry.gender, entry.shiny))
  }
  return index
}

function isUnitSatisfied(unit: RequiredUnit, tierConfig: DexTierConfig, form: Form | undefined, ownedUnitIndex: Set<string>): boolean {
  if (form?.hasGenderDifference && !tierConfig.splitByGender) {
    // Collapsed representative: either gender's individual satisfies it (Leg 1).
    return ownedUnitIndex.has(unitKey(unit.formId, 'male', unit.shiny)) || ownedUnitIndex.has(unitKey(unit.formId, 'female', unit.shiny))
  }
  return ownedUnitIndex.has(unitKey(unit.formId, unit.gender, unit.shiny))
}

/**
 * The units a Box Template still needs to stamp: `requiredUnits()` minus whatever's
 * already owned (anywhere) or already placeholder'd (anywhere in the target location) —
 * additive-only re-apply, per Vanny's call: re-running the same or a broader tier only ever
 * tops up the gap, never touches an existing placeholder.
 */
export function pendingRequiredUnits(params: {
  tierConfig: DexTierConfig
  color: DexColor
  forms: Form[]
  ownedUnitIndex: Set<string>
  existingPlaceholderKeys: Set<string>
}): RequiredUnit[] {
  const { tierConfig, color, forms, ownedUnitIndex, existingPlaceholderKeys } = params
  const formsById = new Map(forms.map((f) => [f.id, f]))
  return requiredUnits(tierConfig, color, forms).filter((unit) => {
    if (isUnitSatisfied(unit, tierConfig, formsById.get(unit.formId), ownedUnitIndex)) return false
    if (existingPlaceholderKeys.has(unitKey(unit.formId, unit.gender, unit.shiny))) return false
    return true
  })
}

/** One `formId|gender|shiny` key per existing placeholder — for `pendingRequiredUnits`'
 * dedup and the "already placeholder'd" check above. */
export function buildPlaceholderKeys(placeholders: Array<{ formId: number; gender: Gender; shiny: boolean }>): Set<string> {
  return new Set(placeholders.map((p) => unitKey(p.formId, p.gender, p.shiny)))
}

/** How many empty slots a set of boxes actually has left, given which are already occupied
 * (by a real entry or an existing placeholder) — for the caller to decide how many new
 * boxes to create before stamping a template that needs more room than exists yet. */
export function countAvailableSlots(boxCount: number, occupiedSlotCount: number): number {
  return boxCount * BOX_SIZE - occupiedSlotCount
}

/** How many additional boxes to create so `unitCount` units all have somewhere to land,
 * given `availableSlots` empty slots already exist. */
export function extraBoxesNeeded(unitCount: number, availableSlots: number): number {
  return Math.max(0, Math.ceil((unitCount - availableSlots) / BOX_SIZE))
}

export interface TemplatePlacement {
  boxNumber: number
  boxSlot: number
  formId: number
  gender: Gender
  shiny: boolean
}

/**
 * Zips `units` (already in dex order) onto every empty slot across `boxNumbers`, walked in
 * box-number-then-slot order (Vanny's call on placement: fill location-wide in dex order,
 * box 1 slot 0, 1, 2… then box 2…). `boxNumbers` should already include any new boxes the
 * caller created to fit the full `units` list (see countAvailableSlots) — if it doesn't,
 * this simply returns fewer placements than `units.length` rather than erroring, since a
 * template apply is always safe to run again to pick up the rest.
 */
export function placeUnitsIntoSlots(units: RequiredUnit[], boxNumbers: number[], occupiedSlots: Set<string>): TemplatePlacement[] {
  const placements: TemplatePlacement[] = []
  let unitIndex = 0
  for (const boxNumber of boxNumbers) {
    for (let boxSlot = 0; boxSlot < BOX_SIZE; boxSlot++) {
      if (unitIndex >= units.length) return placements
      if (occupiedSlots.has(slotKey(boxNumber, boxSlot))) continue
      const unit = units[unitIndex]
      placements.push({ boxNumber, boxSlot, formId: unit.formId, gender: unit.gender, shiny: unit.shiny })
      unitIndex++
    }
  }
  return placements
}

/**
 * The form/gender a manually-set (right-click -> species picker) placeholder resolves to —
 * species only in the UI (Vanny's call), backed by a concrete form/gender under the hood so
 * it can dedupe against a template-stamped placeholder for the same requirement. Picks the
 * species' first boxable form, falling back to its first form at all if every one is
 * non_boxable — same convention buildBoxes.ts's (pre-Leg-2) pickPlaceholderForm used for
 * sprite purposes only; this is now the one place that pick happens, since the resolved
 * form is stored on the placeholder itself rather than re-guessed at render time. Gender
 * follows the same collapsed-representative convention `requiredUnits` uses: `'male'` for
 * a gender-diff form, `'unknown'` otherwise — never `'unknown'` on a gender-diff form,
 * since collection_entries itself never keys one that way (see BoxPlaceholder's own doc
 * comment).
 */
export function canonicalPlaceholderForm(speciesId: number, forms: Form[]): Form | undefined {
  let firstAny: Form | undefined
  for (const form of forms) {
    if (form.speciesId !== speciesId) continue
    if (!firstAny) firstAny = form
    if (form.formCategory !== 'non_boxable') return form
  }
  return firstAny
}
