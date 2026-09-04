import { describe, expect, it, vi } from 'vitest'

// Same reasoning as entry-box-position.test.ts: a small self-contained fixture so real
// species rows exist to point a placeholder at, without touching the real ~1500-species
// dataset. A second species (no form of its own) covers "change species" without
// tripping the species_id FK; a form on the first is needed too, since setEntryBoxPosition
// needs a real collection_entries row to test the placeholder-clearing interaction against.
vi.mock('./load-species-data', () => ({
  loadSpeciesData: () => [
    { id: 1, name: 'bulbasaur', generation: 1 },
    { id: 25, name: 'pikachu', generation: 1 }
  ],
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

/**
 * Box placeholder CRUD (Leg 5 of the Box View Polish & Multi-Box Editing milestone) — see
 * schema.ts's `box_placeholders` table comment and [Phantom placeholder Pokémon] in
 * TODO.md.
 */
describe('box placeholders', () => {
  it('sets a placeholder on an empty slot', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })

    const placeholder = await storage.setBoxPlaceholder(location.id, 1, 5, 1)

    expect(placeholder).toMatchObject({ storageLocationId: location.id, boxNumber: 1, boxSlot: 5, speciesId: 1 })
    expect(await storage.listBoxPlaceholders()).toEqual([placeholder])
  })

  it('changes an existing placeholder\'s species rather than duplicating it', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    await storage.setBoxPlaceholder(location.id, 1, 5, 1)

    const updated = await storage.setBoxPlaceholder(location.id, 1, 5, 25)

    const all = await storage.listBoxPlaceholders()
    expect(all).toHaveLength(1)
    expect(all[0].speciesId).toBe(25)
    expect(updated.speciesId).toBe(25)
  })

  it('clears a placeholder', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    await storage.setBoxPlaceholder(location.id, 1, 5, 1)

    await storage.clearBoxPlaceholder(location.id, 1, 5)

    expect(await storage.listBoxPlaceholders()).toEqual([])
  })

  it('clearing a slot with no placeholder is a no-op', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })

    await expect(storage.clearBoxPlaceholder(location.id, 1, 5)).resolves.toBeUndefined()
  })

  it('rejects setting a placeholder on a slot a real entry already occupies', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    const [entry] = await storage.listCollectionEntries()
    await storage.setEntryStorageLocation(entry.id, location.id)
    await storage.setEntryBoxPosition(entry.id, 1, 5)

    await expect(storage.setBoxPlaceholder(location.id, 1, 5, 1)).rejects.toThrow()
  })

  it('a real entry landing on a placeholder\'s slot clears the placeholder', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    await storage.setBoxPlaceholder(location.id, 1, 5, 1)
    const [entry] = await storage.listCollectionEntries()
    await storage.setEntryStorageLocation(entry.id, location.id)

    await storage.setEntryBoxPosition(entry.id, 1, 5)

    expect(await storage.listBoxPlaceholders()).toEqual([])
  })

  it('a batch fill clears every placeholder it lands a real entry on', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    await storage.setBoxPlaceholder(location.id, 1, 10, 1)
    const entries = await storage.listCollectionEntries()
    for (const entry of entries) await storage.setEntryStorageLocation(entry.id, location.id)

    await storage.fillBoxSlots(entries.map((e) => e.id), 1, 10)

    expect(await storage.listBoxPlaceholders()).toEqual([])
  })

  it('deletes a location\'s placeholders when the location itself is deleted', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    await storage.setBoxPlaceholder(location.id, 1, 5, 1)

    await storage.deleteStorageLocation(location.id)

    expect(await storage.listBoxPlaceholders()).toEqual([])
  })
})
