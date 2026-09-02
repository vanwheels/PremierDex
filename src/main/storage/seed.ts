import type Database from 'better-sqlite3'
import { loadFormsData, loadSpeciesData } from './load-species-data'

/**
 * Leg 7 cleanup: forms.json used to include rows for varieties that shouldn't occupy a
 * dex slot at all — Totem Pokemon (in-game boss encounters, not catchable), Let's Go
 * Pikachu/Eevee's `starter` form, and Koraidon/Miraidon's ride-mode varieties (an
 * in-game S/V traversal feature, not a persistent form). See
 * docs/investigations/home-depositability-audit.md section 1 and
 * scripts/fetch-pokemon-forms.ts's `isExcludedVariety`, which now skips generating these
 * rows going forward. seed.ts itself is INSERT-only and never deletes, so a local db
 * seeded before this leg would otherwise keep these rows (and their collection_entries)
 * forever. Listed as explicit (species_id, form_name) pairs rather than diffed against
 * forms.json's current contents, so a bad or partial forms.json fetch can never delete a
 * player's real collection data.
 */
const PRUNED_FORM_KEYS: ReadonlyArray<readonly [number, string]> = [
  [20, 'totem-alola'],
  [25, 'starter'],
  [105, 'totem'],
  [133, 'starter'],
  [735, 'totem'],
  [738, 'totem'],
  [743, 'totem'],
  [752, 'totem'],
  [754, 'totem'],
  [758, 'totem'],
  [777, 'totem'],
  [778, 'totem-disguised'],
  [778, 'totem-busted'],
  [784, 'totem'],
  [1007, 'limited-build'],
  [1007, 'sprinting-build'],
  [1007, 'swimming-build'],
  [1007, 'gliding-build'],
  [1008, 'low-power-mode'],
  [1008, 'drive-mode'],
  [1008, 'aquatic-mode'],
  [1008, 'glide-mode']
]

function prunePreLeg7ExcludedForms(db: Database.Database): void {
  const findFormId = db.prepare('SELECT id FROM forms WHERE species_id = ? AND form_name = ?')
  const deleteEntries = db.prepare('DELETE FROM collection_entries WHERE form_id = ?')
  const deleteForm = db.prepare('DELETE FROM forms WHERE id = ?')

  for (const [speciesId, formName] of PRUNED_FORM_KEYS) {
    const row = findFormId.get(speciesId, formName) as { id: number } | undefined
    if (!row) continue
    deleteEntries.run(row.id)
    deleteForm.run(row.id)
  }
}

/**
 * Seeds reference data (species/forms/collection-entry rows) on every startup.
 * Entirely INSERT OR IGNORE keyed on schema.ts's unique constraints, so this is always
 * safe to re-run: it only ever adds rows that don't exist yet and never touches a
 * player's existing owned/shiny state.
 *
 * Forms come from `data/pokemon/forms.json` (see `scripts/fetch-pokemon-forms.ts` and
 * `docs/investigations/form-categorization.md` for how form_category/regional_group/
 * has_gender_difference/first_available_generation are derived,
 * `docs/investigations/home-depositability-audit.md` for home_boxable, and
 * `docs/investigations/shiny-locked-audit.md` for shiny_locked; always_shiny is the
 * opposite-axis fact, hand-maintained the same way — see fetch-pokemon-forms.ts's
 * ALWAYS_SHINY set) — real per-form data, not the single 'base' placeholder Leg 1 seeded.
 */
export function runSeed(db: Database.Database): void {
  const insertSpecies = db.prepare(
    'INSERT OR IGNORE INTO species (id, name, generation) VALUES (@id, @name, @generation)'
  )
  const insertForm = db.prepare(`
    INSERT OR IGNORE INTO forms
      (species_id, form_name, form_category, home_boxable, shiny_locked, always_shiny, has_gender_difference, first_available_generation, regional_group, pokeapi_id, sprite_form_suffix)
    VALUES
      (@speciesId, @formName, @formCategory, @homeBoxable, @shinyLocked, @alwaysShiny, @hasGenderDifference, @firstAvailableGeneration, @regionalGroup, @pokeapiId, @spriteFormSuffix)
  `)
  // Leg-4 backfill: INSERT OR IGNORE above skips rows that already existed pre-Leg-4
  // (unique on species_id+form_name), so their pokeapi_id would otherwise stay NULL
  // forever. Runs every startup; a no-op once every row has been backfilled once.
  const backfillPokeapiId = db.prepare(`
    UPDATE forms SET pokeapi_id = @pokeapiId
    WHERE species_id = @speciesId AND form_name = @formName AND pokeapi_id IS NULL
  `)
  // Leg-8 backfill: home_boxable used to be hardcoded to 1 on every insert (see git
  // history), so any row inserted before this leg has the wrong value for the forms
  // corrected in forms.json's OVERRIDES (Dialga/Palkia/Giratina Origin, Necrozma Dawn/
  // Dusk, Calyrex Ice/Shadow Rider, Ogerpon's masks, Minior's core colors — see
  // docs/investigations/home-depositability-audit.md section 2). Unlike pokeapi_id this
  // isn't nullable, so re-sync unconditionally rather than gating on IS NULL; cheap and
  // idempotent, and never touches collection_entries.
  const backfillHomeBoxable = db.prepare(`
    UPDATE forms SET home_boxable = @homeBoxable
    WHERE species_id = @speciesId AND form_name = @formName AND home_boxable != @homeBoxable
  `)
  // Same pattern as backfillHomeBoxable above: shiny_locked is a hand-maintained
  // OVERRIDES-style fact (see fetch-pokemon-forms.ts's SHINY_LOCKED set and
  // docs/investigations/shiny-locked-audit.md), not derivable from any PokeAPI signal,
  // so a row inserted before this leg (or before a species gets added/removed from
  // SHINY_LOCKED) would otherwise keep a stale value forever. Not nullable, so re-sync
  // unconditionally rather than gating on IS NULL; never touches collection_entries.
  const backfillShinyLocked = db.prepare(`
    UPDATE forms SET shiny_locked = @shinyLocked
    WHERE species_id = @speciesId AND form_name = @formName AND shiny_locked != @shinyLocked
  `)
  // Same pattern again: always_shiny (Leg 6) is the opposite-axis fact from
  // shiny_locked — hand-maintained, not derivable from PokeAPI — so a row inserted
  // before this leg needs the same re-sync-unconditionally backfill.
  const backfillAlwaysShiny = db.prepare(`
    UPDATE forms SET always_shiny = @alwaysShiny
    WHERE species_id = @speciesId AND form_name = @formName AND always_shiny != @alwaysShiny
  `)
  const selectFormId = db.prepare('SELECT id FROM forms WHERE species_id = ? AND form_name = ?')
  const insertEntry = db.prepare(
    'INSERT OR IGNORE INTO collection_entries (form_id, gender, shiny, owned) VALUES (@formId, @gender, @shiny, 0)'
  )

  const seedAll = db.transaction(() => {
    prunePreLeg7ExcludedForms(db)

    for (const species of loadSpeciesData()) {
      insertSpecies.run(species)
    }

    for (const form of loadFormsData()) {
      insertForm.run({
        speciesId: form.speciesId,
        formName: form.formName,
        formCategory: form.formCategory,
        homeBoxable: form.homeBoxable ? 1 : 0,
        shinyLocked: form.shinyLocked ? 1 : 0,
        alwaysShiny: form.alwaysShiny ? 1 : 0,
        hasGenderDifference: form.hasGenderDifference ? 1 : 0,
        firstAvailableGeneration: form.firstAvailableGeneration,
        regionalGroup: form.regionalGroup,
        pokeapiId: form.pokeapiId,
        spriteFormSuffix: form.spriteFormSuffix
      })
      // No backfill needed for sprite_form_suffix (unlike pokeapi_id/home_boxable
      // above): every row this leg gives a non-null value is itself a brand-new row
      // (Unown's letters, Vivillon's patterns, etc. — see
      // docs/investigations/home-depositability-audit.md section 3), so INSERT OR
      // IGNORE above always reaches it. Every pre-existing row's correct value is
      // NULL, which the fresh column already defaults to.
      backfillPokeapiId.run({
        speciesId: form.speciesId,
        formName: form.formName,
        pokeapiId: form.pokeapiId
      })
      backfillHomeBoxable.run({
        speciesId: form.speciesId,
        formName: form.formName,
        homeBoxable: form.homeBoxable ? 1 : 0
      })
      backfillShinyLocked.run({
        speciesId: form.speciesId,
        formName: form.formName,
        shinyLocked: form.shinyLocked ? 1 : 0
      })
      backfillAlwaysShiny.run({
        speciesId: form.speciesId,
        formName: form.formName,
        alwaysShiny: form.alwaysShiny ? 1 : 0
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
