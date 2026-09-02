import { useState } from 'react'
import type { StorageLocationInput, StorageLocationType } from '@shared/types/storage-location'
import { STORAGE_LOCATION_TYPES } from '@shared/types/storage-location'
import type { TrainerProfile } from '@shared/types/trainer-profile'

interface StorageLocationFormProps {
  initial: StorageLocationInput
  trainerProfiles: TrainerProfile[]
  onSubmit: (input: StorageLocationInput) => void
  onCancel: () => void
}

/** Editable field set shared by StorageLocationsPanel's add-row and StorageLocationRow's
 * edit mode — always rendered inside a <tr>, never standalone. Mirrors
 * trainer/TrainerProfileForm.tsx's shape.
 *
 * The trainer profile picker only appears for the 'save_file' type, since that's the one
 * kind of location schema-required to link back to the trainer whose save it is (see
 * [Storage Location model] in TODO.md) — switching away from 'save_file' clears any
 * picked profile so the two never disagree.
 */
export function StorageLocationForm({
  initial,
  trainerProfiles,
  onSubmit,
  onCancel
}: StorageLocationFormProps): JSX.Element {
  const [locationType, setLocationType] = useState<StorageLocationType>(initial.locationType)
  const [name, setName] = useState(initial.name)
  const [trainerProfileId, setTrainerProfileId] = useState<number | null>(initial.trainerProfileId)

  const requiresTrainerProfile = locationType === 'save_file'
  const valid = name.trim().length > 0 && (!requiresTrainerProfile || trainerProfileId !== null)

  const handleTypeChange = (nextType: StorageLocationType): void => {
    setLocationType(nextType)
    if (nextType !== 'save_file') setTrainerProfileId(null)
  }

  const handleSubmit = (): void => {
    if (!valid) return
    onSubmit({ locationType, name: name.trim(), trainerProfileId: requiresTrainerProfile ? trainerProfileId : null })
  }

  return (
    <>
      <td>
        <select value={locationType} onChange={(e) => handleTypeChange(e.target.value as StorageLocationType)}>
          {STORAGE_LOCATION_TYPES.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
      </td>
      <td>
        {requiresTrainerProfile ? (
          <select
            value={trainerProfileId ?? ''}
            onChange={(e) => setTrainerProfileId(e.target.value === '' ? null : Number(e.target.value))}
          >
            <option value="">Select trainer…</option>
            {trainerProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.label ?? `${profile.game} — ${profile.otName}`}
              </option>
            ))}
          </select>
        ) : (
          <span title="Only a save-file location links to a trainer profile.">—</span>
        )}
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
