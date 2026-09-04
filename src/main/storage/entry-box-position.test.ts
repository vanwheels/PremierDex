import { describe, expect, it, vi } from 'vitest'

// Same reasoning as entry-storage-location.test.ts: a small self-contained fixture so a
// real collection_entries row exists to assign a box position to, without touching the
// real ~1500-species dataset.
vi.mock('./load-species-data', () => ({
  loadSpeciesData: () => [{ id: 1, name: 'bulbasaur', generation: 1 }],
  loadFormsData: () => [
    {
      speciesId: 1,
      formName: 'base',
      formCategory: 'dex_distinct',
      homeBoxable: true,
      shinyLocked: false,
      alwaysShiny: false,
      hasGenderDifference: false,
      firstAvailableGeneration: 1,
      regionalGroup: null,
      pokeapiId: 1,
      spriteFormSuffix: null
    }
  ]
}))

const { createSqliteStorage } = await import('./sqlite-storage')

async function findBulbasaurEntry(storage: ReturnType<typeof createSqliteStorage>, shiny: boolean) {
  const entries = await storage.listCollectionEntries()
  return entries.find((e) => e.shiny === shiny)!
}

/**
 * setEntryBoxPosition (Leg 3 of the Box Arrangement/Real Inventory Data Model milestone)
 * — a box is a numbered sub-unit of a storage location, with real per-entry slot
 * positions. See CollectionEntry's doc comment and schema.ts's box_number/box_slot
 * comment for the invariants this enforces.
 */
describe('collection entry box position', () => {
  it('assigns a box position to an entry already at a storage location', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    const entry = await findBulbasaurEntry(storage, false)
    await storage.setEntryStorageLocation(entry.id, location.id)

    const updated = await storage.setEntryBoxPosition(entry.id, 3, 12)

    expect(updated.boxNumber).toBe(3)
    expect(updated.boxSlot).toBe(12)
    expect((await findBulbasaurEntry(storage, false)).boxNumber).toBe(3)
  })

  it('clears a box position back to null', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    const entry = await findBulbasaurEntry(storage, false)
    await storage.setEntryStorageLocation(entry.id, location.id)
    await storage.setEntryBoxPosition(entry.id, 3, 12)

    const cleared = await storage.setEntryBoxPosition(entry.id, null, null)

    expect(cleared.boxNumber).toBeNull()
    expect(cleared.boxSlot).toBeNull()
  })

  it('rejects assigning a box position to an entry with no storage location', async () => {
    const storage = createSqliteStorage(':memory:')
    const entry = await findBulbasaurEntry(storage, false)

    await expect(storage.setEntryBoxPosition(entry.id, 1, 0)).rejects.toThrow()
  })

  it('rejects boxNumber/boxSlot set independently of one another', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    const entry = await findBulbasaurEntry(storage, false)
    await storage.setEntryStorageLocation(entry.id, location.id)

    await expect(storage.setEntryBoxPosition(entry.id, 3, null)).rejects.toThrow()
    await expect(storage.setEntryBoxPosition(entry.id, null, 12)).rejects.toThrow()
  })

  it('rejects a box slot outside 0-29, at the DB layer', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    const entry = await findBulbasaurEntry(storage, false)
    await storage.setEntryStorageLocation(entry.id, location.id)

    await expect(storage.setEntryBoxPosition(entry.id, 1, 30)).rejects.toThrow()
  })

  it('rejects two entries claiming the same (location, box, slot), at the DB layer', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    const regular = await findBulbasaurEntry(storage, false)
    const shiny = await findBulbasaurEntry(storage, true)
    await storage.setEntryStorageLocation(regular.id, location.id)
    await storage.setEntryStorageLocation(shiny.id, location.id)
    await storage.setEntryBoxPosition(regular.id, 1, 0)

    await expect(storage.setEntryBoxPosition(shiny.id, 1, 0)).rejects.toThrow()
  })

  it('vacates the box position when the entry moves to a different storage location', async () => {
    const storage = createSqliteStorage(':memory:')
    const home = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    const ranch = await storage.createStorageLocation({ locationType: 'ranch', name: 'Ranch', trainerProfileId: null })
    const entry = await findBulbasaurEntry(storage, false)
    await storage.setEntryStorageLocation(entry.id, home.id)
    await storage.setEntryBoxPosition(entry.id, 1, 0)

    const moved = await storage.setEntryStorageLocation(entry.id, ranch.id)

    expect(moved.boxNumber).toBeNull()
    expect(moved.boxSlot).toBeNull()
  })

  it('allows two different locations to reuse the same box/slot numbering', async () => {
    const storage = createSqliteStorage(':memory:')
    const home = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    const ranch = await storage.createStorageLocation({ locationType: 'ranch', name: 'Ranch', trainerProfileId: null })
    const regular = await findBulbasaurEntry(storage, false)
    const shiny = await findBulbasaurEntry(storage, true)
    await storage.setEntryStorageLocation(regular.id, home.id)
    await storage.setEntryStorageLocation(shiny.id, ranch.id)

    await storage.setEntryBoxPosition(regular.id, 1, 0)
    const updated = await storage.setEntryBoxPosition(shiny.id, 1, 0)

    expect(updated.boxNumber).toBe(1)
    expect(updated.boxSlot).toBe(0)
  })
})

/**
 * swapEntryBoxPositions (Leg 7 of the Box Arrangement/Real Inventory Data Model
 * milestone, DexBoxGrid's drag-a-cell-onto-another-cell flow) — see sqlite-storage.ts's
 * own comment for why a naive two-call setEntryBoxPosition sequence can't do this: the
 * UNIQUE(storage_location_id, box_number, box_slot) index isn't deferrable, so the second
 * call's target slot is still occupied by the first entry's own pre-move row.
 */
describe('swapEntryBoxPositions', () => {
  it('exchanges two occupied entries positions', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    const regular = await findBulbasaurEntry(storage, false)
    const shiny = await findBulbasaurEntry(storage, true)
    await storage.setEntryStorageLocation(regular.id, location.id)
    await storage.setEntryStorageLocation(shiny.id, location.id)
    await storage.setEntryBoxPosition(regular.id, 1, 0)
    await storage.setEntryBoxPosition(shiny.id, 1, 5)

    const [updatedRegular, updatedShiny] = await storage.swapEntryBoxPositions(regular.id, shiny.id)

    expect(updatedRegular.boxNumber).toBe(1)
    expect(updatedRegular.boxSlot).toBe(5)
    expect(updatedShiny.boxNumber).toBe(1)
    expect(updatedShiny.boxSlot).toBe(0)
  })

  it('rejects swapping when either entry has no box position yet', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    const regular = await findBulbasaurEntry(storage, false)
    const shiny = await findBulbasaurEntry(storage, true)
    await storage.setEntryStorageLocation(regular.id, location.id)
    await storage.setEntryStorageLocation(shiny.id, location.id)
    await storage.setEntryBoxPosition(regular.id, 1, 0)

    await expect(storage.swapEntryBoxPositions(regular.id, shiny.id)).rejects.toThrow()
  })
})
