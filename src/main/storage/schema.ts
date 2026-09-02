import type Database from 'better-sqlite3'

export function applySchema(db: Database.Database): void {
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS species (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      generation INTEGER NOT NULL
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

    CREATE TABLE IF NOT EXISTS collection_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_id INTEGER NOT NULL REFERENCES forms(id),
      gender TEXT NOT NULL DEFAULT 'unknown' CHECK (gender IN ('male', 'female', 'unknown')),
      shiny INTEGER NOT NULL DEFAULT 0,
      owned INTEGER NOT NULL DEFAULT 0,
      UNIQUE(form_id, gender, shiny)
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
      label TEXT
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
  `)

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
  // table's original CREATE. trainer_profile_id is provenance only (which Trainer
  // Profile, if any, the snapshot columns below were copied from) — the game/ot_name/
  // tid/sid/nickname columns are the source of truth for display and never auto-update
  // when the referenced profile changes later. No ON DELETE clause: SQLite's default FK
  // action is NO ACTION, which would block deleting a still-referenced profile, so
  // orphaning trainer_profile_id to NULL on profile delete is handled explicitly in
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
  // rebuild the table. Safe unconditionally: this table has never shipped in a release,
  // so no install has real rows in it yet.
  const trainerProfileColumns = db.prepare('PRAGMA table_info(trainer_profiles)').all() as Array<{
    name: string
    notnull: 0 | 1
  }>
  if (trainerProfileColumns.some((c) => c.name === 'tid' && c.notnull === 1)) {
    db.exec(`
      DROP TABLE trainer_profiles;
      CREATE TABLE trainer_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game TEXT NOT NULL,
        ot_name TEXT NOT NULL,
        tid INTEGER CHECK (tid IS NULL OR tid BETWEEN 0 AND 999999),
        sid INTEGER CHECK (sid IS NULL OR sid BETWEEN 0 AND 999999),
        label TEXT
      );
    `)
  }

  // Widened sid's upper bound again, from 4294 (Gen VII+'s derived cap,
  // floor(32-bit ID / 1_000_000)) to 999999: pre-Gen-VII games never display a Secret
  // ID in-game, but it exists internally and can run up to 6 digits once read out with
  // a tool like PKHex — see the CREATE TABLE comment above. Unlike the tid NOT NULL
  // rebuild above, this table now sees real use (Legs 1-4 shipped the same day), so
  // this rebuild copies existing rows across instead of dropping them. Detected via the
  // stored CHECK text directly, since PRAGMA table_info doesn't expose CHECK bounds.
  const trainerProfilesSql = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'trainer_profiles'")
    .get() as { sql: string } | undefined
  if (trainerProfilesSql?.sql.includes('sid BETWEEN 0 AND 4294')) {
    db.exec(`
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
    `)
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
}
