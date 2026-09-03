import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CollectionEntry, CollectionEntryOriginInput, Form, Species } from '@shared/types/pokemon'
import type { StorageLocation } from '@shared/types/storage-location'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import { BackupControls } from './BackupControls'
import { UpdateControls } from './UpdateControls'
import { ThemeProvider } from './theme/theme-store'
import { ThemeModeToggle } from './theme/ThemeModeToggle'
import { buildDexSections } from './dex/buildDexSections'
import { filterDexSections } from './dex/filterDexSections'
import { sortDexSections } from './dex/sortDexSections'
import { computeCompletionStats, DEFAULT_COMPLETION_STATS_OPTIONS, filterEntriesByStorageLocation } from './dex/completionStats'
import type { CompletionStatsOptions } from './dex/completionStats'
import { DexTable } from './dex/DexTable'
import { DexLocationTabs } from './dex/DexLocationTabs'
import { DexToolbar } from './dex/DexToolbar'
import { DexFilterBar } from './dex/DexFilterBar'
import { CompletionStatsPanel } from './dex/CompletionStatsPanel'
import type { DexFilters, DexOptions, DexSort } from './dex/types'
import { DEFAULT_DEX_FILTERS, DEFAULT_DEX_SORT } from './dex/types'
import { TrainerProfilesPanel } from './trainer/TrainerProfilesPanel'
import { StorageLocationsPanel } from './storage-location/StorageLocationsPanel'
import { CollectionView } from './collection/CollectionView'

const DEFAULT_OPTIONS: DexOptions = { splitGenderRows: false, regionalMode: 'inline' }

// Empty until loadAll's fetch resolves (App gates rendering behind `loading` until then,
// same as species/forms/entries below) — an empty availability dataset makes Leg 6's
// invalid-combo check a no-op rather than a crash.
const EMPTY_SPECIES_AVAILABILITY: SpeciesAvailabilityData = { pokedexes: {}, gameToPokedexes: {} }

/** Which top-level lens the collection is browsed through — the species-first Living Dex
 * grid, the owned-entries-grouped-by-origin/OT/shiny Collection view (Leg 18), or the
 * Trainer Profiles/Storage Locations management tabs (Leg 1 of the nav-restructuring
 * milestone — previously always-mounted stacked panels above the Dex/Collection tabs). */
type AppView = 'dex' | 'collection' | 'trainers' | 'storage-locations'

/** The v1 spreadsheet-style Living Dex grid. See docs/completed-archive/living-dex-v1.md's
 * [Spreadsheet-style Living Dex UI] item (Leg 3). */
export function App(): JSX.Element {
  const [species, setSpecies] = useState<Species[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [entries, setEntries] = useState<CollectionEntry[]>([])
  // Fetched here (rather than left to StorageLocationsPanel's own load) so DexTable's
  // interim assignment picker (Leg 3) has the list to populate its dropdown from, and so
  // DexLocationTabs (Leg 8) has it for the per-location tab bar.
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([])
  const [speciesAvailability, setSpeciesAvailability] = useState<SpeciesAvailabilityData>(EMPTY_SPECIES_AVAILABILITY)
  const [loading, setLoading] = useState(true)
  const [options, setOptions] = useState<DexOptions>(DEFAULT_OPTIONS)
  const [filters, setFilters] = useState<DexFilters>(DEFAULT_DEX_FILTERS)
  const [sort, setSort] = useState<DexSort | null>(DEFAULT_DEX_SORT)
  const [completionStatsOptions, setCompletionStatsOptions] = useState<CompletionStatsOptions>(
    DEFAULT_COMPLETION_STATS_OPTIONS
  )
  // Leg 8's per-location tab selection for the Living Dex view. Defaults to the
  // Unassigned tab (null) rather than the first real location — it needs no data to
  // resolve on first render, and it's where every entry starts out anyway (see
  // DexLocationTabs' doc comment).
  const [selectedLocationTab, setSelectedLocationTab] = useState<number | null>(null)
  const [view, setView] = useState<AppView>('dex')
  // Bumped after a JSON import (Leg 13 added Trainer Profiles/Storage Locations to the
  // backup) so both panels below remount and refetch — they load their own data on
  // mount only and have no other way to learn the DB moved out from under them.
  const [importVersion, setImportVersion] = useState(0)

  // Reused after a JSON import too, since that writes owned state straight to SQLite
  // without going through setOwned — React's copy has to be reloaded from scratch.
  const loadAll = useCallback((): Promise<void> => {
    return Promise.all([
      window.premierDex.listSpecies(),
      window.premierDex.listForms(),
      window.premierDex.listCollectionEntries(),
      window.premierDex.listStorageLocations(),
      window.premierDex.loadSpeciesAvailability()
    ]).then(([speciesList, formList, entryList, storageLocationList, availability]) => {
      setSpecies(speciesList)
      setForms(formList)
      setEntries(entryList)
      setStorageLocations(storageLocationList)
      setSpeciesAvailability(availability)
    })
  }, [])

  const handleImported = useCallback((): void => {
    setImportVersion((v) => v + 1)
    loadAll()
  }, [loadAll])

  // Trainer Profile update (live sync, Leg 31) and delete (orphaning) both rewrite
  // collection_entries directly at the DB layer, bypassing setEntryOrigin — refetch just
  // the entries so linked-but-stale rows in state pick up the change.
  const refetchEntries = useCallback((): void => {
    window.premierDex.listCollectionEntries().then(setEntries)
  }, [])

  useEffect(() => {
    loadAll().finally(() => setLoading(false))
  }, [loadAll])

  // Leg 8: both the table and the stats panel scope to the selected location tab via
  // Leg 7's filter, applied once here rather than in each consumer. An entry that's
  // unowned everywhere sits at storageLocationId: null, same as an owned-but-unassigned
  // one — so it only ever appears (checkable) under the Unassigned tab; see
  // DexLocationTabs' doc comment for why that's the intended Leg 8/9 workflow, not a bug.
  const entriesForLocationTab = useMemo(
    () => filterEntriesByStorageLocation(entries, selectedLocationTab),
    [entries, selectedLocationTab]
  )

  const sections = useMemo(
    () => buildDexSections(species, forms, entriesForLocationTab, options),
    [species, forms, entriesForLocationTab, options]
  )
  const filteredSections = useMemo(() => filterDexSections(sections, filters), [sections, filters])
  const visibleSections = useMemo(() => sortDexSections(filteredSections, sort), [filteredSections, sort])
  // Independent of options/filters/sort (all display-only) — stats reflect the whole of
  // the selected tab's location, not the currently-visible slice. See completionStats.ts.
  const completionStats = useMemo(
    () => computeCompletionStats(forms, entriesForLocationTab, completionStatsOptions),
    [forms, entriesForLocationTab, completionStatsOptions]
  )

  const handleToggleEntry = (entryId: number, owned: boolean): void => {
    window.premierDex.setOwned(entryId, owned).then((updated) => {
      setEntries((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)))
    })
  }

  const handleSaveOrigin = (entryId: number, input: CollectionEntryOriginInput): void => {
    window.premierDex.setEntryOrigin(entryId, input).then((updated) => {
      setEntries((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)))
    })
  }

  const handleSaveStorageLocation = (entryId: number, storageLocationId: number | null): void => {
    window.premierDex.setEntryStorageLocation(entryId, storageLocationId).then((updated) => {
      setEntries((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)))
    })
  }

  const handleSetCollapsedDisplayForm = (speciesId: number, formId: number | null): void => {
    window.premierDex.setCollapsedDisplayForm(speciesId, formId).then((updated) => {
      setSpecies((prev) => prev.map((sp) => (sp.id === updated.id ? updated : sp)))
    })
  }

  if (loading) {
    return <p>Loading…</p>
  }

  return (
    <ThemeProvider>
      <div className="app-shell">
        <header className="app-header">
          <h1 className="app-title">PremierDex</h1>
          <div className="app-header-controls">
            <ThemeModeToggle />
            <BackupControls onImported={handleImported} />
            <UpdateControls />
          </div>
        </header>
        <nav className="app-view-tabs">
          <button type="button" className={view === 'dex' ? 'app-view-tab active' : 'app-view-tab'} onClick={() => setView('dex')}>
            Living Dex
          </button>
          <button
            type="button"
            className={view === 'collection' ? 'app-view-tab active' : 'app-view-tab'}
            onClick={() => setView('collection')}
          >
            Collection
          </button>
          <button
            type="button"
            className={view === 'trainers' ? 'app-view-tab active' : 'app-view-tab'}
            onClick={() => setView('trainers')}
          >
            Trainer Profiles
          </button>
          <button
            type="button"
            className={view === 'storage-locations' ? 'app-view-tab active' : 'app-view-tab'}
            onClick={() => setView('storage-locations')}
          >
            Storage Locations
          </button>
        </nav>
        <main className="app-content">
          {view === 'dex' && (
            <>
              <DexLocationTabs
                storageLocations={storageLocations}
                selected={selectedLocationTab}
                onSelect={setSelectedLocationTab}
              />
              <CompletionStatsPanel
                stats={completionStats}
                options={completionStatsOptions}
                onOptionsChange={setCompletionStatsOptions}
              />
              <DexToolbar options={options} onChange={setOptions} />
              <DexFilterBar filters={filters} onChange={setFilters} />
              <DexTable
                sections={visibleSections}
                sort={sort}
                onSortChange={setSort}
                onToggleEntry={handleToggleEntry}
                onSaveOrigin={handleSaveOrigin}
                onSetCollapsedDisplayForm={handleSetCollapsedDisplayForm}
                storageLocations={storageLocations}
                onSaveStorageLocation={handleSaveStorageLocation}
                speciesAvailability={speciesAvailability}
              />
            </>
          )}
          {view === 'collection' && (
            <CollectionView species={species} forms={forms} entries={entries} onSaveOrigin={handleSaveOrigin} />
          )}
          {view === 'trainers' && <TrainerProfilesPanel key={importVersion} onEntriesChanged={refetchEntries} />}
          {view === 'storage-locations' && (
            <StorageLocationsPanel key={importVersion} onLocationsChanged={loadAll} />
          )}
        </main>
      </div>
    </ThemeProvider>
  )
}
