import { describe, expect, it, vi } from 'vitest'

// Same reasoning as entry-box-position.test.ts: a small self-contained fixture so real
// species/form rows exist to point a placeholder at, without touching the real ~1500-
// species dataset. Two forms (ids 1 and 2, per insertion order) cover "change form" without
// tripping the form_id FK; the first form is also what setEntryBoxPosition needs a real
// collection_entries row against, to test the placeholder-clearing interaction.
vi.mock('./load-species-data', () => ({
  loadSpeciesEvolutionData: () => [],
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
    },
    {
      speciesId: 25,
      formName: 'base',
      formCategory: 'dex_distinct',
      homeBoxable: true,
      shinyLocked: false,
      alwaysShiny: false,
      hasGenderDifference: false,
      firstAvailableGeneration: 1,
      regionalGroup: null,
      pokeapiId: 25,
      spriteFormSuffix: null
    }
  ]
}))

const { createSqliteStorage } = await import('./sqlite-storage')

/**
 * Box placeholder CRUD (Leg 5 of the Box View Polish & Multi-Box Editing milestone,
 * widened to (form_id, gender, shiny) by Leg 2 of the Dex completeness tier migration) —
 * see schema.ts's `box_placeholders` table comment and [Phantom placeholder Pokémon] in
 * TODO.md.
 */
describe('box placeholders', () => {
  it('sets a placeholder on an empty slot', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })

    const placeholder = await storage.setBoxPlaceholder(location.id, 1, 5, 1, 'unknown', false)

    expect(placeholder).toMatchObject({
      storageLocationId: location.id,
      boxNumber: 1,
      boxSlot: 5,
      formId: 1,
      gender: 'unknown',
      shiny: false
    })
    expect(await storage.listBoxPlaceholders()).toEqual([placeholder])
  })

  it('changes an existing placeholder\'s form/gender/shiny rather than duplicating it', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    await storage.setBoxPlaceholder(location.id, 1, 5, 1, 'unknown', false)

    const updated = await storage.setBoxPlaceholder(location.id, 1, 5, 2, 'unknown', true)

    const all = await storage.listBoxPlaceholders()
    expect(all).toHaveLength(1)
    expect(all[0]).toMatchObject({ formId: 2, shiny: true })
    expect(updated).toMatchObject({ formId: 2, shiny: true })
  })

  it('clears a placeholder', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    await storage.setBoxPlaceholder(location.id, 1, 5, 1, 'unknown', false)

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

    await expect(storage.setBoxPlaceholder(location.id, 1, 5, 1, 'unknown', false)).rejects.toThrow()
  })

  it('a real entry landing on a placeholder\'s slot clears the placeholder', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    await storage.setBoxPlaceholder(location.id, 1, 5, 1, 'unknown', false)
    const [entry] = await storage.listCollectionEntries()
    await storage.setEntryStorageLocation(entry.id, location.id)

    await storage.setEntryBoxPosition(entry.id, 1, 5)

    expect(await storage.listBoxPlaceholders()).toEqual([])
  })

  it('a batch fill clears every placeholder it lands a real entry on', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    await storage.setBoxPlaceholder(location.id, 1, 10, 1, 'unknown', false)
    const entries = await storage.listCollectionEntries()
    for (const entry of entries) await storage.setEntryStorageLocation(entry.id, location.id)

    await storage.fillBoxSlots(entries.map((e) => e.id), 1, 10)

    expect(await storage.listBoxPlaceholders()).toEqual([])
  })

  it('deletes a location\'s placeholders when the location itself is deleted', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    await storage.setBoxPlaceholder(location.id, 1, 5, 1, 'unknown', false)

    await storage.deleteStorageLocation(location.id)

    expect(await storage.listBoxPlaceholders()).toEqual([])
  })

  describe('setBoxPlaceholders (batch, Leg 2 of the Dex completeness tier migration)', () => {
    it('writes every placement in one call', async () => {
      const storage = createSqliteStorage(':memory:')
      const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })

      const result = await storage.setBoxPlaceholders(location.id, [
        { boxNumber: 1, boxSlot: 0, formId: 1, gender: 'unknown', shiny: false },
        { boxNumber: 1, boxSlot: 1, formId: 2, gender: 'unknown', shiny: true }
      ])

      expect(result).toHaveLength(2)
      expect(await storage.listBoxPlaceholders()).toHaveLength(2)
    })

    it('resolves with every placeholder in the location, including ones the batch didn\'t touch', async () => {
      const storage = createSqliteStorage(':memory:')
      const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
      await storage.setBoxPlaceholder(location.id, 1, 0, 1, 'unknown', false)

      const result = await storage.setBoxPlaceholders(location.id, [
        { boxNumber: 1, boxSlot: 1, formId: 2, gender: 'unknown', shiny: false }
      ])

      expect(result.map((p) => p.boxSlot).sort()).toEqual([0, 1])
    })

    it('skips a placement whose slot already holds a real entry, without failing the rest', async () => {
      const storage = createSqliteStorage(':memory:')
      const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
      const [entry] = await storage.listCollectionEntries()
      await storage.setEntryStorageLocation(entry.id, location.id)
      await storage.setEntryBoxPosition(entry.id, 1, 0)

      const result = await storage.setBoxPlaceholders(location.id, [
        { boxNumber: 1, boxSlot: 0, formId: 1, gender: 'unknown', shiny: false },
        { boxNumber: 1, boxSlot: 1, formId: 2, gender: 'unknown', shiny: false }
      ])

      expect(result.map((p) => p.boxSlot)).toEqual([1])
    })
  })
})
