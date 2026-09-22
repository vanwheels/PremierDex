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
      'collection_entry_marks',
      'collection_entry_ribbons',
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
    expect(row.is_alpha).toBe(0)
    expect(row.capture_date).toBeNull()
    expect(row.size_class).toBeNull()
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

  it('defaults a fresh species row to is_final_evolution_stage = 1', () => {
    const db = makeDb()
    db.prepare('INSERT INTO species (id, name, generation) VALUES (1, \'bulbasaur\', 1)').run()
    const row = db.prepare('SELECT is_final_evolution_stage FROM species WHERE id = 1').get() as {
      is_final_evolution_stage: number
    }
    expect(row.is_final_evolution_stage).toBe(1)
  })

  it('retrofits is_final_evolution_stage onto a species table that predates Leg 5 of the Dex completeness tier migration', () => {
    const db = new Database(':memory:')
    db.exec(`
      CREATE TABLE species (id INTEGER PRIMARY KEY, name TEXT NOT NULL, generation INTEGER NOT NULL);
      INSERT INTO species (id, name, generation) VALUES (1, 'bulbasaur', 1);
    `)

    applySchema(db)

    const columns = db.prepare('PRAGMA table_info(species)').all() as Array<{ name: string }>
    expect(columns.some((c) => c.name === 'is_final_evolution_stage')).toBe(true)
    const row = db.prepare('SELECT * FROM species WHERE id = 1').get() as Record<string, unknown>
    expect(row.name).toBe('bulbasaur')
    expect(row.is_final_evolution_stage).toBe(1)
  })

  it('allows several ribbons on one collection_entries row (Leg 4)', () => {
    const db = makeDb()
    db.prepare('INSERT INTO species (id, name, generation) VALUES (1, \'bulbasaur\', 1)').run()
    db.prepare(
      `INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
       VALUES (1, 'base', 'dex_distinct', 1)`
    ).run()
    const entry = db.prepare('INSERT INTO collection_entries (form_id, gender, shiny) VALUES (1, \'unknown\', 0)').run()
    db.prepare('INSERT INTO collection_entry_ribbons (entry_id, ribbon_name) VALUES (?, ?)').run(
      entry.lastInsertRowid,
      'Champion Ribbon'
    )
    expect(() =>
      db
        .prepare('INSERT INTO collection_entry_ribbons (entry_id, ribbon_name) VALUES (?, ?)')
        .run(entry.lastInsertRowid, 'Effort Ribbon')
    ).not.toThrow()
    const count = (
      db.prepare('SELECT COUNT(*) AS n FROM collection_entry_ribbons WHERE entry_id = ?').get(entry.lastInsertRowid) as {
        n: number
      }
    ).n
    expect(count).toBe(2)
  })

  it('rejects a ribbon_name outside the fixed placeholder list via the CHECK constraint', () => {
    const db = makeDb()
    db.prepare('INSERT INTO species (id, name, generation) VALUES (1, \'bulbasaur\', 1)').run()
    db.prepare(
      `INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
       VALUES (1, 'base', 'dex_distinct', 1)`
    ).run()
    const entry = db.prepare('INSERT INTO collection_entries (form_id, gender, shiny) VALUES (1, \'unknown\', 0)').run()
    expect(() =>
      db
        .prepare('INSERT INTO collection_entry_ribbons (entry_id, ribbon_name) VALUES (?, ?)')
        .run(entry.lastInsertRowid, 'Not A Real Ribbon')
    ).toThrow()
  })

  it('rejects a duplicate (entry_id, ribbon_name) pair via the UNIQUE constraint', () => {
    const db = makeDb()
    db.prepare('INSERT INTO species (id, name, generation) VALUES (1, \'bulbasaur\', 1)').run()
    db.prepare(
      `INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
       VALUES (1, 'base', 'dex_distinct', 1)`
    ).run()
    const entry = db.prepare('INSERT INTO collection_entries (form_id, gender, shiny) VALUES (1, \'unknown\', 0)').run()
    db.prepare('INSERT INTO collection_entry_ribbons (entry_id, ribbon_name) VALUES (?, ?)').run(
      entry.lastInsertRowid,
      'Champion Ribbon'
    )
    expect(() =>
      db
        .prepare('INSERT INTO collection_entry_ribbons (entry_id, ribbon_name) VALUES (?, ?)')
        .run(entry.lastInsertRowid, 'Champion Ribbon')
    ).toThrow()
  })

  it('allows more than one Mark on one collection_entries row (e.g. Jumbo + Partner coexisting)', () => {
    const db = makeDb()
    db.prepare('INSERT INTO species (id, name, generation) VALUES (1, \'bulbasaur\', 1)').run()
    db.prepare(
      `INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
       VALUES (1, 'base', 'dex_distinct', 1)`
    ).run()
    const entry = db.prepare('INSERT INTO collection_entries (form_id, gender, shiny) VALUES (1, \'unknown\', 0)').run()
    db.prepare('INSERT INTO collection_entry_marks (entry_id, mark_name) VALUES (?, ?)').run(
      entry.lastInsertRowid,
      'Jumbo Mark'
    )
    expect(() =>
      db
        .prepare('INSERT INTO collection_entry_marks (entry_id, mark_name) VALUES (?, ?)')
        .run(entry.lastInsertRowid, 'Partner Mark')
    ).not.toThrow()
  })

  it('rejects a mark_name outside the fixed placeholder list via the CHECK constraint', () => {
    const db = makeDb()
    db.prepare('INSERT INTO species (id, name, generation) VALUES (1, \'bulbasaur\', 1)').run()
    db.prepare(
      `INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
       VALUES (1, 'base', 'dex_distinct', 1)`
    ).run()
    const entry = db.prepare('INSERT INTO collection_entries (form_id, gender, shiny) VALUES (1, \'unknown\', 0)').run()
    expect(() =>
      db
        .prepare('INSERT INTO collection_entry_marks (entry_id, mark_name) VALUES (?, ?)')
        .run(entry.lastInsertRowid, 'Not A Real Mark')
    ).toThrow()
  })

  it('cascade-deletes ribbons/marks when their collection_entries row is deleted', () => {
    const db = makeDb()
    db.pragma('foreign_keys = ON')
    db.prepare('INSERT INTO species (id, name, generation) VALUES (1, \'bulbasaur\', 1)').run()
    db.prepare(
      `INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
       VALUES (1, 'base', 'dex_distinct', 1)`
    ).run()
    const entry = db.prepare('INSERT INTO collection_entries (form_id, gender, shiny) VALUES (1, \'unknown\', 0)').run()
    db.prepare('INSERT INTO collection_entry_ribbons (entry_id, ribbon_name) VALUES (?, ?)').run(
      entry.lastInsertRowid,
      'Champion Ribbon'
    )
    db.prepare('INSERT INTO collection_entry_marks (entry_id, mark_name) VALUES (?, ?)').run(
      entry.lastInsertRowid,
      'Jumbo Mark'
    )

    db.prepare('DELETE FROM collection_entries WHERE id = ?').run(entry.lastInsertRowid)

    const ribbonCount = (
      db.prepare('SELECT COUNT(*) AS n FROM collection_entry_ribbons').get() as { n: number }
    ).n
    const markCount = (db.prepare('SELECT COUNT(*) AS n FROM collection_entry_marks').get() as { n: number }).n
    expect(ribbonCount).toBe(0)
    expect(markCount).toBe(0)
  })
})
