import { describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { applySchema } from './schema'

function makeDb() {
  const db = new Database(':memory:')
  applySchema(db)
  return db
}

describe('applySchema', () => {
  it('creates species, forms, and collection_entries tables', () => {
    const db = makeDb()
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all()
      .map((row) => (row as { name: string }).name)
    expect(tables).toEqual([
      'box_placeholders',
      'boxes',
      'collection_entries',
      'forms',
      'species',
      'storage_locations',
      'trainer_profiles'
    ])
  })

  it('is safe to apply twice (idempotent DDL)', () => {
    const db = makeDb()
    expect(() => applySchema(db)).not.toThrow()
  })

  it('rejects an invalid form_category via the CHECK constraint', () => {
    const db = makeDb()
    db.prepare('INSERT INTO species (id, name, generation) VALUES (1, \'bulbasaur\', 1)').run()
    expect(() =>
      db
        .prepare(
          `INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
           VALUES (1, 'base', 'not_a_real_category', 1)`
        )
        .run()
    ).toThrow()
  })

  it('allows multiple collection_entries rows for the same (form_id, gender, shiny) — duplicate owned copies are real individuals (Leg 2)', () => {
    const db = makeDb()
    db.prepare('INSERT INTO species (id, name, generation) VALUES (1, \'bulbasaur\', 1)').run()
    db.prepare(
      `INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
       VALUES (1, 'base', 'dex_distinct', 1)`
    ).run()
    db.prepare('INSERT INTO collection_entries (form_id, gender, shiny) VALUES (1, \'unknown\', 0)').run()
    expect(() =>
      db.prepare('INSERT INTO collection_entries (form_id, gender, shiny) VALUES (1, \'unknown\', 0)').run()
    ).not.toThrow()
    const count = (
      db.prepare('SELECT COUNT(*) AS n FROM collection_entries WHERE form_id = 1').get() as { n: number }
    ).n
    expect(count).toBe(2)
  })

  it('rejects a trainer_profiles tid past the 6-digit range via the CHECK constraint', () => {
    const db = makeDb()
    expect(() =>
      db
        .prepare('INSERT INTO trainer_profiles (game, ot_name, tid, sid) VALUES (?, ?, ?, ?)')
        .run('Pokémon Scarlet', 'Ash', 1_000_000, 0)
    ).toThrow()
  })

  it('rejects a trainer_profiles sid past the 6-digit range via the CHECK constraint', () => {
    const db = makeDb()
    expect(() =>
      db
        .prepare('INSERT INTO trainer_profiles (game, ot_name, tid, sid) VALUES (?, ?, ?, ?)')
        .run('Pokémon Scarlet', 'Ash', 0, 1_000_000)
    ).toThrow()
  })

  it('allows a trainer_profiles sid past Gen VII+\'s 4294 cap, for a pre-Gen-VII SID read out with PKHex', () => {
    const db = makeDb()
    expect(() =>
      db
        .prepare('INSERT INTO trainer_profiles (game, ot_name, tid, sid) VALUES (?, ?, ?, ?)')
        .run('Pokémon Black', 'Ash', 0, 54321)
    ).not.toThrow()
  })

  it('rejects a negative trainer_profiles sid via the CHECK constraint', () => {
    const db = makeDb()
    expect(() =>
      db
        .prepare('INSERT INTO trainer_profiles (game, ot_name, tid, sid) VALUES (?, ?, ?, ?)')
        .run('Pokémon Sword', 'Ash', 0, -1)
    ).toThrow()
  })

  it('allows null tid/sid, for origins like Pokémon GO that show neither', () => {
    const db = makeDb()
    expect(() =>
      db
        .prepare('INSERT INTO trainer_profiles (game, ot_name, tid, sid) VALUES (?, ?, ?, ?)')
        .run('Pokémon GO', 'Ash', null, null)
    ).not.toThrow()
  })

  it('rejects an invalid storage_locations location_type via the CHECK constraint', () => {
    const db = makeDb()
    expect(() =>
      db
        .prepare('INSERT INTO storage_locations (location_type, name) VALUES (?, ?)')
        .run('not_a_real_type', 'Somewhere')
    ).toThrow()
  })

  it('rejects a save_file storage_locations row with no trainer_profile_id', () => {
    const db = makeDb()
    expect(() =>
      db.prepare('INSERT INTO storage_locations (location_type, name) VALUES (?, ?)').run('save_file', 'Sword Box 1')
    ).toThrow()
  })

  it('rejects a non-save_file storage_locations row that sets a trainer_profile_id', () => {
    const db = makeDb()
    db.prepare('INSERT INTO trainer_profiles (game, ot_name, tid, sid) VALUES (?, ?, ?, ?)').run(
      'Pokémon Sword',
      'Ash',
      1,
      2
    )
    expect(() =>
      db
        .prepare('INSERT INTO storage_locations (location_type, name, trainer_profile_id) VALUES (?, ?, 1)')
        .run('home', 'My HOME Account')
    ).toThrow()
  })

  it('allows a save_file storage_locations row with a trainer_profile_id', () => {
    const db = makeDb()
    const trainer = db
      .prepare('INSERT INTO trainer_profiles (game, ot_name, tid, sid) VALUES (?, ?, ?, ?)')
      .run('Pokémon Sword', 'Ash', 1, 2)
    expect(() =>
      db
        .prepare('INSERT INTO storage_locations (location_type, name, trainer_profile_id) VALUES (?, ?, ?)')
        .run('save_file', 'Sword Box 1', trainer.lastInsertRowid)
    ).not.toThrow()
  })

  it('allows a collection_entries row with null origin/nickname fields (the pre-Leg-4 default)', () => {
    const db = makeDb()
    db.prepare('INSERT INTO species (id, name, generation) VALUES (1, \'bulbasaur\', 1)').run()
    db.prepare(
      `INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
       VALUES (1, 'base', 'dex_distinct', 1)`
    ).run()
    expect(() =>
      db.prepare('INSERT INTO collection_entries (form_id, gender, shiny) VALUES (1, \'unknown\', 0)').run()
    ).not.toThrow()
    const row = db.prepare('SELECT * FROM collection_entries').get() as Record<string, unknown>
    expect(row.trainer_profile_id).toBeNull()
    expect(row.origin_game).toBeNull()
    expect(row.ot_name).toBeNull()
    expect(row.tid).toBeNull()
    expect(row.sid).toBeNull()
    expect(row.language).toBeNull()
    expect(row.nickname).toBeNull()
    expect(row.caught_ball).toBeNull()
    expect(row.storage_location_id).toBeNull()
    expect(row.met_location).toBeNull()
  })

  it('rejects a collection_entries tid past the 6-digit range via the CHECK constraint', () => {
    const db = makeDb()
    db.prepare('INSERT INTO species (id, name, generation) VALUES (1, \'bulbasaur\', 1)').run()
    db.prepare(
      `INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
       VALUES (1, 'base', 'dex_distinct', 1)`
    ).run()
    expect(() =>
      db
        .prepare('INSERT INTO collection_entries (form_id, gender, shiny, tid) VALUES (1, \'unknown\', 0, ?)')
        .run(1_000_000)
    ).toThrow()
  })

  it('rejects a collection_entries sid past the 6-digit range via the CHECK constraint', () => {
    const db = makeDb()
    db.prepare('INSERT INTO species (id, name, generation) VALUES (1, \'bulbasaur\', 1)').run()
    db.prepare(
      `INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
       VALUES (1, 'base', 'dex_distinct', 1)`
    ).run()
    expect(() =>
      db
        .prepare('INSERT INTO collection_entries (form_id, gender, shiny, sid) VALUES (1, \'unknown\', 0, ?)')
        .run(1_000_000)
    ).toThrow()
  })

  it('rejects a collection_entries trainer_profile_id that has no matching trainer_profiles row', () => {
    const db = makeDb()
    db.prepare('INSERT INTO species (id, name, generation) VALUES (1, \'bulbasaur\', 1)').run()
    db.prepare(
      `INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
       VALUES (1, 'base', 'dex_distinct', 1)`
    ).run()
    expect(() =>
      db
        .prepare('INSERT INTO collection_entries (form_id, gender, shiny, trainer_profile_id) VALUES (1, \'unknown\', 0, ?)')
        .run(999)
    ).toThrow()
  })

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

  it('allows a species row with a null collapsed_display_form_id (the default)', () => {
    const db = makeDb()
    db.prepare('INSERT INTO species (id, name, generation) VALUES (1, \'bulbasaur\', 1)').run()
    const row = db.prepare('SELECT collapsed_display_form_id FROM species WHERE id = 1').get() as {
      collapsed_display_form_id: number | null
    }
    expect(row.collapsed_display_form_id).toBeNull()
  })

  it('retrofits collapsed_display_form_id onto a species table that predates Leg 27', () => {
    const db = new Database(':memory:')
    db.exec(`
      CREATE TABLE species (id INTEGER PRIMARY KEY, name TEXT NOT NULL, generation INTEGER NOT NULL);
      INSERT INTO species (id, name, generation) VALUES (1, 'bulbasaur', 1);
    `)

    applySchema(db)

    const columns = db.prepare('PRAGMA table_info(species)').all() as Array<{ name: string }>
    expect(columns.some((c) => c.name === 'collapsed_display_form_id')).toBe(true)
    const row = db.prepare('SELECT * FROM species WHERE id = 1').get() as Record<string, unknown>
    expect(row.name).toBe('bulbasaur')
    expect(row.collapsed_display_form_id).toBeNull()
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
})
