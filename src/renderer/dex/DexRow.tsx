import { SpriteThumbnail } from './SpriteThumbnail'
import type { SpriteModalTarget } from './SpriteModal'
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
  expandControl?: ExpandControl
  indent?: boolean
}

export function DexRow({ row, onToggleEntry, onOpenSprite, expandControl, indent }: DexRowProps): JSX.Element {
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
      </td>
      <td>
        <input
          type="checkbox"
          disabled={!row.shinyEntry || row.shinyLocked}
          checked={row.shinyEntry?.owned ?? false}
          onChange={() => row.shinyEntry && onToggleEntry(row.shinyEntry.id, !row.shinyEntry.owned)}
        />
        {row.shinyLocked && (
          <span className="dex-shiny-locked-badge" title="No legitimate shiny of this form has ever existed">
            Shiny-locked
          </span>
        )}
      </td>
    </tr>
  )
}
