import type { CollectionEntry, CollectionEntryOriginInput, Form, Gender, Species } from '@shared/types/pokemon'
import type { TrainerProfile, TrainerProfileInput } from '@shared/types/trainer-profile'
import type { StorageLocation, StorageLocationInput } from '@shared/types/storage-location'
import type { BoxPlaceholder, StorageBox } from '@shared/types/box'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import type { EvolutionEdge } from '@shared/types/evolution'
import type { FormeSwitchGroup } from '@shared/types/forme-switch-groups'
import type { SpeciesDetailsData } from '@shared/types/species-details'
import type { EncounterData } from '@shared/types/encounters'
import type { LearnsetData } from '@shared/types/learnsets'
import type { MoveData } from '@shared/types/moves'
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
  /** See StorageAdapter.fillInPlaceholders' own doc comment. */
  fillInPlaceholders(
    storageLocationId: number,
    placements: Array<{ entryId: number; boxNumber: number; boxSlot: number }>
  ): Promise<{ applied: CollectionEntry[]; skipped: Array<{ entryId: number; reason: string }> }>
  /** See StorageAdapter.moveEntriesToLocation's own doc comment. */
  moveEntriesToLocation(
    storageLocationId: number,
    placements: Array<{ entryId: number; boxNumber: number; boxSlot: number }>
  ): Promise<CollectionEntry[]>
  /** See StorageAdapter.restoreEntryBoxPositions' own doc comment. */
  restoreEntryBoxPositions(
    snapshots: Array<{ entryId: number; storageLocationId: number | null; boxNumber: number | null; boxSlot: number | null }>
  ): Promise<CollectionEntry[]>
  setCollapsedDisplayForm(speciesId: number, formId: number | null): Promise<Species>
  /** Leg 6: static per-game species-availability data, for the Living Dex's derived
   * invalid-combo badge (see renderer/dex/invalidCombo.ts). Not DB-backed — see
   * PokemonIpcChannel.loadSpeciesAvailability's own comment. */
  loadSpeciesAvailability(): Promise<SpeciesAvailabilityData>
  /** Leg 2 of the Species detail popup + evolution family tree milestone: static per-edge
   * evolution-method/regional-branch data, for the tree component (see
   * renderer/dex/evolutionTree.ts). Not DB-backed — see
   * PokemonIpcChannel.loadEvolutionEdges' own comment. */
  loadEvolutionEdges(): Promise<EvolutionEdge[]>
  /** Leg 8 of the Species detail popup + evolution family tree milestone: static
   * non-evolutionary forme-switch group data, for the popup's alternate-formes view (see
   * renderer/dex/FormeSwitchGroupView.tsx). Not DB-backed — see
   * PokemonIpcChannel.loadFormeSwitchGroups' own comment. */
  loadFormeSwitchGroups(): Promise<FormeSwitchGroup[]>
  /** Leg 2 of the Species database: full per-species pages milestone: static per-species/
   * per-form detail data (ability descriptions, base happiness, EV yield, etc.), for the
   * full species page (Leg 3). Not DB-backed — see PokemonIpcChannel.loadSpeciesDetails'
   * own comment. */
  loadSpeciesDetails(): Promise<SpeciesDetailsData>
  /** Leg 2 of the Encounter data + Where to Find milestone: static per-pokeapiId wild/snag
   * encounter data, for the species page's Where to Find section (Leg 3). Not DB-backed —
   * see PokemonIpcChannel.loadEncounters' own comment. */
  loadEncounters(): Promise<EncounterData>
  /** Leg 3 of the Species/Dex reference data layer milestone: static per-pokeapiId learnset
   * data. Not DB-backed — see PokemonIpcChannel.loadLearnsets' own comment. */
  loadLearnsets(): Promise<LearnsetData>
  /** Leg 4 of the Species/Dex reference data layer milestone: static move metadata keyed by
   * move slug. Not DB-backed — see PokemonIpcChannel.loadMoves' own comment. */
  loadMoves(): Promise<MoveData>
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
  /** See StorageAdapter.clearAllBoxPlaceholders' own doc comment. */
  clearAllBoxPlaceholders(storageLocationId: number): Promise<void>
  /** See StorageAdapter.listEntryRibbons/setEntryRibbons/listEntryMarks/setEntryMarks' own
   * doc comments. */
  listEntryRibbons(entryId: number): Promise<string[]>
  setEntryRibbons(entryId: number, ribbonNames: string[]): Promise<string[]>
  listEntryMarks(entryId: number): Promise<string[]>
  setEntryMarks(entryId: number, markNames: string[]): Promise<string[]>
}
