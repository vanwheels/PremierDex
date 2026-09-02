import { contextBridge, ipcRenderer } from 'electron'
import type { CollectionEntry } from '@shared/types/pokemon'
import type { StorageAdapter } from '@shared/storage/storage-interface'
import { PokemonIpcChannel } from '@shared/storage/ipc-channels'

/**
 * Implements the shared StorageAdapter interface over IPC. The renderer only ever talks
 * to this bridge (window.premierDex) — never to SQLite directly.
 */
const storage: StorageAdapter = {
  listSpecies: () => ipcRenderer.invoke(PokemonIpcChannel.listSpecies),
  listForms: () => ipcRenderer.invoke(PokemonIpcChannel.listForms),
  listCollectionEntries: () => ipcRenderer.invoke(PokemonIpcChannel.listCollectionEntries),
  setOwned: (entryId: number, owned: boolean): Promise<CollectionEntry> =>
    ipcRenderer.invoke(PokemonIpcChannel.setOwned, entryId, owned)
}

contextBridge.exposeInMainWorld('premierDex', storage)
