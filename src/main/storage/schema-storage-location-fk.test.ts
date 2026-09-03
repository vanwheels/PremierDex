import { describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { applySchema } from './schema'

/**
 * Leg 3 of the nav-restructuring milestone's `storage_location_id` (nullable FK onto
 * storage_locations) and `met_location` (free text) columns on collection_entries —
 * split out from schema.test.ts, same reasoning as schema-ball.test.ts. Covers the FK
 * enforcement and the ALTER TABLE retrofit for a pre-Leg-3 database that already has
 * collection_entries and storage_locations but neither column yet.
 */
function makeDb() {
  const db = new Database(':memory:')
  applySchema(db)
  return db
}

function seedOneFormAndLocation(db: Database.Database): void {
  db.prepare("INSERT INTO species (id, name, generation) VALUES (1, 'bulbasaur', 1)").run()
  db.prepare(
    `INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
     VALUES (1, 'base', 'dex_distinct', 1)`
  ).run()
  db.prepare("INSERT INTO storage_locations (location_type, name) VALUES ('home', 'My HOME Account')").run()
}

describe('collection_entries.storage_location_id / met_location', () => {
  it('rejects a storage_location_id that does not reference an existing storage_locations row', () => {
    const db = makeDb()
    seedOneFormAndLocation(db)
    expect(() =>
      db
        .prepare('INSERT INTO collection_entries (form_id, gender, shiny, storage_location_id) VALUES (1, ?, 0, ?)')
        .run('unknown', 999)
    ).toThrow()
  })

  it('allows a storage_location_id that references an existing storage_locations row', () => {
    const db = makeDb()
    seedOneFormAndLocation(db)
    expect(() =>
      db
        .prepare('INSERT INTO collection_entries (form_id, gender, shiny, storage_location_id) VALUES (1, ?, 0, ?)')
        .run('unknown', 1)
    ).not.toThrow()
  })

  it('allows a null storage_location_id and a free-text met_location', () => {
    const db = makeDb()
    seedOneFormAndLocation(db)
    expect(() =>
      db
        .prepare("INSERT INTO collection_entries (form_id, gender, shiny, met_location) VALUES (1, 'unknown', 0, ?)")
        .run('Route 1')
    ).not.toThrow()
  })

  it('adds both columns via retrofit onto a pre-Leg-3 collection_entries table', () => {
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
      CREATE TABLE storage_locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location_type TEXT NOT NULL,
        name TEXT NOT NULL,
        trainer_profile_id INTEGER
      );
      CREATE TABLE collection_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_id INTEGER NOT NULL REFERENCES forms(id),
        gender TEXT NOT NULL DEFAULT 'unknown',
        shiny INTEGER NOT NULL DEFAULT 0,
        owned INTEGER NOT NULL DEFAULT 0,
        origin_game TEXT,
        ot_name TEXT,
        tid INTEGER,
        sid INTEGER,
        language TEXT,
        nickname TEXT,
        caught_ball TEXT,
        UNIQUE(form_id, gender, shiny)
      );
      INSERT INTO species (id, name, generation) VALUES (1, 'bulbasaur', 1);
      INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
        VALUES (1, 'base', 'dex_distinct', 1);
      INSERT INTO storage_locations (location_type, name) VALUES ('home', 'My HOME Account');
      INSERT INTO collection_entries (form_id, gender, shiny) VALUES (1, 'unknown', 0);
    `)

    applySchema(db)

    const row = db.prepare('SELECT * FROM collection_entries').get() as Record<string, unknown>
    expect(row.storage_location_id).toBeNull()
    expect(row.met_location).toBeNull()
    expect(() =>
      db.prepare('UPDATE collection_entries SET storage_location_id = 1, met_location = ? WHERE id = ?').run('Route 1', row.id)
    ).not.toThrow()
  })
})
