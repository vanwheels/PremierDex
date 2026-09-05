import { describe, expect, it, vi } from 'vitest'

// Same fixture as entry-storage-location.test.ts: one species/form gives two seeded
// entries (shiny false/true), enough to exercise a real multi-entry bulk call without
// touching the real ~1500-species dataset.
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

async function bulbasaurEntries(storage: ReturnType<typeof createSqliteStorage>) {
  return storage.listCollectionEntries()
}

/**
 * [Bulk move entries between storage locations] — List view's multi-select toolbar.
 * Batches setEntryStorageLocation's own per-entry semantics (see
 * entry-storage-location.test.ts for that method's own coverage) in one DB round trip.
 */
describe('bulk move entries between storage locations', () => {
  it('moves every selected entry to the target location and clears box position', async () => {
    const storage = createSqliteStorage(':memory:')
    const origin = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    const target = await storage.createStorageLocation({ locationType: 'box', name: 'Box 1', trainerProfileId: null })
    const entries = await bulbasaurEntries(storage)
    for (const entry of entries) {
      await storage.setEntryStorageLocation(entry.id, origin.id)
    }

    const updated = await storage.bulkSetEntryStorageLocation(
      entries.map((e) => e.id),
      target.id
    )

    expect(updated).toHaveLength(entries.length)
    expect(updated.every((e) => e.storageLocationId === target.id)).toBe(true)
    expect(updated.every((e) => e.boxNumber === null && e.boxSlot === null)).toBe(true)
  })

  it('moves selected entries back to unassigned when given null', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    const entries = await bulbasaurEntries(storage)
    await storage.setEntryStorageLocation(entries[0].id, location.id)

    const updated = await storage.bulkSetEntryStorageLocation([entries[0].id], null)

    expect(updated[0].storageLocationId).toBeNull()
  })

  it('rejects an entry id that does not exist, leaving no partial writes', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    const entries = await bulbasaurEntries(storage)

    await expect(storage.bulkSetEntryStorageLocation([entries[0].id, 999_999], location.id)).rejects.toThrow()
    expect((await bulbasaurEntries(storage)).find((e) => e.id === entries[0].id)!.storageLocationId).toBeNull()
  })
})

/**
 * Storage Locations tab's "Duplicate" button — clones a whole location's entry roster in
 * one call, replacing the per-entry List-view duplicate above (picking entries one at a
 * time to clone a 1025+-entry roster was unworkable, see commit 74c73c9). See
 * storage-location-storage.test.ts for the location-metadata side (name/type/trainer
 * carry-over, the fresh location's own Box 1) — these cover the entry-cloning side, which
 * needs the seeded bulbasaur fixture above.
 */
describe("duplicate a storage location's entries", () => {
  it('clones every entry in the source location as new rows carrying origin/nickname, landing unassigned', async () => {
    const storage = createSqliteStorage(':memory:')
    const source = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    const entries = await bulbasaurEntries(storage)
    const original = entries[0]
    await storage.setOwned(original.id, true)
    await storage.setEntryStorageLocation(original.id, source.id)
    await storage.setEntryOrigin(original.id, {
      trainerProfileId: null,
      originGame: 'Pokémon Sword',
      otName: 'Ash',
      tid: 123456,
      sid: 1234,
      language: 'English',
      nickname: 'Bulby',
      caughtBall: 'Great Ball',
      metLocation: 'Route 1'
    })

    const clonedLocation = await storage.duplicateStorageLocation(source.id)
    const duplicate = (await bulbasaurEntries(storage)).find((e) => e.storageLocationId === clonedLocation.id)!

    expect(duplicate.id).not.toBe(original.id)
    expect(duplicate.formId).toBe(original.formId)
    expect(duplicate.gender).toBe(original.gender)
    expect(duplicate.shiny).toBe(original.shiny)
    expect(duplicate.owned).toBe(true)
    expect(duplicate.nickname).toBe('Bulby')
    expect(duplicate.otName).toBe('Ash')
    expect(duplicate.boxNumber).toBeNull()
    expect(duplicate.boxSlot).toBeNull()
    // The source entry is untouched — a duplicate is a new individual, not a move.
    const refetchedOriginal = (await bulbasaurEntries(storage)).find((e) => e.id === original.id)!
    expect(refetchedOriginal.storageLocationId).toBe(source.id)
  })

  it("clones every entry currently in the location, regardless of box position", async () => {
    const storage = createSqliteStorage(':memory:')
    const source = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    const entries = await bulbasaurEntries(storage)
    for (const entry of entries) {
      await storage.setOwned(entry.id, true)
      await storage.setEntryStorageLocation(entry.id, source.id)
    }

    const clonedLocation = await storage.duplicateStorageLocation(source.id)
    const clonedEntries = (await bulbasaurEntries(storage)).filter((e) => e.storageLocationId === clonedLocation.id)

    expect(clonedEntries).toHaveLength(entries.length)
    expect(clonedEntries.map((d) => d.shiny).sort()).toEqual(entries.map((e) => e.shiny).sort())
    // Real, independent rows now coexist with their sources (the UNIQUE(form_id, gender,
    // shiny) constraint that used to forbid this was dropped for exactly this purpose).
    expect(await bulbasaurEntries(storage)).toHaveLength(entries.length * 2)
  })

  it('does not clone entries that belong to a different storage location', async () => {
    const storage = createSqliteStorage(':memory:')
    const source = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    const other = await storage.createStorageLocation({ locationType: 'box', name: 'Box 1', trainerProfileId: null })
    const entries = await bulbasaurEntries(storage)
    await storage.setOwned(entries[0].id, true)
    await storage.setEntryStorageLocation(entries[0].id, source.id)
    await storage.setOwned(entries[1].id, true)
    await storage.setEntryStorageLocation(entries[1].id, other.id)

    const clonedLocation = await storage.duplicateStorageLocation(source.id)

    expect((await bulbasaurEntries(storage)).filter((e) => e.storageLocationId === clonedLocation.id)).toHaveLength(1)
  })

  it('rejects a source location id that does not exist, leaving no partial inserts', async () => {
    const storage = createSqliteStorage(':memory:')
    const entries = await bulbasaurEntries(storage)

    await expect(storage.duplicateStorageLocation(999_999)).rejects.toThrow()
    expect(await bulbasaurEntries(storage)).toHaveLength(entries.length)
    expect(await storage.listStorageLocations()).toHaveLength(0)
  })
})
