import { app, shell, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { createSqliteStorage } from './storage/sqlite-storage'
import { registerPokemonIpc } from './ipc/pokemon-ipc'
import { registerBackupIpc } from './ipc/backup-ipc'
import { loadRenderer } from './renderer-url'

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  void loadRenderer(mainWindow)

  return mainWindow
}

app.whenReady().then(() => {
  const dbPath = join(app.getPath('userData'), 'premierdex.sqlite')
  const storage = createSqliteStorage(dbPath)
  registerPokemonIpc(storage)
  registerBackupIpc(storage)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
