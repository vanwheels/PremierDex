import { useState } from 'react'
import type { TrainerProfile, TrainerProfileInput } from '@shared/types/trainer-profile'
import { TrainerProfileForm } from './TrainerProfileForm'

interface TrainerProfileRowProps {
  profile: TrainerProfile
  onSave: (input: TrainerProfileInput) => void
  onDelete: () => void
}

/** One Trainer Profile row: read view by default, swaps to TrainerProfileForm's shared
 * field set when editing. */
export function TrainerProfileRow({ profile, onSave, onDelete }: TrainerProfileRowProps): JSX.Element {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <tr>
        <TrainerProfileForm
          initial={profile}
          onSubmit={(input) => {
            onSave(input)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      </tr>
    )
  }

  return (
    <tr>
      <td>{profile.game}</td>
      <td>{profile.otName}</td>
      <td>{profile.tid ?? '—'}</td>
      <td>{profile.sid ?? '—'}</td>
      <td>{profile.label ?? ''}</td>
      <td>{profile.language ?? '—'}</td>
      <td>
        <button type="button" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button type="button" className="button-danger" onClick={onDelete}>
          Delete
        </button>
      </td>
    </tr>
  )
}
