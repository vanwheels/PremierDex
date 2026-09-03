import { describe, expect, it } from 'vitest'
import { parseCollectionExport } from './collection-export'

const validExport = {
  version: 2,
  exportedAt: '2026-09-01T00:00:00.000Z',
  species: [],
  forms: [],
  collectionEntries: [],
  trainerProfiles: [],
  storageLocations: []
}

describe('parseCollectionExport', () => {
  it('accepts a well-formed export', () => {
    expect(parseCollectionExport(validExport)).toEqual(validExport)
  })

  it('rejects non-object input', () => {
    expect(() => parseCollectionExport('not json')).toThrow(/not a valid JSON object/)
    expect(() => parseCollectionExport(null)).toThrow(/not a valid JSON object/)
  })

  it('rejects an unsupported version', () => {
    expect(() => parseCollectionExport({ ...validExport, version: 3 })).toThrow(/Unsupported backup version/)
  })

  // v1 (pre-Leg-13) omitted trainerProfiles/storageLocations entirely — no migration
  // path forward from it, since neither table had shipped in a release yet (see the
  // CollectionExport doc comment).
  it('rejects a v1 backup', () => {
    const v1Export = { ...validExport, version: 1 }
    expect(() => parseCollectionExport(v1Export)).toThrow(/Unsupported backup version/)
  })

  it('rejects a missing array field', () => {
    const missingForms = { ...validExport, forms: undefined }
    expect(() => parseCollectionExport(missingForms)).toThrow(/missing species, forms, collectionEntries/)
  })

  it('rejects a missing trainerProfiles/storageLocations field', () => {
    const missingTrainerProfiles = { ...validExport, trainerProfiles: undefined }
    expect(() => parseCollectionExport(missingTrainerProfiles)).toThrow(/trainerProfiles, or storageLocations/)
  })
})
