import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import type { BrowserWindow } from 'electron'

/** Navigates `win` to this app's own renderer bundle — the Vite dev-server URL in dev,
 *  or the packaged `index.html` otherwise. */
export function loadRenderer(win: BrowserWindow): Promise<void> {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    return win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  }
  return win.loadFile(join(__dirname, '../renderer/index.html'))
}
