import { app, shell, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { createSqliteStorage } from './storage/sqlite-storage'
import { registerPokemonIpc } from './ipc/pokemon-ipc'
import { registerBackupIpc } from './ipc/backup-ipc'
import { registerTrainerProfileIpc } from './ipc/trainer-profile-ipc'
import { registerStorageLocationIpc } from './ipc/storage-location-ipc'
import { registerUpdaterIpc } from './updater/auto-updater'
import { loadRenderer } from './renderer-url'

// Tracked so registerUpdaterIpc can push status events to whichever window is currently
// open, rather than only the one that existed at registration time.
let activeWindow: BrowserWindow | null = null

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

  mainWindow.on('closed', () => {
    if (activeWindow === mainWindow) activeWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  void loadRenderer(mainWindow)

  activeWindow = mainWindow
  return mainWindow
}

app.whenReady().then(() => {
  const dbPath = join(app.getPath('userData'), 'premierdex.sqlite')
  const storage = createSqliteStorage(dbPath)
  registerPokemonIpc(storage)
  registerBackupIpc(storage)
  registerTrainerProfileIpc(storage)
  registerStorageLocationIpc(storage)
  registerUpdaterIpc(() => activeWindow)

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
