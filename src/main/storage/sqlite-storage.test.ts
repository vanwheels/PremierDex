import { describe, expect, it, vi } from 'vitest'

// createSqliteStorage -> runSeed -> load-species-data.ts reads app.isPackaged (Electron)
// and resolves data/pokemon/ relative to the built main bundle's __dirname, neither of
// which hold under plain vitest. Stub the loaders with a small, self-contained fixture
// instead of the real ~1500-species dataset — isolates these tests from that path
// resolution entirely and keeps them fast.
vi.mock('./load-species-data', () => ({
  loadSpeciesEvolutionData: () => [],
  loadSpeciesData: () => [
    { id: 1, name: 'bulbasaur', generation: 1 },
    { id: 2, name: 'ivysaur', generation: 1 }
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
      speciesId: 2,
      formName: 'base',
      formCategory: 'dex_distinct',
      homeBoxable: true,
      shinyLocked: false,
      alwaysShiny: false,
      hasGenderDifference: false,
      firstAvailableGeneration: 1,
      regionalGroup: null,
      pokeapiId: 2,
      spriteFormSuffix: null
    }
  ]
}))

const { createSqliteStorage } = await import('./sqlite-storage')

async function findBulbasaurBaseEntry(storage: ReturnType<typeof createSqliteStorage>, shiny: boolean) {
  const forms = await storage.listForms()
  const bulbasaurBase = forms.find((f) => f.speciesId === 1 && f.formName === 'base')!
  const entries = await storage.listCollectionEntries()
  return entries.find((e) => e.formId === bulbasaurBase.id && e.shiny === shiny)!
}

describe('exportCollection / importCollection', () => {
  it('round-trips exported data onto the same database with no changes', async () => {
    const storage = createSqliteStorage(':memory:')
    const before = await storage.listCollectionEntries()

    const exported = await storage.exportCollection()
    const result = await storage.importCollection(exported)

    expect(result).toEqual({ matched: exported.collectionEntries.length, skipped: 0 })
    expect(await storage.listCollectionEntries()).toEqual(before)
  })

  it('restores owned state onto a freshly-seeded database, matched by natural key', async () => {
    const source = createSqliteStorage(':memory:')
    const ownedEntry = await findBulbasaurBaseEntry(source, false)
    await source.setOwned(ownedEntry.id, true)
    const exported = await source.exportCollection()

    // Simulates a reinstall: a brand-new database, freshly reseeded (nothing owned yet),
    // where AUTOINCREMENT ids aren't guaranteed to match the source database's.
    const fresh = createSqliteStorage(':memory:')
    const result = await fresh.importCollection(exported)

    expect(result.skipped).toBe(0)
    const restored = await findBulbasaurBaseEntry(fresh, false)
    expect(restored.owned).toBe(true)
  })

  it('is a full replace: entries owned locally but absent from the backup are reset', async () => {
    const fresh = createSqliteStorage(':memory:')
    const localOnlyOwned = await findBulbasaurBaseEntry(fresh, true)
    await fresh.setOwned(localOnlyOwned.id, true)

    // An export from a different, otherwise-empty collection.
    const empty = createSqliteStorage(':memory:')
    const exported = await empty.exportCollection()

    await fresh.importCollection(exported)

    expect((await findBulbasaurBaseEntry(fresh, true)).owned).toBe(false)
  })

  it('carries origin/nickname fields through export (Leg 4 — reused via toCollectionEntry, no dedicated export code)', async () => {
    const storage = createSqliteStorage(':memory:')
    const entry = await findBulbasaurBaseEntry(storage, false)
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

    const exported = await storage.exportCollection()

    const exportedEntry = exported.collectionEntries.find((e) => e.id === entry.id)!
    expect(exportedEntry.nickname).toBe('Bulby')
    expect(exportedEntry.otName).toBe('Ash')
    expect(exportedEntry.language).toBe('English')
    expect(exportedEntry.caughtBall).toBe('Great Ball')
    expect(exportedEntry.metLocation).toBe('Route 1')
  })

  it('resets local origin/nickname data on import when the backup entry has none (full replace, Leg 13)', async () => {
    const storage = createSqliteStorage(':memory:')
    const entry = await findBulbasaurBaseEntry(storage, false)
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

    // A backup from before this entry had a nickname/origin set — full-replace means
    // restoring it wipes local-only origin data, same as it already did for `owned`.
    const staleExport = await createSqliteStorage(':memory:').exportCollection()
    await storage.importCollection(staleExport)

    const restored = await findBulbasaurBaseEntry(storage, false)
    expect(restored.nickname).toBeNull()
    expect(restored.otName).toBeNull()
  })

  it('round-trips Trainer Profiles and Storage Locations through export/import, preserving ids and the FK link', async () => {
    const source = createSqliteStorage(':memory:')
    const profile = await source.createTrainerProfile({
      game: 'Pokémon Sword',
      otName: 'Ash',
      tid: 123456,
      sid: 1234,
      label: 'Playthrough 1',
      language: 'English'
    })
    const location = await source.createStorageLocation({
      locationType: 'save_file',
      name: 'Sword Save',
      trainerProfileId: profile.id
    })
    const entry = await findBulbasaurBaseEntry(source, false)
    await source.setEntryOrigin(entry.id, {
      trainerProfileId: profile.id,
      originGame: profile.game,
      otName: profile.otName,
      tid: profile.tid,
      sid: profile.sid,
      language: profile.language,
      nickname: 'Bulby',
      caughtBall: 'Great Ball',
      metLocation: 'Route 1'
    })
    await source.setEntryStorageLocation(entry.id, location.id)
    const exported = await source.exportCollection()

    // Simulates a reinstall: a brand-new, freshly-seeded database with no profiles or
    // locations of its own yet.
    const fresh = createSqliteStorage(':memory:')
    await fresh.importCollection(exported)

    expect(await fresh.listTrainerProfiles()).toEqual([profile])
    expect(await fresh.listStorageLocations()).toEqual([location])
    const restoredEntry = await findBulbasaurBaseEntry(fresh, false)
    expect(restoredEntry.trainerProfileId).toBe(profile.id)
    expect(restoredEntry.nickname).toBe('Bulby')
    expect(restoredEntry.storageLocationId).toBe(location.id)
  })

  it('is a full replace for Trainer Profiles/Storage Locations too: local-only rows absent from the backup are gone', async () => {
    const fresh = createSqliteStorage(':memory:')
    await fresh.createTrainerProfile({
      game: 'Pokémon Sword',
      otName: 'Local',
      tid: null,
      sid: null,
      label: null,
      language: null
    })

    const empty = createSqliteStorage(':memory:')
    const exported = await empty.exportCollection()
    await fresh.importCollection(exported)

    expect(await fresh.listTrainerProfiles()).toEqual([])
    expect(await fresh.listStorageLocations()).toEqual([])
  })

  it('drops a dangling trainerProfileId on an entry rather than failing import, when its profile is missing from the backup', async () => {
    const source = createSqliteStorage(':memory:')
    const profile = await source.createTrainerProfile({
      game: 'Pokémon Sword',
      otName: 'Ash',
      tid: null,
      sid: null,
      label: null,
      language: null
    })
    const entry = await findBulbasaurBaseEntry(source, false)
    await source.setEntryOrigin(entry.id, {
      trainerProfileId: profile.id,
      originGame: profile.game,
      otName: profile.otName,
      tid: null,
      sid: null,
      language: null,
      nickname: null,
      caughtBall: null,
      metLocation: null
    })
    const exported = await source.exportCollection()
    // Simulate a hand-edited/corrupted backup where the profile array is missing the
    // profile an entry still points to.
    const corrupted = { ...exported, trainerProfiles: [] }

    const fresh = createSqliteStorage(':memory:')
    const result = await fresh.importCollection(corrupted)

    expect(result.matched).toBe(exported.collectionEntries.length)
    const restoredEntry = await findBulbasaurBaseEntry(fresh, false)
    expect(restoredEntry.trainerProfileId).toBeNull()
    expect(restoredEntry.originGame).toBe('Pokémon Sword')
  })

  it('drops a dangling storageLocationId on an entry rather than failing import, when its location is missing from the backup', async () => {
    const source = createSqliteStorage(':memory:')
    const location = await source.createStorageLocation({
      locationType: 'box',
      name: 'Box 1',
      trainerProfileId: null
    })
    const entry = await findBulbasaurBaseEntry(source, false)
    await source.setEntryStorageLocation(entry.id, location.id)
    const exported = await source.exportCollection()
    // Simulate a hand-edited/corrupted backup where the location array is missing the
    // location an entry still points to.
    const corrupted = { ...exported, storageLocations: [] }

    const fresh = createSqliteStorage(':memory:')
    const result = await fresh.importCollection(corrupted)

    expect(result.matched).toBe(exported.collectionEntries.length)
    const restoredEntry = await findBulbasaurBaseEntry(fresh, false)
    expect(restoredEntry.storageLocationId).toBeNull()
  })

  it('skips entries whose form no longer exists in this install', async () => {
    const storage = createSqliteStorage(':memory:')
    const exported = await storage.exportCollection()

    const withGhostForm = {
      ...exported,
      forms: [...exported.forms, { ...exported.forms[0], id: 999_999, formName: 'ghost-form' }],
      collectionEntries: [
        ...exported.collectionEntries,
        {
          id: 999_999,
          formId: 999_999,
          gender: 'unknown' as const,
          shiny: false,
          owned: true,
          trainerProfileId: null,
          originGame: null,
          otName: null,
          tid: null,
          sid: null,
          language: null,
          nickname: null,
          caughtBall: null,
          storageLocationId: null,
          metLocation: null,
          boxNumber: null,
          boxSlot: null,
          genderConfirmed: false
        }
      ]
    }

    const result = await storage.importCollection(withGhostForm)
    expect(result.skipped).toBe(1)
    expect(result.matched).toBe(exported.collectionEntries.length)
  })
})
