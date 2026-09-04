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
 * [Bulk move/duplicate entries between storage locations] — List view's multi-select
 * toolbar. bulkSetEntryStorageLocation batches setEntryStorageLocation's own per-entry
 * semantics (see entry-storage-location.test.ts for that method's own coverage);
 * duplicateEntries is new behavior — the first way to create a real duplicate individual.
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

describe('duplicate entries into a storage location', () => {
  it('clones each selected entry as a new row carrying origin/nickname, landing unassigned', async () => {
    const storage = createSqliteStorage(':memory:')
    const source = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    const target = await storage.createStorageLocation({ locationType: 'box', name: 'Box 1', trainerProfileId: null })
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

    const [duplicate] = await storage.duplicateEntries([original.id], target.id)

    expect(duplicate.id).not.toBe(original.id)
    expect(duplicate.formId).toBe(original.formId)
    expect(duplicate.gender).toBe(original.gender)
    expect(duplicate.shiny).toBe(original.shiny)
    expect(duplicate.owned).toBe(true)
    expect(duplicate.nickname).toBe('Bulby')
    expect(duplicate.otName).toBe('Ash')
    expect(duplicate.storageLocationId).toBe(target.id)
    expect(duplicate.boxNumber).toBeNull()
    expect(duplicate.boxSlot).toBeNull()
    // The source entry is untouched — a duplicate is a new individual, not a move.
    const refetchedOriginal = (await bulbasaurEntries(storage)).find((e) => e.id === original.id)!
    expect(refetchedOriginal.storageLocationId).toBe(source.id)
  })

  it('duplicates several selected entries in one call, in order', async () => {
    const storage = createSqliteStorage(':memory:')
    const target = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    const entries = await bulbasaurEntries(storage)
    for (const entry of entries) await storage.setOwned(entry.id, true)

    const duplicates = await storage.duplicateEntries(
      entries.map((e) => e.id),
      target.id
    )

    expect(duplicates).toHaveLength(entries.length)
    expect(duplicates.map((d) => d.shiny)).toEqual(entries.map((e) => e.shiny))
    expect(duplicates.every((d) => d.storageLocationId === target.id)).toBe(true)
    // Real, independent rows now coexist with their sources (the UNIQUE(form_id, gender,
    // shiny) constraint that used to forbid this was dropped for exactly this purpose).
    expect(await bulbasaurEntries(storage)).toHaveLength(entries.length * 2)
  })

  it('rejects an entry id that does not exist, leaving no partial inserts', async () => {
    const storage = createSqliteStorage(':memory:')
    const target = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    const entries = await bulbasaurEntries(storage)

    await expect(storage.duplicateEntries([entries[0].id, 999_999], target.id)).rejects.toThrow()
    expect(await bulbasaurEntries(storage)).toHaveLength(entries.length)
  })
})
