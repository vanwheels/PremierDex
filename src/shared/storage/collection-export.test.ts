import { describe, expect, it } from 'vitest'
import { parseCollectionExport } from './collection-export'

const validExport = {
  version: 1,
  exportedAt: '2026-09-01T00:00:00.000Z',
  species: [],
  forms: [],
  collectionEntries: []
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
    expect(() => parseCollectionExport({ ...validExport, version: 2 })).toThrow(/Unsupported backup version/)
  })

  it('rejects a missing array field', () => {
    const missingForms = { ...validExport, forms: undefined }
    expect(() => parseCollectionExport(missingForms)).toThrow(/missing species, forms, or collectionEntries/)
  })
})
