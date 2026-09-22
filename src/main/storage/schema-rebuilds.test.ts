import { describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { applySchema } from './schema'

// CHECK-widen/table-rebuild coverage for schema-rebuilds.ts, split out of schema.test.ts
// (Leg 2 of the Codebase File-Size Cleanup milestone) along the same module boundary as
// the schema.ts/schema-rebuilds.ts/schema-retrofits.ts source split. Each test seeds a
// legacy table shape directly (not via applySchema) and confirms applySchema rebuilds it
// in place without losing data or tripping FK enforcement.

describe('applySchema rebuilds', () => {
  it('rebuilds trainer_profiles when it still has the pre-widen NOT NULL tid column', () => {
    const db = new Database(':memory:')
    db.exec(`
      CREATE TABLE trainer_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game TEXT NOT NULL,
        ot_name TEXT NOT NULL,
        tid INTEGER NOT NULL CHECK (tid BETWEEN 0 AND 65535),
        sid INTEGER NOT NULL DEFAULT 0 CHECK (sid BETWEEN 0 AND 65535),
        label TEXT
      );
    `)

    applySchema(db)

    const columns = db.prepare('PRAGMA table_info(trainer_profiles)').all() as Array<{
      name: string
      notnull: 0 | 1
    }>
    expect(columns.find((c) => c.name === 'tid')?.notnull).toBe(0)
    expect(() =>
      db
        .prepare('INSERT INTO trainer_profiles (game, ot_name, tid, sid) VALUES (?, ?, ?, ?)')
        .run('Pokémon GO', 'Ash', null, null)
    ).not.toThrow()
  })

  it('widens trainer_profiles sid to 999999 while preserving existing rows', () => {
    const db = new Database(':memory:')
    db.exec(`
      CREATE TABLE trainer_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game TEXT NOT NULL,
        ot_name TEXT NOT NULL,
        tid INTEGER CHECK (tid IS NULL OR tid BETWEEN 0 AND 999999),
        sid INTEGER CHECK (sid IS NULL OR sid BETWEEN 0 AND 4294),
        label TEXT
      );
    `)
    const inserted = db
      .prepare('INSERT INTO trainer_profiles (game, ot_name, tid, sid, label) VALUES (?, ?, ?, ?, ?)')
      .run('Pokémon Black', 'Ash', 1, 2, null)

    applySchema(db)

    expect(db.prepare('SELECT * FROM trainer_profiles').all()).toEqual([
      { id: inserted.lastInsertRowid, game: 'Pokémon Black', ot_name: 'Ash', tid: 1, sid: 2, label: null, language: null }
    ])
    expect(() =>
      db
        .prepare('INSERT INTO trainer_profiles (game, ot_name, tid, sid) VALUES (?, ?, ?, ?)')
        .run('Pokémon White', 'Ash', 3, 54321)
    ).not.toThrow()
  })

  it('widens collection_entries sid to 999999 while preserving existing rows', () => {
    const db = new Database(':memory:')
    db.exec(`
      CREATE TABLE species (id INTEGER PRIMARY KEY, name TEXT NOT NULL, generation INTEGER NOT NULL);
      CREATE TABLE forms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        species_id INTEGER NOT NULL REFERENCES species(id),
        form_name TEXT NOT NULL,
        form_category TEXT NOT NULL,
        first_available_generation INTEGER NOT NULL
      );
      CREATE TABLE collection_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_id INTEGER NOT NULL REFERENCES forms(id),
        gender TEXT NOT NULL DEFAULT 'unknown',
        shiny INTEGER NOT NULL DEFAULT 0,
        owned INTEGER NOT NULL DEFAULT 0,
        origin_game TEXT,
        ot_name TEXT,
        tid INTEGER CHECK (tid IS NULL OR tid BETWEEN 0 AND 999999),
        sid INTEGER CHECK (sid IS NULL OR sid BETWEEN 0 AND 4294),
        nickname TEXT,
        UNIQUE(form_id, gender, shiny)
      );
      INSERT INTO species (id, name, generation) VALUES (1, 'bulbasaur', 1);
      INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
        VALUES (1, 'base', 'dex_distinct', 1);
    `)
    const inserted = db
      .prepare(
        'INSERT INTO collection_entries (form_id, gender, shiny, owned, origin_game, ot_name, tid, sid, nickname) VALUES (1, \'unknown\', 0, 1, ?, ?, ?, ?, ?)'
      )
      .run('Pokémon Black', 'Ash', 1, 2, null)

    applySchema(db)

    const row = db.prepare('SELECT * FROM collection_entries').get() as Record<string, unknown>
    expect(row.id).toBe(inserted.lastInsertRowid)
    expect(row.trainer_profile_id).toBeNull()
    expect(row.sid).toBe(2)
    expect(row.language).toBeNull()
    expect(() =>
      db
        .prepare('INSERT INTO collection_entries (form_id, gender, shiny, sid) VALUES (1, \'male\', 0, ?)')
        .run(54321)
    ).not.toThrow()
  })

  it('rebuilds trainer_profiles without violating FKs from linked collection_entries/storage_locations rows', () => {
    const db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    db.exec(`
      CREATE TABLE species (id INTEGER PRIMARY KEY, name TEXT NOT NULL, generation INTEGER NOT NULL);
      CREATE TABLE forms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        species_id INTEGER NOT NULL REFERENCES species(id),
        form_name TEXT NOT NULL,
        form_category TEXT NOT NULL,
        first_available_generation INTEGER NOT NULL
      );
      CREATE TABLE trainer_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game TEXT NOT NULL,
        ot_name TEXT NOT NULL,
        tid INTEGER CHECK (tid IS NULL OR tid BETWEEN 0 AND 999999),
        sid INTEGER CHECK (sid IS NULL OR sid BETWEEN 0 AND 4294),
        label TEXT
      );
      CREATE TABLE collection_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_id INTEGER NOT NULL REFERENCES forms(id),
        gender TEXT NOT NULL DEFAULT 'unknown',
        shiny INTEGER NOT NULL DEFAULT 0,
        owned INTEGER NOT NULL DEFAULT 0,
        trainer_profile_id INTEGER REFERENCES trainer_profiles(id),
        origin_game TEXT,
        ot_name TEXT,
        tid INTEGER,
        sid INTEGER,
        nickname TEXT,
        UNIQUE(form_id, gender, shiny)
      );
      CREATE TABLE storage_locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location_type TEXT NOT NULL,
        name TEXT NOT NULL,
        trainer_profile_id INTEGER REFERENCES trainer_profiles(id)
      );
      INSERT INTO species (id, name, generation) VALUES (1, 'bulbasaur', 1);
      INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
        VALUES (1, 'base', 'dex_distinct', 1);
      INSERT INTO trainer_profiles (game, ot_name, tid, sid, label) VALUES ('Pokemon Black', 'Ash', 1, 2, null);
      INSERT INTO collection_entries (form_id, gender, shiny, owned, trainer_profile_id)
        VALUES (1, 'unknown', 0, 1, 1);
      INSERT INTO storage_locations (location_type, name, trainer_profile_id) VALUES ('save_file', 'Box 1', 1);
    `)

    expect(() => applySchema(db)).not.toThrow()

    // FK enforcement should be back on afterward, and the linked rows should have
    // survived the rebuild with their trainer_profile_id intact.
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1)
    const entry = db.prepare('SELECT trainer_profile_id FROM collection_entries WHERE id = 1').get() as {
      trainer_profile_id: number
    }
    expect(entry.trainer_profile_id).toBe(1)
    const loc = db.prepare('SELECT trainer_profile_id FROM storage_locations WHERE id = 1').get() as {
      trainer_profile_id: number
    }
    expect(loc.trainer_profile_id).toBe(1)
  })

  it('rebuilds collection_entries (the legacy sid-4294 path) without violating FKs from linked ribbon/mark rows', () => {
    const db = new Database(':memory:')
    db.exec(`
      CREATE TABLE species (id INTEGER PRIMARY KEY, name TEXT NOT NULL, generation INTEGER NOT NULL);
      CREATE TABLE forms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        species_id INTEGER NOT NULL REFERENCES species(id),
        form_name TEXT NOT NULL,
        form_category TEXT NOT NULL,
        first_available_generation INTEGER NOT NULL
      );
      CREATE TABLE collection_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_id INTEGER NOT NULL REFERENCES forms(id),
        gender TEXT NOT NULL DEFAULT 'unknown',
        shiny INTEGER NOT NULL DEFAULT 0,
        owned INTEGER NOT NULL DEFAULT 0,
        origin_game TEXT,
        ot_name TEXT,
        tid INTEGER CHECK (tid IS NULL OR tid BETWEEN 0 AND 999999),
        sid INTEGER CHECK (sid IS NULL OR sid BETWEEN 0 AND 4294),
        nickname TEXT,
        UNIQUE(form_id, gender, shiny)
      );
      CREATE TABLE collection_entry_ribbons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_id INTEGER NOT NULL REFERENCES collection_entries(id) ON DELETE CASCADE,
        ribbon_name TEXT NOT NULL
      );
      INSERT INTO species (id, name, generation) VALUES (1, 'bulbasaur', 1);
      INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
        VALUES (1, 'base', 'dex_distinct', 1);
      INSERT INTO collection_entries (form_id, gender, shiny, owned) VALUES (1, 'unknown', 0, 1);
      INSERT INTO collection_entry_ribbons (entry_id, ribbon_name) VALUES (1, 'Champion Ribbon');
    `)
    db.pragma('foreign_keys = ON')

    expect(() => applySchema(db)).not.toThrow()

    expect(db.pragma('foreign_keys', { simple: true })).toBe(1)
    const ribbon = db.prepare('SELECT entry_id, ribbon_name FROM collection_entry_ribbons').get() as {
      entry_id: number
      ribbon_name: string
    }
    expect(ribbon).toEqual({ entry_id: 1, ribbon_name: 'Champion Ribbon' })
  })
})
