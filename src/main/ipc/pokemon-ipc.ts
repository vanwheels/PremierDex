import { ipcMain } from 'electron'
import type { StorageAdapter } from '@shared/storage/storage-interface'
import type { CollectionEntryOriginInput } from '@shared/types/pokemon'
import { PokemonIpcChannel } from '@shared/storage/ipc-channels'
import { loadSpeciesAvailabilityData } from '../storage/load-species-data'

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
  ipcMain.handle(PokemonIpcChannel.setCollapsedDisplayForm, (_event, speciesId: number, formId: number | null) =>
    storage.setCollapsedDisplayForm(speciesId, formId)
  )
  // Static file read, not a `storage` method — see the channel's own comment.
  ipcMain.handle(PokemonIpcChannel.loadSpeciesAvailability, () => loadSpeciesAvailabilityData())
}
