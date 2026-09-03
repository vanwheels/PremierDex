import { describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { applySchema } from './schema'

/**
 * Leg 14's `language` column — split out from schema.test.ts to keep that file under
 * the project's line-count soft cap rather than growing it further. Covers the CHECK
 * constraint (a closed set, unlike `game` — see schema.ts) on both trainer_profiles and
 * collection_entries, plus the ALTER TABLE retrofit for a pre-Leg-14 database that
 * already has both tables but neither column yet.
 */
function makeDb() {
  const db = new Database(':memory:')
  applySchema(db)
  return db
}

describe('trainer_profiles.language', () => {
  it('rejects a language value outside the fixed in-game language list', () => {
    const db = makeDb()
    expect(() =>
      db
        .prepare('INSERT INTO trainer_profiles (game, ot_name, language) VALUES (?, ?, ?)')
        .run('Pokémon Scarlet', 'Ash', 'Klingon')
    ).toThrow()
  })

  it('allows a language value from the fixed list', () => {
    const db = makeDb()
    expect(() =>
      db
        .prepare('INSERT INTO trainer_profiles (game, ot_name, language) VALUES (?, ?, ?)')
        .run('Pokémon Scarlet', 'Ash', 'Japanese')
    ).not.toThrow()
  })

  it('allows a null language', () => {
    const db = makeDb()
    expect(() =>
      db.prepare('INSERT INTO trainer_profiles (game, ot_name, language) VALUES (?, ?, ?)').run('Pokémon GO', 'Ash', null)
    ).not.toThrow()
  })

  it('adds the language column via retrofit onto a pre-Leg-14 trainer_profiles table', () => {
    const db = new Database(':memory:')
    db.exec(`
      CREATE TABLE trainer_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game TEXT NOT NULL,
        ot_name TEXT NOT NULL,
        tid INTEGER CHECK (tid IS NULL OR tid BETWEEN 0 AND 999999),
        sid INTEGER CHECK (sid IS NULL OR sid BETWEEN 0 AND 999999),
        label TEXT
      );
    `)
    const inserted = db
      .prepare('INSERT INTO trainer_profiles (game, ot_name, tid, sid, label) VALUES (?, ?, ?, ?, ?)')
      .run('Pokémon Black', 'Ash', 1, 2, null)

    applySchema(db)

    const row = db.prepare('SELECT * FROM trainer_profiles WHERE id = ?').get(inserted.lastInsertRowid) as Record<
      string,
      unknown
    >
    expect(row.language).toBeNull()
    expect(() =>
      db.prepare('UPDATE trainer_profiles SET language = ? WHERE id = ?').run('English', inserted.lastInsertRowid)
    ).not.toThrow()
  })
})

describe('collection_entries.language', () => {
  function seedOneForm(db: Database.Database): void {
    db.prepare("INSERT INTO species (id, name, generation) VALUES (1, 'bulbasaur', 1)").run()
    db.prepare(
      `INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
       VALUES (1, 'base', 'dex_distinct', 1)`
    ).run()
  }

  it('rejects a language value outside the fixed in-game language list', () => {
    const db = makeDb()
    seedOneForm(db)
    expect(() =>
      db
        .prepare("INSERT INTO collection_entries (form_id, gender, shiny, language) VALUES (1, 'unknown', 0, ?)")
        .run('Klingon')
    ).toThrow()
  })

  it('allows a language value from the fixed list', () => {
    const db = makeDb()
    seedOneForm(db)
    expect(() =>
      db
        .prepare("INSERT INTO collection_entries (form_id, gender, shiny, language) VALUES (1, 'unknown', 0, ?)")
        .run('English')
    ).not.toThrow()
  })

  it('adds the language column via retrofit onto a pre-Leg-14 collection_entries table', () => {
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
    expect(row.language).toBeNull()
    expect(() =>
      db.prepare('UPDATE collection_entries SET language = ? WHERE id = ?').run('French', row.id)
    ).not.toThrow()
  })
})
