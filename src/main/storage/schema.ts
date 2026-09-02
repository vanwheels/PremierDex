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
    -- has neither, and pre-Gen-7 games never display a SID at all (see
    -- shared/types/trainer-profile.ts). Ranges cover the widest any generation shows —
    -- 6-digit TID and 4-digit SID, both introduced Gen VII — rather than a tighter
    -- per-generation bound, since that depends on the game name text in a column SQLite
    -- CHECK can't cross-reference.
    CREATE TABLE IF NOT EXISTS trainer_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game TEXT NOT NULL,
      ot_name TEXT NOT NULL,
      tid INTEGER CHECK (tid IS NULL OR tid BETWEEN 0 AND 999999),
      sid INTEGER CHECK (sid IS NULL OR sid BETWEEN 0 AND 4294),
      label TEXT
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
        sid INTEGER CHECK (sid IS NULL OR sid BETWEEN 0 AND 4294),
        label TEXT
      );
    `)
  }
}
