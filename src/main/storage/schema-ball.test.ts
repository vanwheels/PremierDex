import { describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { applySchema } from './schema'

/**
 * Leg 28's `caught_ball` column — split out from schema.test.ts to keep that file under
 * the project's line-count soft cap, same reasoning as schema-language.test.ts. Covers
 * the CHECK constraint (a closed set, same as `language` — see shared/data/poke-balls.ts)
 * and the ALTER TABLE retrofit for a pre-Leg-28 database that already has
 * collection_entries but not this column. collection_entries only: a ball is per-catch,
 * not per-trainer, so trainer_profiles never gets this column.
 */
function makeDb() {
  const db = new Database(':memory:')
  applySchema(db)
  return db
}

function seedOneForm(db: Database.Database): void {
  db.prepare("INSERT INTO species (id, name, generation) VALUES (1, 'bulbasaur', 1)").run()
  db.prepare(
    `INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
     VALUES (1, 'base', 'dex_distinct', 1)`
  ).run()
}

describe('collection_entries.caught_ball', () => {
  it('rejects a ball value outside the fixed Poké Ball list', () => {
    const db = makeDb()
    seedOneForm(db)
    expect(() =>
      db
        .prepare("INSERT INTO collection_entries (form_id, gender, shiny, caught_ball) VALUES (1, 'unknown', 0, ?)")
        .run('Pizza Ball')
    ).toThrow()
  })

  it('allows a ball value from the fixed list', () => {
    const db = makeDb()
    seedOneForm(db)
    expect(() =>
      db
        .prepare("INSERT INTO collection_entries (form_id, gender, shiny, caught_ball) VALUES (1, 'unknown', 0, ?)")
        .run('Great Ball')
    ).not.toThrow()
  })

  it('allows a null ball', () => {
    const db = makeDb()
    seedOneForm(db)
    expect(() =>
      db.prepare("INSERT INTO collection_entries (form_id, gender, shiny, caught_ball) VALUES (1, 'unknown', 0, ?)").run(null)
    ).not.toThrow()
  })

  it('adds the caught_ball column via retrofit onto a pre-Leg-28 collection_entries table', () => {
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
        tid INTEGER,
        sid INTEGER,
        language TEXT,
        nickname TEXT,
        UNIQUE(form_id, gender, shiny)
      );
      INSERT INTO species (id, name, generation) VALUES (1, 'bulbasaur', 1);
      INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
        VALUES (1, 'base', 'dex_distinct', 1);
      INSERT INTO collection_entries (form_id, gender, shiny) VALUES (1, 'unknown', 0);
    `)

    applySchema(db)

    const row = db.prepare('SELECT * FROM collection_entries').get() as Record<string, unknown>
    expect(row.caught_ball).toBeNull()
    expect(() =>
      db.prepare('UPDATE collection_entries SET caught_ball = ? WHERE id = ?').run('Ultra Ball', row.id)
    ).not.toThrow()
  })

  it('widens a pre-Leg-5 caught_ball CHECK (missing Legends Arceus balls) via rebuild, preserving data', () => {
    // Simulates an install that already ran the Leg 28 retrofit before Leg 5 added
    // Legends Arceus's balls to POKE_BALLS: caught_ball exists, but its CHECK list is the
    // old, narrower one (no 'Origin Ball').
    const db = new Database(':memory:')
    applySchema(db)
    db.exec(`
      CREATE TABLE collection_entries_old (
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
        language TEXT,
        caught_ball TEXT CHECK (caught_ball IS NULL OR caught_ball IN ('Poké Ball', 'Great Ball', 'Ultra Ball')),
        storage_location_id INTEGER REFERENCES storage_locations(id),
        met_location TEXT,
        UNIQUE(form_id, gender, shiny)
      );
    `)
    seedOneForm(db)
    db.prepare("INSERT INTO collection_entries_old (form_id, gender, shiny, caught_ball) VALUES (1, 'unknown', 0, 'Great Ball')").run()
    db.exec('DROP TABLE collection_entries; ALTER TABLE collection_entries_old RENAME TO collection_entries;')

    applySchema(db)

    const row = db.prepare('SELECT * FROM collection_entries').get() as Record<string, unknown>
    expect(row.caught_ball).toBe('Great Ball')
    expect(() =>
      db.prepare('UPDATE collection_entries SET caught_ball = ? WHERE id = ?').run('Origin Ball', row.id)
    ).not.toThrow()
  })
})
