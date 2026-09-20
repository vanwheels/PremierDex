import { describe, expect, it, vi } from 'vitest'
import { RIBBONS } from '@shared/data/ribbons'
import { MARKS } from '@shared/data/marks'

// Same self-contained fixture as collection-entry-origin-storage.test.ts — a small dataset
// so a real collection_entries row exists to attach ribbons/marks to, without touching the
// real ~1500-species dataset or Electron's app.isPackaged path resolution.
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

describe('collection entry ribbons', () => {
  it('starts empty for a fresh entry', async () => {
    const storage = createSqliteStorage(':memory:')
    const entry = await findBulbasaurBaseEntry(storage)

    expect(await storage.listEntryRibbons(entry.id)).toEqual([])
  })

  it('sets and reads back multiple ribbons on one entry', async () => {
    const storage = createSqliteStorage(':memory:')
    const entry = await findBulbasaurBaseEntry(storage)
    const wanted = [RIBBONS[0], RIBBONS[1], RIBBONS[2]]

    const result = await storage.setEntryRibbons(entry.id, wanted)

    expect(result.sort()).toEqual([...wanted].sort())
    expect((await storage.listEntryRibbons(entry.id)).sort()).toEqual([...wanted].sort())
  })

  it('replaces (not merges with) the previous ribbon set', async () => {
    const storage = createSqliteStorage(':memory:')
    const entry = await findBulbasaurBaseEntry(storage)
    await storage.setEntryRibbons(entry.id, [RIBBONS[0], RIBBONS[1]])

    await storage.setEntryRibbons(entry.id, [RIBBONS[2]])

    expect(await storage.listEntryRibbons(entry.id)).toEqual([RIBBONS[2]])
  })

  it('clears every ribbon when set to an empty list', async () => {
    const storage = createSqliteStorage(':memory:')
    const entry = await findBulbasaurBaseEntry(storage)
    await storage.setEntryRibbons(entry.id, [RIBBONS[0]])

    await storage.setEntryRibbons(entry.id, [])

    expect(await storage.listEntryRibbons(entry.id)).toEqual([])
  })

  it('rejects a ribbon name outside the fixed placeholder list at the DB layer', async () => {
    const storage = createSqliteStorage(':memory:')
    const entry = await findBulbasaurBaseEntry(storage)

    await expect(storage.setEntryRibbons(entry.id, ['Not A Real Ribbon'])).rejects.toThrow()
  })

  it('does not leak one entry\'s ribbons onto another', async () => {
    const storage = createSqliteStorage(':memory:')
    const entries = await storage.listCollectionEntries()
    const [first, second] = entries
    await storage.setEntryRibbons(first.id, [RIBBONS[0]])

    expect(await storage.listEntryRibbons(second.id)).toEqual([])
  })
})

describe('collection entry marks', () => {
  it('starts empty for a fresh entry', async () => {
    const storage = createSqliteStorage(':memory:')
    const entry = await findBulbasaurBaseEntry(storage)

    expect(await storage.listEntryMarks(entry.id)).toEqual([])
  })

  it('sets and reads back more than one Mark on one entry (e.g. Jumbo + Partner coexisting)', async () => {
    const storage = createSqliteStorage(':memory:')
    const entry = await findBulbasaurBaseEntry(storage)
    const wanted = [MARKS[0], MARKS[1]]

    const result = await storage.setEntryMarks(entry.id, wanted)

    expect(result.sort()).toEqual([...wanted].sort())
    expect((await storage.listEntryMarks(entry.id)).sort()).toEqual([...wanted].sort())
  })

  it('replaces (not merges with) the previous Mark set', async () => {
    const storage = createSqliteStorage(':memory:')
    const entry = await findBulbasaurBaseEntry(storage)
    await storage.setEntryMarks(entry.id, [MARKS[0], MARKS[1]])

    await storage.setEntryMarks(entry.id, [MARKS[2]])

    expect(await storage.listEntryMarks(entry.id)).toEqual([MARKS[2]])
  })

  it('rejects a Mark name outside the fixed placeholder list at the DB layer', async () => {
    const storage = createSqliteStorage(':memory:')
    const entry = await findBulbasaurBaseEntry(storage)

    await expect(storage.setEntryMarks(entry.id, ['Not A Real Mark'])).rejects.toThrow()
  })
})
