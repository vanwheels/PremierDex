import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CollectionEntry, CollectionEntryOriginInput, Form, Species } from '@shared/types/pokemon'
import { BackupControls } from './BackupControls'
import { UpdateControls } from './UpdateControls'
import { buildDexSections } from './dex/buildDexSections'
import { filterDexSections } from './dex/filterDexSections'
import { sortDexSections } from './dex/sortDexSections'
import { computeCompletionStats, DEFAULT_COMPLETION_STATS_OPTIONS } from './dex/completionStats'
import type { CompletionStatsOptions } from './dex/completionStats'
import { DexTable } from './dex/DexTable'
import { DexToolbar } from './dex/DexToolbar'
import { DexFilterBar } from './dex/DexFilterBar'
import { CompletionStatsPanel } from './dex/CompletionStatsPanel'
import type { DexFilters, DexOptions, DexSort } from './dex/types'
import { DEFAULT_DEX_FILTERS, DEFAULT_DEX_SORT } from './dex/types'
import { TrainerProfilesPanel } from './trainer/TrainerProfilesPanel'
import { StorageLocationsPanel } from './storage-location/StorageLocationsPanel'
import { CollectionView } from './collection/CollectionView'

const DEFAULT_OPTIONS: DexOptions = { splitGenderRows: false, regionalMode: 'inline' }

/** Which top-level lens the collection is browsed through — the species-first Living
 * Dex grid, or the owned-entries-grouped-by-origin/OT/shiny Collection view (Leg 18). */
type AppView = 'dex' | 'collection'

/** The v1 spreadsheet-style Living Dex grid. See TODO.md's [Spreadsheet-style Living Dex UI] item. */
export function App(): JSX.Element {
  const [species, setSpecies] = useState<Species[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [entries, setEntries] = useState<CollectionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [options, setOptions] = useState<DexOptions>(DEFAULT_OPTIONS)
  const [filters, setFilters] = useState<DexFilters>(DEFAULT_DEX_FILTERS)
  const [sort, setSort] = useState<DexSort | null>(DEFAULT_DEX_SORT)
  const [completionStatsOptions, setCompletionStatsOptions] = useState<CompletionStatsOptions>(
    DEFAULT_COMPLETION_STATS_OPTIONS
  )
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
      window.premierDex.listCollectionEntries()
    ]).then(([speciesList, formList, entryList]) => {
      setSpecies(speciesList)
      setForms(formList)
      setEntries(entryList)
    })
  }, [])

  const handleImported = useCallback((): void => {
    setImportVersion((v) => v + 1)
    loadAll()
  }, [loadAll])

  useEffect(() => {
    loadAll().finally(() => setLoading(false))
  }, [loadAll])

  const sections = useMemo(
    () => buildDexSections(species, forms, entries, options),
    [species, forms, entries, options]
  )
  const filteredSections = useMemo(() => filterDexSections(sections, filters), [sections, filters])
  const visibleSections = useMemo(() => sortDexSections(filteredSections, sort), [filteredSections, sort])
  // Independent of options/filters/sort (all display-only) — stats reflect the whole
  // collection, not the currently-visible slice. See completionStats.ts.
  const completionStats = useMemo(
    () => computeCompletionStats(forms, entries, completionStatsOptions),
    [forms, entries, completionStatsOptions]
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

  if (loading) {
    return <p>Loading…</p>
  }

  return (
    <main>
      <h1>PremierDex</h1>
      <BackupControls onImported={handleImported} />
      <UpdateControls />
      <TrainerProfilesPanel key={importVersion} />
      <StorageLocationsPanel key={importVersion} />
      <CompletionStatsPanel
        stats={completionStats}
        options={completionStatsOptions}
        onOptionsChange={setCompletionStatsOptions}
      />
      <div className="app-view-tabs">
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
      </div>
      {view === 'dex' ? (
        <>
          <DexToolbar options={options} onChange={setOptions} />
          <DexFilterBar filters={filters} onChange={setFilters} />
          <DexTable
            sections={visibleSections}
            sort={sort}
            onSortChange={setSort}
            onToggleEntry={handleToggleEntry}
            onSaveOrigin={handleSaveOrigin}
          />
        </>
      ) : (
        <CollectionView species={species} forms={forms} entries={entries} onSaveOrigin={handleSaveOrigin} />
      )}
    </main>
  )
}
