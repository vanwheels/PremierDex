import { describe, expect, it, vi } from 'vitest'

// Same reasoning as trainer-profile-storage.test.ts: createSqliteStorage always runs the
// seed, which reads real data files via load-species-data.ts. These tests don't touch
// species/forms at all, so stub both loaders out to empty lists.
vi.mock('./load-species-data', () => ({
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
