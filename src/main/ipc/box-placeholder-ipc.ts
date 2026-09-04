import { ipcMain } from 'electron'
import type { Gender } from '@shared/types/pokemon'
import type { StorageAdapter } from '@shared/storage/storage-interface'
import { BoxPlaceholderIpcChannel } from '@shared/storage/ipc-channels'

export function registerBoxPlaceholderIpc(storage: StorageAdapter): void {
  ipcMain.handle(BoxPlaceholderIpcChannel.list, () => storage.listBoxPlaceholders())
  ipcMain.handle(
    BoxPlaceholderIpcChannel.set,
    (_event, storageLocationId: number, boxNumber: number, boxSlot: number, formId: number, gender: Gender, shiny: boolean) =>
      storage.setBoxPlaceholder(storageLocationId, boxNumber, boxSlot, formId, gender, shiny)
  )
  ipcMain.handle(
    BoxPlaceholderIpcChannel.batchSet,
    (
      _event,
      storageLocationId: number,
      placements: Array<{ boxNumber: number; boxSlot: number; formId: number; gender: Gender; shiny: boolean }>
    ) => storage.setBoxPlaceholders(storageLocationId, placements)
  )
  ipcMain.handle(
    BoxPlaceholderIpcChannel.clear,
    (_event, storageLocationId: number, boxNumber: number, boxSlot: number) =>
      storage.clearBoxPlaceholder(storageLocationId, boxNumber, boxSlot)
  )
}
