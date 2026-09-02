import { Fragment, useState } from 'react'
import type { CollectionEntryOriginInput } from '@shared/types/pokemon'
import { DexRow } from './DexRow'
import { SpriteModal } from './SpriteModal'
import type { SpriteModalTarget } from './SpriteModal'
import { OriginModal } from './OriginModal'
import type { OriginModalTarget } from './OriginModal'
import { pickCollapsedRow } from './buildDexSections'
import type { DexSection } from './types'

interface DexTableProps {
  sections: DexSection[]
  onToggleEntry: (entryId: number, owned: boolean) => void
  onSaveOrigin: (entryId: number, input: CollectionEntryOriginInput) => void
}

/**
 * Owns the per-species cosmetic-variant expand/collapse state. This is UI-only and
 * intentionally not lifted to App — it never affects stored data, and resets on
 * navigating away, which is fine for a display preference.
 */
export function DexTable({ sections, onToggleEntry, onSaveOrigin }: DexTableProps): JSX.Element {
  const [expandedSpeciesIds, setExpandedSpeciesIds] = useState<Set<number>>(new Set())
  // Which row's sprite is enlarged, if any. UI-only, same as expandedSpeciesIds above.
  const [spriteTarget, setSpriteTarget] = useState<SpriteModalTarget | null>(null)
  // Which entry's origin/nickname editor is open, if any. Unlike spriteTarget, saving
  // from here writes to SQLite (via onSaveOrigin), so this isn't purely UI state — but
  // "which modal is open" still belongs local to DexTable, same as spriteTarget.
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
            <th>#</th>
            <th>Name</th>
            <th>Owned</th>
            <th>Shiny</th>
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
                  // variant) is checked off, so an owned/shiny variant doesn't hide
                  // behind an unowned default. Expanded, every row is visible anyway, so
                  // it shows the base form in its normal list-order position.
                  const displayRow = isCollapseSlot && !isExpanded ? pickCollapsedRow(section.rows, section.cosmeticRows) : row
                  return (
                    <DexRow
                      key={row.key}
                      row={displayRow}
                      onToggleEntry={onToggleEntry}
                      onOpenSprite={setSpriteTarget}
                      onOpenOrigin={setOriginTarget}
                      expandControl={
                        isCollapseSlot
                          ? {
                              isExpanded,
                              count: section.cosmeticRows.length,
                              onClick: () => toggleExpanded(section.speciesId!)
                            }
                          : undefined
                      }
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
