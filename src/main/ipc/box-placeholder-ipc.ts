import { ipcMain } from 'electron'
import type { StorageAdapter } from '@shared/storage/storage-interface'
import { BoxPlaceholderIpcChannel } from '@shared/storage/ipc-channels'

export function registerBoxPlaceholderIpc(storage: StorageAdapter): void {
  ipcMain.handle(BoxPlaceholderIpcChannel.list, () => storage.listBoxPlaceholders())
  ipcMain.handle(
    BoxPlaceholderIpcChannel.set,
    (_event, storageLocationId: number, boxNumber: number, boxSlot: number, speciesId: number) =>
      storage.setBoxPlaceholder(storageLocationId, boxNumber, boxSlot, speciesId)
  )
  ipcMain.handle(
    BoxPlaceholderIpcChannel.clear,
    (_event, storageLocationId: number, boxNumber: number, boxSlot: number) =>
      storage.clearBoxPlaceholder(storageLocationId, boxNumber, boxSlot)
  )
}
