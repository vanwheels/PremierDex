import { ipcMain } from 'electron'
import type { StorageAdapter } from '@shared/storage/storage-interface'
import type { TrainerProfileInput } from '@shared/types/trainer-profile'
import { TrainerProfileIpcChannel } from '@shared/storage/ipc-channels'

export function registerTrainerProfileIpc(storage: StorageAdapter): void {
  ipcMain.handle(TrainerProfileIpcChannel.list, () => storage.listTrainerProfiles())
  ipcMain.handle(TrainerProfileIpcChannel.create, (_event, input: TrainerProfileInput) =>
    storage.createTrainerProfile(input)
  )
  ipcMain.handle(TrainerProfileIpcChannel.update, (_event, id: number, input: TrainerProfileInput) =>
    storage.updateTrainerProfile(id, input)
  )
  ipcMain.handle(TrainerProfileIpcChannel.delete, (_event, id: number) => storage.deleteTrainerProfile(id))
}
