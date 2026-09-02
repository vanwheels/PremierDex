import { useEffect, useState } from 'react'
import type { CollectionEntry, CollectionEntryOriginInput } from '@shared/types/pokemon'
import type { TrainerProfile } from '@shared/types/trainer-profile'
import { findOriginGame } from '@shared/data/origin-games'
import { OriginGameInput } from '../trainer/OriginGameInput'

const TID_MAX = 999999
// Equal to TID_MAX, not the narrower Gen VII+ derived cap (floor(32-bit ID / 1_000_000)
// = 4294): pre-Gen-VII games don't display a Secret ID in-game, but it exists
// internally and can run up to 6 digits once read out with an external tool like PKHex,
// so the field isn't tightened to Gen VII+'s range — same "widest across any
// generation" approach already used for TID_MAX.
const SID_MAX = TID_MAX
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
 * Per-entry origin editor (Leg 4; nickname moved out to its own grid column at Leg 10 —
 * see DexRow's inline nickname input) — click-to-open, mirrors SpriteModal's
 * backdrop/Escape/close pattern. One entry (a specific gender+shiny combo) is edited at
 * a time; the regular and shiny rows of the same form are separate CollectionEntry rows
 * and get independent origin data, since they're independent individuals.
 *
 * "Copy from Trainer Profile" only ever *seeds* the game/OT/TID/SID fields — after
 * that, they're plain editable inputs, and Save snapshots whatever's currently in them
 * onto the entry. Editing the source profile later, or deleting it, never changes what
 * was already saved here (see sqlite-storage.ts's deleteTrainerProfile). Save carries the
 * entry's existing nickname through unchanged (setEntryOrigin is a full-row snapshot
 * write, not a partial patch) — this modal never touches it.
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
  // Pokémon GO's 12-digit Trainer Code overrides the mainline 6-digit cap — see
  // origin-games.ts's trainerIdMax doc.
  const tidMax = matchedGame?.trainerIdMax ?? TID_MAX

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
  // TID/SID are optional even when the game shows them — only Game and OT Name are
  // required. A blank field parses to null; a non-blank one still has to be a valid
  // in-range integer.
  const parsedTid = tid.trim() === '' ? null : Number(tid)
  const parsedSid = sid.trim() === '' ? null : Number(sid)
  const tidValid = !tidVisible || parsedTid === null || (Number.isInteger(parsedTid) && parsedTid >= 0 && parsedTid <= tidMax)
  const sidValid = !sidVisible || parsedSid === null || (Number.isInteger(parsedSid) && parsedSid >= 0 && parsedSid <= SID_MAX)
  const valid = bothBlank || (game.trim() !== '' && otName.trim() !== '' && tidValid && sidValid)

  const handleSave = (): void => {
    if (!valid) return
    const input: CollectionEntryOriginInput = bothBlank
      ? { trainerProfileId: null, originGame: null, otName: null, tid: null, sid: null, nickname: entry.nickname }
      : {
          trainerProfileId,
          originGame: game.trim(),
          otName: otName.trim(),
          tid: tidVisible ? parsedTid : null,
          sid: sidVisible ? parsedSid : null,
          nickname: entry.nickname
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
            <input type="number" min={0} max={tidMax} value={tid} onChange={(e) => setTid(e.target.value)} />
          </label>
        )}
        {sidVisible && (
          <label className="origin-modal-field">
            SID
            <input type="number" min={0} max={SID_MAX} value={sid} onChange={(e) => setSid(e.target.value)} />
          </label>
        )}
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
