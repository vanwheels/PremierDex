import type Database from 'better-sqlite3'
import { loadFormsData, loadSpeciesData } from './load-species-data'

/**
 * Seeds reference data (species/forms/collection-entry rows) on every startup.
 * Entirely INSERT OR IGNORE keyed on schema.ts's unique constraints, so this is always
 * safe to re-run: it only ever adds rows that don't exist yet and never touches a
 * player's existing owned/shiny state.
 *
 * Forms come from `data/pokemon/forms.json` (see `scripts/fetch-pokemon-forms.ts` and
 * `docs/investigations/form-categorization.md` for how form_category/regional_group/
 * has_gender_difference/first_available_generation are derived) — real per-form data,
 * not the single 'base' placeholder Leg 1 seeded.
 */
export function runSeed(db: Database.Database): void {
  const insertSpecies = db.prepare(
    'INSERT OR IGNORE INTO species (id, name, generation) VALUES (@id, @name, @generation)'
  )
  const insertForm = db.prepare(`
    INSERT OR IGNORE INTO forms
      (species_id, form_name, form_category, home_boxable, has_gender_difference, first_available_generation, regional_group, pokeapi_id)
    VALUES
      (@speciesId, @formName, @formCategory, 1, @hasGenderDifference, @firstAvailableGeneration, @regionalGroup, @pokeapiId)
  `)
  // Leg-4 backfill: INSERT OR IGNORE above skips rows that already existed pre-Leg-4
  // (unique on species_id+form_name), so their pokeapi_id would otherwise stay NULL
  // forever. Runs every startup; a no-op once every row has been backfilled once.
  const backfillPokeapiId = db.prepare(`
    UPDATE forms SET pokeapi_id = @pokeapiId
    WHERE species_id = @speciesId AND form_name = @formName AND pokeapi_id IS NULL
  `)
  const selectFormId = db.prepare('SELECT id FROM forms WHERE species_id = ? AND form_name = ?')
  const insertEntry = db.prepare(
    'INSERT OR IGNORE INTO collection_entries (form_id, gender, shiny, owned) VALUES (@formId, @gender, @shiny, 0)'
  )

  const seedAll = db.transaction(() => {
    for (const species of loadSpeciesData()) {
      insertSpecies.run(species)
    }

    for (const form of loadFormsData()) {
      insertForm.run({
        speciesId: form.speciesId,
        formName: form.formName,
        formCategory: form.formCategory,
        hasGenderDifference: form.hasGenderDifference ? 1 : 0,
        firstAvailableGeneration: form.firstAvailableGeneration,
        regionalGroup: form.regionalGroup,
        pokeapiId: form.pokeapiId
      })
      backfillPokeapiId.run({
        speciesId: form.speciesId,
        formName: form.formName,
        pokeapiId: form.pokeapiId
      })

      const row = selectFormId.get(form.speciesId, form.formName) as { id: number }
      const genders = form.hasGenderDifference ? (['male', 'female'] as const) : (['unknown'] as const)
      for (const gender of genders) {
        for (const shiny of [0, 1]) {
          insertEntry.run({ formId: row.id, gender, shiny })
        }
      }
    }
  })

  seedAll()
}
