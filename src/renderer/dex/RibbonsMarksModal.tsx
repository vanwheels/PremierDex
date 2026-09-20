import { useEffect, useState } from 'react'
import { RIBBONS } from '@shared/data/ribbons'
import { MARKS } from '@shared/data/marks'

interface RibbonsMarksModalProps {
  entryId: number
  displayName: string
  onClose: () => void
}

/**
 * Ribbons & Marks editor (Leg 4 of the Ribbons/Alpha/Size/Capture-Date Tracking milestone,
 * see docs/investigations/ribbons-alpha-size-capture-date.md) — a separate modal from
 * OriginModal rather than a section bolted onto it: Ribbons and Marks are both many-to-many
 * (backed by their own join tables, not a column on collection_entries), so they're fetched
 * on open and saved independently instead of riding along with OriginModal's single-row
 * snapshot write. Same backdrop/Escape/close chrome as every other modal in this app; the
 * two checklists reuse DexResolveGenderModal's scrollable-list shape rather than
 * OriginModal's field-stack, since this is a checklist, not a form.
 *
 * RIBBONS/MARKS (shared/data/ribbons.ts, shared/data/marks.ts) are Leg 5's full curated
 * name lists (117 ribbons, 53 marks) — see those files' own doc comments for sourcing and
 * the retiredOnTransfer/canCoexist metadata this checklist doesn't surface. Save is a full
 * replace-all (setEntryRibbons/setEntryMarks), same convention as OriginModal's save.
 */
export function RibbonsMarksModal({ entryId, displayName, onClose }: RibbonsMarksModalProps): JSX.Element {
  const [ribbons, setRibbons] = useState<Set<string>>(new Set())
  const [marks, setMarks] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Promise.all([window.premierDex.listEntryRibbons(entryId), window.premierDex.listEntryMarks(entryId)]).then(
      ([entryRibbons, entryMarks]) => {
        setRibbons(new Set(entryRibbons))
        setMarks(new Set(entryMarks))
        setLoaded(true)
      }
    )
  }, [entryId])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const toggle = (set: Set<string>, setSet: (next: Set<string>) => void, name: string): void => {
    const next = new Set(set)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    setSet(next)
  }

  const handleSave = (): void => {
    window.premierDex.setEntryRibbons(entryId, [...ribbons])
    window.premierDex.setEntryMarks(entryId, [...marks])
    onClose()
  }

  return (
    <div className="origin-modal-backdrop" onClick={onClose}>
      <div className="origin-modal dex-ribbons-marks-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="origin-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2>{displayName} — Ribbons &amp; Marks</h2>
        {loaded && (
          <div className="dex-ribbons-marks-columns">
            <div className="dex-ribbons-marks-column">
              <h3>Ribbons</h3>
              <ul className="dex-resolve-gender-list">
                {RIBBONS.map((ribbon) => (
                  <li key={ribbon}>
                    <label>
                      <input
                        type="checkbox"
                        checked={ribbons.has(ribbon)}
                        onChange={() => toggle(ribbons, setRibbons, ribbon)}
                      />
                      {ribbon}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
            <div className="dex-ribbons-marks-column">
              <h3>Marks</h3>
              <ul className="dex-resolve-gender-list">
                {MARKS.map((mark) => (
                  <li key={mark}>
                    <label>
                      <input type="checkbox" checked={marks.has(mark)} onChange={() => toggle(marks, setMarks, mark)} />
                      {mark}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <div className="origin-modal-actions">
          <button type="button" onClick={handleSave} disabled={!loaded}>
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
