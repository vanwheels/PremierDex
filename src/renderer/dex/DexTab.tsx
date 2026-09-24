import { useState } from 'react'
import type { EncounterData } from '@shared/types/encounters'
import type { Form, Species } from '@shared/types/pokemon'
import type { SpeciesDetailsData } from '@shared/types/species-details'
import { DexLocations } from './DexLocations'
import { DexPokemonList } from './DexPokemonList'
import type { SpeciesDetailTarget } from './SpeciesDetailPopup'

interface DexTabProps {
  species: Species[]
  forms: Form[]
  speciesDetails: SpeciesDetailsData
  encounterData: EncounterData
  onOpenSpecies: (target: SpeciesDetailTarget) => void
}

type DexSubTab = 'pokemon' | 'locations'

/**
 * Full UI/UX pass Leg 4: the top-level Dex tab (sketch-1's second tab) — a reference browser
 * with no ownership concept, modelled on reference-dex-list.png's Pokémon/Locations
 * sub-tabs. Its Search and Moves sub-tabs are deferred (TODO.md, Species/Dex reference data
 * layer). Both panes stay mounted and toggle via `hidden` so each keeps its own search/sort
 * state and scroll position across sub-tab switches.
 */
export function DexTab({ species, forms, speciesDetails, encounterData, onOpenSpecies }: DexTabProps): JSX.Element {
  const [subTab, setSubTab] = useState<DexSubTab>('pokemon')

  return (
    <div className="dex-tab">
      <nav className="dex-tab-subtabs">
        <button
          type="button"
          className={subTab === 'pokemon' ? 'dex-tab-subtab active' : 'dex-tab-subtab'}
          onClick={() => setSubTab('pokemon')}
        >
          Pokémon
        </button>
        <button
          type="button"
          className={subTab === 'locations' ? 'dex-tab-subtab active' : 'dex-tab-subtab'}
          onClick={() => setSubTab('locations')}
        >
          Locations
        </button>
      </nav>
      <div hidden={subTab !== 'pokemon'}>
        <DexPokemonList species={species} forms={forms} speciesDetails={speciesDetails} onOpenSpecies={onOpenSpecies} />
      </div>
      <div hidden={subTab !== 'locations'}>
        <DexLocations species={species} forms={forms} encounterData={encounterData} onOpenSpecies={onOpenSpecies} />
      </div>
    </div>
  )
}
