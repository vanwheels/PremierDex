import { SpriteThumbnail } from './SpriteThumbnail'
import type { SpriteModalTarget } from './SpriteModal'
import type { OriginModalTarget } from './OriginModal'
import type { DexRowData } from './types'

export interface ExpandControl {
  isExpanded: boolean
  onClick: () => void
  count: number
}

interface DexRowProps {
  row: DexRowData
  onToggleEntry: (entryId: number, owned: boolean) => void
  onOpenSprite: (target: SpriteModalTarget) => void
  onOpenOrigin: (target: OriginModalTarget) => void
  expandControl?: ExpandControl
  indent?: boolean
}

/** Origin summary shown as the origin button's tooltip once set — OT/TID/SID/game, the
 * same fields the modal itself edits. Omits whichever of TID/SID is null (unshown by
 * that origin game) rather than printing "TID: —". */
function originTitle(entry: DexRowData['regular']): string | undefined {
  if (!entry || !entry.otName) return undefined
  const parts = [`OT: ${entry.otName}`]
  if (entry.tid !== null) parts.push(`TID: ${entry.tid}`)
  if (entry.sid !== null) parts.push(`SID: ${entry.sid}`)
  if (entry.originGame) parts.push(entry.originGame)
  return parts.join(' · ')
}

export function DexRow({ row, onToggleEntry, onOpenSprite, onOpenOrigin, expandControl, indent }: DexRowProps): JSX.Element {
  return (
    <tr className={indent ? 'dex-row-indent' : undefined}>
      <td>
        <SpriteThumbnail
          pokeapiId={row.pokeapiId}
          spriteFormSuffix={row.spriteFormSuffix}
          displayName={row.displayName}
          onClick={() =>
            onOpenSprite({
              pokeapiId: row.pokeapiId,
              spriteFormSuffix: row.spriteFormSuffix,
              displayName: row.displayName,
              firstAvailableGeneration: row.firstAvailableGeneration
            })
          }
        />
      </td>
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
        {!row.homeBoxable && (
          <span className="dex-not-home-boxable-badge" title="Not yet accepted by Pokemon Home">
            Not Home-boxable
          </span>
        )}
      </td>
      <td>
        <input
          type="checkbox"
          disabled={!row.regular}
          checked={row.regular?.owned ?? false}
          onChange={() => row.regular && onToggleEntry(row.regular.id, !row.regular.owned)}
        />
        <button
          type="button"
          className="dex-origin-button"
          disabled={!row.regular?.owned}
          title={originTitle(row.regular)}
          onClick={() => row.regular && onOpenOrigin({ entry: row.regular, displayName: row.displayName })}
        >
          {row.regular?.nickname || 'Origin'}
        </button>
      </td>
      <td>
        <input
          type="checkbox"
          disabled={!row.shinyEntry || row.shinyLocked}
          checked={row.shinyEntry?.owned ?? false}
          onChange={() => row.shinyEntry && onToggleEntry(row.shinyEntry.id, !row.shinyEntry.owned)}
        />
        <button
          type="button"
          className="dex-origin-button"
          disabled={!row.shinyEntry?.owned}
          title={originTitle(row.shinyEntry)}
          onClick={() => row.shinyEntry && onOpenOrigin({ entry: row.shinyEntry, displayName: row.displayName })}
        >
          {row.shinyEntry?.nickname || 'Origin'}
        </button>
        {row.shinyLocked && (
          <span className="dex-shiny-locked-badge" title="No legitimate shiny of this form has ever existed">
            Shiny-locked
          </span>
        )}
      </td>
    </tr>
  )
}
