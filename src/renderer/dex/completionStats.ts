import type { CollectionEntry, Form } from '@shared/types/pokemon'
import { indexEntriesByForm, REGIONAL_LABELS, REGIONAL_ORDER } from './buildDexSections'

/** How many of `total` collectible units are owned. Percent is left for the caller to
 * compute (DexTable-style components already do their own formatting) — `total: 0`
 * means "no such units exist" rather than "0%", so callers should render that as a dash
 * rather than dividing. */
export interface CompletionCount {
  owned: number
  total: number
}

export interface CompletionBucket {
  key: string
  label: string
  regular: CompletionCount
  shiny: CompletionCount
}

export interface CompletionStats {
  overall: CompletionBucket
  byGeneration: CompletionBucket[]
  byRegionalGroup: CompletionBucket[]
}

/**
 * The three independent axes Vanny's proposed completion tiers (Base Dex / Base Form Dex
 * / Complete Gender Dex / Complete Dex) fall out of as combinations, rather than as
 * separate named computations (Leg 19). All three default off, matching the two existing
 * precedents for these exact axes elsewhere in the dex UI: DexOptions.splitGenderRows
 * (gender variants collapse to one row until split on) and DexSection.cosmeticRows
 * (cosmetic variants stay collapsed/hidden until expanded).
 */
export interface CompletionStatsOptions {
  /** Count cosmetic_variant forms (Vivillon patterns, Unown letters, etc.), not just
   * dex_distinct ones. */
  includeCosmeticVariants: boolean
  /** Count a gender-diff form's male and female entries as two separate collectible
   * units. Off: the form counts as one unit, owned if either gender's entry is owned. */
  splitByGender: boolean
  /** Also fold regional-group forms (Alolan/Galarian/Hisuian/Paldean) into their
   * by-generation bucket, on top of always appearing in their own Regional section. Off
   * by default — on reproduces the pre-Leg-19 double count (regional forms landing in
   * both their generation bucket and byRegionalGroup). */
  foldRegionalIntoGeneration: boolean
}

export const DEFAULT_COMPLETION_STATS_OPTIONS: CompletionStatsOptions = {
  includeCosmeticVariants: false,
  splitByGender: false,
  foldRegionalIntoGeneration: false
}

/**
 * Narrows entries to one Storage Location's worth (Leg 7), for scoping
 * computeCompletionStats to a single tab of Leg 8's per-location table. `null` selects the
 * Unassigned bucket (entries never assigned a location) rather than "no filter" — a caller
 * wanting unscoped totals should skip filtering and pass the full entries array to
 * computeCompletionStats, same as before this existed. Total counts are unaffected by this
 * filter either way: they come from `forms`, not `entries` (see computeCompletionStats),
 * since which forms are collectible doesn't depend on which box you're looking at — only
 * which of them are owned does.
 */
export function filterEntriesByStorageLocation(
  entries: CollectionEntry[],
  storageLocationId: number | null
): CollectionEntry[] {
  return entries.filter((entry) => entry.storageLocationId === storageLocationId)
}

function emptyBucket(key: string, label: string): CompletionBucket {
  return { key, label, regular: { owned: 0, total: 0 }, shiny: { owned: 0, total: 0 } }
}

/**
 * Folds one collectible unit (a form/gender pair) into a bucket's regular and shiny
 * counts. A form's alwaysShiny/shinyLocked flags exclude it from the regular/shiny
 * denominator respectively — a unit that can never legitimately exist in that color
 * shouldn't cap completion below 100%, same reasoning as `homeBoxable`/`shinyLocked`
 * already get their own filter dimension rather than being silently included.
 */
function addUnit(bucket: CompletionBucket, form: Form, ownedRegular: boolean, ownedShiny: boolean): void {
  if (!form.alwaysShiny) {
    bucket.regular.total += 1
    if (ownedRegular) bucket.regular.owned += 1
  }
  if (!form.shinyLocked) {
    bucket.shiny.total += 1
    if (ownedShiny) bucket.shiny.owned += 1
  }
}

/**
 * Owned%/shiny% completion, broken down by generation and by regional group (Leg 17),
 * configurable via `options` (Leg 19 — see CompletionStatsOptions). Counts collectible
 * units directly against CollectionEntry, deliberately independent of buildDexSections'
 * row shaping — its splitGenderRows option is purely a display toggle, unrelated to
 * whether *completion* counts genders separately. Also independent of the active
 * search/filter/sort (Legs 15-16) — a stats dashboard should reflect the whole
 * collection, not the currently-visible slice.
 *
 * Species-only for now, per Vanny's 2026-09-02 scoping call on the TODO item: no
 * dex-tier (regular vs. complete living dex) breakdown until that concept exists in the
 * schema — see TODO.md's [Dex completeness tier migration].
 */
export function computeCompletionStats(
  forms: Form[],
  entries: CollectionEntry[],
  options: CompletionStatsOptions = DEFAULT_COMPLETION_STATS_OPTIONS
): CompletionStats {
  const entriesByForm = indexEntriesByForm(entries)
  const overall = emptyBucket('overall', 'Overall')
  const byGeneration = new Map<number, CompletionBucket>()
  const byRegionalGroup = new Map<string, CompletionBucket>()

  for (const form of forms) {
    if (form.formCategory === 'non_boxable') continue
    if (form.formCategory === 'cosmetic_variant' && !options.includeCosmeticVariants) continue
    const entriesByGender = entriesByForm.get(form.id)

    let regionalBucket: CompletionBucket | undefined
    if (form.regionalGroup !== null) {
      regionalBucket = byRegionalGroup.get(form.regionalGroup)
      if (!regionalBucket) {
        regionalBucket = emptyBucket(form.regionalGroup, REGIONAL_LABELS[form.regionalGroup] ?? form.regionalGroup)
        byRegionalGroup.set(form.regionalGroup, regionalBucket)
      }
    }
    const includeInGeneration = form.regionalGroup === null || options.foldRegionalIntoGeneration
    let genBucket: CompletionBucket | undefined
    if (includeInGeneration) {
      genBucket = byGeneration.get(form.firstAvailableGeneration)
      if (!genBucket) {
        genBucket = emptyBucket(String(form.firstAvailableGeneration), `Gen ${form.firstAvailableGeneration}`)
        byGeneration.set(form.firstAvailableGeneration, genBucket)
      }
    }

    const addForGender = (ownedRegular: boolean, ownedShiny: boolean): void => {
      addUnit(overall, form, ownedRegular, ownedShiny)
      if (genBucket) addUnit(genBucket, form, ownedRegular, ownedShiny)
      if (regionalBucket) addUnit(regionalBucket, form, ownedRegular, ownedShiny)
    }

    if (form.hasGenderDifference && options.splitByGender) {
      for (const gender of ['male', 'female'] as const) {
        const slot = entriesByGender?.get(gender)
        addForGender(slot?.regular?.owned ?? false, slot?.shiny?.owned ?? false)
      }
    } else if (form.hasGenderDifference) {
      // Not splitting: one unit for the form, owned if either gender's entry is owned.
      const maleSlot = entriesByGender?.get('male')
      const femaleSlot = entriesByGender?.get('female')
      addForGender(
        (maleSlot?.regular?.owned ?? false) || (femaleSlot?.regular?.owned ?? false),
        (maleSlot?.shiny?.owned ?? false) || (femaleSlot?.shiny?.owned ?? false)
      )
    } else {
      const slot = entriesByGender?.get('unknown')
      addForGender(slot?.regular?.owned ?? false, slot?.shiny?.owned ?? false)
    }
  }

  return {
    overall,
    byGeneration: [...byGeneration.values()].sort((a, b) => Number(a.key) - Number(b.key)),
    byRegionalGroup: REGIONAL_ORDER.map((group) => byRegionalGroup.get(group)).filter(
      (bucket): bucket is CompletionBucket => bucket !== undefined
    )
  }
}
