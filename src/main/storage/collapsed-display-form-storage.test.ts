import { describe, expect, it, vi } from 'vitest'

// Same reasoning as sqlite-storage.test.ts: a small self-contained fixture with a
// cosmetic-variant species (two forms under the same speciesId) so there's a second
// formId to pin as the collapsed-display override, without touching the real
// ~1500-species dataset or Electron's app.isPackaged path resolution.
vi.mock('./load-species-data', () => ({
  loadSpeciesData: () => [{ id: 201, name: 'unown', generation: 2 }],
  loadFormsData: () => [
    {
      speciesId: 201,
      formName: 'a',
      formCategory: 'dex_distinct',
      homeBoxable: true,
      shinyLocked: false,
      alwaysShiny: false,
      hasGenderDifference: false,
      firstAvailableGeneration: 2,
      regionalGroup: null,
      pokeapiId: 201,
      spriteFormSuffix: 'a'
    },
    {
      speciesId: 201,
      formName: 'b',
      formCategory: 'cosmetic_variant',
      homeBoxable: true,
      shinyLocked: false,
      alwaysShiny: false,
      hasGenderDifference: false,
      firstAvailableGeneration: 2,
      regionalGroup: null,
      pokeapiId: 201,
      spriteFormSuffix: 'b'
    }
  ]
}))

const { createSqliteStorage } = await import('./sqlite-storage')

describe('collapsed display form override (Leg 27)', () => {
  it('defaults a fresh species to no override', async () => {
    const storage = createSqliteStorage(':memory:')
    const species = (await storage.listSpecies()).find((s) => s.id === 201)!
    expect(species.collapsedDisplayFormId).toBeNull()
  })

  it('pins a form and reads it back from both the mutation result and a fresh listSpecies', async () => {
    const storage = createSqliteStorage(':memory:')
    const forms = await storage.listForms()
    const cosmeticForm = forms.find((f) => f.formName === 'b')!

    const updated = await storage.setCollapsedDisplayForm(201, cosmeticForm.id)

    expect(updated.collapsedDisplayFormId).toBe(cosmeticForm.id)
    const reloaded = (await storage.listSpecies()).find((s) => s.id === 201)!
    expect(reloaded.collapsedDisplayFormId).toBe(cosmeticForm.id)
  })

  it('clears the override back to null (Auto)', async () => {
    const storage = createSqliteStorage(':memory:')
    const forms = await storage.listForms()
    const cosmeticForm = forms.find((f) => f.formName === 'b')!
    await storage.setCollapsedDisplayForm(201, cosmeticForm.id)

    const cleared = await storage.setCollapsedDisplayForm(201, null)

    expect(cleared.collapsedDisplayFormId).toBeNull()
  })

  it('rejects a formId that names no real form, via the species -> forms FK', async () => {
    const storage = createSqliteStorage(':memory:')
    await expect(storage.setCollapsedDisplayForm(201, 999_999)).rejects.toThrow()
  })

  it('carries the override through exportCollection', async () => {
    const storage = createSqliteStorage(':memory:')
    const forms = await storage.listForms()
    const cosmeticForm = forms.find((f) => f.formName === 'b')!
    await storage.setCollapsedDisplayForm(201, cosmeticForm.id)

    const exported = await storage.exportCollection()

    const exportedSpecies = exported.species.find((s) => s.id === 201)!
    expect(exportedSpecies.collapsedDisplayFormId).toBe(cosmeticForm.id)
  })
})
