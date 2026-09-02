import { Fragment, useState } from 'react'
import { DexRow } from './DexRow'
import type { DexSection } from './types'

interface DexTableProps {
  sections: DexSection[]
  onToggleEntry: (entryId: number, owned: boolean) => void
}

/**
 * Owns the per-species cosmetic-variant expand/collapse state. This is UI-only and
 * intentionally not lifted to App — it never affects stored data, and resets on
 * navigating away, which is fine for a display preference.
 */
export function DexTable({ sections, onToggleEntry }: DexTableProps): JSX.Element {
  const [expandedSpeciesIds, setExpandedSpeciesIds] = useState<Set<number>>(new Set())

  const toggleExpanded = (speciesId: number): void => {
    setExpandedSpeciesIds((prev) => {
      const next = new Set(prev)
      if (next.has(speciesId)) next.delete(speciesId)
      else next.add(speciesId)
      return next
    })
  }

  return (
    <table className="dex-table">
      <thead>
        <tr>
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
              {section.rows.map((row, i) => (
                <DexRow
                  key={row.key}
                  row={row}
                  onToggleEntry={onToggleEntry}
                  expandControl={
                    i === 0 && hasCosmeticRows && section.speciesId !== null
                      ? {
                          isExpanded,
                          count: section.cosmeticRows.length,
                          onClick: () => toggleExpanded(section.speciesId!)
                        }
                      : undefined
                  }
                />
              ))}
              {isExpanded &&
                section.cosmeticRows.map((row) => (
                  <DexRow key={row.key} row={row} onToggleEntry={onToggleEntry} indent />
                ))}
            </Fragment>
          )
        })}
      </tbody>
    </table>
  )
}
