import { describe, expect, it, vi } from 'vitest'

// Same reasoning as trainer-profile-storage.test.ts: createSqliteStorage always runs the
// seed, which reads real data files via load-species-data.ts. These tests don't touch
// species/forms at all, so stub both loaders out to empty lists.
vi.mock('./load-species-data', () => ({
  loadSpeciesEvolutionData: () => [],
  loadSpeciesData: () => [],
  loadFormsData: () => []
}))

const { createSqliteStorage } = await import('./sqlite-storage')

describe('storage location CRUD', () => {
  it('creates a non-save_file storage location and lists it back', async () => {
    const storage = createSqliteStorage(':memory:')
    const created = await storage.createStorageLocation({
      locationType: 'home',
      name: 'My HOME Account',
      trainerProfileId: null
    })

    expect(created.id).toBeGreaterThan(0)
    expect(await storage.listStorageLocations()).toEqual([created])
  })

  it('creates a save_file storage location linked to a trainer profile', async () => {
    const storage = createSqliteStorage(':memory:')
    const trainer = await storage.createTrainerProfile({
      game: 'Pokémon Sword',
      otName: 'Ash',
      tid: 1,
      sid: 2,
      label: null,
      language: null
    })

    const created = await storage.createStorageLocation({
      locationType: 'save_file',
      name: 'Sword Box 1',
      trainerProfileId: trainer.id
    })

    expect(created.trainerProfileId).toBe(trainer.id)
    expect(await storage.listStorageLocations()).toEqual([created])
  })

  it('rejects a save_file storage location with no trainer profile', async () => {
    const storage = createSqliteStorage(':memory:')

    await expect(
      storage.createStorageLocation({ locationType: 'save_file', name: 'Sword Box 1', trainerProfileId: null })
    ).rejects.toThrow()
  })

  it('rejects a non-save_file storage location that sets a trainer profile', async () => {
    const storage = createSqliteStorage(':memory:')
    const trainer = await storage.createTrainerProfile({
      game: 'Pokémon Sword',
      otName: 'Ash',
      tid: 1,
      sid: 2,
      label: null,
      language: null
    })

    await expect(
      storage.createStorageLocation({ locationType: 'bank', name: 'My Bank', trainerProfileId: trainer.id })
    ).rejects.toThrow()
  })

  it('updates a storage location in place', async () => {
    const storage = createSqliteStorage(':memory:')
    const created = await storage.createStorageLocation({
      locationType: 'ranch',
      name: 'Ranch',
      trainerProfileId: null
    })

    const updated = await storage.updateStorageLocation(created.id, {
      locationType: 'ranch',
      name: 'Ranch (renamed)',
      trainerProfileId: null
    })

    expect(updated).toEqual({ id: created.id, locationType: 'ranch', name: 'Ranch (renamed)', trainerProfileId: null })
    expect(await storage.listStorageLocations()).toEqual([updated])
  })

  it('deletes a storage location', async () => {
    const storage = createSqliteStorage(':memory:')
    const created = await storage.createStorageLocation({ locationType: 'box', name: 'Box', trainerProfileId: null })

    await storage.deleteStorageLocation(created.id)

    expect(await storage.listStorageLocations()).toEqual([])
  })

  it('keeps multiple locations of the same type distinct via id, not natural key', async () => {
    const storage = createSqliteStorage(':memory:')
    const first = await storage.createStorageLocation({ locationType: 'home', name: 'Account A', trainerProfileId: null })
    const second = await storage.createStorageLocation({ locationType: 'home', name: 'Account B', trainerProfileId: null })

    expect(first.id).not.toBe(second.id)
    expect(await storage.listStorageLocations()).toEqual([first, second])
  })
})

/**
 * Storage Locations tab's "Duplicate" button — the location-metadata side (name/type/
 * trainer carry-over, the fresh location's own Box 1). See bulk-entry-actions.test.ts's
 * own describe block for the entry-cloning side, which needs seeded species/form data
 * this file deliberately stubs out empty.
 */
describe('duplicate a storage location', () => {
  it("clones the location's type and trainer link, appending \" (Copy)\" to the name", async () => {
    const storage = createSqliteStorage(':memory:')
    const trainer = await storage.createTrainerProfile({
      game: 'Pokémon Sword',
      otName: 'Ash',
      tid: 1,
      sid: 2,
      label: null,
      language: null
    })
    const source = await storage.createStorageLocation({
      locationType: 'save_file',
      name: 'Sword Box 1',
      trainerProfileId: trainer.id
    })

    const clone = await storage.duplicateStorageLocation(source.id)

    expect(clone.id).not.toBe(source.id)
    expect(clone.name).toBe('Sword Box 1 (Copy)')
    expect(clone.locationType).toBe('save_file')
    expect(clone.trainerProfileId).toBe(trainer.id)
    expect(await storage.listStorageLocations()).toEqual([source, clone])
  })

  it('gives the clone its own Box 1, same as any newly created location', async () => {
    const storage = createSqliteStorage(':memory:')
    const source = await storage.createStorageLocation({ locationType: 'box', name: 'Box', trainerProfileId: null })

    const clone = await storage.duplicateStorageLocation(source.id)

    const cloneBoxes = (await storage.listBoxes()).filter((b) => b.storageLocationId === clone.id)
    expect(cloneBoxes).toHaveLength(1)
    expect(cloneBoxes[0].boxNumber).toBe(1)
  })

  it('appends another " (Copy)" on a repeat duplicate rather than colliding on name', async () => {
    const storage = createSqliteStorage(':memory:')
    const source = await storage.createStorageLocation({ locationType: 'ranch', name: 'Ranch', trainerProfileId: null })

    const first = await storage.duplicateStorageLocation(source.id)
    const second = await storage.duplicateStorageLocation(first.id)

    expect(first.name).toBe('Ranch (Copy)')
    expect(second.name).toBe('Ranch (Copy) (Copy)')
  })

  it('rejects a source location id that does not exist', async () => {
    const storage = createSqliteStorage(':memory:')

    await expect(storage.duplicateStorageLocation(999_999)).rejects.toThrow()
  })
})
