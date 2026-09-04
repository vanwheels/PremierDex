import { Fragment, useState } from 'react'
import type { CollectionEntryOriginInput } from '@shared/types/pokemon'
import type { StorageLocation } from '@shared/types/storage-location'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import { DexRow } from './DexRow'
import type { CollapsedDisplayControl } from './DexRow'
import { SpriteModal } from './SpriteModal'
import type { SpriteModalTarget } from './SpriteModal'
import { OriginModal } from './OriginModal'
import type { OriginModalTarget } from './OriginModal'
import { DexBulkActionsBar } from './DexBulkActionsBar'
import { pickCollapsedRow } from './buildDexSections'
import type { DexSection, DexSort, DexSortKey } from './types'

interface DexTableProps {
  sections: DexSection[]
  sort: DexSort | null
  onSortChange: (sort: DexSort | null) => void
  onToggleEntry: (entryId: number, owned: boolean) => void
  onSaveOrigin: (entryId: number, input: CollectionEntryOriginInput) => void
  onSetCollapsedDisplayForm: (speciesId: number, formId: number | null) => void
  /** Per-entry assignment picker (Leg 3), its own Loc. columns since Leg 9 — see DexRow's
   * doc comment. Game/Ball columns joined it at Leg 10, read-only there (edited only via
   * OriginModal). */
  storageLocations: StorageLocation[]
  onSaveStorageLocation: (entryId: number, storageLocationId: number | null) => void
  /** [Bulk move/duplicate entries between storage locations] — see DexBulkActionsBar. */
  onBulkMove: (entryIds: number[], storageLocationId: number | null) => void
  onBulkDuplicate: (entryIds: number[], storageLocationId: number | null) => void
  /** Leg 6's derived invalid-combo badge — see DexRow's doc comment. */
  speciesAvailability: SpeciesAvailabilityData
}

/** Three-state header click cycle (Leg 16): unsorted/other-column → ascending →
 * descending → back to unsorted (buildDexSections' natural order). */
function cycleSort(current: DexSort | null, key: DexSortKey): DexSort | null {
  if (!current || current.key !== key) return { key, direction: 'asc' }
  if (current.direction === 'asc') return { key, direction: 'desc' }
  return null
}

interface SortableHeaderProps {
  label: string
  sortKey: DexSortKey
  sort: DexSort | null
  onSortChange: (sort: DexSort | null) => void
}

function SortableHeader({ label, sortKey, sort, onSortChange }: SortableHeaderProps): JSX.Element {
  const isActive = sort?.key === sortKey
  return (
    <th>
      <button type="button" className="dex-sort-header" onClick={() => onSortChange(cycleSort(sort, sortKey))}>
        {label}
        {isActive && (sort!.direction === 'asc' ? ' ▲' : ' ▼')}
      </button>
    </th>
  )
}

/**
 * Owns the per-species cosmetic-variant expand/collapse state. This is UI-only and
 * intentionally not lifted to App — it never affects stored data. Since Leg 2, App keeps
 * this component mounted (hidden, not unmounted) while browsing other views for
 * performance, so this state now persists across a tab switch rather than resetting.
 */
export function DexTable({
  sections,
  sort,
  onSortChange,
  onToggleEntry,
  onSaveOrigin,
  onSetCollapsedDisplayForm,
  storageLocations,
  onSaveStorageLocation,
  onBulkMove,
  onBulkDuplicate,
  speciesAvailability
}: DexTableProps): JSX.Element {
  const [expandedSpeciesIds, setExpandedSpeciesIds] = useState<Set<number>>(new Set())
  // Which row's sprite is enlarged, if any. UI-only, same as expandedSpeciesIds above.
  const [spriteTarget, setSpriteTarget] = useState<SpriteModalTarget | null>(null)
  // Which entry's origin editor is open, if any. Unlike spriteTarget, saving from here
  // writes to SQLite (via onSaveOrigin), so this isn't purely UI state — but "which modal
  // is open" still belongs local to DexTable, same as spriteTarget.
  const [originTarget, setOriginTarget] = useState<OriginModalTarget | null>(null)
  // [Bulk move/duplicate entries between storage locations]: entry ids checked via the
  // per-entry checkboxes beside each Loc. cell — see DexRow's own doc comment for why this
  // is entry-id-keyed rather than row-keyed. UI-only, same as the state above; cleared
  // after a bulk action fires (DexBulkActionsBar) rather than carried forward, so a repeat
  // click can't silently reapply to a stale selection.
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<number>>(new Set())
  const toggleSelected = (entryId: number): void => {
    setSelectedEntryIds((prev) => {
      const next = new Set(prev)
      if (next.has(entryId)) next.delete(entryId)
      else next.add(entryId)
      return next
    })
  }

  const toggleExpanded = (speciesId: number): void => {
    setExpandedSpeciesIds((prev) => {
      const next = new Set(prev)
      if (next.has(speciesId)) next.delete(speciesId)
      else next.add(speciesId)
      return next
    })
  }

  return (
    <>
      <DexBulkActionsBar
        selectedEntryIds={selectedEntryIds}
        storageLocations={storageLocations}
        onMove={onBulkMove}
        onDuplicate={onBulkDuplicate}
        onClearSelection={() => setSelectedEntryIds(new Set())}
      />
      <div className="dex-table-panel">
        <table className="dex-table">
          {/* Leg 3: gives table-layout: fixed (Leg 2) a real proportional basis instead of
           * its roughly-even fallback. Percentages, not a px/% mix, so the split stays
           * stable as the table's own width changes — extra window width flows to Name
           * and the two Game columns (the ones that actually hold variable-length text and
           * were truncating), while the fixed-content columns (Sprite, #, Gen, Ball icons)
           * stay small. Column count/order must match the <tr> below exactly. */}
          <colgroup>
            <col style={{ width: '4%' }} /> {/* Sprite */}
            <col style={{ width: '3%' }} /> {/* # */}
            <col style={{ width: '17%' }} /> {/* Name */}
            <col style={{ width: '3%' }} /> {/* Gen */}
            <col style={{ width: '8%' }} /> {/* Nickname */}
            <col style={{ width: '8%' }} /> {/* Non-Shiny */}
            <col style={{ width: '13.5%' }} /> {/* Non-Shiny Game */}
            <col style={{ width: '4%' }} /> {/* Non-Shiny Ball */}
            <col style={{ width: '7%' }} /> {/* Non-Shiny Loc. */}
            <col style={{ width: '8%' }} /> {/* Shiny */}
            <col style={{ width: '13.5%' }} /> {/* Shiny Game */}
            <col style={{ width: '4%' }} /> {/* Shiny Ball */}
            <col style={{ width: '7%' }} /> {/* Shiny Loc. */}
          </colgroup>
          <thead>
            <tr>
              <th>Sprite</th>
              <SortableHeader label="#" sortKey="dexNumber" sort={sort} onSortChange={onSortChange} />
              <SortableHeader label="Name" sortKey="name" sort={sort} onSortChange={onSortChange} />
              <SortableHeader label="Gen" sortKey="generation" sort={sort} onSortChange={onSortChange} />
              <th>Nickname</th>
              <SortableHeader label="Non-Shiny" sortKey="owned" sort={sort} onSortChange={onSortChange} />
              <th>Non-Shiny Game</th>
              <th>Non-Shiny Ball</th>
              <th>Non-Shiny Loc.</th>
              <SortableHeader label="Shiny" sortKey="shiny" sort={sort} onSortChange={onSortChange} />
              <th>Shiny Game</th>
              <th>Shiny Ball</th>
              <th>Shiny Loc.</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => {
              const isExpanded = section.speciesId !== null && expandedSpeciesIds.has(section.speciesId)
              const hasCosmeticRows = section.cosmeticRows.length > 0

              return (
                <Fragment key={section.key}>
                  {section.rows.map((row, i) => {
                    const isCollapseSlot = i === 0 && hasCosmeticRows && section.speciesId !== null
                    // Collapsed, this slot shows whichever form (base or a cosmetic
                    // variant) is checked off — or the user's pinned pick, Leg 27 — so an
                    // owned/shiny variant doesn't hide behind an unowned default. Expanded,
                    // every row is visible anyway, so it shows the base form in its normal
                    // list-order position.
                    const displayRow =
                      isCollapseSlot && !isExpanded
                        ? pickCollapsedRow(section.rows, section.cosmeticRows, section.collapsedDisplayFormId)
                        : row
                    const collapsedDisplayControl: CollapsedDisplayControl | undefined = isCollapseSlot
                      ? {
                          value: section.collapsedDisplayFormId,
                          options: [section.rows[0], ...section.cosmeticRows].map((candidate) => ({
                            formId: candidate.formId,
                            label: candidate.displayName
                          })),
                          onChange: (formId) => onSetCollapsedDisplayForm(section.speciesId!, formId)
                        }
                      : undefined
                    return (
                      <DexRow
                        key={row.key}
                        row={displayRow}
                        onToggleEntry={onToggleEntry}
                        onOpenSprite={setSpriteTarget}
                        onOpenOrigin={setOriginTarget}
                        onSaveOrigin={onSaveOrigin}
                        storageLocations={storageLocations}
                        onSaveStorageLocation={onSaveStorageLocation}
                        selectedEntryIds={selectedEntryIds}
                        onToggleSelected={toggleSelected}
                        speciesAvailability={speciesAvailability}
                        expandControl={
                          isCollapseSlot
                            ? {
                                isExpanded,
                                count: section.cosmeticRows.length,
                                onClick: () => toggleExpanded(section.speciesId!)
                              }
                            : undefined
                        }
                        collapsedDisplayControl={collapsedDisplayControl}
                      />
                    )
                  })}
                  {isExpanded &&
                    section.cosmeticRows.map((row) => (
                      <DexRow
                        key={row.key}
                        row={row}
                        onToggleEntry={onToggleEntry}
                        onOpenSprite={setSpriteTarget}
                        onOpenOrigin={setOriginTarget}
                        onSaveOrigin={onSaveOrigin}
                        storageLocations={storageLocations}
                        onSaveStorageLocation={onSaveStorageLocation}
                        selectedEntryIds={selectedEntryIds}
                        onToggleSelected={toggleSelected}
                        speciesAvailability={speciesAvailability}
                        indent
                      />
                    ))}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      {spriteTarget && <SpriteModal target={spriteTarget} onClose={() => setSpriteTarget(null)} />}
      {originTarget && (
        <OriginModal
          entry={originTarget.entry}
          displayName={originTarget.displayName}
          onClose={() => setOriginTarget(null)}
          onSave={onSaveOrigin}
        />
      )}
    </>
  )
}
