import { contextBridge, ipcRenderer } from 'electron'
import type { CollectionEntry } from '@shared/types/pokemon'
import type { CollectionImportResult } from '@shared/storage/collection-export'
import { BackupIpcChannel, PokemonIpcChannel } from '@shared/storage/ipc-channels'
import type { AppBridge } from './bridge'

/** Implements window.premierDex — see bridge.ts for why this isn't just StorageAdapter
 * over IPC. The renderer never talks to SQLite or the filesystem directly. */
const bridge: AppBridge = {
  listSpecies: () => ipcRenderer.invoke(PokemonIpcChannel.listSpecies),
  listForms: () => ipcRenderer.invoke(PokemonIpcChannel.listForms),
  listCollectionEntries: () => ipcRenderer.invoke(PokemonIpcChannel.listCollectionEntries),
  setOwned: (entryId: number, owned: boolean): Promise<CollectionEntry> =>
    ipcRenderer.invoke(PokemonIpcChannel.setOwned, entryId, owned),
  exportCollectionToFile: (): Promise<string | null> => ipcRenderer.invoke(BackupIpcChannel.exportToFile),
  importCollectionFromFile: (): Promise<CollectionImportResult | null> =>
    ipcRenderer.invoke(BackupIpcChannel.importFromFile)
}

contextBridge.exposeInMainWorld('premierDex', bridge)
