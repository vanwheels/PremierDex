import { contextBridge, ipcRenderer } from 'electron'
import type { CollectionEntry } from '@shared/types/pokemon'
import type { CollectionImportResult } from '@shared/storage/collection-export'
import { BackupIpcChannel, PokemonIpcChannel } from '@shared/storage/ipc-channels'
import { UpdaterIpcChannel } from '@shared/updater/ipc-channels'
import type { UpdateStatus } from '@shared/updater/updater-provider'
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
    ipcRenderer.invoke(BackupIpcChannel.importFromFile),
  getAppVersion: () => ipcRenderer.invoke(UpdaterIpcChannel.getAppVersion),
  isSupported: () => ipcRenderer.invoke(UpdaterIpcChannel.isSupported),
  checkForUpdates: () => ipcRenderer.invoke(UpdaterIpcChannel.check),
  downloadUpdate: () => ipcRenderer.invoke(UpdaterIpcChannel.download),
  quitAndInstall: () => ipcRenderer.invoke(UpdaterIpcChannel.install),
  onUpdateStatus: (listener: (status: UpdateStatus) => void) => {
    const handler = (_event: unknown, status: UpdateStatus): void => listener(status)
    ipcRenderer.on(UpdaterIpcChannel.status, handler)
    return () => ipcRenderer.removeListener(UpdaterIpcChannel.status, handler)
  }
}

contextBridge.exposeInMainWorld('premierDex', bridge)
