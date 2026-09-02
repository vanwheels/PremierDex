import { describe, expect, it, vi } from 'vitest'
import Database from 'better-sqlite3'
import { applySchema } from './schema'

// runSeed pulls real species/forms via load-species-data.ts, which resolves paths off
// Electron's app.isPackaged — doesn't hold under plain vitest. Stub with a minimal
// fixture, same pattern as sqlite-storage.test.ts.
vi.mock('./load-species-data', () => ({
  loadSpeciesData: () => [{ id: 1, name: 'bulbasaur', generation: 1 }],
  loadFormsData: () => [
    {
      speciesId: 1,
      formName: 'base',
      formCategory: 'dex_distinct',
      homeBoxable: true,
      shinyLocked: false,
      hasGenderDifference: false,
      firstAvailableGeneration: 1,
      regionalGroup: null,
      pokeapiId: 1,
      spriteFormSuffix: null
    }
  ]
}))

const { runSeed } = await import('./seed')

function makeDb() {
  const db = new Database(':memory:')
  applySchema(db)
  return db
}

describe('runSeed', () => {
  it('prunes a pre-Leg-7 excluded form row and its collection_entries', () => {
    const db = makeDb()

    // Simulate a db seeded before Leg 7: a row for Pikachu's Let's Go "starter" form
    // (species 25, form_name "starter") — one of PRUNED_FORM_KEYS's pairs — with an
    // owned collection_entries row attached, the way a real pre-Leg-7 install would have.
    db.prepare('INSERT INTO species (id, name, generation) VALUES (25, ?, ?)').run('pikachu', 1)
    db.prepare(
      `INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
       VALUES (25, 'starter', 'dex_distinct', 7)`
    ).run()
    const formId = (
      db.prepare("SELECT id FROM forms WHERE species_id = 25 AND form_name = 'starter'").get() as {
        id: number
      }
    ).id
    db.prepare('INSERT INTO collection_entries (form_id, gender, shiny, owned) VALUES (?, ?, ?, ?)').run(
      formId,
      'unknown',
      0,
      1
    )

    runSeed(db)

    expect(db.prepare("SELECT 1 FROM forms WHERE species_id = 25 AND form_name = 'starter'").get()).toBeUndefined()
    expect(db.prepare('SELECT 1 FROM collection_entries WHERE form_id = ?').get(formId)).toBeUndefined()
  })

  it('leaves non-excluded forms and their collection_entries untouched', () => {
    const db = makeDb()
    runSeed(db)

    const bulbasaurBase = db.prepare("SELECT id FROM forms WHERE species_id = 1 AND form_name = 'base'").get() as {
      id: number
    }
    expect(bulbasaurBase).toBeDefined()
    expect((db.prepare('SELECT COUNT(*) AS n FROM collection_entries WHERE form_id = ?').get(bulbasaurBase.id) as {
      n: number
    }).n).toBeGreaterThan(0)
  })

  it('is safe to run when no pruned rows are present (idempotent)', () => {
    const db = makeDb()
    expect(() => runSeed(db)).not.toThrow()
    expect(() => runSeed(db)).not.toThrow()
  })

  it('backfills a stale home_boxable value on a row that already existed', () => {
    const db = makeDb()

    // Simulate a row seeded with the wrong value (e.g. from before forms.json's
    // OVERRIDES existed, or a stale local db) — INSERT OR IGNORE means runSeed's own
    // insertForm won't touch an existing row, so only the backfill can correct it.
    // The fixture's bulbasaur/base has homeBoxable: true; seed this row with 0.
    db.prepare('INSERT INTO species (id, name, generation) VALUES (1, ?, ?)').run('bulbasaur', 1)
    db.prepare(
      `INSERT INTO forms (species_id, form_name, form_category, home_boxable, first_available_generation)
       VALUES (1, 'base', 'dex_distinct', 0, 1)`
    ).run()

    runSeed(db)

    const row = db.prepare("SELECT home_boxable FROM forms WHERE species_id = 1 AND form_name = 'base'").get() as {
      home_boxable: number
    }
    expect(row.home_boxable).toBe(1)
  })

  it('backfills a stale shiny_locked value on a row that already existed', () => {
    const db = makeDb()

    // Same reasoning as the home_boxable backfill test above: INSERT OR IGNORE won't
    // touch an existing row, so only the backfill can correct a stale value. The
    // fixture's bulbasaur/base has shinyLocked: false; seed this row with 1.
    db.prepare('INSERT INTO species (id, name, generation) VALUES (1, ?, ?)').run('bulbasaur', 1)
    db.prepare(
      `INSERT INTO forms (species_id, form_name, form_category, shiny_locked, first_available_generation)
       VALUES (1, 'base', 'dex_distinct', 1, 1)`
    ).run()

    runSeed(db)

    const row = db.prepare("SELECT shiny_locked FROM forms WHERE species_id = 1 AND form_name = 'base'").get() as {
      shiny_locked: number
    }
    expect(row.shiny_locked).toBe(0)
  })
})
