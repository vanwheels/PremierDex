import { contextBridge, ipcRenderer } from 'electron'
import type { CollectionEntry, CollectionEntryOriginInput, Species } from '@shared/types/pokemon'
import type { TrainerProfile, TrainerProfileInput } from '@shared/types/trainer-profile'
import type { StorageLocation, StorageLocationInput } from '@shared/types/storage-location'
import type { CollectionImportResult } from '@shared/storage/collection-export'
import {
  BackupIpcChannel,
  PokemonIpcChannel,
  StorageLocationIpcChannel,
  TrainerProfileIpcChannel
} from '@shared/storage/ipc-channels'
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
  setEntryOrigin: (entryId: number, input: CollectionEntryOriginInput): Promise<CollectionEntry> =>
    ipcRenderer.invoke(PokemonIpcChannel.setEntryOrigin, entryId, input),
  setEntryStorageLocation: (entryId: number, storageLocationId: number | null): Promise<CollectionEntry> =>
    ipcRenderer.invoke(PokemonIpcChannel.setEntryStorageLocation, entryId, storageLocationId),
  setCollapsedDisplayForm: (speciesId: number, formId: number | null): Promise<Species> =>
    ipcRenderer.invoke(PokemonIpcChannel.setCollapsedDisplayForm, speciesId, formId),
  exportCollectionToFile: (): Promise<string | null> => ipcRenderer.invoke(BackupIpcChannel.exportToFile),
  importCollectionFromFile: (): Promise<CollectionImportResult | null> =>
    ipcRenderer.invoke(BackupIpcChannel.importFromFile),
  listTrainerProfiles: () => ipcRenderer.invoke(TrainerProfileIpcChannel.list),
  createTrainerProfile: (input: TrainerProfileInput): Promise<TrainerProfile> =>
    ipcRenderer.invoke(TrainerProfileIpcChannel.create, input),
  updateTrainerProfile: (id: number, input: TrainerProfileInput): Promise<TrainerProfile> =>
    ipcRenderer.invoke(TrainerProfileIpcChannel.update, id, input),
  deleteTrainerProfile: (id: number): Promise<void> => ipcRenderer.invoke(TrainerProfileIpcChannel.delete, id),
  listStorageLocations: () => ipcRenderer.invoke(StorageLocationIpcChannel.list),
  createStorageLocation: (input: StorageLocationInput): Promise<StorageLocation> =>
    ipcRenderer.invoke(StorageLocationIpcChannel.create, input),
  updateStorageLocation: (id: number, input: StorageLocationInput): Promise<StorageLocation> =>
    ipcRenderer.invoke(StorageLocationIpcChannel.update, id, input),
  deleteStorageLocation: (id: number): Promise<void> => ipcRenderer.invoke(StorageLocationIpcChannel.delete, id),
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
