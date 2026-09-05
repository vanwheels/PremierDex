import type { CollectionEntry, Form } from '@shared/types/pokemon'

/**
 * One owned entry whose stored gender is the collapsed-representative 'male' key, not
 * necessarily this individual's actual gender — see buildDexSections.ts's collapsed row
 * (the only row shown for a gender-diff form while Split by Gender display is off always
 * writes/reads the 'male' slot) and docs/investigations/dex-completeness-tiers.md's open
 * question for Leg 3. Every owned copy of a gender-diff form recorded this way is
 * ambiguous independently — duplicates are real per-individual rows (Leg 2 of the Box
 * Arrangement milestone dropped collection_entries' UNIQUE(form_id, gender, shiny)), so
 * two owned "male" Venusaur entries could be one of each gender, both male, or both
 * mislabeled female.
 */
export interface AmbiguousGenderEntry {
  entry: CollectionEntry
  form: Form
}

/**
 * Every owned entry a Living Form Dex migration needs the user to confirm before its
 * completion diff can be trusted: an owned, unconfirmed entry on a `hasGenderDifference`
 * form, stored under the collapsed 'male' key. A form's 'female' rows are always seeded
 * as their own entries (seed.ts) and are never themselves ambiguous — only 'male' ever
 * collapses two possible physical individuals into one key.
 *
 * Gated on `!genderConfirmed`, not just `gender === 'male'` — the gender value alone
 * can't distinguish "reviewed, actually Male" from "never reviewed, defaulted Male" (see
 * CollectionEntry.genderConfirmed's own doc comment), so an entry the user has already
 * confirmed as Male stops appearing here even though its stored gender didn't change.
 */
export function findAmbiguousGenderEntries(forms: Form[], entries: CollectionEntry[]): AmbiguousGenderEntry[] {
  const formsById = new Map(forms.map((form) => [form.id, form]))
  const result: AmbiguousGenderEntry[] = []
  for (const entry of entries) {
    if (!entry.owned || entry.gender !== 'male' || entry.genderConfirmed) continue
    const form = formsById.get(entry.formId)
    if (form?.hasGenderDifference) result.push({ entry, form })
  }
  return result
}
