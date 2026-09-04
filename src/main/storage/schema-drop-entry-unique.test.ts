import { describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { applySchema } from './schema'

/**
 * Leg 2 of the Box Arrangement/Real Inventory Data Model milestone dropped
 * collection_entries' UNIQUE(form_id, gender, shiny) constraint — split out from
 * schema.test.ts to keep that file under the project's line-count soft cap, same
 * reasoning as schema-ball.test.ts/schema-language.test.ts. Covers the rebuild that
 * strips the constraint from a pre-Leg-2 database while preserving existing rows.
 */
function seedOneForm(db: Database.Database): void {
  db.prepare("INSERT INTO species (id, name, generation) VALUES (1, 'bulbasaur', 1)").run()
  db.prepare(
    `INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
     VALUES (1, 'base', 'dex_distinct', 1)`
  ).run()
}

describe('collection_entries UNIQUE(form_id, gender, shiny) removal', () => {
  it('drops the constraint via rebuild on a pre-Leg-2 table, preserving existing rows', () => {
    // Simulates an install that already ran every retrofit through Leg 5 (caught_ball's
    // Legends Arceus widen) but predates this leg — every column present, constraint
    // still there.
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
        caught_ball TEXT,
        storage_location_id INTEGER REFERENCES storage_locations(id),
        met_location TEXT,
        UNIQUE(form_id, gender, shiny)
      );
    `)
    seedOneForm(db)
    db.prepare(
      "INSERT INTO collection_entries_old (form_id, gender, shiny, owned, nickname) VALUES (1, 'unknown', 0, 1, 'Buddy')"
    ).run()
    db.exec('DROP TABLE collection_entries; ALTER TABLE collection_entries_old RENAME TO collection_entries;')

    applySchema(db)

    const rows = db.prepare('SELECT * FROM collection_entries').all() as Array<Record<string, unknown>>
    expect(rows).toHaveLength(1)
    expect(rows[0].owned).toBe(1)
    expect(rows[0].nickname).toBe('Buddy')

    // The whole point of the rebuild: a second row for the exact same (form_id, gender,
    // shiny) — a duplicate owned copy — no longer collides.
    expect(() =>
      db.prepare("INSERT INTO collection_entries (form_id, gender, shiny, owned) VALUES (1, 'unknown', 0, 1)").run()
    ).not.toThrow()
    const count = (db.prepare('SELECT COUNT(*) AS n FROM collection_entries').get() as { n: number }).n
    expect(count).toBe(2)
  })

  it('is a no-op on a fresh install (no constraint to drop)', () => {
    const db = new Database(':memory:')
    applySchema(db)
    seedOneForm(db)
    db.prepare("INSERT INTO collection_entries (form_id, gender, shiny, owned) VALUES (1, 'unknown', 0, 1)").run()

    expect(() => applySchema(db)).not.toThrow()
    expect(
      db.prepare('SELECT sql FROM sqlite_master WHERE type = \'table\' AND name = \'collection_entries\'').get()
    ).not.toBeUndefined()
    expect(() =>
      db.prepare("INSERT INTO collection_entries (form_id, gender, shiny, owned) VALUES (1, 'unknown', 0, 1)").run()
    ).not.toThrow()
  })
})
