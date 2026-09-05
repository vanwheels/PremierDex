import { describe, expect, it, vi } from 'vitest'

// Same fixture as entry-storage-location.test.ts: one species/form gives two seeded
// entries (shiny false/true), enough to exercise a real multi-entry bulk call without
// touching the real ~1500-species dataset.
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
 * [Dex completeness tier migration] Leg 3's "Resolve Gender Ambiguities" flow — flips a
 * batch of entries' stored gender directly. Not gated on hasGenderDifference here (that
 * check lives in genderResolution.ts, one layer up) — the storage method itself is a
 * plain per-row gender write, same as any other bulk entry mutation.
 */
describe('bulk set entry gender', () => {
  it('sets the gender on every listed entry', async () => {
    const storage = createSqliteStorage(':memory:')
    const entries = await bulbasaurEntries(storage)

    const updated = await storage.bulkSetEntryGender(
      entries.map((e) => e.id),
      'female'
    )

    expect(updated).toHaveLength(entries.length)
    expect(updated.every((e) => e.gender === 'female')).toBe(true)
  })

  it('leaves entries not listed untouched', async () => {
    const storage = createSqliteStorage(':memory:')
    const entries = await bulbasaurEntries(storage)

    await storage.bulkSetEntryGender([entries[0].id], 'female')

    const untouched = (await bulbasaurEntries(storage)).find((e) => e.id === entries[1].id)!
    expect(untouched.gender).toBe('unknown')
  })

  // Resolve Gender Ambiguities bugfix: this is what actually lets genderResolution.ts's
  // findAmbiguousGenderEntries stop re-flagging an entry the user already reviewed, even
  // one left on the same gender value it already had (see CollectionEntry.genderConfirmed).
  it('marks every listed entry gender-confirmed, regardless of the chosen gender', async () => {
    const storage = createSqliteStorage(':memory:')
    const entries = await bulbasaurEntries(storage)

    const updated = await storage.bulkSetEntryGender(
      entries.map((e) => e.id),
      'male'
    )

    expect(updated.every((e) => e.genderConfirmed)).toBe(true)
  })

  it('rejects an entry id that does not exist, leaving no partial writes', async () => {
    const storage = createSqliteStorage(':memory:')
    const entries = await bulbasaurEntries(storage)

    await expect(storage.bulkSetEntryGender([entries[0].id, 999_999], 'female')).rejects.toThrow()
    expect((await bulbasaurEntries(storage)).find((e) => e.id === entries[0].id)!.gender).toBe('unknown')
  })
})

/**
 * "Fill In" (Leg 7 of the Dex completeness tier migration) — moves an already-owned,
 * currently-unboxed entry straight into a placeholder's slot and clears that placeholder.
 * The matching/ordering logic itself (which entry a placeholder resolves to) lives in
 * boxTemplates.ts's computeFillInPlacements and is covered by boxTemplates.test.ts; these
 * tests cover the write side only — a placement is assumed to already name a valid
 * (entryId, boxNumber, boxSlot) triple, same convention as fillBoxSlots' own tests.
 */
describe('fillInPlaceholders', () => {
  it('moves an unboxed owned entry into the placeholder slot and clears the placeholder', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    const entries = await bulbasaurEntries(storage)
    await storage.setOwned(entries[0].id, true)
    await storage.setBoxPlaceholder(location.id, 1, 5, entries[0].formId, 'unknown', false)

    const updated = await storage.fillInPlaceholders(location.id, [{ entryId: entries[0].id, boxNumber: 1, boxSlot: 5 }])

    expect(updated).toHaveLength(1)
    expect(updated[0]).toMatchObject({ storageLocationId: location.id, boxNumber: 1, boxSlot: 5 })
    expect(await storage.listBoxPlaceholders()).toEqual([])
  })

  it('skips a placement whose entry is already boxed elsewhere, leaving its placeholder intact', async () => {
    const storage = createSqliteStorage(':memory:')
    const home = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    const box = await storage.createStorageLocation({ locationType: 'box', name: 'Box 1', trainerProfileId: null })
    const entries = await bulbasaurEntries(storage)
    await storage.setOwned(entries[0].id, true)
    await storage.setEntryStorageLocation(entries[0].id, box.id)
    await storage.setEntryBoxPosition(entries[0].id, 1, 0)
    await storage.setBoxPlaceholder(home.id, 1, 5, entries[0].formId, 'unknown', false)

    const updated = await storage.fillInPlaceholders(home.id, [{ entryId: entries[0].id, boxNumber: 1, boxSlot: 5 }])

    expect(updated).toEqual([])
    expect(await storage.listBoxPlaceholders()).toHaveLength(1)
    const untouched = (await bulbasaurEntries(storage)).find((e) => e.id === entries[0].id)!
    expect(untouched.storageLocationId).toBe(box.id)
    expect(untouched.boxNumber).toBe(1)
  })

  it('skips an unowned entry, leaving its placeholder intact', async () => {
    const storage = createSqliteStorage(':memory:')
    const location = await storage.createStorageLocation({ locationType: 'home', name: 'HOME', trainerProfileId: null })
    const entries = await bulbasaurEntries(storage)
    await storage.setBoxPlaceholder(location.id, 1, 5, entries[0].formId, 'unknown', false)

    const updated = await storage.fillInPlaceholders(location.id, [{ entryId: entries[0].id, boxNumber: 1, boxSlot: 5 }])

    expect(updated).toEqual([])
    expect(await storage.listBoxPlaceholders()).toHaveLength(1)
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
