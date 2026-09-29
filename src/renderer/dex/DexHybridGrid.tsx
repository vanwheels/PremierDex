import { useMemo, useState } from 'react'
import type { CollectionEntryOriginInput, Form, Species } from '@shared/types/pokemon'
import type { StorageLocation } from '@shared/types/storage-location'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import type { EvolutionEdge } from '@shared/types/evolution'
import type { FormeSwitchGroup } from '@shared/types/forme-switch-groups'
import { buildHybridTiles } from './buildHybridTiles'
import { SpriteThumbnail } from './SpriteThumbnail'
import { DexHybridDetailPanel } from './DexHybridDetailPanel'
import { OriginModal } from './OriginModal'
import { RibbonsMarksModal } from './RibbonsMarksModal'
import { SpeciesDetailPopup } from './SpeciesDetailPopup'
import type { SpeciesDetailTarget } from './SpeciesDetailPopup'
import type { DexSection } from './types'

const TILE_SPRITE_SIZE = 56

interface DexHybridGridProps {
  sections: DexSection[]
  storageLocations: StorageLocation[]
  speciesAvailability: SpeciesAvailabilityData
  /** Leg 2 of the Evolution-Chain Reachability milestone: backs DexHybridDetailPanel's
   * checkEntryValidity ancestor walk. Also feeds SpeciesDetailPopup below, same convention
   * as DexBoxPane's own `species` prop. */
  species: Species[]
  /** Species detail popup entry point on Hybrid view (unscheduled item, picked up
   * 2026-09-28): feeds SpeciesDetailPopup's EvolutionTree/FormeSwitchGroupView, same
   * convention as DexBoxPane's forms/evolutionEdges/formeSwitchGroups. */
  forms: Form[]
  evolutionEdges: EvolutionEdge[]
  formeSwitchGroups: FormeSwitchGroup[]
  onSaveOrigin: (entryId: number, input: CollectionEntryOriginInput) => void
  /** "View Full Page" in the popup's info view — threaded up to App.tsx, same convention
   * as DexBoxPane's own onOpenFullPage. */
  onOpenFullPage: (target: SpeciesDetailTarget) => void
}

/**
 * Leg 8's HOME-derived Hybrid view — sprite-only tiles flowing continuously with the
 * window width (no box-style page boundaries; see TODO.md for why that's the confirmed
 * layout over a paginated one). Shares App.tsx's buildDexSections -> filterDexSections ->
 * sortDexSections pipeline with List view; this component only ever reads the resulting
 * `sections`, never filters or sorts on its own.
 *
 * Selection is tracked by tile key rather than the tile object itself, so it survives a
 * re-render with fresh data (e.g. right after Origin edits update `entries` upstream) —
 * looking the key back up in the freshly-built `tiles` list picks up the new values
 * instead of pointing at a stale snapshot.
 */
export function DexHybridGrid({
  sections,
  storageLocations,
  speciesAvailability,
  species,
  forms,
  evolutionEdges,
  formeSwitchGroups,
  onSaveOrigin,
  onOpenFullPage
}: DexHybridGridProps): JSX.Element {
  const tiles = useMemo(() => buildHybridTiles(sections), [sections])
  const speciesById = useMemo(() => new Map(species.map((s) => [s.id, s])), [species])
  const [selectedTileKey, setSelectedTileKey] = useState<string | null>(null)
  const [editingOrigin, setEditingOrigin] = useState(false)
  const [editingRibbonsMarks, setEditingRibbonsMarks] = useState(false)
  // Same "parent owns the modal" split as editingOrigin/editingRibbonsMarks above, but its
  // own target rather than a boolean — see DexBoxPane's own speciesDetailTarget doc comment.
  const [speciesDetailTarget, setSpeciesDetailTarget] = useState<SpeciesDetailTarget | null>(null)

  const selectedTile = tiles.find((t) => t.key === selectedTileKey) ?? null

  return (
    <div className="dex-hybrid-view">
      <div className="dex-hybrid-grid">
        {tiles.map((tile) => (
          <SpriteThumbnail
            key={tile.key}
            pokeapiId={tile.row.pokeapiId}
            spriteFormSuffix={tile.row.spriteFormSuffix}
            female={tile.row.femaleSprite}
            shiny={tile.shiny}
            size={TILE_SPRITE_SIZE}
            displayName={tile.row.displayName}
            ariaLabel={`${tile.row.displayName}${tile.shiny ? ' (Shiny)' : ''}${tile.entry.owned ? '' : ' — not yet owned'}`}
            className={
              [
                'dex-hybrid-tile',
                !tile.entry.owned && 'dex-hybrid-tile-unowned',
                tile.key === selectedTileKey && 'dex-hybrid-tile-selected'
              ]
                .filter(Boolean)
                .join(' ')
            }
            onClick={() => setSelectedTileKey(tile.key)}
          />
        ))}
      </div>
      <DexHybridDetailPanel
        tile={selectedTile}
        storageLocations={storageLocations}
        speciesAvailability={speciesAvailability}
        speciesById={speciesById}
        onEditOrigin={() => setEditingOrigin(true)}
        onEditRibbonsMarks={() => setEditingRibbonsMarks(true)}
        onOpenSpeciesDetail={setSpeciesDetailTarget}
      />
      {speciesDetailTarget && (
        <SpeciesDetailPopup
          target={speciesDetailTarget}
          species={species}
          forms={forms}
          evolutionEdges={evolutionEdges}
          formeSwitchGroups={formeSwitchGroups}
          onClose={() => setSpeciesDetailTarget(null)}
          onOpenFullPage={onOpenFullPage}
        />
      )}
      {editingOrigin && selectedTile?.entry.owned && (
        <OriginModal
          entry={selectedTile.entry}
          displayName={selectedTile.row.displayName}
          onClose={() => setEditingOrigin(false)}
          onSave={onSaveOrigin}
        />
      )}
      {editingRibbonsMarks && selectedTile?.entry.owned && (
        <RibbonsMarksModal
          entryId={selectedTile.entry.id}
          displayName={selectedTile.row.displayName}
          onClose={() => setEditingRibbonsMarks(false)}
        />
      )}
    </div>
  )
}
