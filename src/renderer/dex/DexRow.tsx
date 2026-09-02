import type { DexRowData } from './types'

export interface ExpandControl {
  isExpanded: boolean
  onClick: () => void
  count: number
}

interface DexRowProps {
  row: DexRowData
  onToggleEntry: (entryId: number, owned: boolean) => void
  expandControl?: ExpandControl
  indent?: boolean
}

export function DexRow({ row, onToggleEntry, expandControl, indent }: DexRowProps): JSX.Element {
  return (
    <tr className={indent ? 'dex-row-indent' : undefined}>
      <td>{row.dexNumber}</td>
      <td>
        {expandControl && (
          <button
            type="button"
            className="dex-expand-toggle"
            onClick={expandControl.onClick}
            aria-label={expandControl.isExpanded ? 'Hide boxable cosmetic variants' : 'Show boxable cosmetic variants'}
          >
            {expandControl.isExpanded ? '▾' : '▸'} {expandControl.count}
          </button>
        )}
        {row.displayName}
      </td>
      <td>
        <input
          type="checkbox"
          disabled={!row.regular}
          checked={row.regular?.owned ?? false}
          onChange={() => row.regular && onToggleEntry(row.regular.id, !row.regular.owned)}
        />
      </td>
      <td>
        <input
          type="checkbox"
          disabled={!row.shinyEntry}
          checked={row.shinyEntry?.owned ?? false}
          onChange={() => row.shinyEntry && onToggleEntry(row.shinyEntry.id, !row.shinyEntry.owned)}
        />
      </td>
    </tr>
  )
}
