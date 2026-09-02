import type { CollectionEntry, Form, Species } from '@shared/types/pokemon'
import type { CollectionImportResult } from '@shared/storage/collection-export'

/**
 * The renderer-facing bridge exposed as `window.premierDex` — a subset of
 * StorageAdapter's pure-DB reads/writes plus the file-dialog-backed backup flow.
 * Deliberately not `StorageAdapter` itself: StorageAdapter also declares
 * exportCollection/importCollection, which are pure-data methods called directly
 * in-process by main/ipc/backup-ipc.ts (same process, no IPC needed) and have no
 * business crossing the IPC boundary — the renderer only ever triggers the file-picker
 * versions below.
 */
export interface AppBridge {
  listSpecies(): Promise<Species[]>
  listForms(): Promise<Form[]>
  listCollectionEntries(): Promise<CollectionEntry[]>
  setOwned(entryId: number, owned: boolean): Promise<CollectionEntry>
  /** Opens a save dialog, writes the full collection to the chosen file. Null if the
   * user canceled the dialog. */
  exportCollectionToFile(): Promise<string | null>
  /** Opens an open-file dialog, restores collection state from the chosen backup. Null
   * if the user canceled the dialog. */
  importCollectionFromFile(): Promise<CollectionImportResult | null>
}
