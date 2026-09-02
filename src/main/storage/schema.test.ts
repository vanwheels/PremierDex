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
    expect(tables).toEqual(['collection_entries', 'forms', 'species', 'storage_locations', 'trainer_profiles'])
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

  it('enforces one collection_entries row per (form_id, gender, shiny)', () => {
    const db = makeDb()
    db.prepare('INSERT INTO species (id, name, generation) VALUES (1, \'bulbasaur\', 1)').run()
    db.prepare(
      `INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
       VALUES (1, 'base', 'dex_distinct', 1)`
    ).run()
    db.prepare('INSERT INTO collection_entries (form_id, gender, shiny) VALUES (1, \'unknown\', 0)').run()
    expect(() =>
      db.prepare('INSERT INTO collection_entries (form_id, gender, shiny) VALUES (1, \'unknown\', 0)').run()
    ).toThrow()
  })

  it('rejects a trainer_profiles tid past the 6-digit range via the CHECK constraint', () => {
    const db = makeDb()
    expect(() =>
      db
        .prepare('INSERT INTO trainer_profiles (game, ot_name, tid, sid) VALUES (?, ?, ?, ?)')
        .run('Pokémon Scarlet', 'Ash', 1_000_000, 0)
    ).toThrow()
  })

  it('rejects a trainer_profiles sid past the 4-digit range via the CHECK constraint', () => {
    const db = makeDb()
    expect(() =>
      db
        .prepare('INSERT INTO trainer_profiles (game, ot_name, tid, sid) VALUES (?, ?, ?, ?)')
        .run('Pokémon Scarlet', 'Ash', 0, 4295)
    ).toThrow()
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
    expect(row.nickname).toBeNull()
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

  it('rejects a collection_entries sid past the 4-digit range via the CHECK constraint', () => {
    const db = makeDb()
    db.prepare('INSERT INTO species (id, name, generation) VALUES (1, \'bulbasaur\', 1)').run()
    db.prepare(
      `INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
       VALUES (1, 'base', 'dex_distinct', 1)`
    ).run()
    expect(() =>
      db.prepare('INSERT INTO collection_entries (form_id, gender, shiny, sid) VALUES (1, \'unknown\', 0, ?)').run(4295)
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
})
