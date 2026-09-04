import type Database from 'better-sqlite3'
import { ORIGIN_LANGUAGES } from '@shared/data/languages'
import { POKE_BALLS } from '@shared/data/poke-balls'

// Language (Leg 14) is a genuinely closed set defined by the games themselves (unlike
// `game`, which is open-ended enough to cover ROM hacks/future titles and so stays a
// plain unconstrained TEXT column) — safe to enforce with a CHECK, same as `gender`'s
// enum above. Built from ORIGIN_LANGUAGES rather than hardcoded so schema.ts and
// shared/data/languages.ts can't drift apart.
const LANGUAGE_LIST_SQL = ORIGIN_LANGUAGES.map((l) => `'${l}'`).join(', ')

// Caught-in Poké Ball (Leg 28) — same closed-set reasoning as language above, built from
// POKE_BALLS so schema.ts and shared/data/poke-balls.ts can't drift apart. collection_entries
// only: a ball is per-catch, not per-trainer, so trainer_profiles never gets this column.
const POKE_BALL_LIST_SQL = POKE_BALLS.map((b) => `'${b}'`).join(', ')

export function applySchema(db: Database.Database): void {
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS species (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      generation INTEGER NOT NULL,
      -- User-facing override (Leg 27) on top of Leg 9's owned/shiny auto-pick: pins which
      -- form displays when this species' cosmetic-variant section is collapsed. NULL
      -- means "auto" (pickCollapsedRow's default). Forward reference to forms(id) is fine
      -- here — SQLite only resolves FK targets at enforcement time, not CREATE TABLE
      -- parse time, and forms is created immediately below.
      collapsed_display_form_id INTEGER REFERENCES forms(id)
    );

    CREATE TABLE IF NOT EXISTS forms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      species_id INTEGER NOT NULL REFERENCES species(id),
      form_name TEXT NOT NULL,
      form_category TEXT NOT NULL CHECK (form_category IN ('dex_distinct', 'cosmetic_variant', 'non_boxable')),
      home_boxable INTEGER NOT NULL DEFAULT 1,
      shiny_locked INTEGER NOT NULL DEFAULT 0,
      always_shiny INTEGER NOT NULL DEFAULT 0,
      has_gender_difference INTEGER NOT NULL DEFAULT 0,
      first_available_generation INTEGER NOT NULL,
      regional_group TEXT,
      pokeapi_id INTEGER,
      sprite_form_suffix TEXT,
      UNIQUE(species_id, form_name)
    );
    CREATE INDEX IF NOT EXISTS idx_forms_species ON forms(species_id);

    -- No UNIQUE(form_id, gender, shiny) here (dropped Leg 2 of the Box Arrangement
    -- milestone, see TODO.md/COMPLETED.md): duplicate owned copies of the same species/
    -- form/gender/shiny combo are real tracked individuals, not a visual trick, so more
    -- than one row can legitimately share that triple. A pre-Leg-2 database that already
    -- has the constraint gets it dropped by the rebuild block at the bottom of this
    -- function instead — SQLite can't ALTER a table to remove a UNIQUE constraint, same
    -- limitation as the CHECK-widen rebuilds elsewhere in this file.
    CREATE TABLE IF NOT EXISTS collection_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_id INTEGER NOT NULL REFERENCES forms(id),
      gender TEXT NOT NULL DEFAULT 'unknown' CHECK (gender IN ('male', 'female', 'unknown')),
      shiny INTEGER NOT NULL DEFAULT 0,
      owned INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_entries_form ON collection_entries(form_id);

    -- Origin identity a Collection Entry will eventually reference (Leg 4) — standalone
    -- for now, see [Trainer Profile model] in TODO.md. tid/sid are nullable: Pokémon GO
    -- has neither, and pre-Gen-7 games never display a SID in-game, though it exists
    -- internally and can be read out with a tool like PKHex (see
    -- shared/types/trainer-profile.ts). Both ranges cover the widest any generation
    -- shows/holds — 0-999999 — rather than a tighter per-generation bound, since that
    -- depends on the game name text in a column SQLite CHECK can't cross-reference.
    CREATE TABLE IF NOT EXISTS trainer_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game TEXT NOT NULL,
      ot_name TEXT NOT NULL,
      tid INTEGER CHECK (tid IS NULL OR tid BETWEEN 0 AND 999999),
      sid INTEGER CHECK (sid IS NULL OR sid BETWEEN 0 AND 999999),
      label TEXT,
      language TEXT CHECK (language IS NULL OR language IN (${LANGUAGE_LIST_SQL}))
    );

    -- A Pokémon's current location (HOME/Bank/Box/Ranch/save-file), separate from its
    -- origin (trainer_profiles) so trades/transfers move location without touching
    -- origin. See [Storage Location model] in TODO.md. None of the five kinds have a
    -- real capturable identifier (confirmed against Bulbapedia/Project Pokémon: Bank,
    -- Box, and Ranch expose nothing usable, and HOME's only account-level ID is a social
    -- friend code, not a per-slot identity) — so identity is a plain user-provided name,
    -- not a type-specific field. save_file is the one type genuinely scoped to a specific
    -- save, so it must link to the trainer_profile whose boxes it is; the other four
    -- kinds are standalone and must NOT carry that link.
    CREATE TABLE IF NOT EXISTS storage_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_type TEXT NOT NULL CHECK (location_type IN ('home', 'bank', 'box', 'ranch', 'save_file')),
      name TEXT NOT NULL,
      trainer_profile_id INTEGER REFERENCES trainer_profiles(id),
      CHECK (
        (location_type = 'save_file' AND trainer_profile_id IS NOT NULL) OR
        (location_type != 'save_file' AND trainer_profile_id IS NULL)
      )
    );

    -- One row per real box within a Storage Location (Leg 2 of the Box View Polish &
    -- Multi-Box Editing milestone) — box *existence* is what makes a box navigable in Box
    -- view now, not "does it happen to hold >=1 real cell" (buildBoxes.ts's old rule, see
    -- its own doc comment pre-Leg-2). name is an optional user label set via "Rename
    -- box" in DexBoxGrid; null means unnamed, shown there as just "Box N". ON DELETE
    -- CASCADE, unlike collection_entries.storage_location_id: an entry survives its
    -- location's deletion by falling back to Unassigned, but a box has no equivalent
    -- "orphaned but kept" state worth preserving once its location is gone.
    CREATE TABLE IF NOT EXISTS boxes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      storage_location_id INTEGER NOT NULL REFERENCES storage_locations(id) ON DELETE CASCADE,
      box_number INTEGER NOT NULL CHECK (box_number >= 1),
      name TEXT,
      UNIQUE(storage_location_id, box_number)
    );
    CREATE INDEX IF NOT EXISTS idx_boxes_location ON boxes(storage_location_id);
  `)

  // Same retrofit story for species: collapsed_display_form_id postdates every existing
  // install's species table.
  const speciesColumns = db.prepare('PRAGMA table_info(species)').all() as Array<{ name: string }>
  if (!speciesColumns.some((c) => c.name === 'collapsed_display_form_id')) {
    db.exec('ALTER TABLE species ADD COLUMN collapsed_display_form_id INTEGER REFERENCES forms(id)')
  }

  // CREATE TABLE IF NOT EXISTS above doesn't retrofit new columns onto a forms table
  // that already existed pre-Leg-4. SQLite has no ADD COLUMN IF NOT EXISTS, so check first.
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

  // trainer_profiles briefly shipped with tid/sid as NOT NULL 0-65535 before the
  // Bulbapedia-sourced widen (6-digit TID/4-digit SID from Gen VII, both nullable for
  // Pokémon GO and pre-Gen-VII's invisible SID — see the CREATE TABLE comment above).
  // SQLite can't ALTER a CHECK constraint, so detect the old NOT NULL tid column and
  // rebuild the table. collection_entries/storage_locations hold FK references into
  // trainer_profiles, so with foreign_keys=ON (set at the top of this function) a bare
  // DROP TABLE here performs an implicit DELETE that SQLite checks against those FKs —
  // it throws FOREIGN KEY constraint failed the moment any install actually has linked
  // rows, despite this block's original assumption that none would. Follow SQLite's
  // documented procedure for schema changes on FK-referenced tables: disable
  // enforcement and wrap the rebuild in its own transaction.
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

  // Widened sid's upper bound again, from 4294 (Gen VII+'s derived cap,
  // floor(32-bit ID / 1_000_000)) to 999999: pre-Gen-VII games never display a Secret
  // ID in-game, but it exists internally and can run up to 6 digits once read out with
  // a tool like PKHex — see the CREATE TABLE comment above. Unlike the tid NOT NULL
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

  const entriesSql = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'collection_entries'")
    .get() as { sql: string } | undefined
  if (entriesSql?.sql.includes('sid BETWEEN 0 AND 4294')) {
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
  }

  // language (Leg 14) retrofit for both tables — re-read PRAGMA state here rather than
  // reusing trainerProfileColumns/entryColumns above, since the sid-4294 rebuilds just
  // above can recreate either table without this leg's column; querying fresh keeps
  // this correct whether or not a rebuild fired on this run.
  const trainerProfileColumnsFinal = db.prepare('PRAGMA table_info(trainer_profiles)').all() as Array<{ name: string }>
  if (!trainerProfileColumnsFinal.some((c) => c.name === 'language')) {
    db.exec(
      `ALTER TABLE trainer_profiles ADD COLUMN language TEXT CHECK (language IS NULL OR language IN (${LANGUAGE_LIST_SQL}))`
    )
  }
  const entryColumnsFinal = db.prepare('PRAGMA table_info(collection_entries)').all() as Array<{ name: string }>
  if (!entryColumnsFinal.some((c) => c.name === 'language')) {
    db.exec(
      `ALTER TABLE collection_entries ADD COLUMN language TEXT CHECK (language IS NULL OR language IN (${LANGUAGE_LIST_SQL}))`
    )
  }

  // caught_ball (Leg 28) retrofit — same "query fresh, run unconditionally at the end"
  // approach as language above.
  if (!entryColumnsFinal.some((c) => c.name === 'caught_ball')) {
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
  // already created earlier in this function, so the forward reference resolves fine.
  // met_location is free text this milestone (a curated per-game location list is
  // deferred — see TODO.md), so it's a plain TEXT column with no CHECK, and lives
  // alongside the other origin fields since it's edited through OriginModal.
  if (!entryColumnsFinal.some((c) => c.name === 'storage_location_id')) {
    db.exec('ALTER TABLE collection_entries ADD COLUMN storage_location_id INTEGER REFERENCES storage_locations(id)')
  }
  if (!entryColumnsFinal.some((c) => c.name === 'met_location')) {
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
  if (!entryColumnsFinal.some((c) => c.name === 'box_number')) {
    db.exec('ALTER TABLE collection_entries ADD COLUMN box_number INTEGER CHECK (box_number IS NULL OR box_number >= 1)')
  }
  if (!entryColumnsFinal.some((c) => c.name === 'box_slot')) {
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

  // caught_ball's CHECK list was fixed at ALTER-time above and SQLite can't ALTER a CHECK
  // constraint (same limitation as the sid-4294 rebuilds earlier in this function) — Leg 5
  // added Legends Arceus's Feather/Wing/Jet/Leaden/Gigaton/Origin Ball names to
  // POKE_BALLS, so any install that already ran the retrofit above pre-Leg-5 has a stale
  // CHECK missing them. Detected via the stored CHECK text directly (PRAGMA table_info
  // doesn't expose CHECK bounds) rather than a version flag, so this is self-healing
  // however many balls get added in the future. Runs last and rebuilds with every column
  // this function can have added by this point, copied straight across — nothing else
  // references collection_entries(id) as an FK target, so no foreign_keys=OFF dance is
  // needed here (unlike the trainer_profiles rebuilds above).
  const entriesSqlForBallCheck = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'collection_entries'")
    .get() as { sql: string } | undefined
  if (entriesSqlForBallCheck?.sql.includes('caught_ball') && !entriesSqlForBallCheck.sql.includes("'Origin Ball'")) {
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
  }

  // Drop UNIQUE(form_id, gender, shiny) (Leg 2 of the Box Arrangement/Real Inventory Data
  // Model milestone — see TODO.md/COMPLETED.md): a real box can hold several regular and
  // shiny copies of one species mixed together, so duplicate owned copies are real tracked
  // individuals, not a visual trick the old one-row-per-combo model could represent.
  // SQLite can't ALTER a table to drop a UNIQUE constraint (same limitation as the
  // CHECK-widen rebuilds above), so detect it via the stored CREATE TABLE SQL and rebuild.
  // Runs last and rebuilds with every column this function can have added by this point,
  // copied straight across, same reasoning as the caught_ball rebuild directly above — and
  // for the same reason, no foreign_keys=OFF dance is needed (nothing references
  // collection_entries(id) as an FK target).
  const entriesSqlForUniqueCheck = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'collection_entries'")
    .get() as { sql: string } | undefined
  if (entriesSqlForUniqueCheck?.sql.includes('UNIQUE(form_id, gender, shiny)')) {
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
  }

  // Backfills `boxes` rows so every Storage Location has at least a Box 1, plus a row for
  // any box_number collection_entries already reference — covers a pre-Leg-2 install
  // (whose entries can already sit in boxes with no row for them yet, since buildBoxes.ts
  // used to derive box existence straight from entries) and collection-backup.ts's
  // importCollection, which cascade-deletes every boxes row when storage_locations gets
  // wiped-and-reinserted (see its own comment). INSERT OR IGNORE against the UNIQUE
  // (storage_location_id, box_number) index makes this safe to run unconditionally on
  // every startup, not just once.
  backfillBoxes(db)
}

export function backfillBoxes(db: Database.Database): void {
  db.exec(`
    INSERT OR IGNORE INTO boxes (storage_location_id, box_number, name)
    SELECT id, 1, NULL FROM storage_locations;

    INSERT OR IGNORE INTO boxes (storage_location_id, box_number, name)
    SELECT DISTINCT storage_location_id, box_number, NULL
    FROM collection_entries
    WHERE storage_location_id IS NOT NULL AND box_number IS NOT NULL;
  `)
}
