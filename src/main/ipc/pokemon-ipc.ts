import { ipcMain } from 'electron'
import type { StorageAdapter } from '@shared/storage/storage-interface'
import type { CollectionEntryOriginInput, Gender } from '@shared/types/pokemon'
import { PokemonIpcChannel } from '@shared/storage/ipc-channels'
import {
  loadEncounterData,
  loadEvolutionEdgesData,
  loadFormeSwitchGroupsData,
  loadLearnsetData,
  loadSpeciesAvailabilityData,
  loadSpeciesDetailsData
} from '../storage/load-species-data'

export function registerPokemonIpc(storage: StorageAdapter): void {
  ipcMain.handle(PokemonIpcChannel.listSpecies, () => storage.listSpecies())
  ipcMain.handle(PokemonIpcChannel.listForms, () => storage.listForms())
  ipcMain.handle(PokemonIpcChannel.listCollectionEntries, () => storage.listCollectionEntries())
  ipcMain.handle(PokemonIpcChannel.setOwned, (_event, entryId: number, owned: boolean) =>
    storage.setOwned(entryId, owned)
  )
  ipcMain.handle(PokemonIpcChannel.setEntryOrigin, (_event, entryId: number, input: CollectionEntryOriginInput) =>
    storage.setEntryOrigin(entryId, input)
  )
  ipcMain.handle(
    PokemonIpcChannel.setEntryStorageLocation,
    (_event, entryId: number, storageLocationId: number | null) =>
      storage.setEntryStorageLocation(entryId, storageLocationId)
  )
  ipcMain.handle(
    PokemonIpcChannel.setEntryBoxPosition,
    (_event, entryId: number, boxNumber: number | null, boxSlot: number | null) =>
      storage.setEntryBoxPosition(entryId, boxNumber, boxSlot)
  )
  ipcMain.handle(PokemonIpcChannel.swapEntryBoxPositions, (_event, entryIdA: number, entryIdB: number) =>
    storage.swapEntryBoxPositions(entryIdA, entryIdB)
  )
  ipcMain.handle(
    PokemonIpcChannel.fillBoxSlots,
    (_event, entryIds: number[], boxNumber: number, startSlot: number) =>
      storage.fillBoxSlots(entryIds, boxNumber, startSlot)
  )
  ipcMain.handle(
    PokemonIpcChannel.bulkSetEntryStorageLocation,
    (_event, entryIds: number[], storageLocationId: number | null) =>
      storage.bulkSetEntryStorageLocation(entryIds, storageLocationId)
  )
  ipcMain.handle(PokemonIpcChannel.bulkSetEntryGender, (_event, entryIds: number[], gender: Gender) =>
    storage.bulkSetEntryGender(entryIds, gender)
  )
  ipcMain.handle(
    PokemonIpcChannel.fillInPlaceholders,
    (_event, storageLocationId: number, placements: Array<{ entryId: number; boxNumber: number; boxSlot: number }>) =>
      storage.fillInPlaceholders(storageLocationId, placements)
  )
  ipcMain.handle(
    PokemonIpcChannel.moveEntriesToLocation,
    (_event, storageLocationId: number, placements: Array<{ entryId: number; boxNumber: number; boxSlot: number }>) =>
      storage.moveEntriesToLocation(storageLocationId, placements)
  )
  ipcMain.handle(
    PokemonIpcChannel.restoreEntryBoxPositions,
    (
      _event,
      snapshots: Array<{ entryId: number; storageLocationId: number | null; boxNumber: number | null; boxSlot: number | null }>
    ) => storage.restoreEntryBoxPositions(snapshots)
  )
  ipcMain.handle(PokemonIpcChannel.setCollapsedDisplayForm, (_event, speciesId: number, formId: number | null) =>
    storage.setCollapsedDisplayForm(speciesId, formId)
  )
  // Static file read, not a `storage` method — see the channel's own comment.
  ipcMain.handle(PokemonIpcChannel.loadSpeciesAvailability, () => loadSpeciesAvailabilityData())
  ipcMain.handle(PokemonIpcChannel.loadEvolutionEdges, () => loadEvolutionEdgesData())
  ipcMain.handle(PokemonIpcChannel.loadFormeSwitchGroups, () => loadFormeSwitchGroupsData())
  ipcMain.handle(PokemonIpcChannel.loadSpeciesDetails, () => loadSpeciesDetailsData())
  ipcMain.handle(PokemonIpcChannel.loadEncounters, () => loadEncounterData())
  ipcMain.handle(PokemonIpcChannel.loadLearnsets, () => loadLearnsetData())
  ipcMain.handle(PokemonIpcChannel.listEntryRibbons, (_event, entryId: number) => storage.listEntryRibbons(entryId))
  ipcMain.handle(PokemonIpcChannel.setEntryRibbons, (_event, entryId: number, ribbonNames: string[]) =>
    storage.setEntryRibbons(entryId, ribbonNames)
  )
  ipcMain.handle(PokemonIpcChannel.listEntryMarks, (_event, entryId: number) => storage.listEntryMarks(entryId))
  ipcMain.handle(PokemonIpcChannel.setEntryMarks, (_event, entryId: number, markNames: string[]) =>
    storage.setEntryMarks(entryId, markNames)
  )
}
