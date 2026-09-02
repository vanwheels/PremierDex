import { useState } from 'react'
import type { TrainerProfileInput } from '@shared/types/trainer-profile'
import { findOriginGame } from '@shared/data/origin-games'
import { OriginGameInput } from './OriginGameInput'

const TID_MAX = 999999
const SID_MAX = 4294

interface TrainerProfileFormProps {
  initial: TrainerProfileInput
  onSubmit: (input: TrainerProfileInput) => void
  onCancel: () => void
}

/** Editable field set shared by TrainerProfilesPanel's add-row and TrainerProfileRow's
 * edit mode — always rendered inside a <tr>, never standalone.
 *
 * TID/SID are kept as strings in local state (not numbers) so an in-progress edit like
 * "" or a leading zero doesn't get silently coerced back by React before the user
 * finishes typing.
 */
export function TrainerProfileForm({ initial, onSubmit, onCancel }: TrainerProfileFormProps): JSX.Element {
  const [game, setGame] = useState(initial.game)
  const [otName, setOtName] = useState(initial.otName)
  const [tid, setTid] = useState(initial.tid === null ? '' : String(initial.tid))
  const [sid, setSid] = useState(initial.sid === null ? '' : String(initial.sid))
  const [label, setLabel] = useState(initial.label ?? '')

  // An unmatched/custom-typed game defaults to showing both fields — the safest
  // assumption when we don't know its display rules, and matches every listed game
  // before Pokémon GO was added.
  const matchedGame = findOriginGame(game)
  const tidVisible = matchedGame?.hasTrainerId ?? true
  const sidVisible = matchedGame?.hasSecretId ?? true

  // TID/SID are optional even when the game shows them — only Game and OT Name are
  // required. A blank field parses to null; a non-blank one still has to be a valid
  // in-range integer.
  const parsedTid = tid.trim() === '' ? null : Number(tid)
  const parsedSid = sid.trim() === '' ? null : Number(sid)
  const tidValid = !tidVisible || parsedTid === null || (Number.isInteger(parsedTid) && parsedTid >= 0 && parsedTid <= TID_MAX)
  const sidValid = !sidVisible || parsedSid === null || (Number.isInteger(parsedSid) && parsedSid >= 0 && parsedSid <= SID_MAX)
  const valid = game.trim().length > 0 && otName.trim().length > 0 && tidValid && sidValid

  const handleSubmit = (): void => {
    if (!valid) return
    onSubmit({
      game: game.trim(),
      otName: otName.trim(),
      tid: tidVisible ? parsedTid : null,
      sid: sidVisible ? parsedSid : null,
      label: label.trim() || null
    })
  }

  return (
    <>
      <td>
        <OriginGameInput value={game} onChange={setGame} />
      </td>
      <td>
        <input value={otName} onChange={(e) => setOtName(e.target.value)} placeholder="OT Name" />
      </td>
      <td>
        {tidVisible ? (
          <input type="number" min={0} max={TID_MAX} value={tid} onChange={(e) => setTid(e.target.value)} />
        ) : (
          <span title="This game doesn't show a Trainer ID.">—</span>
        )}
      </td>
      <td>
        {sidVisible ? (
          <input type="number" min={0} max={SID_MAX} value={sid} onChange={(e) => setSid(e.target.value)} />
        ) : (
          <span title="This game doesn't have a Secret ID.">—</span>
        )}
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
