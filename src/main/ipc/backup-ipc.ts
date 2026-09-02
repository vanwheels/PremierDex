import { BrowserWindow, dialog, ipcMain } from 'electron'
import { promises as fs } from 'node:fs'
import type { StorageAdapter } from '@shared/storage/storage-interface'
import { BackupIpcChannel } from '@shared/storage/ipc-channels'
import { parseCollectionExport } from '@shared/storage/collection-export'

const JSON_FILTERS = [{ name: 'JSON', extensions: ['json'] }]

function defaultExportFileName(): string {
  const date = new Date().toISOString().slice(0, 10)
  return `premierdex-backup-${date}.json`
}

/** The manual JSON export/import flow (Leg 5) — the only backup path in v1, no sync
 * backend. Owns the native save/open dialogs and disk I/O; the actual DB read/write is
 * StorageAdapter.exportCollection/importCollection (see sqlite-storage.ts), kept
 * separate since dialogs are Electron-UI concerns, not storage ones. */
export function registerBackupIpc(storage: StorageAdapter): void {
  ipcMain.handle(BackupIpcChannel.exportToFile, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const dialogOptions = { defaultPath: defaultExportFileName(), filters: JSON_FILTERS }
    const { canceled, filePath } = window
      ? await dialog.showSaveDialog(window, dialogOptions)
      : await dialog.showSaveDialog(dialogOptions)
    if (canceled || !filePath) return null

    const data = await storage.exportCollection()
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return filePath
  })

  ipcMain.handle(BackupIpcChannel.importFromFile, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const dialogOptions = { properties: ['openFile' as const], filters: JSON_FILTERS }
    const { canceled, filePaths } = window
      ? await dialog.showOpenDialog(window, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions)
    if (canceled || filePaths.length === 0) return null

    const raw = await fs.readFile(filePaths[0], 'utf-8')
    const data = parseCollectionExport(JSON.parse(raw))
    return storage.importCollection(data)
  })
}
