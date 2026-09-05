import { useMemo, useState } from 'react'
import type { Gender, Species } from '@shared/types/pokemon'
import type { AmbiguousGenderEntry } from './genderResolution'
import { formDisplayName, speciesDisplayName } from './formNames'

interface DexResolveGenderModalProps {
  species: Species[]
  ambiguousEntries: AmbiguousGenderEntry[]
  /** Save always confirms every listed entry, not just the ones flipped to Female — an
   * entry left on the default Male needs writing too, or it has no way to record "this was
   * reviewed" and just re-appears here forever (the bug this modal used to have). See
   * LivingDexView's onResolve wiring. */
  onResolve: (femaleEntryIds: number[], maleEntryIds: number[]) => void
  onClose: () => void
}

/**
 * "Resolve Gender Ambiguities" (Leg 3 of the Dex completeness tier migration) — the
 * gap docs/investigations/dex-completeness-tiers.md deliberately left for this leg to
 * design. Every owned, unconfirmed entry on a gender-diff form recorded under the
 * collapsed 'male' key (see genderResolution.ts) is listed here, defaulting to its
 * current stored value (Male) — the user flips only the ones they know are actually
 * female; anything left alone keeps its existing recorded gender. One bulk save rather
 * than a one-at-a-time wizard, matching Vanny's call: a reviewable list is easier to scan
 * and correct than stepping through entries individually, especially once duplicates mean
 * more than one row per species/form/shiny combo can need review.
 *
 * Save confirms every entry shown here, whichever radio it's left on — leaving one on
 * Male is itself a reviewed answer ("yes, this individual really is Male"), not "skip
 * this one," so it needs writing back same as a flip to Female. Without that, an entry
 * that's genuinely Male could never leave this list (see CollectionEntry.genderConfirmed).
 */
export function DexResolveGenderModal({ species, ambiguousEntries, onResolve, onClose }: DexResolveGenderModalProps): JSX.Element {
  const speciesById = useMemo(() => new Map(species.map((s) => [s.id, s])), [species])
  const [femaleEntryIds, setFemaleEntryIds] = useState<Set<number>>(new Set())

  const setGender = (entryId: number, gender: Gender): void => {
    setFemaleEntryIds((prev) => {
      const next = new Set(prev)
      if (gender === 'female') next.add(entryId)
      else next.delete(entryId)
      return next
    })
  }

  return (
    <div className="origin-modal-backdrop" onClick={onClose}>
      <div className="origin-modal dex-resolve-gender-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="origin-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2>Resolve Gender Ambiguities</h2>
        <p className="dex-resolve-gender-intro">
          These owned individuals were checked in while Split by Gender was off, so each was recorded as Male
          regardless of which gender it actually is. Confirm any that are actually female — Living Form Dex's
          completion count can't tell the two genders apart otherwise. Anything left as Male keeps its current
          recorded value.
        </p>
        <ul className="dex-resolve-gender-list">
          {ambiguousEntries.map(({ entry, form }) => {
            const speciesName = speciesById.get(form.speciesId)?.name ?? ''
            const label = formDisplayName(speciesDisplayName(speciesName), form)
            const isFemale = femaleEntryIds.has(entry.id)
            return (
              <li key={entry.id}>
                <span className="dex-resolve-gender-label">
                  {label}
                  {entry.shiny ? ' ✨' : ''}
                </span>
                <label>
                  <input type="radio" name={`gender-${entry.id}`} checked={!isFemale} onChange={() => setGender(entry.id, 'male')} />
                  Male
                </label>
                <label>
                  <input type="radio" name={`gender-${entry.id}`} checked={isFemale} onChange={() => setGender(entry.id, 'female')} />
                  Female
                </label>
              </li>
            )
          })}
        </ul>
        <div className="origin-modal-actions">
          <button
            type="button"
            onClick={() => {
              const maleEntryIds = ambiguousEntries.map(({ entry }) => entry.id).filter((id) => !femaleEntryIds.has(id))
              onResolve([...femaleEntryIds], maleEntryIds)
            }}
          >
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
