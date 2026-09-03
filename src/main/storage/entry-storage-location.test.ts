import { describe, expect, it, vi } from 'vitest'

// Same reasoning as collection-entry-origin-storage.test.ts: a small self-contained
// fixture so a real collection_entries row exists to assign a storage location to,
// without touching the real ~1500-species dataset.
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

async function findBulbasaurBaseEntry(storage: ReturnType<typeof createSqliteStorage>) {
  const entries = await storage.listCollectionEntries()
  return entries.find((e) => e.shiny === false)!
}

/**
 * setEntryStorageLocation (Leg 3) — deliberately separate from setEntryOrigin's tests
 * in collection-entry-origin-storage.test.ts, since location and origin are different
 * axes with independent setters. See CollectionEntry's doc comment.
 */
describe('collection entry storage location', () => {
  it('assigns a storage location to an entry and reads it back', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({
      locationType: 'home',
      name: 'My HOME Account',
      trainerProfileId: null
    })
    const entry = await findBulbasaurBaseEntry(storage)

    const updated = await storage.setEntryStorageLocation(entry.id, location.id)

    expect(updated.storageLocationId).toBe(location.id)
    expect((await findBulbasaurBaseEntry(storage)).storageLocationId).toBe(location.id)
  })

  it('clears a storage location assignment back to null', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({
      locationType: 'home',
      name: 'My HOME Account',
      trainerProfileId: null
    })
    const entry = await findBulbasaurBaseEntry(storage)
    await storage.setEntryStorageLocation(entry.id, location.id)

    const cleared = await storage.setEntryStorageLocation(entry.id, null)

    expect(cleared.storageLocationId).toBeNull()
  })

  it('rejects a storage location id that does not exist, at the DB layer', async () => {
    const storage = createSqliteStorage(':memory:')
    const entry = await findBulbasaurBaseEntry(storage)

    await expect(storage.setEntryStorageLocation(entry.id, 999_999)).rejects.toThrow()
  })

  it('does not touch origin fields when assigning a storage location', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({
      locationType: 'box',
      name: 'Box 1',
      trainerProfileId: null
    })
    const entry = await findBulbasaurBaseEntry(storage)
    await storage.setEntryOrigin(entry.id, {
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

    const updated = await storage.setEntryStorageLocation(entry.id, location.id)

    expect(updated.originGame).toBe('Pokémon Sword')
    expect(updated.otName).toBe('Ash')
    expect(updated.metLocation).toBe('Route 1')
  })

  it('orphans storageLocationId to null when the assigned location is deleted', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({
      locationType: 'ranch',
      name: 'Ranch',
      trainerProfileId: null
    })
    const entry = await findBulbasaurBaseEntry(storage)
    await storage.setEntryStorageLocation(entry.id, location.id)

    await storage.deleteStorageLocation(location.id)

    expect((await findBulbasaurBaseEntry(storage)).storageLocationId).toBeNull()
  })
})
