import { Fragment, useState } from 'react'
import type { CollectionEntryOriginInput } from '@shared/types/pokemon'
import { DexRow } from './DexRow'
import type { CollapsedDisplayControl } from './DexRow'
import { SpriteModal } from './SpriteModal'
import type { SpriteModalTarget } from './SpriteModal'
import { OriginModal } from './OriginModal'
import type { OriginModalTarget } from './OriginModal'
import { pickCollapsedRow } from './buildDexSections'
import type { DexSection, DexSort, DexSortKey } from './types'

interface DexTableProps {
  sections: DexSection[]
  sort: DexSort | null
  onSortChange: (sort: DexSort | null) => void
  onToggleEntry: (entryId: number, owned: boolean) => void
  onSaveOrigin: (entryId: number, input: CollectionEntryOriginInput) => void
  onSetCollapsedDisplayForm: (speciesId: number, formId: number | null) => void
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
 * intentionally not lifted to App — it never affects stored data, and resets on
 * navigating away, which is fine for a display preference.
 */
export function DexTable({
  sections,
  sort,
  onSortChange,
  onToggleEntry,
  onSaveOrigin,
  onSetCollapsedDisplayForm
}: DexTableProps): JSX.Element {
  const [expandedSpeciesIds, setExpandedSpeciesIds] = useState<Set<number>>(new Set())
  // Which row's sprite is enlarged, if any. UI-only, same as expandedSpeciesIds above.
  const [spriteTarget, setSpriteTarget] = useState<SpriteModalTarget | null>(null)
  // Which entry's origin editor is open, if any. Unlike spriteTarget, saving from here
  // writes to SQLite (via onSaveOrigin), so this isn't purely UI state — but "which modal
  // is open" still belongs local to DexTable, same as spriteTarget.
  const [originTarget, setOriginTarget] = useState<OriginModalTarget | null>(null)

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
      <table className="dex-table">
        <thead>
          <tr>
            <th>Sprite</th>
            <SortableHeader label="#" sortKey="dexNumber" sort={sort} onSortChange={onSortChange} />
            <SortableHeader label="Name" sortKey="name" sort={sort} onSortChange={onSortChange} />
            <SortableHeader label="Gen" sortKey="generation" sort={sort} onSortChange={onSortChange} />
            <th>Nickname</th>
            <SortableHeader label="Non-Shiny" sortKey="owned" sort={sort} onSortChange={onSortChange} />
            <SortableHeader label="Shiny" sortKey="shiny" sort={sort} onSortChange={onSortChange} />
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
                      indent
                    />
                  ))}
              </Fragment>
            )
          })}
        </tbody>
      </table>
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
