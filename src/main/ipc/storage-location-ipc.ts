import { ipcMain } from 'electron'
import type { StorageAdapter } from '@shared/storage/storage-interface'
import type { StorageLocationInput } from '@shared/types/storage-location'
import { StorageLocationIpcChannel } from '@shared/storage/ipc-channels'

export function registerStorageLocationIpc(storage: StorageAdapter): void {
  ipcMain.handle(StorageLocationIpcChannel.list, () => storage.listStorageLocations())
  ipcMain.handle(StorageLocationIpcChannel.create, (_event, input: StorageLocationInput) =>
    storage.createStorageLocation(input)
  )
  ipcMain.handle(StorageLocationIpcChannel.update, (_event, id: number, input: StorageLocationInput) =>
    storage.updateStorageLocation(id, input)
  )
  ipcMain.handle(StorageLocationIpcChannel.duplicate, (_event, id: number) => storage.duplicateStorageLocation(id))
  ipcMain.handle(StorageLocationIpcChannel.delete, (_event, id: number) => storage.deleteStorageLocation(id))
}
