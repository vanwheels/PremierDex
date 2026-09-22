import type Database from 'better-sqlite3'
import { LANGUAGE_LIST_SQL, POKE_BALL_LIST_SQL, RIBBON_LIST_SQL, MARK_LIST_SQL } from './schema-constants'

// SQLite can't ALTER a CHECK constraint or drop a UNIQUE constraint, so every case below
// detects a stale/legacy shape and rebuilds the table (CREATE new shape, INSERT...SELECT the
// old rows across, DROP the old table, RENAME the new one into place) instead of a plain
// ALTER TABLE — contrast schema-retrofits.ts, which holds the plain ADD COLUMN cases. Split
// out of schema.ts (Leg 2 of the Codebase File-Size Cleanup milestone) along that same
// boundary.
//
// ORDERING HAZARD: rebuildTrainerProfilesSidWiden/rebuildCollectionEntriesSidWiden below
// rebuild their table from a fixed, hardcoded column list that predates language/caught_ball/
// storage_location_id/box_number/box_slot. schema.ts's applySchema MUST call those two
// rebuilds before schema-retrofits.ts's retrofitColumnsAfterSidWiden — reversing that order
// would make the rebuild's INSERT...SELECT silently drop any of those columns' data on an
// install that still carries the old sid CHECK. The other rebuilds here (caught_ball CHECK,
// drop-UNIQUE, box_placeholders, ribbons/marks CHECK) all run after their columns already
// exist, so they carry the full current column list and have no equivalent hazard.

// trainer_profiles briefly shipped with tid/sid as NOT NULL 0-65535 before the
// Bulbapedia-sourced widen (6-digit TID/4-digit SID from Gen VII, both nullable for
// Pokémon GO and pre-Gen-VII's invisible SID — see schema.ts's CREATE TABLE comment).
// SQLite can't ALTER a CHECK constraint, so detect the old NOT NULL tid column and
// rebuild the table. collection_entries/storage_locations hold FK references into
// trainer_profiles, so with foreign_keys=ON (set at the top of applySchema) a bare
// DROP TABLE here performs an implicit DELETE that SQLite checks against those FKs —
// it throws FOREIGN KEY constraint failed the moment any install actually has linked
// rows, despite this block's original assumption that none would. Follow SQLite's
// documented procedure for schema changes on FK-referenced tables: disable
// enforcement and wrap the rebuild in its own transaction.
export function rebuildTrainerProfilesNotNullTid(db: Database.Database): void {
  const trainerProfileColumns = db.prepare('PRAGMA table_info(trainer_profiles)').all() as Array<{
    name: string
    notnull: 0 | 1
  }>
  if (trainerProfileColumns.some((c) => c.name === 'tid' && c.notnull === 1)) {
    db.pragma('foreign_keys = OFF')
    db.exec(`
      BEGIN;
      DROP TABLE trainer_profiles;
      CREATE TABLE trainer_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game TEXT NOT NULL,
        ot_name TEXT NOT NULL,
        tid INTEGER CHECK (tid IS NULL OR tid BETWEEN 0 AND 999999),
        sid INTEGER CHECK (sid IS NULL OR sid BETWEEN 0 AND 999999),
        label TEXT
      );
      COMMIT;
    `)
    db.pragma('foreign_keys = ON')
  }
}

// Widened sid's upper bound again, from 4294 (Gen VII+'s derived cap,
// floor(32-bit ID / 1_000_000)) to 999999: pre-Gen-VII games never display a Secret
// ID in-game, but it exists internally and can run up to 6 digits once read out with
// a tool like PKHex — see schema.ts's CREATE TABLE comment. Unlike the tid NOT NULL
// rebuild above, this table now sees real use (Legs 1-4 shipped the same day), so
// this rebuild copies existing rows across instead of dropping them. Detected via the
// stored CHECK text directly, since PRAGMA table_info doesn't expose CHECK bounds.
//
// Same FK hazard as the tid rebuild above: collection_entries/storage_locations
// reference trainer_profiles(id), so the DROP TABLE below needs foreign_keys=OFF or
// it fails FOREIGN KEY constraint failed against real linked data (confirmed against
// this project's own dev DB — 23 trainer_profiles rows, thousands of collection_entries
// rows referencing them). Wrapped in a transaction so a failure can't leave a
// half-renamed table sitting around; the leading DROP TABLE IF EXISTS makes this
// self-healing if a prior unguarded run already left exactly that (trainer_profiles_new
// created and populated, then the old DROP TABLE threw and aborted before the rename).
export function rebuildTrainerProfilesSidWiden(db: Database.Database): void {
  const trainerProfilesSql = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'trainer_profiles'")
    .get() as { sql: string } | undefined
  if (trainerProfilesSql?.sql.includes('sid BETWEEN 0 AND 4294')) {
    db.pragma('foreign_keys = OFF')
    db.exec('DROP TABLE IF EXISTS trainer_profiles_new')
    db.exec(`
      BEGIN;
      CREATE TABLE trainer_profiles_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game TEXT NOT NULL,
        ot_name TEXT NOT NULL,
        tid INTEGER CHECK (tid IS NULL OR tid BETWEEN 0 AND 999999),
        sid INTEGER CHECK (sid IS NULL OR sid BETWEEN 0 AND 999999),
        label TEXT
      );
      INSERT INTO trainer_profiles_new (id, game, ot_name, tid, sid, label)
        SELECT id, game, ot_name, tid, sid, label FROM trainer_profiles;
      DROP TABLE trainer_profiles;
      ALTER TABLE trainer_profiles_new RENAME TO trainer_profiles;
      COMMIT;
    `)
    db.pragma('foreign_keys = ON')
  }
}

export function rebuildCollectionEntriesSidWiden(db: Database.Database): void {
  const entriesSql = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'collection_entries'")
    .get() as { sql: string } | undefined
  if (entriesSql?.sql.includes('sid BETWEEN 0 AND 4294')) {
    // foreign_keys=OFF required now that collection_entry_ribbons/collection_entry_marks
    // (added Leg 4 of the Ribbons/Alpha/Size/Capture-Date Tracking milestone) target
    // collection_entries(id) — same DROP-TABLE-triggers-an-implicit-FK-checked-DELETE hazard
    // the trainer_profiles rebuilds above already guard against. In practice this whole
    // block is dead for any DB that's already run through this app's real upgrade path, but
    // it can't assume that.
    db.pragma('foreign_keys = OFF')
    db.exec(`
      CREATE TABLE collection_entries_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_id INTEGER NOT NULL REFERENCES forms(id),
        gender TEXT NOT NULL DEFAULT 'unknown' CHECK (gender IN ('male', 'female', 'unknown')),
        shiny INTEGER NOT NULL DEFAULT 0,
        owned INTEGER NOT NULL DEFAULT 0,
        trainer_profile_id INTEGER REFERENCES trainer_profiles(id),
        origin_game TEXT,
        ot_name TEXT,
        tid INTEGER CHECK (tid IS NULL OR tid BETWEEN 0 AND 999999),
        sid INTEGER CHECK (sid IS NULL OR sid BETWEEN 0 AND 999999),
        nickname TEXT,
        UNIQUE(form_id, gender, shiny)
      );
      INSERT INTO collection_entries_new
        (id, form_id, gender, shiny, owned, trainer_profile_id, origin_game, ot_name, tid, sid, nickname)
        SELECT id, form_id, gender, shiny, owned, trainer_profile_id, origin_game, ot_name, tid, sid, nickname
        FROM collection_entries;
      DROP TABLE collection_entries;
      ALTER TABLE collection_entries_new RENAME TO collection_entries;
      CREATE INDEX IF NOT EXISTS idx_entries_form ON collection_entries(form_id);
    `)
    db.pragma('foreign_keys = ON')
  }
}

// caught_ball's CHECK list was fixed at ALTER-time and SQLite can't ALTER a CHECK
// constraint (same limitation as the sid-4294 rebuilds above) — Leg 5 added Legends
// Arceus's Feather/Wing/Jet/Leaden/Gigaton/Origin Ball names to POKE_BALLS, so any install
// that already ran schema-retrofits.ts's retrofit pre-Leg-5 has a stale CHECK missing them.
// Detected via the stored CHECK text directly (PRAGMA table_info doesn't expose CHECK
// bounds) rather than a version flag, so this is self-healing however many balls get added
// in the future. Runs after every retrofit that can have added a column to
// collection_entries by this point, and rebuilds with all of them, copied straight across.
// Needs the same foreign_keys=OFF dance as the sid-4294 rebuild above, since
// collection_entry_ribbons/collection_entry_marks both reference collection_entries(id).
export function rebuildCollectionEntriesCaughtBallCheck(db: Database.Database): void {
  const entriesSql = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'collection_entries'")
    .get() as { sql: string } | undefined
  if (entriesSql?.sql.includes('caught_ball') && !entriesSql.sql.includes("'Origin Ball'")) {
    db.pragma('foreign_keys = OFF')
    db.exec(`
      CREATE TABLE collection_entries_ballcheck (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_id INTEGER NOT NULL REFERENCES forms(id),
        gender TEXT NOT NULL DEFAULT 'unknown' CHECK (gender IN ('male', 'female', 'unknown')),
        shiny INTEGER NOT NULL DEFAULT 0,
        owned INTEGER NOT NULL DEFAULT 0,
        trainer_profile_id INTEGER REFERENCES trainer_profiles(id),
        origin_game TEXT,
        ot_name TEXT,
        tid INTEGER CHECK (tid IS NULL OR tid BETWEEN 0 AND 999999),
        sid INTEGER CHECK (sid IS NULL OR sid BETWEEN 0 AND 999999),
        nickname TEXT,
        language TEXT CHECK (language IS NULL OR language IN (${LANGUAGE_LIST_SQL})),
        caught_ball TEXT CHECK (caught_ball IS NULL OR caught_ball IN (${POKE_BALL_LIST_SQL})),
        storage_location_id INTEGER REFERENCES storage_locations(id),
        met_location TEXT,
        box_number INTEGER CHECK (box_number IS NULL OR box_number >= 1),
        box_slot INTEGER CHECK (box_slot IS NULL OR box_slot BETWEEN 0 AND 29),
        UNIQUE(form_id, gender, shiny)
      );
      INSERT INTO collection_entries_ballcheck
        (id, form_id, gender, shiny, owned, trainer_profile_id, origin_game, ot_name, tid, sid, nickname,
         language, caught_ball, storage_location_id, met_location, box_number, box_slot)
        SELECT id, form_id, gender, shiny, owned, trainer_profile_id, origin_game, ot_name, tid, sid, nickname,
               language, caught_ball, storage_location_id, met_location, box_number, box_slot
        FROM collection_entries;
      DROP TABLE collection_entries;
      ALTER TABLE collection_entries_ballcheck RENAME TO collection_entries;
      CREATE INDEX IF NOT EXISTS idx_entries_form ON collection_entries(form_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_entries_box_slot ON collection_entries(storage_location_id, box_number, box_slot);
    `)
    db.pragma('foreign_keys = ON')
  }
}

// Drop UNIQUE(form_id, gender, shiny) (Leg 2 of the Box Arrangement/Real Inventory Data
// Model milestone — see TODO.md/COMPLETED.md): a real box can hold several regular and
// shiny copies of one species mixed together, so duplicate owned copies are real tracked
// individuals, not a visual trick the old one-row-per-combo model could represent.
// SQLite can't ALTER a table to drop a UNIQUE constraint (same limitation as the
// CHECK-widen rebuilds above), so detect it via the stored CREATE TABLE SQL and rebuild.
// Runs last and rebuilds with every column collection_entries can have by this point,
// copied straight across, same reasoning as the caught_ball rebuild directly above — and,
// same as that one, needs foreign_keys=OFF too (collection_entry_ribbons/
// collection_entry_marks reference collection_entries(id); see the sid-4294 rebuild's
// own comment above for the full explanation).
export function rebuildCollectionEntriesDropUnique(db: Database.Database): void {
  const entriesSql = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'collection_entries'")
    .get() as { sql: string } | undefined
  if (entriesSql?.sql.includes('UNIQUE(form_id, gender, shiny)')) {
    db.pragma('foreign_keys = OFF')
    db.exec(`
      CREATE TABLE collection_entries_dropunique (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_id INTEGER NOT NULL REFERENCES forms(id),
        gender TEXT NOT NULL DEFAULT 'unknown' CHECK (gender IN ('male', 'female', 'unknown')),
        shiny INTEGER NOT NULL DEFAULT 0,
        owned INTEGER NOT NULL DEFAULT 0,
        trainer_profile_id INTEGER REFERENCES trainer_profiles(id),
        origin_game TEXT,
        ot_name TEXT,
        tid INTEGER CHECK (tid IS NULL OR tid BETWEEN 0 AND 999999),
        sid INTEGER CHECK (sid IS NULL OR sid BETWEEN 0 AND 999999),
        nickname TEXT,
        language TEXT CHECK (language IS NULL OR language IN (${LANGUAGE_LIST_SQL})),
        caught_ball TEXT CHECK (caught_ball IS NULL OR caught_ball IN (${POKE_BALL_LIST_SQL})),
        storage_location_id INTEGER REFERENCES storage_locations(id),
        met_location TEXT,
        box_number INTEGER CHECK (box_number IS NULL OR box_number >= 1),
        box_slot INTEGER CHECK (box_slot IS NULL OR box_slot BETWEEN 0 AND 29)
      );
      INSERT INTO collection_entries_dropunique
        (id, form_id, gender, shiny, owned, trainer_profile_id, origin_game, ot_name, tid, sid, nickname,
         language, caught_ball, storage_location_id, met_location, box_number, box_slot)
        SELECT id, form_id, gender, shiny, owned, trainer_profile_id, origin_game, ot_name, tid, sid, nickname,
               language, caught_ball, storage_location_id, met_location, box_number, box_slot
        FROM collection_entries;
      DROP TABLE collection_entries;
      ALTER TABLE collection_entries_dropunique RENAME TO collection_entries;
      CREATE INDEX IF NOT EXISTS idx_entries_form ON collection_entries(form_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_entries_box_slot ON collection_entries(storage_location_id, box_number, box_slot);
    `)
    db.pragma('foreign_keys = ON')
  }
}

// box_placeholders species_id -> form_id/gender/shiny (Leg 2 of the Dex completeness
// tier migration) — CREATE TABLE IF NOT EXISTS in schema.ts doesn't retrofit a pre-existing
// install's box_placeholders table, which this same milestone created just days ago
// (Leg 5 of Box View Polish) with the old species_id-only shape. Detected via
// PRAGMA table_info directly (a version flag would be overkill for a table this new and
// this small) and rebuilt in place, same "copy rows across" approach as the
// collection_entries CHECK-widen rebuilds above — nothing references box_placeholders(id)
// as an FK target, so no foreign_keys=OFF dance is needed. form_id is backed into each
// row via the same "species' first boxable form, else its first form at all" pick
// buildBoxes.ts's pickPlaceholderForm/boxTemplates.ts's canonicalPlaceholderForm use at
// runtime; gender backfills to 'male' when that resolved form has a gender difference
// (the same collapsed-representative convention requiredUnits() uses), else 'unknown';
// shiny backfills to 0 (regular) — the old shape had no way to record either, so this is
// the closest faithful default, not a guess at real prior intent.
export function rebuildBoxPlaceholdersFormId(db: Database.Database): void {
  const boxPlaceholderColumns = db.prepare('PRAGMA table_info(box_placeholders)').all() as Array<{ name: string }>
  if (boxPlaceholderColumns.some((c) => c.name === 'species_id')) {
    db.exec(`
      CREATE TABLE box_placeholders_formid (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        storage_location_id INTEGER NOT NULL REFERENCES storage_locations(id) ON DELETE CASCADE,
        box_number INTEGER NOT NULL CHECK (box_number >= 1),
        box_slot INTEGER NOT NULL CHECK (box_slot BETWEEN 0 AND 29),
        form_id INTEGER NOT NULL REFERENCES forms(id),
        gender TEXT NOT NULL DEFAULT 'unknown' CHECK (gender IN ('male', 'female', 'unknown')),
        shiny INTEGER NOT NULL DEFAULT 0,
        UNIQUE(storage_location_id, box_number, box_slot)
      );
      INSERT INTO box_placeholders_formid (id, storage_location_id, box_number, box_slot, form_id, gender, shiny)
      SELECT
        bp.id,
        bp.storage_location_id,
        bp.box_number,
        bp.box_slot,
        COALESCE(
          (SELECT f.id FROM forms f WHERE f.species_id = bp.species_id AND f.form_category != 'non_boxable' ORDER BY f.id LIMIT 1),
          (SELECT f.id FROM forms f WHERE f.species_id = bp.species_id ORDER BY f.id LIMIT 1)
        ),
        CASE WHEN (
          SELECT f2.has_gender_difference FROM forms f2
          WHERE f2.id = COALESCE(
            (SELECT f.id FROM forms f WHERE f.species_id = bp.species_id AND f.form_category != 'non_boxable' ORDER BY f.id LIMIT 1),
            (SELECT f.id FROM forms f WHERE f.species_id = bp.species_id ORDER BY f.id LIMIT 1)
          )
        ) = 1 THEN 'male' ELSE 'unknown' END,
        0
      FROM box_placeholders bp;
      DROP TABLE box_placeholders;
      ALTER TABLE box_placeholders_formid RENAME TO box_placeholders;
      CREATE INDEX IF NOT EXISTS idx_box_placeholders_location ON box_placeholders(storage_location_id);
    `)
  }
}

// collection_entry_ribbons/collection_entry_marks' CHECK lists were fixed at CREATE-time
// to Leg 4's 20/22-name placeholder sets, and SQLite can't ALTER a CHECK constraint (same
// limitation as the caught_ball/sid-4294 rebuilds above) — Leg 5 replaced both placeholders
// with the full curated 117-ribbon/53-mark lists, so any install that already ran the
// CREATE TABLE IF NOT EXISTS in schema.ts pre-Leg-5 has a stale CHECK missing nearly all of
// them. Detected via the stored CHECK text directly, same self-healing approach as the
// caught_ball rebuild (a sentinel name absent from Leg 4's placeholder but present in
// Leg 5's real list), so this doesn't need a version flag and heals however many
// ribbons/marks get added in the future. Neither table is referenced by any other table's
// FK (nothing points at collection_entry_ribbons/marks as a parent), so unlike the
// collection_entries rebuilds above, dropping and recreating them needs no
// foreign_keys=OFF dance — only their own entry_id FK into collection_entries is checked,
// and it's checked correctly on the INSERT...SELECT below regardless of the pragma.
export function rebuildCollectionEntryRibbonsCheck(db: Database.Database): void {
  const ribbonsSql = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'collection_entry_ribbons'")
    .get() as { sql: string } | undefined
  if (ribbonsSql?.sql && !ribbonsSql.sql.includes("'Cool Ribbon Super'")) {
    db.exec(`
      CREATE TABLE collection_entry_ribbons_widened (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_id INTEGER NOT NULL REFERENCES collection_entries(id) ON DELETE CASCADE,
        ribbon_name TEXT NOT NULL CHECK (ribbon_name IN (${RIBBON_LIST_SQL})),
        UNIQUE(entry_id, ribbon_name)
      );
      INSERT INTO collection_entry_ribbons_widened (id, entry_id, ribbon_name)
        SELECT id, entry_id, ribbon_name FROM collection_entry_ribbons;
      DROP TABLE collection_entry_ribbons;
      ALTER TABLE collection_entry_ribbons_widened RENAME TO collection_entry_ribbons;
      CREATE INDEX IF NOT EXISTS idx_entry_ribbons_entry ON collection_entry_ribbons(entry_id);
    `)
  }
}

export function rebuildCollectionEntryMarksCheck(db: Database.Database): void {
  const marksSql = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'collection_entry_marks'")
    .get() as { sql: string } | undefined
  if (marksSql?.sql && !marksSql.sql.includes("'Curry Mark'")) {
    db.exec(`
      CREATE TABLE collection_entry_marks_widened (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_id INTEGER NOT NULL REFERENCES collection_entries(id) ON DELETE CASCADE,
        mark_name TEXT NOT NULL CHECK (mark_name IN (${MARK_LIST_SQL})),
        UNIQUE(entry_id, mark_name)
      );
      INSERT INTO collection_entry_marks_widened (id, entry_id, mark_name)
        SELECT id, entry_id, mark_name FROM collection_entry_marks;
      DROP TABLE collection_entry_marks;
      ALTER TABLE collection_entry_marks_widened RENAME TO collection_entry_marks;
      CREATE INDEX IF NOT EXISTS idx_entry_marks_entry ON collection_entry_marks(entry_id);
    `)
  }
}
