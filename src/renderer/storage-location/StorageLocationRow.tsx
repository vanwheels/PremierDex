import { useState } from 'react'
import type { StorageLocation, StorageLocationInput } from '@shared/types/storage-location'
import { STORAGE_LOCATION_TYPES } from '@shared/types/storage-location'
import type { TrainerProfile } from '@shared/types/trainer-profile'
import { StorageLocationForm } from './StorageLocationForm'

interface StorageLocationRowProps {
  location: StorageLocation
  trainerProfiles: TrainerProfile[]
  onSave: (input: StorageLocationInput) => void
  onDelete: () => void
}

function typeLabel(type: StorageLocation['locationType']): string {
  return STORAGE_LOCATION_TYPES.find((t) => t.id === type)?.label ?? type
}

/** One Storage Location row: read view by default, swaps to StorageLocationForm's shared
 * field set when editing. Mirrors trainer/TrainerProfileRow.tsx's shape. */
export function StorageLocationRow({
  location,
  trainerProfiles,
  onSave,
  onDelete
}: StorageLocationRowProps): JSX.Element {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <tr>
        <StorageLocationForm
          initial={location}
          trainerProfiles={trainerProfiles}
          onSubmit={(input) => {
            onSave(input)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      </tr>
    )
  }

  const linkedTrainer = trainerProfiles.find((profile) => profile.id === location.trainerProfileId)

  return (
    <tr>
      <td>{typeLabel(location.locationType)}</td>
      <td>{location.name}</td>
      <td>{linkedTrainer ? (linkedTrainer.label ?? `${linkedTrainer.game} — ${linkedTrainer.otName}`) : '—'}</td>
      <td>
        <button type="button" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button type="button" onClick={onDelete}>
          Delete
        </button>
      </td>
    </tr>
  )
}
