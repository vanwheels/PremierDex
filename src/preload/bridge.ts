import type { CollectionEntry, CollectionEntryOriginInput, Form, Species } from '@shared/types/pokemon'
import type { TrainerProfile, TrainerProfileInput } from '@shared/types/trainer-profile'
import type { StorageLocation, StorageLocationInput } from '@shared/types/storage-location'
import type { CollectionImportResult } from '@shared/storage/collection-export'
import type { UpdaterBridge } from '@shared/updater/updater-provider'

/**
 * The renderer-facing bridge exposed as `window.premierDex` — a subset of
 * StorageAdapter's pure-DB reads/writes plus the file-dialog-backed backup flow, plus
 * the in-app updater. Deliberately not `StorageAdapter` itself: StorageAdapter also
 * declares exportCollection/importCollection, which are pure-data methods called
 * directly in-process by main/ipc/backup-ipc.ts (same process, no IPC needed) and have
 * no business crossing the IPC boundary — the renderer only ever triggers the
 * file-picker versions below.
 */
export interface AppBridge extends UpdaterBridge {
  listSpecies(): Promise<Species[]>
  listForms(): Promise<Form[]>
  listCollectionEntries(): Promise<CollectionEntry[]>
  setOwned(entryId: number, owned: boolean): Promise<CollectionEntry>
  setEntryOrigin(entryId: number, input: CollectionEntryOriginInput): Promise<CollectionEntry>
  setCollapsedDisplayForm(speciesId: number, formId: number | null): Promise<Species>
  /** Opens a save dialog, writes the full collection to the chosen file. Null if the
   * user canceled the dialog. */
  exportCollectionToFile(): Promise<string | null>
  /** Opens an open-file dialog, restores collection state from the chosen backup. Null
   * if the user canceled the dialog. */
  importCollectionFromFile(): Promise<CollectionImportResult | null>
  listTrainerProfiles(): Promise<TrainerProfile[]>
  createTrainerProfile(input: TrainerProfileInput): Promise<TrainerProfile>
  updateTrainerProfile(id: number, input: TrainerProfileInput): Promise<TrainerProfile>
  deleteTrainerProfile(id: number): Promise<void>
  listStorageLocations(): Promise<StorageLocation[]>
  createStorageLocation(input: StorageLocationInput): Promise<StorageLocation>
  updateStorageLocation(id: number, input: StorageLocationInput): Promise<StorageLocation>
  deleteStorageLocation(id: number): Promise<void>
}
