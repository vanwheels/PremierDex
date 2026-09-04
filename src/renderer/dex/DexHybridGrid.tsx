import { useMemo, useState } from 'react'
import type { CollectionEntryOriginInput } from '@shared/types/pokemon'
import type { StorageLocation } from '@shared/types/storage-location'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import { buildHybridTiles } from './buildHybridTiles'
import { SpriteThumbnail } from './SpriteThumbnail'
import { DexHybridDetailPanel } from './DexHybridDetailPanel'
import { OriginModal } from './OriginModal'
import type { DexSection } from './types'

const TILE_SPRITE_SIZE = 56

interface DexHybridGridProps {
  sections: DexSection[]
  storageLocations: StorageLocation[]
  speciesAvailability: SpeciesAvailabilityData
  onSaveOrigin: (entryId: number, input: CollectionEntryOriginInput) => void
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
export function DexHybridGrid({ sections, storageLocations, speciesAvailability, onSaveOrigin }: DexHybridGridProps): JSX.Element {
  const tiles = useMemo(() => buildHybridTiles(sections), [sections])
  const [selectedTileKey, setSelectedTileKey] = useState<string | null>(null)
  const [editingOrigin, setEditingOrigin] = useState(false)

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
        onEditOrigin={() => setEditingOrigin(true)}
      />
      {editingOrigin && selectedTile?.entry.owned && (
        <OriginModal
          entry={selectedTile.entry}
          displayName={selectedTile.row.displayName}
          onClose={() => setEditingOrigin(false)}
          onSave={onSaveOrigin}
        />
      )}
    </div>
  )
}
