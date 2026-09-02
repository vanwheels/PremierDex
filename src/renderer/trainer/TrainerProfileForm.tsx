import { useState } from 'react'
import type { TrainerProfileInput } from '@shared/types/trainer-profile'

interface TrainerProfileFormProps {
  initial: TrainerProfileInput
  onSubmit: (input: TrainerProfileInput) => void
  onCancel: () => void
}

/** Editable field set shared by TrainerProfilesPanel's add-row and TrainerProfileRow's
 * edit mode — always rendered inside a <tr>, never standalone. TID/SID are kept as
 * strings in local state (not numbers) so an in-progress edit like "" or a leading
 * zero doesn't get silently coerced back by React before the user finishes typing. */
export function TrainerProfileForm({ initial, onSubmit, onCancel }: TrainerProfileFormProps): JSX.Element {
  const [game, setGame] = useState(initial.game)
  const [otName, setOtName] = useState(initial.otName)
  const [tid, setTid] = useState(String(initial.tid))
  const [sid, setSid] = useState(String(initial.sid))
  const [label, setLabel] = useState(initial.label ?? '')

  const parsedTid = Number(tid)
  const parsedSid = Number(sid)
  const valid =
    game.trim().length > 0 &&
    otName.trim().length > 0 &&
    Number.isInteger(parsedTid) &&
    parsedTid >= 0 &&
    parsedTid <= 65535 &&
    Number.isInteger(parsedSid) &&
    parsedSid >= 0 &&
    parsedSid <= 65535

  const handleSubmit = (): void => {
    if (!valid) return
    onSubmit({ game: game.trim(), otName: otName.trim(), tid: parsedTid, sid: parsedSid, label: label.trim() || null })
  }

  return (
    <>
      <td>
        <input value={game} onChange={(e) => setGame(e.target.value)} placeholder="Game" />
      </td>
      <td>
        <input value={otName} onChange={(e) => setOtName(e.target.value)} placeholder="OT Name" />
      </td>
      <td>
        <input type="number" min={0} max={65535} value={tid} onChange={(e) => setTid(e.target.value)} />
      </td>
      <td>
        <input type="number" min={0} max={65535} value={sid} onChange={(e) => setSid(e.target.value)} />
      </td>
      <td>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Optional" />
      </td>
      <td>
        <button type="button" onClick={handleSubmit} disabled={!valid}>
          Save
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </td>
    </>
  )
}
