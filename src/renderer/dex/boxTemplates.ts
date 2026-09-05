import type { CollectionEntry, Form, Gender } from '@shared/types/pokemon'
import type { BoxPlaceholder } from '@shared/types/box'
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
 * real filter yet — the data it needs now exists (`Species.isFinalEvolutionStage`, Leg 5),
 * but wiring it into this filter is its own follow-up leg (see TODO.md).
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

/** One `formId|gender|shiny` key per real entry that already physically occupies a box
 * slot **in the target location** — `entries` must already be scoped to that location
 * (same convention as DexBoxGrid's own `entries` prop), unlike the global, ownership-wide
 * index this replaced (see this file's Leg 6 correction below). Deliberately not filtered
 * on `entry.owned`: an unowned "planned" entry occupying a slot (see CollectionEntry's own
 * boxNumber doc comment) still counts as physically occupying that slot. */
export function buildOccupiedUnitIndex(entries: CollectionEntry[]): Set<string> {
  const index = new Set<string>()
  for (const entry of entries) {
    if (entry.boxNumber !== null) index.add(unitKey(entry.formId, entry.gender, entry.shiny))
  }
  return index
}

function isUnitSatisfied(unit: RequiredUnit, tierConfig: DexTierConfig, form: Form | undefined, occupiedUnitIndex: Set<string>): boolean {
  if (form?.hasGenderDifference && !tierConfig.splitByGender) {
    // Collapsed representative: either gender's individual satisfies it (Leg 1).
    return (
      occupiedUnitIndex.has(unitKey(unit.formId, 'male', unit.shiny)) || occupiedUnitIndex.has(unitKey(unit.formId, 'female', unit.shiny))
    )
  }
  return occupiedUnitIndex.has(unitKey(unit.formId, unit.gender, unit.shiny))
}

/**
 * The units a Box Template still needs to stamp in the target location:
 * `requiredUnits()` minus whatever already occupies a slot there — a real entry
 * (`occupiedUnitIndex`) or an existing placeholder (`existingPlaceholderKeys`). Total-based
 * as of Leg 6 of the Dex completeness tier migration, correcting Leg 2's original
 * ownership-based concept (docs/investigations/dex-completeness-tiers.md's "Correction"
 * section): a template stamps the tier's *full* required set every time regardless of
 * whether a unit is owned elsewhere in the collection, only skipping what this location
 * already accounts for. Still additive-only re-apply within that location: re-running the
 * same or a broader tier only ever tops up the gap, never touches an existing placeholder.
 */
export function pendingRequiredUnits(params: {
  tierConfig: DexTierConfig
  color: DexColor
  forms: Form[]
  occupiedUnitIndex: Set<string>
  existingPlaceholderKeys: Set<string>
}): RequiredUnit[] {
  const { tierConfig, color, forms, occupiedUnitIndex, existingPlaceholderKeys } = params
  const formsById = new Map(forms.map((f) => [f.id, f]))
  return requiredUnits(tierConfig, color, forms).filter((unit) => {
    if (isUnitSatisfied(unit, tierConfig, formsById.get(unit.formId), occupiedUnitIndex)) return false
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

export interface FillInPlacement {
  entryId: number
  boxNumber: number
  boxSlot: number
}

/**
 * "Fill In" (Leg 7 of the Dex completeness tier migration) — for each placeholder in
 * `placeholders` (already scoped to the target location, walked in their existing
 * box-number-then-slot order, same convention `placeUnitsIntoSlots` places into), finds an
 * owned individual somewhere in the collection that satisfies it and hasn't already been
 * consumed by an earlier placeholder in this same walk. `entries` is deliberately
 * collection-wide, not location-scoped (unlike this file's other functions) — a matching
 * owned individual can be sitting unboxed in any location's tray, or in Unassigned.
 *
 * Per Vanny's scoping: only an unboxed individual (`boxNumber === null`, wherever it
 * currently lives) is a candidate — one already occupying a slot in some other box is left
 * alone, so a placeholder with only already-boxed matches stays a ghost. When several
 * unboxed individuals match the same unit, one is picked as follows and the rest are left
 * untouched, same "one representative individual, others untouched" precedent as List
 * view's bulk actions:
 *
 * 1. An unboxed candidate already sitting in the placeholder's OWN location wins first,
 *    regardless of id. Added after a bug report: "Duplicate Storage Location" clones every
 *    entry as a fresh (higher-id) row landing unboxed in the new location (see
 *    duplicateStorageLocationTx), so a plain lowest-id-wins rule would reach straight past
 *    that brand-new local clone and raid the *original* location's own individual instead —
 *    stranding the local clone unboxed (looking like "it's in both the box and Unboxed" once
 *    the raided original lands in this location's box) and draining a copy out of the
 *    original for no reason the user asked for.
 * 2. Only once the placeholder's own location has no unboxed match at all does this fall
 *    back to the lowest `id` (insertion order) collection-wide — the original "somewhere in
 *    the collection" behavior, for the case where the user owns a matching individual but
 *    hasn't gotten around to moving it into this location yet.
 *
 * Gender: a placeholder's `gender` follows the same collapsed-representative convention
 * `requiredUnits`/`isUnitSatisfied` use — `'male'` on a gender-diff form means "either
 * gender satisfies it" (the common case: every tier except `livingForm`, plus every
 * manually-set placeholder, collapses this way), so both the male and female candidate
 * pools are checked together under the same two-tier rule above. `'female'` only ever
 * comes from a real split-by-gender tier and is matched strictly.
 */
export function computeFillInPlacements(params: {
  placeholders: BoxPlaceholder[]
  entries: CollectionEntry[]
  forms: Form[]
}): FillInPlacement[] {
  const { placeholders, entries, forms } = params
  const formsById = new Map(forms.map((f) => [f.id, f]))

  const pools = new Map<string, CollectionEntry[]>()
  for (const entry of entries) {
    if (!entry.owned || entry.boxNumber !== null) continue
    const key = unitKey(entry.formId, entry.gender, entry.shiny)
    const pool = pools.get(key)
    if (pool) pool.push(entry)
    else pools.set(key, [entry])
  }
  for (const pool of pools.values()) pool.sort((a, b) => a.id - b.id)

  function removeFromPool(key: string, entryId: number): void {
    const pool = pools.get(key)
    if (!pool) return
    const index = pool.findIndex((e) => e.id === entryId)
    if (index !== -1) pool.splice(index, 1)
  }

  const placements: FillInPlacement[] = []
  for (const placeholder of placeholders) {
    const form = formsById.get(placeholder.formId)
    const keys = [unitKey(placeholder.formId, placeholder.gender, placeholder.shiny)]
    if (form?.hasGenderDifference && placeholder.gender === 'male') {
      keys.push(unitKey(placeholder.formId, 'female', placeholder.shiny))
    }

    // Tier 1: lowest-id candidate already local to this placeholder's own location, across
    // whichever of `keys` has one. Each pool is sorted ascending by id, so `.find`'s first
    // hit is that pool's own lowest-id local candidate.
    let best: { key: string; entry: CollectionEntry } | undefined
    for (const key of keys) {
      const local = pools.get(key)?.find((e) => e.storageLocationId === placeholder.storageLocationId)
      if (local && (!best || local.id < best.entry.id)) best = { key, entry: local }
    }
    // Tier 2: no local match anywhere among `keys` — fall back to lowest id collection-wide.
    if (!best) {
      for (const key of keys) {
        const candidate = pools.get(key)?.[0]
        if (candidate && (!best || candidate.id < best.entry.id)) best = { key, entry: candidate }
      }
    }
    if (!best) continue

    removeFromPool(best.key, best.entry.id)
    placements.push({ entryId: best.entry.id, boxNumber: placeholder.boxNumber, boxSlot: placeholder.boxSlot })
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
