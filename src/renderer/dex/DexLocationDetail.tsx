import { useMemo, useState } from 'react'
import { applyConditionSelection, type ConditionSelection } from './encounterConditions'
import { groupEncounterDetails } from './encountersFormat'
import type { DexLocation } from './dexLocationIndex'
import type { SpeciesDetailTarget } from './SpeciesDetailPopup'

interface DexLocationDetailProps {
  location: DexLocation
  methods: string[]
  onOpenSpecies: (target: SpeciesDetailTarget) => void
}

/**
 * Third pane of the Locations sub-tab: the species at one game's location, each with its
 * grouped encounter rows. A toggle row per condition the location's encounters vary in (time,
 * weather, ...) re-filters and re-groups the raw details; a location with no such variation
 * shows none. The parent keys this component by game+location so the selection resets when
 * either changes.
 */
export function DexLocationDetail({ location, methods, onOpenSpecies }: DexLocationDetailProps): JSX.Element {
  const [selection, setSelection] = useState<ConditionSelection>({})

  const entries = useMemo(
    () =>
      location.species
        .map((s) => ({ ...s, rows: groupEncounterDetails(applyConditionSelection(s.details, selection), methods) }))
        .filter((s) => s.rows.length > 0),
    [location, methods, selection]
  )

  const choose = (key: string, value: string | null): void => {
    setSelection((prev) => {
      const next = { ...prev }
      if (value === null) delete next[key]
      else next[key] = value
      return next
    })
  }

  return (
    <>
      <h3>{location.name}</h3>
      {location.toggles.map((toggle) => (
        <div key={toggle.key} className="dex-locations-toggle" role="group" aria-label={toggle.label}>
          <span className="dex-locations-toggle-label">{toggle.label}</span>
          {[{ value: null, label: 'All' }, ...toggle.options].map((option) => {
            const active = (selection[toggle.key] ?? null) === option.value
            return (
              <button
                key={option.value ?? 'all'}
                type="button"
                className={active ? 'dex-locations-toggle-option active' : 'dex-locations-toggle-option'}
                aria-pressed={active}
                onClick={() => choose(toggle.key, option.value)}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      ))}
      <table className="dex-locations-table">
        <colgroup>
          <col className="dex-locations-col-number" />
          <col className="dex-locations-col-name" />
          <col className="dex-locations-col-method" />
          <col className="dex-locations-col-levels" />
          <col className="dex-locations-col-conditions" />
        </colgroup>
        <thead>
          <tr>
            <th>#</th>
            <th>Pokémon</th>
            <th>Method</th>
            <th>Levels</th>
            <th>Conditions</th>
          </tr>
        </thead>
        <tbody>
          {entries.flatMap((s) =>
            s.rows.map((row, i) => (
              <tr key={`${s.speciesId}-${s.formName}-${i}`}>
                <td className="dex-list-number">{i === 0 ? `#${String(s.speciesId).padStart(3, '0')}` : ''}</td>
                <td>
                  {i === 0 && (
                    <button
                      type="button"
                      className="dex-list-name"
                      onClick={() => onOpenSpecies({ speciesId: s.speciesId, formName: s.formName })}
                    >
                      {s.displayName}
                    </button>
                  )}
                </td>
                <td>{row.method}</td>
                <td>{row.levels}</td>
                <td>{row.conditions ?? ''}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {entries.length === 0 && <p className="dex-tab-empty">No encounters match this selection.</p>}
    </>
  )
}
