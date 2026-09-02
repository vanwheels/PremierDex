import { describe, expect, it, vi } from 'vitest'

// createSqliteStorage -> runSeed -> load-species-data.ts reads app.isPackaged (Electron)
// and resolves data/pokemon/ relative to the built main bundle's __dirname, neither of
// which hold under plain vitest. Stub the loaders with a small, self-contained fixture
// instead of the real ~1500-species dataset — isolates these tests from that path
// resolution entirely and keeps them fast.
vi.mock('./load-species-data', () => ({
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

  it('skips entries whose form no longer exists in this install', async () => {
    const storage = createSqliteStorage(':memory:')
    const exported = await storage.exportCollection()

    const withGhostForm = {
      ...exported,
      forms: [...exported.forms, { ...exported.forms[0], id: 999_999, formName: 'ghost-form' }],
      collectionEntries: [
        ...exported.collectionEntries,
        { id: 999_999, formId: 999_999, gender: 'unknown' as const, shiny: false, owned: true }
      ]
    }

    const result = await storage.importCollection(withGhostForm)
    expect(result.skipped).toBe(1)
    expect(result.matched).toBe(exported.collectionEntries.length)
  })
})
