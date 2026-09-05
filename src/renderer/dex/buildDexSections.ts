import type { CollectionEntry, Form, Gender, Species } from '@shared/types/pokemon'
import { formDisplayName, speciesDisplayName } from './formNames'
import type { DexOptions, DexRowData, DexSection } from './types'

/** Exported for completionStats.ts (Leg 17), which buckets by the same regional groups
 * as the grouped-mode dex layout below. */
export const REGIONAL_LABELS: Record<string, string> = {
  alolan: 'Alolan Forms',
  galarian: 'Galarian Forms',
  hisuian: 'Hisuian Forms',
  paldean: 'Paldean Forms'
}
export const REGIONAL_ORDER = ['alolan', 'galarian', 'hisuian', 'paldean']

interface EntrySlot {
  regular: CollectionEntry | null
  shiny: CollectionEntry | null
}
type EntriesByGender = Map<Gender, EntrySlot>

/** Exported for completionStats.ts (Leg 17), which needs the same per-form/per-gender
 * entry lookup but over the raw entry set rather than shaped display rows.
 *
 * One form/gender/shiny slot can now hold more than one CollectionEntry row — duplicate
 * owned individuals are real since Leg 2 dropped the DB's uniqueness constraint, so a
 * slot can see an owned duplicate alongside the unowned seed placeholder (or, once a
 * future leg adds a way to add further duplicates, more than one owned row). This index
 * still only ever surfaces one representative entry per slot — full per-individual
 * enumeration is Box view's job, not List/Hybrid's (see the milestone note in TODO.md) —
 * but it must pick an *owned* entry whenever one exists, never an unowned placeholder
 * merely because it happened to sort last. First-owned-wins keeps that deterministic;
 * further owned duplicates in the same slot are invisible here for the same reason a
 * second duplicate's nickname doesn't get its own List-view cell. */
export function indexEntriesByForm(entries: CollectionEntry[]): Map<number, EntriesByGender> {
  const byForm = new Map<number, EntriesByGender>()
  for (const entry of entries) {
    let byGender = byForm.get(entry.formId)
    if (!byGender) {
      byGender = new Map()
      byForm.set(entry.formId, byGender)
    }
    let slot = byGender.get(entry.gender)
    if (!slot) {
      slot = { regular: null, shiny: null }
      byGender.set(entry.gender, slot)
    }
    if (entry.shiny) {
      if (slot.shiny === null || (!slot.shiny.owned && entry.owned)) slot.shiny = entry
    } else if (slot.regular === null || (!slot.regular.owned && entry.owned)) {
      slot.regular = entry
    }
  }
  return byForm
}

/**
 * Builds the row(s) for one form. Gender-diff forms collapse to a single row (the male
 * entry) unless splitGenderRows is on, in which case they expand to a ♂ row and a ♀ row.
 * Forms without a gender difference always seed only 'unknown'-gender entries.
 */
function buildRows(
  speciesName: string,
  dexNumber: number,
  form: Form,
  entriesByGender: EntriesByGender | undefined,
  splitGenderRows: boolean
): DexRowData[] {
  const baseName = formDisplayName(speciesName, form)

  const rowFor = (gender: Gender, suffix: string): DexRowData => {
    const slot = entriesByGender?.get(gender)
    return {
      key: `${form.id}-${gender}`,
      formId: form.id,
      dexNumber,
      displayName: suffix ? `${baseName} ${suffix}` : baseName,
      regular: slot?.regular ?? null,
      shinyEntry: slot?.shiny ?? null,
      pokeapiId: form.pokeapiId,
      spriteFormSuffix: form.spriteFormSuffix,
      femaleSprite: gender === 'female',
      firstAvailableGeneration: form.firstAvailableGeneration,
      homeBoxable: form.homeBoxable,
      shinyLocked: form.shinyLocked,
      alwaysShiny: form.alwaysShiny,
      regionalGroup: form.regionalGroup,
      hasGenderDifference: form.hasGenderDifference
    }
  }

  if (!form.hasGenderDifference) return [rowFor('unknown', '')]
  if (!splitGenderRows) return [rowFor('male', '')]
  return [rowFor('male', '♂'), rowFor('female', '♀')]
}

/**
 * Shapes species/forms/collection-entries into display sections per the current toggle
 * options. Toggles only affect this view-model — never the stored data. non_boxable
 * forms (Mega/Gmax/battle-only, etc.) are never collectible and are filtered out here.
 */
export function buildDexSections(
  species: Species[],
  forms: Form[],
  entries: CollectionEntry[],
  options: DexOptions
): DexSection[] {
  const entriesByForm = indexEntriesByForm(entries)
  const formsBySpecies = new Map<number, Form[]>()
  for (const form of forms) {
    if (form.formCategory === 'non_boxable') continue
    const list = formsBySpecies.get(form.speciesId)
    if (list) list.push(form)
    else formsBySpecies.set(form.speciesId, [form])
  }

  const sections: DexSection[] = []
  const regionalBuckets = new Map<string, DexRowData[]>()

  for (const sp of species) {
    const speciesName = speciesDisplayName(sp.name)
    const speciesForms = formsBySpecies.get(sp.id) ?? []
    const rows: DexRowData[] = []
    const cosmeticRows: DexRowData[] = []

    for (const form of speciesForms) {
      const entriesByGender = entriesByForm.get(form.id)
      const rowsForForm = buildRows(speciesName, sp.id, form, entriesByGender, options.splitGenderRows)

      if (form.formCategory === 'cosmetic_variant') {
        cosmeticRows.push(...rowsForForm)
        continue
      }

      // dex_distinct
      if (form.regionalGroup !== null && options.regionalMode === 'grouped') {
        const bucket = regionalBuckets.get(form.regionalGroup) ?? []
        bucket.push(...rowsForForm)
        regionalBuckets.set(form.regionalGroup, bucket)
      } else {
        rows.push(...rowsForForm)
      }
    }

    sections.push({
      key: `species-${sp.id}`,
      heading: speciesName,
      speciesId: sp.id,
      rows,
      cosmeticRows,
      collapsedDisplayFormId: sp.collapsedDisplayFormId
    })
  }

  if (options.regionalMode === 'grouped') {
    for (const group of REGIONAL_ORDER) {
      const rows = regionalBuckets.get(group)
      if (!rows || rows.length === 0) continue
      sections.push({
        key: `regional-${group}`,
        heading: REGIONAL_LABELS[group] ?? group,
        speciesId: null,
        rows,
        cosmeticRows: [],
        collapsedDisplayFormId: null
      })
    }
  }

  return sections
}

/**
 * Picks which row represents a foldable species (one with cosmetic variants — Unown,
 * Maushold, etc.) when its section is collapsed. `overrideFormId` (Leg 27's user-facing
 * pick, from Species.collapsedDisplayFormId) wins outright when it names one of this
 * section's candidates — sticking regardless of that row's owned/shiny state. Otherwise
 * falls back to Leg 9's auto-pick: the first candidate, checking `rows[0]` then
 * `cosmeticRows` in list order, that has an owned regular or shiny entry — or `rows[0]`
 * itself if none are checked off. Only meaningful when the species actually has cosmetic
 * rows; DexTable is the only caller, and only for the row slot carrying the expand toggle
 * (rows[0]) — any further dex_distinct rows in the section (e.g. Floette's Eternal
 * Flower) render as-is regardless of collapse state.
 */
export function pickCollapsedRow(
  rows: DexRowData[],
  cosmeticRows: DexRowData[],
  overrideFormId?: number | null
): DexRowData {
  const candidates = [rows[0], ...cosmeticRows]
  if (overrideFormId != null) {
    const picked = candidates.find((row) => row.formId === overrideFormId)
    if (picked) return picked
  }
  return candidates.find((row) => row.regular?.owned || row.shinyEntry?.owned) ?? rows[0]
}
