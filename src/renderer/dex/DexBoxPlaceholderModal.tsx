import { useEffect, useMemo, useState } from 'react'
import type { Species } from '@shared/types/pokemon'
import { speciesDisplayName } from './formNames'

interface DexBoxPlaceholderModalProps {
  species: Species[]
  /** Non-null when this is "Change species" on an existing placeholder — pre-selects and
   * highlights its current species rather than opening on an empty search. */
  initialSpeciesId: number | null
  onClose: () => void
  onSave: (speciesId: number) => void
}

// Same reasoning as OriginGameInput's own search-filtered list: species can run past 1000
// entries, so this caps the rendered list rather than ever mounting all of them at once —
// the search box is how a user narrows down to the one they want, not a scroll.
const MAX_VISIBLE_MATCHES = 50

/**
 * Species picker for a Box view "planned" placeholder (Leg 5 of the Box View Polish &
 * Multi-Box Editing milestone) — right-click an empty slot ("Set placeholder…") or an
 * existing placeholder ("Change species") in DexBoxPane. Reuses OriginModal's backdrop/
 * dialog chrome (origin-modal-*) rather than a parallel stylesheet, since the two are
 * visually identical dialogs and this one doesn't need OriginModal's field-heavy layout —
 * just a search box and a result list. Species only, no form/gender/shiny — see
 * shared/types/box.ts's BoxPlaceholder doc comment for why.
 */
export function DexBoxPlaceholderModal({
  species,
  initialSpeciesId,
  onClose,
  onSave
}: DexBoxPlaceholderModalProps): JSX.Element {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(initialSpeciesId)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    const named = species.map((sp) => ({ sp, name: speciesDisplayName(sp.name) }))
    const filtered = q ? named.filter(({ name }) => name.toLowerCase().includes(q)) : named
    return filtered.slice(0, MAX_VISIBLE_MATCHES)
  }, [species, query])

  return (
    <div className="origin-modal-backdrop" onClick={onClose}>
      <div className="origin-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="origin-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2>{initialSpeciesId !== null ? 'Change planned species' : 'Set placeholder'}</h2>
        <label className="origin-modal-field">
          Species
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search species…"
            autoFocus
          />
        </label>
        {/* Reuses OriginGameInput's own scrollable option-list styling (origin-game-options)
         * rather than a parallel stylesheet — same elevated-list-of-buttons shape, just
         * inline in the dialog body instead of anchored under an input. */}
        <ul className="origin-game-options dex-box-placeholder-options" role="listbox">
          {matches.map(({ sp, name }) => (
            <li key={sp.id}>
              <button
                type="button"
                className={sp.id === selectedId ? 'dex-box-placeholder-option-selected' : undefined}
                onClick={() => setSelectedId(sp.id)}
              >
                {name}
              </button>
            </li>
          ))}
          {matches.length === 0 && <li className="dex-box-placeholder-no-matches">No matching species.</li>}
        </ul>
        <div className="origin-modal-actions">
          <button type="button" onClick={() => selectedId !== null && onSave(selectedId)} disabled={selectedId === null}>
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
