import { useState } from 'react'
import { BackupControls } from './BackupControls'
import { UpdateControls } from './UpdateControls'
import { ThemeProvider } from './theme/theme-store'
import { ThemeModeToggle } from './theme/ThemeModeToggle'
import { LivingDexView } from './dex/LivingDexView'
import { useCollectionData } from './useCollectionData'
import { TrainerProfilesPanel } from './trainer/TrainerProfilesPanel'
import { StorageLocationsPanel } from './storage-location/StorageLocationsPanel'
import { CollectionView } from './collection/CollectionView'

/** Which top-level lens the collection is browsed through — the species-first Living Dex
 * grid, the owned-entries-grouped-by-origin/OT/shiny Collection view (Leg 18), or the
 * Trainer Profiles/Storage Locations management tabs (Leg 1 of the nav-restructuring
 * milestone — previously always-mounted stacked panels above the Dex/Collection tabs). */
type AppView = 'dex' | 'collection' | 'trainers' | 'storage-locations'

/** The v1 spreadsheet-style Living Dex grid. See docs/completed-archive/living-dex-v1.md's
 * [Spreadsheet-style Living Dex UI] item (Leg 3).
 *
 * Shell only: the view-tab nav and the per-view mount/hide wiring. All fetched data and its
 * CRUD operations live in useCollectionData (shared across every view below); the Living
 * Dex tab's own state (view-mode, filters, selected location tab, etc.) lives in
 * LivingDexView. Split apart in this shape (Leg 1 of the Box Arrangement milestone) ahead
 * of that view's third view-mode branch (Box, Leg 6). */
export function App(): JSX.Element {
  const [view, setView] = useState<AppView>('dex')
  const data = useCollectionData()

  if (data.loading) {
    return <p>Loading…</p>
  }

  return (
    <ThemeProvider>
      <div className="app-shell">
        <header className="app-header">
          <h1 className="app-title">PremierDex</h1>
          <div className="app-header-controls">
            <ThemeModeToggle />
            <BackupControls onImported={data.handleImported} />
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
          {/* Kept mounted and hidden via the `hidden` attribute rather than conditionally
           * rendered like the other views below. DexTable's row count (~1000+ DexRows, each
           * with two populated <select>s, a sprite <img>, checkboxes) made a full
           * unmount/remount on every switch into this tab the dominant cost — see
           * LivingDexView's own hidden-toggle comments for the same treatment one level
           * down, between its List/Hybrid/(Box) view modes. */}
          <div hidden={view !== 'dex'}>
            <LivingDexView
              species={data.species}
              forms={data.forms}
              entries={data.entries}
              storageLocations={data.storageLocations}
              boxes={data.boxes}
              boxPlaceholders={data.boxPlaceholders}
              trainerProfiles={data.trainerProfiles}
              speciesAvailability={data.speciesAvailability}
              onSetEntryOwned={data.setEntryOwned}
              onSaveStorageLocation={data.setEntryStorageLocation}
              onSaveOrigin={data.setEntryOrigin}
              onSetEntryBoxPosition={data.setEntryBoxPosition}
              onSwapEntryBoxPositions={data.swapEntryBoxPositions}
              onFillBoxSlots={data.fillBoxSlots}
              onSetCollapsedDisplayForm={data.setCollapsedDisplayForm}
              onAddBox={data.addBox}
              onRenameBox={data.renameBox}
              onSetBoxPlaceholder={data.setBoxPlaceholder}
              onClearBoxPlaceholder={data.clearBoxPlaceholder}
            />
          </div>
          {view === 'collection' && (
            <CollectionView species={data.species} forms={data.forms} entries={data.entries} onSaveOrigin={data.setEntryOrigin} />
          )}
          {view === 'trainers' && <TrainerProfilesPanel key={data.importVersion} onEntriesChanged={data.refetchEntries} />}
          {view === 'storage-locations' && (
            <StorageLocationsPanel key={data.importVersion} onLocationsChanged={data.loadAll} />
          )}
        </main>
      </div>
    </ThemeProvider>
  )
}
