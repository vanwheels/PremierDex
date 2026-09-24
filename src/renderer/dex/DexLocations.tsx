import { useMemo, useState } from 'react'
import type { EncounterData } from '@shared/types/encounters'
import type { Form, Species } from '@shared/types/pokemon'
import { buildDexLocations, filterDexLocations } from './dexLocationIndex'
import type { SpeciesDetailTarget } from './SpeciesDetailPopup'

interface DexLocationsProps {
  species: Species[]
  forms: Form[]
  encounterData: EncounterData
  onOpenSpecies: (target: SpeciesDetailTarget) => void
}

/**
 * Full UI/UX pass Leg 4: the Dex tab's Locations sub-tab — a searchable location list on the
 * left, the species found at the selected location (with which games) on the right. Built
 * off encounters.json, so it carries that dataset's coverage gap (no Brilliant Diamond/
 * Shining Pearl, Legends Arceus, Scarlet/Violet, or Legends Z-A — see encounters.ts).
 */
export function DexLocations({ species, forms, encounterData, onOpenSpecies }: DexLocationsProps): JSX.Element {
  const [query, setQuery] = useState('')
  const [selectedName, setSelectedName] = useState<string | null>(null)

  const locations = useMemo(() => buildDexLocations(encounterData, species, forms), [encounterData, species, forms])
  const visible = useMemo(() => filterDexLocations(locations, query), [locations, query])
  const selected = locations.find((l) => l.name === selectedName) ?? null

  return (
    <div className="dex-locations">
      <div className="dex-locations-list">
        <input
          type="search"
          className="dex-tab-search"
          value={query}
          placeholder="Search locations…"
          onChange={(e) => setQuery(e.target.value)}
        />
        <ul>
          {visible.map((loc) => (
            <li key={loc.name}>
              <button
                type="button"
                className={loc.name === selectedName ? 'dex-locations-item active' : 'dex-locations-item'}
                onClick={() => setSelectedName(loc.name)}
              >
                {loc.name}
              </button>
            </li>
          ))}
        </ul>
        {visible.length === 0 && <p className="dex-tab-empty">No locations match “{query.trim()}”.</p>}
      </div>
      <div className="dex-locations-detail">
        {selected ? (
          <>
            <h3>{selected.name}</h3>
            <ul>
              {selected.species.map((s) => (
                <li key={`${s.speciesId}-${s.formName}`} className="dex-locations-species">
                  <span className="dex-list-number">#{String(s.speciesId).padStart(3, '0')}</span>
                  <button
                    type="button"
                    className="dex-list-name"
                    onClick={() => onOpenSpecies({ speciesId: s.speciesId, formName: s.formName })}
                  >
                    {s.displayName}
                  </button>
                  <span className="dex-locations-games">{s.gamesLabel}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="dex-tab-empty">Select a location to see which Pokémon appear there.</p>
        )}
      </div>
    </div>
  )
}
