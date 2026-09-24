import { useMemo, useState } from 'react'
import type { EncounterData } from '@shared/types/encounters'
import type { Form, Species } from '@shared/types/pokemon'
import { DexLocationDetail } from './DexLocationDetail'
import { buildDexGames, filterDexLocations } from './dexLocationIndex'
import { gameColor } from './gameColors'
import type { SpeciesDetailTarget } from './SpeciesDetailPopup'

interface DexLocationsProps {
  species: Species[]
  forms: Form[]
  encounterData: EncounterData
  onOpenSpecies: (target: SpeciesDetailTarget) => void
}

/**
 * The Dex tab's Locations sub-tab as three panes (Encounter display rework Leg 3): Games ->
 * the selected game's searchable Locations -> the species found at the selected location.
 * Built off encounters.json, so it carries that dataset's coverage gap (no Brilliant Diamond/
 * Shining Pearl, Legends Arceus, Scarlet/Violet, or Legends Z-A — see encounters.ts).
 */
export function DexLocations({ species, forms, encounterData, onOpenSpecies }: DexLocationsProps): JSX.Element {
  const [query, setQuery] = useState('')
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)

  const games = useMemo(() => buildDexGames(encounterData, species, forms), [encounterData, species, forms])
  const game = games.find((g) => g.label === selectedGame) ?? null
  const visible = useMemo(() => (game ? filterDexLocations(game.locations, query) : []), [game, query])
  const location = game?.locations.find((l) => l.name === selectedLocation) ?? null

  return (
    <div className="dex-locations">
      <div className="dex-locations-games">
        <ul>
          {games.map((g) => {
            const { bg, fg } = gameColor(g.gameId)
            const active = g.label === selectedGame
            return (
              <li key={g.label}>
                <button
                  type="button"
                  className={active ? 'dex-locations-game active' : 'dex-locations-game'}
                  style={active ? { backgroundColor: bg, color: fg } : { borderLeftColor: bg }}
                  onClick={() => {
                    setSelectedGame(g.label)
                    setSelectedLocation(null)
                  }}
                >
                  {g.label}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      <div className="dex-locations-list">
        {game ? (
          <>
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
                    className={loc.name === selectedLocation ? 'dex-locations-item active' : 'dex-locations-item'}
                    onClick={() => setSelectedLocation(loc.name)}
                  >
                    {loc.name}
                  </button>
                </li>
              ))}
            </ul>
            {visible.length === 0 && <p className="dex-tab-empty">No locations match “{query.trim()}”.</p>}
          </>
        ) : (
          <p className="dex-tab-empty">Select a game.</p>
        )}
      </div>
      <div className="dex-locations-detail">
        {location ? (
          <DexLocationDetail
            key={`${game?.label}/${location.name}`}
            location={location}
            methods={encounterData.methods}
            onOpenSpecies={onOpenSpecies}
          />
        ) : (
          <p className="dex-tab-empty">
            {game ? 'Select a location to see which Pokémon appear there.' : 'Pick a game, then a location.'}
          </p>
        )}
      </div>
    </div>
  )
}
