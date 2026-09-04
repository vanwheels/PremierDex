import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CollectionEntry, CollectionEntryOriginInput, Form, Species } from '@shared/types/pokemon'
import type { StorageLocation } from '@shared/types/storage-location'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import type { TrainerProfile } from '@shared/types/trainer-profile'
import { BackupControls } from './BackupControls'
import { UpdateControls } from './UpdateControls'
import { ThemeProvider } from './theme/theme-store'
import { ThemeModeToggle } from './theme/ThemeModeToggle'
import { buildDexSections } from './dex/buildDexSections'
import { filterDexSections } from './dex/filterDexSections'
import { filterDepositableSections } from './dex/locationDepositability'
import { sortDexSections } from './dex/sortDexSections'
import { computeCompletionStats, DEFAULT_COMPLETION_STATS_OPTIONS, filterEntriesByStorageLocation } from './dex/completionStats'
import type { CompletionStatsOptions } from './dex/completionStats'
import { autoAssignedLocationOnCheckIn } from './dex/autoAssignLocation'
import { DexTable } from './dex/DexTable'
import { DexHybridGrid } from './dex/DexHybridGrid'
import { DexLocationTabs } from './dex/DexLocationTabs'
import { DexToolbar } from './dex/DexToolbar'
import { DexFilterBar } from './dex/DexFilterBar'
import { DexViewModeSwitcher } from './dex/DexViewModeSwitcher'
import { useDexViewMode } from './dex/useDexViewMode'
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
  // per-row assignment picker (Leg 3, Leg 9) has the list to populate its dropdown from,
  // and so DexLocationTabs (Leg 8) has it for the per-location tab bar.
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([])
  // Leg 5: fetched here (rather than left to TrainerProfilesPanel's own load) so a
  // save_file location tab can resolve its linked Trainer Profile's game and gate
  // depositability by it — see locationDepositability.ts.
  const [trainerProfiles, setTrainerProfiles] = useState<TrainerProfile[]>([])
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
  // Leg 7: persisted Living Dex layout choice — see useDexViewMode's doc comment. Leg 8
  // added the 'hybrid' branch alongside DexTable's below.
  const [viewMode, setViewMode] = useDexViewMode()
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
      window.premierDex.loadSpeciesAvailability(),
      window.premierDex.listTrainerProfiles()
    ]).then(([speciesList, formList, entryList, storageLocationList, availability, trainerProfileList]) => {
      setSpecies(speciesList)
      setForms(formList)
      setEntries(entryList)
      setStorageLocations(storageLocationList)
      setSpeciesAvailability(availability)
      setTrainerProfiles(trainerProfileList)
    })
  }, [])

  const handleImported = useCallback((): void => {
    setImportVersion((v) => v + 1)
    loadAll()
  }, [loadAll])

  // Trainer Profile create/update/delete all leave App's own `trainerProfiles` copy stale
  // (TrainerProfilesPanel manages its own list independently) — refetched here too so a
  // save_file location's depositability gate (Leg 5, locationDepositability.ts) always
  // resolves against the current game. Update (live sync, Leg 31) and delete (orphaning)
  // also rewrite collection_entries directly at the DB layer, bypassing setEntryOrigin, so
  // entries gets refetched alongside for those two.
  const refetchTrainerProfiles = useCallback((): void => {
    window.premierDex.listTrainerProfiles().then(setTrainerProfiles)
  }, [])

  const refetchEntries = useCallback((): void => {
    window.premierDex.listCollectionEntries().then(setEntries)
    refetchTrainerProfiles()
  }, [refetchTrainerProfiles])

  useEffect(() => {
    loadAll().finally(() => setLoading(false))
  }, [loadAll])

  // Leg 8: both the table and the stats panel scope to the selected location tab via
  // Leg 7's filter, applied once here rather than in each consumer. An entry that's
  // unowned everywhere sits at storageLocationId: null, same as an owned-but-unassigned
  // one — so it only ever appears (checkable) under the Unassigned tab; see
  // DexLocationTabs' doc comment. Leg 9's auto-assign-on-check-in (handleToggleEntry
  // below) is what gets a freshly-checked entry off that tab in the common case.
  const entriesForLocationTab = useMemo(
    () => filterEntriesByStorageLocation(entries, selectedLocationTab),
    [entries, selectedLocationTab]
  )

  const sections = useMemo(
    () => buildDexSections(species, forms, entriesForLocationTab, options),
    [species, forms, entriesForLocationTab, options]
  )
  // Leg 5: which species/forms even belong in this tab's table at all, ahead of the
  // user's own DexFilters dimensions below — see locationDepositability.ts. A save_file
  // location's cap comes from its linked Trainer Profile's game; every other capped type
  // (ranch/box/bank) has a fixed generation ceiling, and home/Unassigned aren't capped.
  const selectedLocation = useMemo(
    () => storageLocations.find((location) => location.id === selectedLocationTab) ?? null,
    [storageLocations, selectedLocationTab]
  )
  const selectedLocationTrainerGame = useMemo(() => {
    if (selectedLocation?.locationType !== 'save_file') return null
    return trainerProfiles.find((profile) => profile.id === selectedLocation.trainerProfileId)?.game ?? null
  }, [selectedLocation, trainerProfiles])
  const depositableSections = useMemo(
    () => filterDepositableSections(sections, selectedLocation, selectedLocationTrainerGame, speciesAvailability),
    [sections, selectedLocation, selectedLocationTrainerGame, speciesAvailability]
  )
  const filteredSections = useMemo(() => filterDexSections(depositableSections, filters), [depositableSections, filters])
  const visibleSections = useMemo(() => sortDexSections(filteredSections, sort), [filteredSections, sort])
  // Independent of options/filters/sort (all display-only) — stats reflect the whole of
  // the selected tab's location, not the currently-visible slice. See completionStats.ts.
  const completionStats = useMemo(
    () => computeCompletionStats(forms, entriesForLocationTab, completionStatsOptions),
    [forms, entriesForLocationTab, completionStatsOptions]
  )

  const handleSaveStorageLocation = (entryId: number, storageLocationId: number | null): void => {
    window.premierDex.setEntryStorageLocation(entryId, storageLocationId).then((updated) => {
      setEntries((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)))
    })
  }

  // Leg 9: checking an entry owned while a real location tab is selected assigns it there
  // in the same action, via autoAssignedLocationOnCheckIn — the per-row picker (now its own
  // table column, see DexRow) stays for reassigning afterward or assigning while on the
  // Unassigned tab.
  const handleToggleEntry = (entryId: number, owned: boolean): void => {
    window.premierDex.setOwned(entryId, owned).then((updated) => {
      setEntries((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)))
    })
    const autoLocationId = autoAssignedLocationOnCheckIn(owned, selectedLocationTab)
    if (autoLocationId !== null) {
      handleSaveStorageLocation(entryId, autoLocationId)
    }
  }

  const handleSaveOrigin = (entryId: number, input: CollectionEntryOriginInput): void => {
    window.premierDex.setEntryOrigin(entryId, input).then((updated) => {
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
          {/* Leg 2 (Table resize/tab-switch performance): kept mounted and hidden via the
           * `hidden` attribute rather than conditionally rendered like the other views
           * below. DexTable's row count (~1000+ DexRows, each with two populated <select>s,
           * a sprite <img>, checkboxes) made a full unmount/remount on every switch into
           * this tab the dominant cost — profiling found buildDexSections/filterDexSections/
           * sortDexSections were already correctly memoized, so recomputation was never the
           * bottleneck. Side effect: DexTable's local expand/collapse state (see its doc
           * comment) now survives a switch away and back instead of resetting — an
           * improvement, not a regression, but noted since the old doc comment called the
           * reset-on-navigate behavior out as intentional. */}
          <div hidden={view !== 'dex'}>
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
            <div className="dex-controls-row">
              <DexFilterBar filters={filters} onChange={setFilters} />
              <DexViewModeSwitcher viewMode={viewMode} onChange={setViewMode} />
            </div>
            {/* Hidden rather than conditionally rendered, same reasoning as the `view`
             * wrapper above (Leg 2) — switching modes shouldn't pay DexTable's mount cost
             * again on switching back. */}
            <div hidden={viewMode !== 'list'}>
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
            </div>
            {/* Leg 8: same hidden-not-unmounted treatment as DexTable above, so switching
             * back and forth between List and Hybrid doesn't re-pay either one's mount
             * cost or lose Hybrid's own tile-selection state. */}
            <div hidden={viewMode !== 'hybrid'}>
              <DexHybridGrid
                sections={visibleSections}
                storageLocations={storageLocations}
                speciesAvailability={speciesAvailability}
                onSaveOrigin={handleSaveOrigin}
              />
            </div>
          </div>
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
