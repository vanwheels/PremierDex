import { useEffect, useMemo, useState } from 'react'
import type { CollectionEntry, CollectionEntryOriginInput, Form, Species } from '@shared/types/pokemon'
import type { StorageLocation } from '@shared/types/storage-location'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import { BOX_COLS, buildBoxes } from './buildBoxes'
import { SpriteThumbnail } from './SpriteThumbnail'
import { DexBoxDetailPanel } from './DexBoxDetailPanel'
import { OriginModal } from './OriginModal'
import type { BoxCell } from './types'

const CELL_SPRITE_SIZE = 48

interface DexBoxGridProps {
  entries: CollectionEntry[]
  species: Species[]
  forms: Form[]
  storageLocations: StorageLocation[]
  speciesAvailability: SpeciesAvailabilityData
  /** Same axis as DexLocationTabs' `selected` — needed here (unlike DexHybridGrid, which
   * only ever sees already-scoped `sections`) because Box view has to tell "the Unassigned
   * tab, which can never hold a box" apart from "a real location with zero boxed entries
   * yet," and `entries` alone can't distinguish those two empty cases. */
  selectedLocationTab: number | null
  onSaveOrigin: (entryId: number, input: CollectionEntryOriginInput) => void
}

/**
 * Leg 6 (Box Arrangement milestone) HOME-style box grid — real per-individual box
 * contents (`entry.boxNumber`/`boxSlot`, Leg 3 of this milestone), paginated one box at a
 * time rather than Hybrid's continuous flow, matching HOME's own Box view screen (as
 * opposed to its List View, which Hybrid mirrors instead). Read-only: no drag-and-drop
 * placement yet (Leg 7). Reuses SpriteThumbnail/DexHybridGrid's tile-rendering and
 * selection pattern per the Phase 1 post-mortem's dependency note, adapted for a fixed
 * 30-cell grid instead of a flowing tile list.
 *
 * Only entries within `entries` (already scoped to the selected Storage Location tab by
 * LivingDexView) can appear — a box is always a sub-unit of one real location, never
 * cross-location. Selection is tracked by cell key (`${boxNumber}-${slot}`) rather than
 * the cell object, same reasoning as DexHybridGrid's selectedTileKey.
 */
export function DexBoxGrid({
  entries,
  species,
  forms,
  storageLocations,
  speciesAvailability,
  selectedLocationTab,
  onSaveOrigin
}: DexBoxGridProps): JSX.Element {
  const boxes = useMemo(() => buildBoxes(species, forms, entries), [species, forms, entries])
  const [boxIndex, setBoxIndex] = useState(0)
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null)
  const [editingOrigin, setEditingOrigin] = useState(false)

  // Switching Storage Location tabs swaps which location's boxes `entries`/`boxes`
  // describe without remounting this component (LivingDexView keeps it mounted-and-hidden,
  // same as List/Hybrid) — a stale box index or selection from the old location would
  // otherwise silently carry over and land on an unrelated box.
  useEffect(() => {
    setBoxIndex(0)
    setSelectedCellKey(null)
  }, [selectedLocationTab])

  if (selectedLocationTab === null) {
    return (
      <div className="dex-box-empty-state">
        Select a Storage Location tab above to see its boxes — Unassigned entries have no box to show.
      </div>
    )
  }

  const clampedIndex = Math.min(boxIndex, boxes.length - 1)
  const box = boxes[clampedIndex]
  const cells = box.cells
  const selectedCell = cells.find((c): c is BoxCell => c !== null && `${c.boxNumber}-${c.slot}` === selectedCellKey) ?? null

  const goToBox = (index: number): void => {
    setBoxIndex(index)
    setSelectedCellKey(null)
  }

  return (
    <div className="dex-box-view">
      <div className="dex-box-pager">
        <button type="button" onClick={() => goToBox(clampedIndex - 1)} disabled={clampedIndex === 0}>
          ← Prev
        </button>
        <span className="dex-box-pager-label">
          Box {box.boxNumber} ({clampedIndex + 1} of {boxes.length})
        </span>
        <button type="button" onClick={() => goToBox(clampedIndex + 1)} disabled={clampedIndex === boxes.length - 1}>
          Next →
        </button>
      </div>
      <div className="dex-box-grid" style={{ gridTemplateColumns: `repeat(${BOX_COLS}, 1fr)` }}>
        {cells.map((cell, slot) =>
          cell ? (
            <SpriteThumbnail
              key={slot}
              pokeapiId={cell.pokeapiId}
              spriteFormSuffix={cell.spriteFormSuffix}
              female={cell.femaleSprite}
              shiny={cell.entry.shiny}
              size={CELL_SPRITE_SIZE}
              displayName={cell.displayName}
              ariaLabel={`${cell.displayName}${cell.entry.owned ? '' : ' — not yet owned'}`}
              className={
                [
                  'dex-hybrid-tile',
                  !cell.entry.owned && 'dex-hybrid-tile-unowned',
                  `${cell.boxNumber}-${cell.slot}` === selectedCellKey && 'dex-hybrid-tile-selected'
                ]
                  .filter(Boolean)
                  .join(' ')
              }
              onClick={() => setSelectedCellKey(`${cell.boxNumber}-${cell.slot}`)}
            />
          ) : (
            <div key={slot} className="dex-box-cell-empty" aria-hidden="true" />
          )
        )}
      </div>
      <DexBoxDetailPanel
        cell={selectedCell}
        storageLocations={storageLocations}
        speciesAvailability={speciesAvailability}
        onEditOrigin={() => setEditingOrigin(true)}
      />
      {editingOrigin && selectedCell?.entry.owned && (
        <OriginModal
          entry={selectedCell.entry}
          displayName={selectedCell.displayName}
          onClose={() => setEditingOrigin(false)}
          onSave={onSaveOrigin}
        />
      )}
    </div>
  )
}
