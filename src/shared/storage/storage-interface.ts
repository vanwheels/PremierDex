import type { CollectionEntry, CollectionEntryOriginInput, Form, Species } from '../types/pokemon'
import type { TrainerProfile, TrainerProfileInput } from '../types/trainer-profile'
import type { StorageLocation, StorageLocationInput } from '../types/storage-location'
import type { StorageBox } from '../types/box'
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
  /** Leg 27: pins (or, with formId null, clears) the form a foldable species' section
   * displays when collapsed, overriding pickCollapsedRow's auto-pick. */
  setCollapsedDisplayForm(speciesId: number, formId: number | null): Promise<Species>
  setEntryOrigin(entryId: number, input: CollectionEntryOriginInput): Promise<CollectionEntry>
  /** Separate from setEntryOrigin (Leg 3) — current location and origin are deliberately
   * different axes, see CollectionEntry's doc comment. Null clears the assignment back
   * to unassigned. */
  setEntryStorageLocation(entryId: number, storageLocationId: number | null): Promise<CollectionEntry>
  /** Places (or, with both null, removes) an entry at a box/slot position within its
   * already-assigned storage location (Leg 3 of the Box Arrangement milestone). Both
   * boxNumber/boxSlot must be null or non-null together; rejects assigning a position to
   * an entry with no storageLocationId. See CollectionEntry's doc comment. */
  setEntryBoxPosition(entryId: number, boxNumber: number | null, boxSlot: number | null): Promise<CollectionEntry>
  /** Exchanges two entries' box positions in one atomic step (Leg 7 of the Box Arrangement
   * milestone, DexBoxGrid's drag-a-cell-onto-another-cell flow) — a naive two-call
   * setEntryBoxPosition/setEntryBoxPosition sequence throws on the UNIQUE(storage_
   * location_id, box_number, box_slot) index, since the second call's target slot is
   * still occupied by the first entry's own pre-move row. Rejects if either entry has no
   * box position yet. */
  swapEntryBoxPositions(entryIdA: number, entryIdB: number): Promise<[CollectionEntry, CollectionEntry]>
  /** Places a batch of entries into a contiguous run of slots starting at `startSlot`,
   * in `entryIds` order, in one atomic step (Leg 4 of the Box View Polish milestone,
   * DexBoxPane's multi-select drag-drop flow) — same UNIQUE-index workaround as
   * swapEntryBoxPositions above, generalized to N entries instead of 2. Rejects if any
   * entry has no storageLocationId; does not itself check the target slots are free of
   * non-`entryIds` occupants or in range — DexBoxPane's own drop-target rejection covers
   * that before this is ever called, and the DB's existing box_slot/UNIQUE constraints
   * still apply as a backstop. */
  fillBoxSlots(entryIds: number[], boxNumber: number, startSlot: number): Promise<CollectionEntry[]>
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
  /** Every box across every Storage Location (Leg 2 of the Box View Polish milestone) —
   * a location's own boxes are filtered out of this flat list client-side, same convention
   * as listCollectionEntries. */
  listBoxes(): Promise<StorageBox[]>
  /** Creates the next-numbered, unnamed box for a Storage Location (MAX(boxNumber)+1;
   * 1 if it has none yet, though every location always has at least Box 1 in practice). */
  addBox(storageLocationId: number): Promise<StorageBox>
  /** Renames (or, with null, clears the name of) a box. */
  renameBox(boxId: number, name: string | null): Promise<StorageBox>
}
