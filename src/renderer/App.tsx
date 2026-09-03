import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CollectionEntry, CollectionEntryOriginInput, Form, Species } from '@shared/types/pokemon'
import { BackupControls } from './BackupControls'
import { UpdateControls } from './UpdateControls'
import { buildDexSections } from './dex/buildDexSections'
import { filterDexSections } from './dex/filterDexSections'
import { DexTable } from './dex/DexTable'
import { DexToolbar } from './dex/DexToolbar'
import { DexFilterBar } from './dex/DexFilterBar'
import type { DexFilters, DexOptions } from './dex/types'
import { DEFAULT_DEX_FILTERS } from './dex/types'
import { TrainerProfilesPanel } from './trainer/TrainerProfilesPanel'
import { StorageLocationsPanel } from './storage-location/StorageLocationsPanel'

const DEFAULT_OPTIONS: DexOptions = { splitGenderRows: false, regionalMode: 'inline' }

/** The v1 spreadsheet-style Living Dex grid. See TODO.md's [Spreadsheet-style Living Dex UI] item. */
export function App(): JSX.Element {
  const [species, setSpecies] = useState<Species[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [entries, setEntries] = useState<CollectionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [options, setOptions] = useState<DexOptions>(DEFAULT_OPTIONS)
  const [filters, setFilters] = useState<DexFilters>(DEFAULT_DEX_FILTERS)
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
  const visibleSections = useMemo(() => filterDexSections(sections, filters), [sections, filters])

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
      <DexToolbar options={options} onChange={setOptions} />
      <DexFilterBar filters={filters} onChange={setFilters} />
      <DexTable sections={visibleSections} onToggleEntry={handleToggleEntry} onSaveOrigin={handleSaveOrigin} />
    </main>
  )
}
