import { describe, expect, it, vi } from 'vitest'

// Same reasoning as collection-entry-origin-storage.test.ts: a small self-contained
// fixture so a real collection_entries row exists to assign a storage location to,
// without touching the real ~1500-species dataset.
vi.mock('./load-species-data', () => ({
  loadSpeciesEvolutionData: () => [],
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

/**
 * Leg 6 of the User-Customizable Dex Layout milestone: entries checked in owned before
 * any storage location existed sat at storage_location_id NULL forever, with nothing to
 * sweep them in once a location finally got created. Scoped to the 0->1 location
 * transition specifically (see createStorageLocation's comment) — creating a second
 * location must never re-sweep, since by then Unassigned is a deliberate state.
 */
describe('unassigned owned entries backfill onto the first-ever storage location', () => {
  it('assigns every owned, unassigned entry to the first storage location created', async () => {
    const storage = createSqliteStorage(':memory:')
    const entry = await findBulbasaurBaseEntry(storage)
    await storage.setOwned(entry.id, true)
    expect((await findBulbasaurBaseEntry(storage)).storageLocationId).toBeNull()

    const location = await storage.createStorageLocation({
      locationType: 'home',
      name: 'My HOME Account',
      trainerProfileId: null
    })

    expect((await findBulbasaurBaseEntry(storage)).storageLocationId).toBe(location.id)
  })

  it('does not touch an unowned entry', async () => {
    const storage = createSqliteStorage(':memory:')

    await storage.createStorageLocation({ locationType: 'home', name: 'My HOME Account', trainerProfileId: null })

    expect((await findBulbasaurBaseEntry(storage)).storageLocationId).toBeNull()
  })

  it('does not re-sweep entries when a second location is created', async () => {
    const storage = createSqliteStorage(':memory:')
    await storage.createStorageLocation({ locationType: 'home', name: 'My HOME Account', trainerProfileId: null })
    const entry = await findBulbasaurBaseEntry(storage)
    await storage.setOwned(entry.id, true)
    // Deliberately left Unassigned after the first location already exists.
    expect((await findBulbasaurBaseEntry(storage)).storageLocationId).toBeNull()

    await storage.createStorageLocation({ locationType: 'box', name: 'Box 1', trainerProfileId: null })

    expect((await findBulbasaurBaseEntry(storage)).storageLocationId).toBeNull()
  })

  it('does not overwrite an entry that already has a different location assigned', async () => {
    const storage = createSqliteStorage(':memory:')
    const entry = await findBulbasaurBaseEntry(storage)
    await storage.setOwned(entry.id, true)
    // No prior location exists yet, so this creation is itself the 0->1 transition —
    // it should assign the entry to it.
    const first = await storage.createStorageLocation({ locationType: 'box', name: 'Box 1', trainerProfileId: null })
    expect((await findBulbasaurBaseEntry(storage)).storageLocationId).toBe(first.id)

    await storage.createStorageLocation({ locationType: 'ranch', name: 'Ranch', trainerProfileId: null })

    expect((await findBulbasaurBaseEntry(storage)).storageLocationId).toBe(first.id)
  })
})
