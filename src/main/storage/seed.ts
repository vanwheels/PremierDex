import type Database from 'better-sqlite3'
import { loadSpeciesData } from './load-species-data'

/**
 * Seeds reference data (species/forms/collection-entry rows) on every startup.
 * Entirely INSERT OR IGNORE keyed on schema.ts's unique constraints, so this is always
 * safe to re-run: it only ever adds rows that don't exist yet and never touches a
 * player's existing owned/shiny state.
 *
 * Forms are seeded as a single PLACEHOLDER 'base' form per species (form_category:
 * 'dex_distinct', has_gender_difference: false) — real per-form categorization
 * (dex_distinct vs cosmetic_variant vs non_boxable, gender differences, regional
 * grouping) is its own follow-up leg (see TODO.md); this just needs the pipeline to
 * run end-to-end.
 */
export function runSeed(db: Database.Database): void {
  const insertSpecies = db.prepare(
    'INSERT OR IGNORE INTO species (id, name, generation) VALUES (@id, @name, @generation)'
  )
  const insertForm = db.prepare(`
    INSERT OR IGNORE INTO forms
      (species_id, form_name, form_category, home_boxable, has_gender_difference, first_available_generation, regional_group)
    VALUES
      (@speciesId, 'base', 'dex_distinct', 1, 0, @generation, NULL)
  `)
  const selectFormId = db.prepare('SELECT id FROM forms WHERE species_id = ? AND form_name = ?')
  const insertEntry = db.prepare(
    'INSERT OR IGNORE INTO collection_entries (form_id, gender, shiny, owned) VALUES (@formId, @gender, @shiny, 0)'
  )

  const seedAll = db.transaction(() => {
    for (const species of loadSpeciesData()) {
      insertSpecies.run(species)
      insertForm.run({ speciesId: species.id, generation: species.generation })

      const form = selectFormId.get(species.id, 'base') as { id: number }
      for (const shiny of [0, 1]) {
        insertEntry.run({ formId: form.id, gender: 'unknown', shiny })
      }
    }
  })

  seedAll()
}
