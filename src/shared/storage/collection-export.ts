import type { CollectionEntry, Form, Species } from '../types/pokemon'

/**
 * Full-collection snapshot for the manual JSON backup mechanism (Leg 5 — the only
 * backup path in v1, no sync backend). Mirrors StorageAdapter's list* methods plus a
 * version/timestamp so a later schema change has something to detect and migrate on.
 */
export interface CollectionExport {
  version: 1
  exportedAt: string
  species: Species[]
  forms: Form[]
  collectionEntries: CollectionEntry[]
}

/**
 * Import matches collection entries by natural key (species id + form name, then
 * gender + shiny) rather than by raw row id — ids are SQLite AUTOINCREMENT values that
 * aren't guaranteed to line up across a reinstall or a different app version's seed run.
 * `skipped` counts entries whose form no longer exists in this install (e.g. dropped by
 * a later species-exclusion pass) — those are left alone, not errored.
 */
export interface CollectionImportResult {
  matched: number
  skipped: number
}

/** Minimal shape check on a parsed backup file — not full per-item validation, just
 * enough to fail with a clear message instead of throwing deep inside import matching. */
export function parseCollectionExport(raw: unknown): CollectionExport {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Backup file is not a valid JSON object.')
  }

  const data = raw as Partial<CollectionExport>
  if (data.version !== 1) {
    throw new Error(`Unsupported backup version: ${String(data.version)}. Expected 1.`)
  }
  if (!Array.isArray(data.species) || !Array.isArray(data.forms) || !Array.isArray(data.collectionEntries)) {
    throw new Error('Backup file is missing species, forms, or collectionEntries.')
  }

  return data as CollectionExport
}
