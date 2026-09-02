import type { CollectionEntry, CollectionEntryOriginInput, Form, Species } from '../types/pokemon'
import type { TrainerProfile, TrainerProfileInput } from '../types/trainer-profile'
import type { StorageLocation, StorageLocationInput } from '../types/storage-location'
import type { CollectionExport, CollectionImportResult } from './collection-export'

/**
 * The full local storage surface the app depends on. The renderer never talks to
 * SQLite directly — it only ever depends on this interface, reached via the
 * preload-exposed `window.premierDex` bridge (see src/preload/index.ts). Domain-specific
 * (not a generic blob Repository<T>) because Species/Form/CollectionEntry are real
 * relational reads, not opaque records.
 *
 * Methods are async even though better-sqlite3 itself is synchronous, so the interface
 * doesn't leak that implementation detail across the IPC boundary.
 *
 * exportCollection/importCollection are pure DB operations (no file I/O, no dialogs) —
 * the file-picker flow that wraps them lives in main/ipc/backup-ipc.ts instead, since
 * that's Electron-dialog orchestration, not storage.
 */
export interface StorageAdapter {
  listSpecies(): Promise<Species[]>
  listForms(): Promise<Form[]>
  listCollectionEntries(): Promise<CollectionEntry[]>
  setOwned(entryId: number, owned: boolean): Promise<CollectionEntry>
  setEntryOrigin(entryId: number, input: CollectionEntryOriginInput): Promise<CollectionEntry>
  exportCollection(): Promise<CollectionExport>
  importCollection(data: CollectionExport): Promise<CollectionImportResult>
  listTrainerProfiles(): Promise<TrainerProfile[]>
  createTrainerProfile(input: TrainerProfileInput): Promise<TrainerProfile>
  updateTrainerProfile(id: number, input: TrainerProfileInput): Promise<TrainerProfile>
  deleteTrainerProfile(id: number): Promise<void>
  listStorageLocations(): Promise<StorageLocation[]>
  createStorageLocation(input: StorageLocationInput): Promise<StorageLocation>
  updateStorageLocation(id: number, input: StorageLocationInput): Promise<StorageLocation>
  deleteStorageLocation(id: number): Promise<void>
}
