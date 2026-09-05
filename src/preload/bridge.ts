import type { CollectionEntry, CollectionEntryOriginInput, Form, Gender, Species } from '@shared/types/pokemon'
import type { TrainerProfile, TrainerProfileInput } from '@shared/types/trainer-profile'
import type { StorageLocation, StorageLocationInput } from '@shared/types/storage-location'
import type { BoxPlaceholder, StorageBox } from '@shared/types/box'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
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
  setEntryStorageLocation(entryId: number, storageLocationId: number | null): Promise<CollectionEntry>
  setEntryBoxPosition(entryId: number, boxNumber: number | null, boxSlot: number | null): Promise<CollectionEntry>
  /** See StorageAdapter.swapEntryBoxPositions' own doc comment. */
  swapEntryBoxPositions(entryIdA: number, entryIdB: number): Promise<[CollectionEntry, CollectionEntry]>
  /** See StorageAdapter.fillBoxSlots' own doc comment. */
  fillBoxSlots(entryIds: number[], boxNumber: number, startSlot: number): Promise<CollectionEntry[]>
  /** See StorageAdapter.bulkSetEntryStorageLocation's own doc comment. */
  bulkSetEntryStorageLocation(entryIds: number[], storageLocationId: number | null): Promise<CollectionEntry[]>
  /** See StorageAdapter.bulkSetEntryGender's own doc comment. */
  bulkSetEntryGender(entryIds: number[], gender: Gender): Promise<CollectionEntry[]>
  setCollapsedDisplayForm(speciesId: number, formId: number | null): Promise<Species>
  /** Leg 6: static per-game species-availability data, for the Living Dex's derived
   * invalid-combo badge (see renderer/dex/invalidCombo.ts). Not DB-backed — see
   * PokemonIpcChannel.loadSpeciesAvailability's own comment. */
  loadSpeciesAvailability(): Promise<SpeciesAvailabilityData>
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
  /** See StorageAdapter.duplicateStorageLocation's own doc comment. */
  duplicateStorageLocation(id: number): Promise<StorageLocation>
  deleteStorageLocation(id: number): Promise<void>
  listBoxes(): Promise<StorageBox[]>
  addBox(storageLocationId: number): Promise<StorageBox>
  renameBox(boxId: number, name: string | null): Promise<StorageBox>
  listBoxPlaceholders(): Promise<BoxPlaceholder[]>
  setBoxPlaceholder(
    storageLocationId: number,
    boxNumber: number,
    boxSlot: number,
    formId: number,
    gender: Gender,
    shiny: boolean
  ): Promise<BoxPlaceholder>
  /** See StorageAdapter.setBoxPlaceholders' own doc comment. */
  setBoxPlaceholders(
    storageLocationId: number,
    placements: Array<{ boxNumber: number; boxSlot: number; formId: number; gender: Gender; shiny: boolean }>
  ): Promise<BoxPlaceholder[]>
  clearBoxPlaceholder(storageLocationId: number, boxNumber: number, boxSlot: number): Promise<void>
}
