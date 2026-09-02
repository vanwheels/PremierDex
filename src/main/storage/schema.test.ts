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
    expect(tables).toEqual(['collection_entries', 'forms', 'species', 'trainer_profiles'])
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

  it('rejects a trainer_profiles tid outside the 16-bit range via the CHECK constraint', () => {
    const db = makeDb()
    expect(() =>
      db
        .prepare('INSERT INTO trainer_profiles (game, ot_name, tid, sid) VALUES (?, ?, ?, ?)')
        .run('Pokémon Sword', 'Ash', 70000, 0)
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
})
