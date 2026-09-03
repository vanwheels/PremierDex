import type { CollectionEntry, Form, Species } from '../types/pokemon'
import type { TrainerProfile } from '../types/trainer-profile'
import type { StorageLocation } from '../types/storage-location'

/**
 * Full-collection snapshot for the manual JSON backup mechanism (Leg 5 — the only
 * backup path in v1, no sync backend). Mirrors StorageAdapter's list* methods plus a
 * version/timestamp so a later schema change has something to detect and migrate on.
 *
 * v2 (Leg 13) adds trainerProfiles/storageLocations: v1 omitted both, so a reinstall or
 * a restore from backup silently lost every profile/location the user created — see
 * TODO.md/COMPLETED.md's Leg 13 entry. No migration path from v1: neither table had
 * shipped in a release yet, so there was nothing worth carrying forward:
 * parseCollectionExport rejects a v1 file outright, same as it already rejected an
 * unrecognized version before this change.
 */
export interface CollectionExport {
  version: 2
  exportedAt: string
  species: Species[]
  forms: Form[]
  collectionEntries: CollectionEntry[]
  trainerProfiles: TrainerProfile[]
  storageLocations: StorageLocation[]
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
  if (data.version !== 2) {
    throw new Error(`Unsupported backup version: ${String(data.version)}. Expected 2.`)
  }
  if (
    !Array.isArray(data.species) ||
    !Array.isArray(data.forms) ||
    !Array.isArray(data.collectionEntries) ||
    !Array.isArray(data.trainerProfiles) ||
    !Array.isArray(data.storageLocations)
  ) {
    throw new Error('Backup file is missing species, forms, collectionEntries, trainerProfiles, or storageLocations.')
  }

  return data as CollectionExport
}
