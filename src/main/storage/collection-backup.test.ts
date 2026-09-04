import { describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { applySchema } from './schema'
import { createBackupOperations } from './collection-backup'

/**
 * Leg 5 of the Box Arrangement/Real Inventory Data Model milestone: exportCollection/
 * importCollection's natural-key matching used to collapse to formId/gender/shiny alone,
 * which was safe only because the DB guaranteed exactly one row per combination pre-Leg-2.
 * Split into its own file (rather than added to sqlite-storage.test.ts) since exercising
 * duplicate rows needs direct SQL against collection_entries — nothing in the app can
 * create a second individual yet (that's Leg 7) — same raw-DB style as
 * schema-drop-entry-unique.test.ts, which covers the migration that made this possible.
 */
function seedOneForm(db: Database.Database): void {
  db.prepare("INSERT INTO species (id, name, generation) VALUES (1, 'bulbasaur', 1)").run()
  db.prepare(
    `INSERT INTO forms (species_id, form_name, form_category, first_available_generation)
     VALUES (1, 'base', 'dex_distinct', 1)`
  ).run()
}

/** Inserts a collection_entries row directly, bypassing the (not-yet-built) app API for
 * adding a duplicate individual. Rows insert in call order, so id order == call order. */
function insertEntry(
  db: Database.Database,
  opts: { formId?: number; gender?: string; shiny?: 0 | 1; owned?: 0 | 1; nickname?: string | null }
): number {
  const { formId = 1, gender = 'unknown', shiny = 0, owned = 0, nickname = null } = opts
  const result = db
    .prepare('INSERT INTO collection_entries (form_id, gender, shiny, owned, nickname) VALUES (?, ?, ?, ?, ?)')
    .run(formId, gender, shiny, owned, nickname)
  return Number(result.lastInsertRowid)
}

function getEntry(db: Database.Database, id: number): { owned: number; nickname: string | null } {
  return db.prepare('SELECT owned, nickname FROM collection_entries WHERE id = ?').get(id) as {
    owned: number
    nickname: string | null
  }
}

function countEntries(db: Database.Database): number {
  return (db.prepare('SELECT COUNT(*) AS n FROM collection_entries').get() as { n: number }).n
}

describe('collection-backup duplicate-individual matching (Leg 5)', () => {
  it('lines up duplicates with their target-DB counterpart by id-order position', async () => {
    const source = new Database(':memory:')
    applySchema(source)
    seedOneForm(source)
    insertEntry(source, { owned: 1, nickname: 'First' })
    insertEntry(source, { owned: 0, nickname: 'Second' })
    const exported = await createBackupOperations(source).exportCollection()

    // A fresh install where a duplicate was already added (e.g. by a prior version, or
    // hand-seeded here to simulate Leg 7's not-yet-built add-duplicate flow) — two rows
    // for the same form/gender/shiny, inserted in the same relative order.
    const target = new Database(':memory:')
    applySchema(target)
    seedOneForm(target)
    const targetFirst = insertEntry(target, {})
    const targetSecond = insertEntry(target, {})

    const result = await createBackupOperations(target).importCollection(exported)

    expect(result).toEqual({ matched: 2, skipped: 0 })
    expect(getEntry(target, targetFirst)).toEqual({ owned: 1, nickname: 'First' })
    expect(getEntry(target, targetSecond)).toEqual({ owned: 0, nickname: 'Second' })
  })

  it('drops the extra individual when the backup has more copies than the target has rows for', async () => {
    const source = new Database(':memory:')
    applySchema(source)
    seedOneForm(source)
    insertEntry(source, { owned: 1, nickname: 'First' })
    insertEntry(source, { owned: 1, nickname: 'Second' })
    const exported = await createBackupOperations(source).exportCollection()

    // Freshly seeded target: only the one placeholder row exists for this group.
    const target = new Database(':memory:')
    applySchema(target)
    seedOneForm(target)
    const onlyRow = insertEntry(target, {})

    const result = await createBackupOperations(target).importCollection(exported)

    // Both backup entries still resolve to a real form (matched counts by form existence,
    // not by whether a target row ended up receiving the data) — but only ordinal #0 had
    // a row to write into.
    expect(result).toEqual({ matched: 2, skipped: 0 })
    expect(getEntry(target, onlyRow)).toEqual({ owned: 1, nickname: 'First' })
    expect(countEntries(target)).toBe(1)
  })

  it('resets the target extra copy to defaults when the backup has fewer copies for that group', async () => {
    const source = new Database(':memory:')
    applySchema(source)
    seedOneForm(source)
    insertEntry(source, { owned: 1, nickname: 'Only' })
    const exported = await createBackupOperations(source).exportCollection()

    // Target already has two individuals for this group (again simulating Leg 7's
    // not-yet-built flow); the backup only accounts for one.
    const target = new Database(':memory:')
    applySchema(target)
    seedOneForm(target)
    const targetFirst = insertEntry(target, {})
    const targetSecond = insertEntry(target, { owned: 1, nickname: 'Local-only' })

    const result = await createBackupOperations(target).importCollection(exported)

    expect(result).toEqual({ matched: 1, skipped: 0 })
    expect(getEntry(target, targetFirst)).toEqual({ owned: 1, nickname: 'Only' })
    expect(getEntry(target, targetSecond)).toEqual({ owned: 0, nickname: null })
  })
})
