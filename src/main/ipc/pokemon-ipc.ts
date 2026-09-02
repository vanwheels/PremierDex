import { ipcMain } from 'electron'
import type { StorageAdapter } from '@shared/storage/storage-interface'
import { PokemonIpcChannel } from '@shared/storage/ipc-channels'

export function registerPokemonIpc(storage: StorageAdapter): void {
  ipcMain.handle(PokemonIpcChannel.listSpecies, () => storage.listSpecies())
  ipcMain.handle(PokemonIpcChannel.listForms, () => storage.listForms())
  ipcMain.handle(PokemonIpcChannel.listCollectionEntries, () => storage.listCollectionEntries())
  ipcMain.handle(PokemonIpcChannel.setOwned, (_event, entryId: number, owned: boolean) =>
    storage.setOwned(entryId, owned)
  )
}
