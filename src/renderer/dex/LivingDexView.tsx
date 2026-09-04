import { useMemo, useState } from 'react'
import type { CollectionEntry, CollectionEntryOriginInput, Form, Gender, Species } from '@shared/types/pokemon'
import type { StorageLocation } from '@shared/types/storage-location'
import type { BoxPlaceholder, StorageBox } from '@shared/types/box'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import type { TrainerProfile } from '@shared/types/trainer-profile'
import { buildDexSections } from './buildDexSections'
import { filterDexSections } from './filterDexSections'
import { filterDepositableSections } from './locationDepositability'
import { sortDexSections } from './sortDexSections'
import { computeCompletionStats, DEFAULT_COMPLETION_STATS_OPTIONS, filterEntriesByStorageLocation } from './completionStats'
import type { CompletionStatsOptions } from './completionStats'
import { autoAssignedLocationOnCheckIn } from './autoAssignLocation'
import { DexTable } from './DexTable'
import { DexHybridGrid } from './DexHybridGrid'
import { DexBoxGrid } from './DexBoxGrid'
import type { TemplatePlacement } from './boxTemplates'
import { DexLocationTabs } from './DexLocationTabs'
import { DexToolbar } from './DexToolbar'
import { DexFilterBar } from './DexFilterBar'
import { DexViewModeSwitcher } from './DexViewModeSwitcher'
import { useDexViewMode } from './useDexViewMode'
import { CompletionStatsPanel } from './CompletionStatsPanel'
import type { DexFilters, DexOptions, DexSort } from './types'
import { DEFAULT_DEX_FILTERS, DEFAULT_DEX_SORT } from './types'

const DEFAULT_OPTIONS: DexOptions = { splitGenderRows: false, regionalMode: 'inline' }

export interface LivingDexViewProps {
  species: Species[]
  forms: Form[]
  entries: CollectionEntry[]
  storageLocations: StorageLocation[]
  boxes: StorageBox[]
  /** Leg 5 of the Box View Polish milestone — see DexBoxGrid's boxPlaceholders prop. */
  boxPlaceholders: BoxPlaceholder[]
  trainerProfiles: TrainerProfile[]
  speciesAvailability: SpeciesAvailabilityData
  onSetEntryOwned: (entryId: number, owned: boolean) => void
  onSaveStorageLocation: (entryId: number, storageLocationId: number | null) => void
  /** [Bulk move/duplicate entries between storage locations] — see DexBulkActionsBar. */
  onBulkMoveEntries: (entryIds: number[], storageLocationId: number | null) => void
  onBulkDuplicateEntries: (entryIds: number[], storageLocationId: number | null) => void
  onSaveOrigin: (entryId: number, input: CollectionEntryOriginInput) => void
  onSetEntryBoxPosition: (entryId: number, boxNumber: number | null, boxSlot: number | null) => void
  onSwapEntryBoxPositions: (entryIdA: number, entryIdB: number) => void
  /** Leg 4 of the Box View Polish milestone: multi-select drag-drop — see DexBoxGrid's
   * own doc comment. */
  onFillBoxSlots: (entryIds: number[], boxNumber: number, startSlot: number) => void
  onSetCollapsedDisplayForm: (speciesId: number, formId: number | null) => void
  onAddBox: (storageLocationId: number) => Promise<StorageBox>
  onRenameBox: (boxId: number, name: string | null) => void
  onSetBoxPlaceholder: (storageLocationId: number, boxNumber: number, boxSlot: number, formId: number, gender: Gender, shiny: boolean) => void
  /** Leg 2 of the Dex completeness tier migration: Apply Template's bulk write. */
  onSetBoxPlaceholders: (storageLocationId: number, placements: TemplatePlacement[]) => Promise<void>
  onClearBoxPlaceholder: (storageLocationId: number, boxNumber: number, boxSlot: number) => void
}

/** The Living Dex tab's own content: the per-location tab bar, completion stats, the
 * toolbar/filter/sort controls, and the view-mode-switched grid itself. Split out of
 * App.tsx (Leg 1 of the Box Arrangement milestone) ahead of Leg 6 adding a third view-mode
 * branch here (Box, HOME-style grid) alongside List (DexTable) and Hybrid (DexHybridGrid)
 * below.
 *
 * Owns all state specific to browsing the Dex: view-mode, filters/sort/display options,
 * and the selected location tab. Data itself (species/forms/entries/...) is owned by App
 * via useCollectionData and passed down as props, since Collection/Trainer Profiles/
 * Storage Locations need it too. */
export function LivingDexView(props: LivingDexViewProps): JSX.Element {
  const {
    species,
    forms,
    entries,
    storageLocations,
    boxes,
    boxPlaceholders,
    trainerProfiles,
    speciesAvailability,
    onSetEntryOwned,
    onSaveStorageLocation,
    onBulkMoveEntries,
    onBulkDuplicateEntries,
    onSaveOrigin,
    onSetEntryBoxPosition,
    onSwapEntryBoxPositions,
    onFillBoxSlots,
    onSetCollapsedDisplayForm,
    onAddBox,
    onRenameBox,
    onSetBoxPlaceholder,
    onSetBoxPlaceholders,
    onClearBoxPlaceholder
  } = props

  const [options, setOptions] = useState<DexOptions>(DEFAULT_OPTIONS)
  const [filters, setFilters] = useState<DexFilters>(DEFAULT_DEX_FILTERS)
  const [sort, setSort] = useState<DexSort | null>(DEFAULT_DEX_SORT)
  const [completionStatsOptions, setCompletionStatsOptions] = useState<CompletionStatsOptions>(
    DEFAULT_COMPLETION_STATS_OPTIONS
  )
  // Defaults to the Unassigned tab (null) rather than the first real location — it needs no
  // data to resolve on first render, and it's where every entry starts out anyway (see
  // DexLocationTabs' doc comment).
  const [selectedLocationTab, setSelectedLocationTab] = useState<number | null>(null)
  // Persisted Living Dex layout choice — see useDexViewMode's doc comment.
  const [viewMode, setViewMode] = useDexViewMode()

  // Both the table and the stats panel scope to the selected location tab via this filter,
  // applied once here rather than in each consumer. An entry that's unowned everywhere sits
  // at storageLocationId: null, same as an owned-but-unassigned one — so it only ever
  // appears (checkable) under the Unassigned tab; see DexLocationTabs' doc comment.
  // handleToggleEntry below is what gets a freshly-checked entry off that tab in the common
  // case.
  const entriesForLocationTab = useMemo(
    () => filterEntriesByStorageLocation(entries, selectedLocationTab),
    [entries, selectedLocationTab]
  )
  // Same pre-scoping convention as entriesForLocationTab above, for DexBoxGrid's
  // storageBoxes prop (Leg 2 of the Box View Polish milestone) — the Unassigned tab
  // (selectedLocationTab: null) never has boxes, matching DexBoxGrid's own early return.
  const boxesForLocationTab = useMemo(
    () => (selectedLocationTab === null ? [] : boxes.filter((box) => box.storageLocationId === selectedLocationTab)),
    [boxes, selectedLocationTab]
  )
  // Same pre-scoping convention as boxesForLocationTab above (Leg 5 of the Box View Polish
  // milestone).
  const boxPlaceholdersForLocationTab = useMemo(
    () =>
      selectedLocationTab === null
        ? []
        : boxPlaceholders.filter((placeholder) => placeholder.storageLocationId === selectedLocationTab),
    [boxPlaceholders, selectedLocationTab]
  )

  const sections = useMemo(
    () => buildDexSections(species, forms, entriesForLocationTab, options),
    [species, forms, entriesForLocationTab, options]
  )
  // Which species/forms even belong in this tab's table at all, ahead of the user's own
  // DexFilters dimensions below — see locationDepositability.ts. A save_file location's cap
  // comes from its linked Trainer Profile's game; every other capped type (ranch/box/bank)
  // has a fixed generation ceiling, and home/Unassigned aren't capped.
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
  // Independent of options/filters/sort (all display-only) — stats reflect the whole of the
  // selected tab's location, not the currently-visible slice. See completionStats.ts.
  const completionStats = useMemo(
    () => computeCompletionStats(forms, entriesForLocationTab, completionStatsOptions),
    [forms, entriesForLocationTab, completionStatsOptions]
  )

  // Checking an entry owned while a real location tab is selected assigns it there in the
  // same action, via autoAssignedLocationOnCheckIn — the per-row picker (its own table
  // column, see DexRow) stays for reassigning afterward or assigning while on the
  // Unassigned tab.
  const handleToggleEntry = (entryId: number, owned: boolean): void => {
    onSetEntryOwned(entryId, owned)
    const autoLocationId = autoAssignedLocationOnCheckIn(owned, selectedLocationTab)
    if (autoLocationId !== null) {
      onSaveStorageLocation(entryId, autoLocationId)
    }
  }

  return (
    <>
      <DexLocationTabs storageLocations={storageLocations} selected={selectedLocationTab} onSelect={setSelectedLocationTab} />
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
      {/* Hidden rather than conditionally rendered — switching modes shouldn't pay DexTable's
       * mount cost again on switching back (see App.tsx's own `view` wrapper for the same
       * reasoning one level up). */}
      <div hidden={viewMode !== 'list'}>
        <DexTable
          sections={visibleSections}
          sort={sort}
          onSortChange={setSort}
          onToggleEntry={handleToggleEntry}
          onSaveOrigin={onSaveOrigin}
          onSetCollapsedDisplayForm={onSetCollapsedDisplayForm}
          storageLocations={storageLocations}
          onSaveStorageLocation={onSaveStorageLocation}
          onBulkMove={onBulkMoveEntries}
          onBulkDuplicate={onBulkDuplicateEntries}
          speciesAvailability={speciesAvailability}
        />
      </div>
      {/* Same hidden-not-unmounted treatment as DexTable above, so switching back and forth
       * between List and Hybrid doesn't re-pay either one's mount cost or lose Hybrid's own
       * tile-selection state. */}
      <div hidden={viewMode !== 'hybrid'}>
        <DexHybridGrid
          sections={visibleSections}
          storageLocations={storageLocations}
          speciesAvailability={speciesAvailability}
          onSaveOrigin={onSaveOrigin}
        />
      </div>
      {/* Same hidden-not-unmounted treatment. Unlike List/Hybrid above, Box view reads
       * entriesForLocationTab directly rather than the filtered/sorted visibleSections
       * pipeline — see DexViewModeSwitcher's doc comment for why it's deliberately outside
       * DexFilters' scope. */}
      <div hidden={viewMode !== 'box'}>
        <DexBoxGrid
          entries={entriesForLocationTab}
          allEntries={entries}
          species={species}
          forms={forms}
          storageLocations={storageLocations}
          storageBoxes={boxesForLocationTab}
          boxPlaceholders={boxPlaceholdersForLocationTab}
          speciesAvailability={speciesAvailability}
          selectedLocationTab={selectedLocationTab}
          onSaveOrigin={onSaveOrigin}
          onSetEntryBoxPosition={onSetEntryBoxPosition}
          onSwapEntryBoxPositions={onSwapEntryBoxPositions}
          onFillBoxSlots={onFillBoxSlots}
          onAddBox={onAddBox}
          onRenameBox={onRenameBox}
          onSetBoxPlaceholder={onSetBoxPlaceholder}
          onSetBoxPlaceholders={onSetBoxPlaceholders}
          onClearBoxPlaceholder={onClearBoxPlaceholder}
        />
      </div>
    </>
  )
}
