import { describe, expect, it, vi } from 'vitest'

// Same reasoning as sqlite-storage.test.ts: createSqliteStorage always runs the seed,
// which reads real data files via load-species-data.ts. These tests don't touch
// species/forms at all, so stub both loaders out to empty lists.
vi.mock('./load-species-data', () => ({
  loadSpeciesData: () => [],
  loadFormsData: () => []
}))

const { createSqliteStorage } = await import('./sqlite-storage')

describe('trainer profile CRUD', () => {
  it('creates a trainer profile and lists it back', async () => {
    const storage = createSqliteStorage(':memory:')
    const created = await storage.createTrainerProfile({
      game: 'Pokémon Sword',
      otName: 'Ash',
      tid: 123456,
      sid: 1234,
      label: 'Main file'
    })

    expect(created.id).toBeGreaterThan(0)
    expect(await storage.listTrainerProfiles()).toEqual([created])
  })

  it('defaults label to null when omitted', async () => {
    const storage = createSqliteStorage(':memory:')
    const created = await storage.createTrainerProfile({
      game: 'Pokémon Sword',
      otName: 'Ash',
      tid: 1,
      sid: 2,
      label: null
    })

    expect(created.label).toBeNull()
  })

  it('updates a trainer profile in place', async () => {
    const storage = createSqliteStorage(':memory:')
    const created = await storage.createTrainerProfile({
      game: 'Pokémon Sword',
      otName: 'Ash',
      tid: 1,
      sid: 2,
      label: null
    })

    const updated = await storage.updateTrainerProfile(created.id, {
      game: 'Pokémon Shield',
      otName: 'Ash',
      tid: 1,
      sid: 2,
      label: 'Renamed'
    })

    expect(updated).toEqual({ id: created.id, game: 'Pokémon Shield', otName: 'Ash', tid: 1, sid: 2, label: 'Renamed' })
    expect(await storage.listTrainerProfiles()).toEqual([updated])
  })

  it('deletes a trainer profile', async () => {
    const storage = createSqliteStorage(':memory:')
    const created = await storage.createTrainerProfile({
      game: 'Pokémon Sword',
      otName: 'Ash',
      tid: 1,
      sid: 2,
      label: null
    })

    await storage.deleteTrainerProfile(created.id)

    expect(await storage.listTrainerProfiles()).toEqual([])
  })

  it('stores a Pokémon GO profile with null tid/sid', async () => {
    const storage = createSqliteStorage(':memory:')
    const created = await storage.createTrainerProfile({
      game: 'Pokémon GO',
      otName: 'Ash',
      tid: null,
      sid: null,
      label: null
    })

    expect(created.tid).toBeNull()
    expect(created.sid).toBeNull()
    expect(await storage.listTrainerProfiles()).toEqual([created])
  })

  it('accepts a 6-digit tid and 4-digit sid (Gen VII+ range)', async () => {
    const storage = createSqliteStorage(':memory:')
    const created = await storage.createTrainerProfile({
      game: 'Pokémon Scarlet',
      otName: 'Ash',
      tid: 999_999,
      sid: 4294,
      label: null
    })

    expect(created.tid).toBe(999_999)
    expect(created.sid).toBe(4294)
  })

  it('accepts a sid past Gen VII+\'s 4294 cap for a pre-Gen-VII game, read out with an external tool', async () => {
    const storage = createSqliteStorage(':memory:')
    const created = await storage.createTrainerProfile({
      game: 'Pokémon Black',
      otName: 'Ash',
      tid: 12345,
      sid: 54321,
      label: null
    })

    expect(created.sid).toBe(54321)
  })

  it('keeps profiles for the same game distinct via id, not natural key', async () => {
    const storage = createSqliteStorage(':memory:')
    const first = await storage.createTrainerProfile({
      game: 'Pokémon Sword',
      otName: 'Ash',
      tid: 1,
      sid: 1,
      label: 'File A'
    })
    const second = await storage.createTrainerProfile({
      game: 'Pokémon Sword',
      otName: 'Ash',
      tid: 1,
      sid: 1,
      label: 'File B'
    })

    expect(first.id).not.toBe(second.id)
    expect(await storage.listTrainerProfiles()).toEqual([first, second])
  })
})
