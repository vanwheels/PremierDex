import { useState } from 'react'

interface BackupControlsProps {
  /** Called after a successful import so the caller can reload species/forms/entries —
   * import changes owned state directly in SQLite, bypassing React state entirely. */
  onImported: () => void
}

/** Manual JSON export/import (Leg 5) — the only backup path in v1, no sync backend. */
export function BackupControls({ onImported }: BackupControlsProps): JSX.Element {
  const [status, setStatus] = useState<string | null>(null)

  const handleExport = async (): Promise<void> => {
    const filePath = await window.premierDex.exportCollectionToFile()
    setStatus(filePath ? `Exported to ${filePath}` : null)
  }

  const handleImport = async (): Promise<void> => {
    const confirmed = window.confirm(
      "Importing replaces your current collection with the backup file's — anything owned " +
        "since that backup that isn't in the file will be reset to unowned. Continue?"
    )
    if (!confirmed) return

    try {
      const result = await window.premierDex.importCollectionFromFile()
      if (!result) return
      setStatus(
        `Imported: ${result.matched} matched${result.skipped > 0 ? `, ${result.skipped} skipped (no longer in this app version)` : ''}.`
      )
      onImported()
    } catch (err) {
      setStatus(`Import failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return (
    <div className="backup-controls">
      <button type="button" onClick={handleExport}>
        Export…
      </button>
      <button type="button" onClick={handleImport}>
        Import…
      </button>
      {status && <span className="backup-status">{status}</span>}
    </div>
  )
}
