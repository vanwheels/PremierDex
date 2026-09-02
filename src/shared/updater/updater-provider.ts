/** Mirrors electron-updater's own event sequence (checking -> available|not-available ->
 *  downloading -> downloaded), plus 'idle' as the pre-first-check state and 'error' for any
 *  failure at any stage. `autoDownload` is off (see auto-updater.ts) so 'available' is a real,
 *  user-visible step rather than jumping straight to downloading. */
export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available'; version: string }
  | { state: 'not-available' }
  | { state: 'downloading'; percent: number }
  | { state: 'downloaded'; version: string }
  | { state: 'error'; message: string }

/**
 * The renderer's slice of window.premierDex driving in-app updates (see
 * src/preload/bridge.ts). Backed by electron-updater reading GitHub Releases (see
 * electron-builder.yml's `publish` config); Windows-only for now (NSIS is the only
 * target this app currently ships with auto-update support wired up), so callers should
 * check `isSupported()` before showing update controls.
 */
export interface UpdaterBridge {
  getAppVersion(): Promise<string>
  isSupported(): Promise<boolean>
  checkForUpdates(): Promise<void>
  downloadUpdate(): Promise<void>
  quitAndInstall(): Promise<void>
  /** Subscribes to status pushes from the main process; returns an unsubscribe function. */
  onUpdateStatus(listener: (status: UpdateStatus) => void): () => void
}
