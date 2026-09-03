import type { DexFilters, FilterTriState } from './types'
import { CURRENT_MAX_GENERATION } from './sprites'

interface DexFilterBarProps {
  filters: DexFilters
  onChange: (filters: DexFilters) => void
}

const GENERATIONS = Array.from({ length: CURRENT_MAX_GENERATION }, (_, i) => i + 1)

function TriStateSelect({
  label,
  value,
  onChange
}: {
  label: string
  value: FilterTriState
  onChange: (value: FilterTriState) => void
}): JSX.Element {
  return (
    <label>
      {label}:{' '}
      <select value={value} onChange={(e) => onChange(e.target.value as FilterTriState)}>
        <option value="any">Any</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </label>
  )
}

/**
 * Search/filter bar for the Living Dex grid (Leg 15). Sits alongside DexToolbar's view
 * toggles but is a distinct concern: DexToolbar changes what rows *exist* (gender
 * splitting, regional grouping), this narrows which of the built rows are *visible* — see
 * filterDexSections.ts. Presentation-only, same as DexToolbar: never persisted, never
 * written back to storage.
 */
export function DexFilterBar({ filters, onChange }: DexFilterBarProps): JSX.Element {
  return (
    <div className="dex-filter-bar">
      <label>
        <input
          type="search"
          className="dex-filter-query"
          value={filters.query}
          placeholder="Search name, #, nickname, OT, TID/SID…"
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
        />
      </label>
      <TriStateSelect label="Owned" value={filters.owned} onChange={(owned) => onChange({ ...filters, owned })} />
      <TriStateSelect label="Shiny" value={filters.shiny} onChange={(shiny) => onChange({ ...filters, shiny })} />
      <TriStateSelect label="Regional" value={filters.regional} onChange={(regional) => onChange({ ...filters, regional })} />
      <label>
        Generation:{' '}
        <select
          value={filters.generation}
          onChange={(e) => onChange({ ...filters, generation: e.target.value === 'any' ? 'any' : Number(e.target.value) })}
        >
          <option value="any">Any</option>
          {GENERATIONS.map((gen) => (
            <option key={gen} value={gen}>
              {gen}
            </option>
          ))}
        </select>
      </label>
      <TriStateSelect
        label="Home-boxable"
        value={filters.homeBoxable}
        onChange={(homeBoxable) => onChange({ ...filters, homeBoxable })}
      />
      <TriStateSelect
        label="Shiny-locked"
        value={filters.shinyLocked}
        onChange={(shinyLocked) => onChange({ ...filters, shinyLocked })}
      />
    </div>
  )
}
