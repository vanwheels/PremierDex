import { useState } from 'react'
import { SettingsButton } from './SettingsButton'
import { UpdateControls } from './UpdateControls'
import { ThemeProvider } from './theme/theme-store'
import { ThemeModeToggle } from './theme/ThemeModeToggle'
import { LivingDexView } from './dex/LivingDexView'
import { useCollectionData } from './useCollectionData'
import { SpeciesPage } from './dex/SpeciesPage'
import type { SpeciesDetailTarget } from './dex/SpeciesDetailPopup'

/** Which top-level view is showing. 'collection' is what used to be the Living Dex tab
 * (Leg 1 of the Full UI/UX pass — it now also hosts the Storage Locations/Trainer Profiles
 * popups, and the old group-by Collection tab is gone); 'dex' is the new species reference
 * browser (placeholder until Leg 4); 'species' is the full species page (Leg 3 of the
 * Species database milestone — reached only via SpeciesDetailPopup's "View Full Page"
 * button, not a persistent nav tab). */
type AppView = 'collection' | 'dex' | 'species'

/** The v1 spreadsheet-style Living Dex grid. See docs/completed-archive/living-dex-v1.md's
 * [Spreadsheet-style Living Dex UI] item (Leg 3).
 *
 * Shell only: the view-tab nav and the per-view mount/hide wiring. All fetched data and its
 * CRUD operations live in useCollectionData (shared across every view below); the Living
 * Dex tab's own state (view-mode, filters, selected location tab, etc.) lives in
 * LivingDexView. Split apart in this shape (Leg 1 of the Box Arrangement milestone) ahead
 * of that view's third view-mode branch (Box, Leg 6). */
export function App(): JSX.Element {
  const [view, setView] = useState<AppView>('collection')
  // Leg 3 of the Species database milestone: the full page's own target, carried
  // alongside `view` since AppView alone has no payload — set together with
  // setView('species') by openFullPage below.
  const [speciesPageTarget, setSpeciesPageTarget] = useState<SpeciesDetailTarget | null>(null)
  const data = useCollectionData()

  if (data.loading) {
    return <p>Loading…</p>
  }

  const openFullPage = (target: SpeciesDetailTarget): void => {
    setSpeciesPageTarget(target)
    setView('species')
  }

  return (
    <ThemeProvider>
      <div className="app-shell">
        <header className="app-header">
          <h1 className="app-title">PremierDex</h1>
          <div className="app-header-controls">
            <UpdateControls />
            <ThemeModeToggle />
            <SettingsButton onImported={data.handleImported} />
          </div>
        </header>
        <nav className="app-view-tabs">
          <button
            type="button"
            className={view === 'collection' ? 'app-view-tab active' : 'app-view-tab'}
            onClick={() => setView('collection')}
          >
            Collection
          </button>
          <button type="button" className={view === 'dex' ? 'app-view-tab active' : 'app-view-tab'} onClick={() => setView('dex')}>
            Dex
          </button>
        </nav>
        <main className="app-content">
          {/* Kept mounted and hidden via the `hidden` attribute rather than conditionally
           * rendered like the other views below. DexTable's row count (~1000+ DexRows, each
           * with two populated <select>s, a sprite <img>, checkboxes) made a full
           * unmount/remount on every switch into this tab the dominant cost — see
           * LivingDexView's own hidden-toggle comments for the same treatment one level
           * down, between its List/Hybrid/(Box) view modes. */}
          <div hidden={view !== 'collection'}>
            <LivingDexView
              isActive={view === 'collection'}
              species={data.species}
              forms={data.forms}
              evolutionEdges={data.evolutionEdges}
              formeSwitchGroups={data.formeSwitchGroups}
              entries={data.entries}
              storageLocations={data.storageLocations}
              boxes={data.boxes}
              boxPlaceholders={data.boxPlaceholders}
              trainerProfiles={data.trainerProfiles}
              speciesAvailability={data.speciesAvailability}
              onSetEntryOwned={data.setEntryOwned}
              onSaveStorageLocation={data.setEntryStorageLocation}
              onBulkMoveEntries={data.bulkMoveEntries}
              onBulkSetEntryGender={data.bulkSetEntryGender}
              onSaveOrigin={data.setEntryOrigin}
              onSetEntryBoxPosition={data.setEntryBoxPosition}
              onSwapEntryBoxPositions={data.swapEntryBoxPositions}
              onUndo={data.undo}
              canUndo={data.canUndo}
              onFillBoxSlots={data.fillBoxSlots}
              onSetCollapsedDisplayForm={data.setCollapsedDisplayForm}
              onAddBox={data.addBox}
              onRenameBox={data.renameBox}
              onSetBoxPlaceholder={data.setBoxPlaceholder}
              onSetBoxPlaceholders={data.setBoxPlaceholders}
              onClearBoxPlaceholder={data.clearBoxPlaceholder}
              onClearAllBoxPlaceholders={data.clearAllBoxPlaceholders}
              onFillInPlaceholders={data.fillInPlaceholders}
              onMoveEntriesToLocation={data.moveEntriesToLocation}
              onOpenFullPage={openFullPage}
              onLocationsChanged={data.loadAll}
              onEntriesChanged={data.refetchEntries}
            />
          </div>
          {view === 'dex' && <p>Dex — coming soon.</p>}
          {view === 'species' && speciesPageTarget && (
            <SpeciesPage
              target={speciesPageTarget}
              species={data.species}
              forms={data.forms}
              speciesDetails={data.speciesDetails}
              encounterData={data.encounterData}
              speciesAvailability={data.speciesAvailability}
              onClose={() => setView('collection')}
            />
          )}
        </main>
      </div>
    </ThemeProvider>
  )
}
