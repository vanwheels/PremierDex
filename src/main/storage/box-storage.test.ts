import { describe, expect, it, vi } from 'vitest'

// Same reasoning as storage-location-storage.test.ts: these tests never touch
// species/forms, so stub both loaders out to empty lists.
vi.mock('./load-species-data', () => ({
  loadSpeciesData: () => [],
  loadFormsData: () => []
}))

const { createSqliteStorage } = await import('./sqlite-storage')

/**
 * Box CRUD (Leg 2 of the Box View Polish & Multi-Box Editing milestone) — see
 * schema.ts's `boxes` table comment and [Add / rename boxes] in TODO.md.
 */
describe('box CRUD', () => {
  it('seeds a Box 1 when a storage location is created', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })

    const boxes = await storage.listBoxes()
    expect(boxes).toEqual([{ id: expect.any(Number), storageLocationId: location.id, boxNumber: 1, name: null }])
  })

  it('adds boxes with increasing box numbers, unnamed', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })

    const second = await storage.addBox(location.id)
    const third = await storage.addBox(location.id)

    expect(second).toMatchObject({ storageLocationId: location.id, boxNumber: 2, name: null })
    expect(third).toMatchObject({ storageLocationId: location.id, boxNumber: 3, name: null })
  })

  it('numbers each location\'s boxes independently', async () => {
    const storage = createSqliteStorage(':memory:')
    const home = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    const bank = await storage.createStorageLocation({ locationType: 'bank', name: 'Bank', trainerProfileId: null })

    const homeBox2 = await storage.addBox(home.id)
    const bankBox2 = await storage.addBox(bank.id)

    expect(homeBox2.boxNumber).toBe(2)
    expect(bankBox2.boxNumber).toBe(2)
  })

  it('renames a box, and clears the name back to null', async () => {
    const storage = createSqliteStorage(':memory:')
    await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    const [box1] = await storage.listBoxes()

    const renamed = await storage.renameBox(box1.id, 'Starters')
    expect(renamed.name).toBe('Starters')
    expect((await storage.listBoxes())[0].name).toBe('Starters')

    const cleared = await storage.renameBox(box1.id, null)
    expect(cleared.name).toBeNull()
  })

  it('deletes a location\'s boxes when the location itself is deleted', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    await storage.addBox(location.id)
    expect(await storage.listBoxes()).toHaveLength(2)

    await storage.deleteStorageLocation(location.id)

    expect(await storage.listBoxes()).toEqual([])
  })
})
