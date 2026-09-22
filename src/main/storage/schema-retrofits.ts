import type Database from 'better-sqlite3'
import { LANGUAGE_LIST_SQL, POKE_BALL_LIST_SQL, SIZE_CLASS_LIST_SQL } from './schema-constants'

// Plain `ALTER TABLE ADD COLUMN` retrofits for columns that postdate an existing install's
// tables. Each is safe as a bare ADD COLUMN (self-referential CHECKs only, nothing that
// needs another column's data to already exist) — contrast schema-rebuilds.ts, which holds
// the CHECK-widen/table-rebuild cases SQLite can't express as a plain ALTER. Split out of
// schema.ts (Leg 2 of the Codebase File-Size Cleanup milestone) along that same boundary.

// Same retrofit story for species: collapsed_display_form_id postdates every existing
// install's species table.
export function retrofitSpeciesColumns(db: Database.Database): void {
  const speciesColumns = db.prepare('PRAGMA table_info(species)').all() as Array<{ name: string }>
  if (!speciesColumns.some((c) => c.name === 'collapsed_display_form_id')) {
    db.exec('ALTER TABLE species ADD COLUMN collapsed_display_form_id INTEGER REFERENCES forms(id)')
  }
  // is_final_evolution_stage (Leg 5 of the Dex completeness tier migration) postdates
  // every existing install's species table, same retrofit story as
  // collapsed_display_form_id above. The CHECK-free NOT NULL DEFAULT 1 is safe to add via
  // a plain ALTER TABLE (self-referential, nothing to rebuild); runSeed's unconditional
  // backfill is what corrects every row to its real value right after.
  if (!speciesColumns.some((c) => c.name === 'is_final_evolution_stage')) {
    db.exec('ALTER TABLE species ADD COLUMN is_final_evolution_stage INTEGER NOT NULL DEFAULT 1')
  }
  // evolves_from_species_id (Leg 1 of the Evolution-Chain Reachability milestone) postdates
  // every existing install's species table, same retrofit story as the two columns above —
  // nullable and self-referential, so a plain ALTER TABLE is safe with nothing to rebuild;
  // runSeed's unconditional backfill fills in every row's real value right after.
  if (!speciesColumns.some((c) => c.name === 'evolves_from_species_id')) {
    db.exec('ALTER TABLE species ADD COLUMN evolves_from_species_id INTEGER REFERENCES species(id)')
  }
}

// CREATE TABLE IF NOT EXISTS above doesn't retrofit new columns onto a forms table
// that already existed pre-Leg-4. SQLite has no ADD COLUMN IF NOT EXISTS, so check first.
export function retrofitFormsColumns(db: Database.Database): void {
  const formColumns = db.prepare('PRAGMA table_info(forms)').all() as Array<{ name: string }>
  if (!formColumns.some((c) => c.name === 'pokeapi_id')) {
    db.exec('ALTER TABLE forms ADD COLUMN pokeapi_id INTEGER')
  }
  if (!formColumns.some((c) => c.name === 'sprite_form_suffix')) {
    db.exec('ALTER TABLE forms ADD COLUMN sprite_form_suffix TEXT')
  }
  if (!formColumns.some((c) => c.name === 'shiny_locked')) {
    db.exec('ALTER TABLE forms ADD COLUMN shiny_locked INTEGER NOT NULL DEFAULT 0')
  }
  if (!formColumns.some((c) => c.name === 'always_shiny')) {
    db.exec('ALTER TABLE forms ADD COLUMN always_shiny INTEGER NOT NULL DEFAULT 0')
  }
}

// Same retrofit story for collection_entries: origin/nickname (Leg 4) postdate this
// table's original CREATE. trainer_profile_id is a live link (Leg 31 — reverses Leg 4's
// original "provenance only, never auto-update" design, see COMPLETED.md): while set,
// origin_game/ot_name/tid/sid/language mirror that trainer_profiles row and are
// rewritten whenever it's saved (see sqlite-storage.ts's updateTrainerProfile). nickname
// and caught_ball are per-entry and never touched by that sync. No ON DELETE clause:
// SQLite's default FK action is NO ACTION, which would block deleting a
// still-referenced profile, so orphaning trainer_profile_id to NULL on profile delete
// (freezing the columns at their last-synced values) is handled explicitly in
// sqlite-storage.ts's deleteTrainerProfile instead of here.
export function retrofitCollectionEntriesOriginColumns(db: Database.Database): void {
  const entryColumns = db.prepare('PRAGMA table_info(collection_entries)').all() as Array<{ name: string }>
  if (!entryColumns.some((c) => c.name === 'trainer_profile_id')) {
    db.exec('ALTER TABLE collection_entries ADD COLUMN trainer_profile_id INTEGER REFERENCES trainer_profiles(id)')
  }
  if (!entryColumns.some((c) => c.name === 'origin_game')) {
    db.exec('ALTER TABLE collection_entries ADD COLUMN origin_game TEXT')
  }
  if (!entryColumns.some((c) => c.name === 'ot_name')) {
    db.exec('ALTER TABLE collection_entries ADD COLUMN ot_name TEXT')
  }
  if (!entryColumns.some((c) => c.name === 'tid')) {
    db.exec('ALTER TABLE collection_entries ADD COLUMN tid INTEGER CHECK (tid IS NULL OR tid BETWEEN 0 AND 999999)')
  }
  if (!entryColumns.some((c) => c.name === 'sid')) {
    db.exec('ALTER TABLE collection_entries ADD COLUMN sid INTEGER CHECK (sid IS NULL OR sid BETWEEN 0 AND 999999)')
  }
  if (!entryColumns.some((c) => c.name === 'nickname')) {
    db.exec('ALTER TABLE collection_entries ADD COLUMN nickname TEXT')
  }
}

// language/caught_ball/storage_location_id/met_location/box_number/box_slot all postdate
// the sid 4294->999999 CHECK-widen rebuilds in schema-rebuilds.ts (rebuildTrainerProfilesSidWiden/
// rebuildCollectionEntriesSidWiden), and MUST run after them: those rebuilds recreate
// trainer_profiles/collection_entries by name from a fixed, hardcoded column list that
// doesn't include any of these columns. Running this retrofit first would make the rebuild's
// INSERT...SELECT silently drop this data on any install still carrying the old sid CHECK.
// schema.ts's applySchema is what actually enforces this ordering; this function is only
// safe to call after both sid-widen rebuilds have run. Re-queries PRAGMA state fresh (rather
// than reusing columns computed before those rebuilds) for the same reason.
export function retrofitColumnsAfterSidWiden(db: Database.Database): void {
  const trainerProfileColumns = db.prepare('PRAGMA table_info(trainer_profiles)').all() as Array<{ name: string }>
  if (!trainerProfileColumns.some((c) => c.name === 'language')) {
    db.exec(
      `ALTER TABLE trainer_profiles ADD COLUMN language TEXT CHECK (language IS NULL OR language IN (${LANGUAGE_LIST_SQL}))`
    )
  }

  const entryColumns = db.prepare('PRAGMA table_info(collection_entries)').all() as Array<{ name: string }>
  if (!entryColumns.some((c) => c.name === 'language')) {
    db.exec(
      `ALTER TABLE collection_entries ADD COLUMN language TEXT CHECK (language IS NULL OR language IN (${LANGUAGE_LIST_SQL}))`
    )
  }

  // caught_ball (Leg 28) retrofit — same "query fresh, run unconditionally at the end"
  // approach as language above.
  if (!entryColumns.some((c) => c.name === 'caught_ball')) {
    db.exec(
      `ALTER TABLE collection_entries ADD COLUMN caught_ball TEXT CHECK (caught_ball IS NULL OR caught_ball IN (${POKE_BALL_LIST_SQL}))`
    )
  }

  // storage_location_id + met_location (Leg 3 of the nav-restructuring milestone) —
  // same retrofit approach as caught_ball above. storage_location_id is a nullable FK
  // onto storage_locations(id), deliberately separate from the trainer_profile_id/
  // origin_game/... origin fields above: current location and original origin are
  // different axes (see storage-location.ts's doc comment), so this is written by its
  // own setEntryStorageLocation setter, never by setEntryOrigin. storage_locations is
  // already created earlier in applySchema, so the forward reference resolves fine.
  // met_location is free text this milestone (a curated per-game location list is
  // deferred — see TODO.md), so it's a plain TEXT column with no CHECK, and lives
  // alongside the other origin fields since it's edited through OriginModal.
  if (!entryColumns.some((c) => c.name === 'storage_location_id')) {
    db.exec('ALTER TABLE collection_entries ADD COLUMN storage_location_id INTEGER REFERENCES storage_locations(id)')
  }
  if (!entryColumns.some((c) => c.name === 'met_location')) {
    db.exec('ALTER TABLE collection_entries ADD COLUMN met_location TEXT')
  }

  // box_number/box_slot (Leg 3 of the Box Arrangement/Real Inventory Data Model
  // milestone) — a box is a numbered sub-unit of a Storage Location (e.g. "HOME Box 3"),
  // per Vanny's call in TODO.md's milestone intro, with real per-entry slot positions
  // rather than a separate planning concept. box_slot is 0-29 (30 cells: a HOME-style
  // 5-row x 6-column grid, decided ahead of Leg 6's Box view UI). Both CHECKs
  // are self-referential (only constrain the new column against itself), so — same as
  // caught_ball/tid/sid above — a plain ALTER TABLE ADD COLUMN can carry them; no rebuild
  // needed. The "box requires a location, box_number/box_slot travel together" invariant
  // is deliberately NOT a CHECK here (would need to reference storage_location_id, which
  // ALTER TABLE ADD COLUMN can't do without a rebuild) — enforced in sqlite-storage.ts's
  // setEntryBoxPosition instead, same app-level-invariant pattern as the FK orphaning
  // elsewhere in this file.
  if (!entryColumns.some((c) => c.name === 'box_number')) {
    db.exec('ALTER TABLE collection_entries ADD COLUMN box_number INTEGER CHECK (box_number IS NULL OR box_number >= 1)')
  }
  if (!entryColumns.some((c) => c.name === 'box_slot')) {
    db.exec(
      'ALTER TABLE collection_entries ADD COLUMN box_slot INTEGER CHECK (box_slot IS NULL OR box_slot BETWEEN 0 AND 29)'
    )
  }
  // One individual per box slot. A plain (non-partial) UNIQUE index is enough: SQLite
  // treats every NULL as distinct for uniqueness purposes, so the many rows with
  // box_number/box_slot NULL (unboxed, or a fresh install where every column just
  // defaulted to NULL) never collide with each other — only two rows that both name the
  // same real (location, box, slot) triple do. Safe to create unconditionally on every
  // startup regardless of existing data for exactly that reason.
  db.exec(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_entries_box_slot ON collection_entries(storage_location_id, box_number, box_slot)'
  )
}

// gender_confirmed/is_alpha/capture_date/size_class all postdate the caught_ball-CHECK and
// drop-UNIQUE rebuilds in schema-rebuilds.ts, so this must run after those — same ordering
// requirement as retrofitColumnsAfterSidWiden above, enforced by call order in
// schema.ts's applySchema, not by anything in this file.
export function retrofitLateCollectionEntryColumns(db: Database.Database): void {
  const entryColumns = db.prepare('PRAGMA table_info(collection_entries)').all() as Array<{ name: string }>

  // gender_confirmed (Resolve Gender Ambiguities bugfix, see TODO.md/COMPLETED.md) —
  // `gender` alone can't distinguish "reviewed, actually Male" from "never reviewed,
  // defaulted Male" on a gender-diff form's collapsed entry (buildDexSections.ts's
  // collapsed row always writes 'male' regardless of the individual's real gender), so
  // findAmbiguousGenderEntries (genderResolution.ts) kept re-flagging every entry the
  // Resolve modal's Save left on Male forever — there was nowhere to persist "yes, this
  // one really is Male." This column is that persisted confirmation, set independently of
  // which gender value ends up stored. Defaults to 0 (unconfirmed) for every existing row,
  // which is correct: a female-gender row is never flagged as ambiguous regardless of this
  // flag (see genderResolution.ts), and a male-gender row that predates this column
  // genuinely hasn't been reviewed yet.
  if (!entryColumns.some((c) => c.name === 'gender_confirmed')) {
    db.exec('ALTER TABLE collection_entries ADD COLUMN gender_confirmed INTEGER NOT NULL DEFAULT 0')
  }

  // is_alpha/capture_date (Leg 2 of the Ribbons/Alpha/Size/Capture-Date Tracking
  // milestone, see docs/investigations/ribbons-alpha-size-capture-date.md) — is_alpha is
  // a plain boolean, same shape as `shiny`; confirmed to apply to both Legends Arceus and
  // Legends Z-A, not Arceus-only, so no per-game CHECK gates it (same trust-the-user-input
  // precedent as caught_ball/language). capture_date is a nullable DATE column with no
  // CHECK (dates aren't a closed set) — Met Date has existed since Gen III with no
  // per-game gating needed, same looseness as met_location above. Both self-referential
  // (nothing to widen later), so a plain ALTER TABLE ADD COLUMN is safe, same as
  // gender_confirmed just above — no rebuild needed.
  if (!entryColumns.some((c) => c.name === 'is_alpha')) {
    db.exec('ALTER TABLE collection_entries ADD COLUMN is_alpha INTEGER NOT NULL DEFAULT 0')
  }
  if (!entryColumns.some((c) => c.name === 'capture_date')) {
    db.exec('ALTER TABLE collection_entries ADD COLUMN capture_date TEXT')
  }

  // size_class (Leg 3 of the Ribbons/Alpha/Size/Capture-Date Tracking milestone, see
  // docs/investigations/ribbons-alpha-size-capture-date.md's Leg 3 update) — a nullable
  // CHECK-constrained TEXT column, same shape as caught_ball/language: self-referential
  // (nothing to widen later against another column), so a plain ALTER TABLE ADD COLUMN is
  // safe, no rebuild needed. Not game-gated at the schema level, same trust-the-user-input
  // precedent as is_alpha/caught_ball above.
  if (!entryColumns.some((c) => c.name === 'size_class')) {
    db.exec(
      `ALTER TABLE collection_entries ADD COLUMN size_class TEXT CHECK (size_class IS NULL OR size_class IN (${SIZE_CLASS_LIST_SQL}))`
    )
  }
}
