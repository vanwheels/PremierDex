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
 * Owned%/shiny% completion, broken down by generation and by regional group (Leg 17).
 * Counts every non-non_boxable form's collectible units directly against
 * CollectionEntry, deliberately independent of buildDexSections' row shaping: its
 * splitGenderRows option hides the female entry of a gender-diff form entirely when
 * off, but completion needs both genders counted regardless of that display toggle. Also
 * independent of the active search/filter/sort (Legs 15-16) — a stats dashboard should
 * reflect the whole collection, not the currently-visible slice.
 *
 * Species-only for now, per Vanny's 2026-09-02 scoping call on the TODO item: no
 * dex-tier (regular vs. complete living dex) breakdown until that concept exists in the
 * schema — see TODO.md's [Dex completeness tier migration].
 */
export function computeCompletionStats(forms: Form[], entries: CollectionEntry[]): CompletionStats {
  const entriesByForm = indexEntriesByForm(entries)
  const overall = emptyBucket('overall', 'Overall')
  const byGeneration = new Map<number, CompletionBucket>()
  const byRegionalGroup = new Map<string, CompletionBucket>()

  for (const form of forms) {
    if (form.formCategory === 'non_boxable') continue
    const entriesByGender = entriesByForm.get(form.id)
    const genders = form.hasGenderDifference ? (['male', 'female'] as const) : (['unknown'] as const)

    let genBucket = byGeneration.get(form.firstAvailableGeneration)
    if (!genBucket) {
      genBucket = emptyBucket(String(form.firstAvailableGeneration), `Gen ${form.firstAvailableGeneration}`)
      byGeneration.set(form.firstAvailableGeneration, genBucket)
    }

    let regionalBucket: CompletionBucket | undefined
    if (form.regionalGroup !== null) {
      regionalBucket = byRegionalGroup.get(form.regionalGroup)
      if (!regionalBucket) {
        regionalBucket = emptyBucket(form.regionalGroup, REGIONAL_LABELS[form.regionalGroup] ?? form.regionalGroup)
        byRegionalGroup.set(form.regionalGroup, regionalBucket)
      }
    }

    for (const gender of genders) {
      const slot = entriesByGender?.get(gender)
      const ownedRegular = slot?.regular?.owned ?? false
      const ownedShiny = slot?.shiny?.owned ?? false
      addUnit(overall, form, ownedRegular, ownedShiny)
      addUnit(genBucket, form, ownedRegular, ownedShiny)
      if (regionalBucket) addUnit(regionalBucket, form, ownedRegular, ownedShiny)
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
