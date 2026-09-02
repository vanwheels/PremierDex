import { useEffect, useState } from 'react'
import type { CollectionEntry, CollectionEntryOriginInput } from '@shared/types/pokemon'
import type { TrainerProfile } from '@shared/types/trainer-profile'
import { findOriginGame } from '@shared/data/origin-games'
import { OriginGameInput } from '../trainer/OriginGameInput'

const TID_MAX = 999999
const SID_MAX = 4294
const NO_PROFILE = ''

export interface OriginModalTarget {
  entry: CollectionEntry
  displayName: string
}

interface OriginModalProps {
  entry: CollectionEntry
  displayName: string
  onClose: () => void
  onSave: (entryId: number, input: CollectionEntryOriginInput) => void
}

/**
 * Per-entry origin/nickname editor (Leg 4) — click-to-open, mirrors SpriteModal's
 * backdrop/Escape/close pattern. One entry (a specific gender+shiny combo) is edited at
 * a time; the regular and shiny rows of the same form are separate CollectionEntry rows
 * and get independent origin data, since they're independent individuals.
 *
 * "Copy from Trainer Profile" only ever *seeds* the game/OT/TID/SID fields — after
 * that, they're plain editable inputs, and Save snapshots whatever's currently in them
 * onto the entry. Editing the source profile later, or deleting it, never changes what
 * was already saved here (see sqlite-storage.ts's deleteTrainerProfile).
 *
 * The TID/SID visibility-by-game logic and validation shape duplicate
 * TrainerProfileForm.tsx rather than reusing it directly — that component renders as
 * `<td>` siblings inside a trainer-profiles table row and isn't reusable as a standalone
 * form. Worth extracting later if a third caller shows up.
 */
export function OriginModal({ entry, displayName, onClose, onSave }: OriginModalProps): JSX.Element {
  const [profiles, setProfiles] = useState<TrainerProfile[]>([])
  const [trainerProfileId, setTrainerProfileId] = useState(entry.trainerProfileId)
  const [game, setGame] = useState(entry.originGame ?? '')
  const [otName, setOtName] = useState(entry.otName ?? '')
  const [tid, setTid] = useState(entry.tid === null ? '' : String(entry.tid))
  const [sid, setSid] = useState(entry.sid === null ? '' : String(entry.sid))
  const [nickname, setNickname] = useState(entry.nickname ?? '')

  useEffect(() => {
    window.premierDex.listTrainerProfiles().then(setProfiles)
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const matchedGame = findOriginGame(game)
  const tidVisible = matchedGame?.hasTrainerId ?? true
  const sidVisible = matchedGame?.hasSecretId ?? true

  const handleProfileSelect = (value: string): void => {
    if (value === NO_PROFILE) {
      setTrainerProfileId(null)
      return
    }
    const profile = profiles.find((p) => p.id === Number(value))
    if (!profile) return
    setTrainerProfileId(profile.id)
    setGame(profile.game)
    setOtName(profile.otName)
    setTid(profile.tid === null ? '' : String(profile.tid))
    setSid(profile.sid === null ? '' : String(profile.sid))
  }

  const bothBlank = game.trim() === '' && otName.trim() === ''
  const parsedTid = Number(tid)
  const parsedSid = Number(sid)
  const tidValid = !tidVisible || (tid.trim() !== '' && Number.isInteger(parsedTid) && parsedTid >= 0 && parsedTid <= TID_MAX)
  const sidValid = !sidVisible || (sid.trim() !== '' && Number.isInteger(parsedSid) && parsedSid >= 0 && parsedSid <= SID_MAX)
  const valid = bothBlank || (game.trim() !== '' && otName.trim() !== '' && tidValid && sidValid)

  const handleSave = (): void => {
    if (!valid) return
    const input: CollectionEntryOriginInput = bothBlank
      ? { trainerProfileId: null, originGame: null, otName: null, tid: null, sid: null, nickname: nickname.trim() || null }
      : {
          trainerProfileId,
          originGame: game.trim(),
          otName: otName.trim(),
          tid: tidVisible ? parsedTid : null,
          sid: sidVisible ? parsedSid : null,
          nickname: nickname.trim() || null
        }
    onSave(entry.id, input)
    onClose()
  }

  return (
    <div className="origin-modal-backdrop" onClick={onClose}>
      <div className="origin-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="origin-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2>
          {displayName} {entry.shiny && '(Shiny)'}
        </h2>
        <label className="origin-modal-field">
          Copy from Trainer Profile
          <select value={trainerProfileId === null ? NO_PROFILE : String(trainerProfileId)} onChange={(e) => handleProfileSelect(e.target.value)}>
            <option value={NO_PROFILE}>— None —</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.label ?? profile.otName} — {profile.game}
              </option>
            ))}
          </select>
        </label>
        <label className="origin-modal-field">
          Game
          <OriginGameInput value={game} onChange={setGame} />
        </label>
        <label className="origin-modal-field">
          OT Name
          <input value={otName} onChange={(e) => setOtName(e.target.value)} placeholder="OT Name" />
        </label>
        {tidVisible && (
          <label className="origin-modal-field">
            TID
            <input type="number" min={0} max={TID_MAX} value={tid} onChange={(e) => setTid(e.target.value)} />
          </label>
        )}
        {sidVisible && (
          <label className="origin-modal-field">
            SID
            <input type="number" min={0} max={SID_MAX} value={sid} onChange={(e) => setSid(e.target.value)} />
          </label>
        )}
        <label className="origin-modal-field">
          Nickname
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Optional" />
        </label>
        <div className="origin-modal-actions">
          <button type="button" onClick={handleSave} disabled={!valid}>
            Save
          </button>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
