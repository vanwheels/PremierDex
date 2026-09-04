import { ipcMain } from 'electron'
import type { StorageAdapter } from '@shared/storage/storage-interface'
import { BoxIpcChannel } from '@shared/storage/ipc-channels'

export function registerBoxIpc(storage: StorageAdapter): void {
  ipcMain.handle(BoxIpcChannel.list, () => storage.listBoxes())
  ipcMain.handle(BoxIpcChannel.add, (_event, storageLocationId: number) => storage.addBox(storageLocationId))
  ipcMain.handle(BoxIpcChannel.rename, (_event, boxId: number, name: string | null) => storage.renameBox(boxId, name))
}
