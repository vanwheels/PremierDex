import { useState } from 'react'
import { BackupControls } from './BackupControls'
import { PanelModal } from './shared/PanelModal'

interface SettingsButtonProps {
  /** Forwarded to BackupControls — reload collection data after an import. */
  onImported: () => void
}

/** Header "Settings" button + its popup (Full UI/UX pass, per sketch-1's header). Currently
 * hosts only the Backup (export/import) section; each future setting gets its own
 * `.settings-section` here rather than another header control. */
export function SettingsButton({ onImported }: SettingsButtonProps): JSX.Element {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Settings
      </button>
      {open && (
        <PanelModal title="Settings" onClose={() => setOpen(false)}>
          <h2>Settings</h2>
          <section className="settings-section">
            <h3>Backup</h3>
            <BackupControls onImported={onImported} />
          </section>
        </PanelModal>
      )}
    </>
  )
}
