import { describe, expect, it, vi } from 'vitest'

// Same reasoning as sqlite-storage.test.ts: a small self-contained fixture so a real
// collection_entries row exists to set origin data on, without touching the real
// ~1500-species dataset or Electron's app.isPackaged path resolution.
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

const ORIGIN_INPUT = {
  trainerProfileId: null,
  originGame: 'Pokémon Sword',
  otName: 'Ash',
  tid: 123456,
  sid: 1234,
  language: 'English',
  nickname: 'Bulby',
  caughtBall: 'Great Ball',
  metLocation: 'Route 1'
}

describe('collection entry origin', () => {
  it('sets origin/nickname on an entry and reads it back', async () => {
    const storage = createSqliteStorage(':memory:')
    const entry = await findBulbasaurBaseEntry(storage)

    const updated = await storage.setEntryOrigin(entry.id, ORIGIN_INPUT)

    expect(updated).toMatchObject(ORIGIN_INPUT)
    expect((await findBulbasaurBaseEntry(storage))).toMatchObject(ORIGIN_INPUT)
  })

  it('clears origin/nickname back to null', async () => {
    const storage = createSqliteStorage(':memory:')
    const entry = await findBulbasaurBaseEntry(storage)
    await storage.setEntryOrigin(entry.id, ORIGIN_INPUT)

    const cleared = await storage.setEntryOrigin(entry.id, {
      trainerProfileId: null,
      originGame: null,
      otName: null,
      tid: null,
      sid: null,
      language: null,
      nickname: null,
      caughtBall: null,
      metLocation: null
    })

    expect(cleared.originGame).toBeNull()
    expect(cleared.otName).toBeNull()
    expect(cleared.tid).toBeNull()
    expect(cleared.sid).toBeNull()
    expect(cleared.language).toBeNull()
    expect(cleared.nickname).toBeNull()
    expect(cleared.caughtBall).toBeNull()
    expect(cleared.metLocation).toBeNull()
  })

  it('rejects a caught ball value outside the fixed Poké Ball list at the DB layer', async () => {
    const storage = createSqliteStorage(':memory:')
    const entry = await findBulbasaurBaseEntry(storage)

    await expect(storage.setEntryOrigin(entry.id, { ...ORIGIN_INPUT, caughtBall: 'Pizza Ball' })).rejects.toThrow()
  })

  it('rejects a tid past the 6-digit range at the DB layer', async () => {
    const storage = createSqliteStorage(':memory:')
    const entry = await findBulbasaurBaseEntry(storage)

    await expect(storage.setEntryOrigin(entry.id, { ...ORIGIN_INPUT, tid: 1_000_000 })).rejects.toThrow()
  })

  it('rejects a sid past the 6-digit range at the DB layer', async () => {
    const storage = createSqliteStorage(':memory:')
    const entry = await findBulbasaurBaseEntry(storage)

    await expect(storage.setEntryOrigin(entry.id, { ...ORIGIN_INPUT, sid: 1_000_000 })).rejects.toThrow()
  })

  it('links an entry to a trainer profile via trainerProfileId', async () => {
    const storage = createSqliteStorage(':memory:')
    const profile = await storage.createTrainerProfile({
      game: 'Pokémon Sword',
      otName: 'Ash',
      tid: 123456,
      sid: 1234,
      label: null,
      language: null
    })
    const entry = await findBulbasaurBaseEntry(storage)

    const updated = await storage.setEntryOrigin(entry.id, { ...ORIGIN_INPUT, trainerProfileId: profile.id })

    expect(updated.trainerProfileId).toBe(profile.id)
  })

  it('mirrors a trainer profile update onto every entry still linked to it (Leg 31)', async () => {
    const storage = createSqliteStorage(':memory:')
    const profile = await storage.createTrainerProfile({
      game: 'Pokémon Sword',
      otName: 'Ash',
      tid: 123456,
      sid: 1234,
      label: null,
      language: 'English'
    })
    const entry = await findBulbasaurBaseEntry(storage)
    await storage.setEntryOrigin(entry.id, { ...ORIGIN_INPUT, trainerProfileId: profile.id })

    await storage.updateTrainerProfile(profile.id, {
      game: 'Pokémon Shield',
      otName: 'Red',
      tid: 654321,
      sid: 4321,
      label: null,
      language: 'Japanese'
    })

    const synced = await findBulbasaurBaseEntry(storage)
    expect(synced.originGame).toBe('Pokémon Shield')
    expect(synced.otName).toBe('Red')
    expect(synced.tid).toBe(654321)
    expect(synced.sid).toBe(4321)
    expect(synced.language).toBe('Japanese')
    // nickname/caughtBall are per-entry, never synced from the profile.
    expect(synced.nickname).toBe(ORIGIN_INPUT.nickname)
    expect(synced.caughtBall).toBe(ORIGIN_INPUT.caughtBall)
  })

  it('does not touch an unlinked entry when an unrelated trainer profile updates', async () => {
    const storage = createSqliteStorage(':memory:')
    const profile = await storage.createTrainerProfile({
      game: 'Pokémon Sword',
      otName: 'Ash',
      tid: 1,
      sid: 1,
      label: null,
      language: null
    })
    const entry = await findBulbasaurBaseEntry(storage)
    await storage.setEntryOrigin(entry.id, ORIGIN_INPUT) // trainerProfileId: null

    await storage.updateTrainerProfile(profile.id, {
      game: 'Pokémon Shield',
      otName: 'Red',
      tid: 2,
      sid: 2,
      label: null,
      language: null
    })

    const untouched = await findBulbasaurBaseEntry(storage)
    expect(untouched.originGame).toBe(ORIGIN_INPUT.originGame)
    expect(untouched.otName).toBe(ORIGIN_INPUT.otName)
  })

  it('orphans trainerProfileId to null (without touching the snapshot fields) when the source profile is deleted', async () => {
    const storage = createSqliteStorage(':memory:')
    const profile = await storage.createTrainerProfile({
      game: 'Pokémon Sword',
      otName: 'Ash',
      tid: 123456,
      sid: 1234,
      label: null,
      language: null
    })
    const entry = await findBulbasaurBaseEntry(storage)
    await storage.setEntryOrigin(entry.id, { ...ORIGIN_INPUT, trainerProfileId: profile.id })

    await storage.deleteTrainerProfile(profile.id)

    const afterDelete = await findBulbasaurBaseEntry(storage)
    expect(afterDelete.trainerProfileId).toBeNull()
    expect(afterDelete.originGame).toBe(ORIGIN_INPUT.originGame)
    expect(afterDelete.otName).toBe(ORIGIN_INPUT.otName)
    expect(afterDelete.nickname).toBe(ORIGIN_INPUT.nickname)
  })
})
