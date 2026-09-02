import { useEffect, useState } from 'react'
import type { UpdateStatus } from '@shared/updater/updater-provider'

/** In-app update controls (Leg 6), reading GitHub Releases via electron-updater —
 * Windows-only for now (see auto-updater.ts), hence the isSupported gate. */
export function UpdateControls(): JSX.Element | null {
  const [supported, setSupported] = useState(false)
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' })

  useEffect(() => {
    void window.premierDex.isSupported().then(setSupported)
    return window.premierDex.onUpdateStatus(setStatus)
  }, [])

  if (!supported) return null

  switch (status.state) {
    case 'idle':
      return (
        <button type="button" onClick={() => void window.premierDex.checkForUpdates()}>
          Check for updates
        </button>
      )
    case 'checking':
      return <span className="backup-status">Checking for updates…</span>
    case 'not-available':
      return (
        <div className="backup-controls">
          <span className="backup-status">You're on the latest version.</span>
          <button type="button" onClick={() => void window.premierDex.checkForUpdates()}>
            Check again
          </button>
        </div>
      )
    case 'available':
      return (
        <div className="backup-controls">
          <span className="backup-status">Update {status.version} is available.</span>
          <button type="button" onClick={() => void window.premierDex.downloadUpdate()}>
            Download update
          </button>
        </div>
      )
    case 'downloading':
      return <span className="backup-status">Downloading update… {status.percent}%</span>
    case 'downloaded':
      return (
        <div className="backup-controls">
          <span className="backup-status">Update {status.version} downloaded and ready to install.</span>
          <button type="button" onClick={() => void window.premierDex.quitAndInstall()}>
            Restart and install
          </button>
        </div>
      )
    case 'error':
      return (
        <div className="backup-controls">
          <span className="backup-status">Update check failed: {status.message}</span>
          <button type="button" onClick={() => void window.premierDex.checkForUpdates()}>
            Try again
          </button>
        </div>
      )
  }
}
