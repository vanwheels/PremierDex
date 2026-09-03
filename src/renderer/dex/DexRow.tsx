import type { CollectionEntry, CollectionEntryOriginInput } from '@shared/types/pokemon'
import { SpriteThumbnail } from './SpriteThumbnail'
import type { SpriteModalTarget } from './SpriteModal'
import type { OriginModalTarget } from './OriginModal'
import { originTitle } from './originSummary'
import { useNicknameEditor } from './useNicknameEditor'
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
  onSaveOrigin: (entryId: number, input: CollectionEntryOriginInput) => void
  expandControl?: ExpandControl
  indent?: boolean
}

/** Which owned entry the row's single Nickname cell edits, when a row has both a
 * regular and a shiny entry owned at once (independent individuals, independent
 * nicknames — see CollectionEntry's doc comment). Shiny wins: it's the rarer catch and
 * the more likely one to carry a nickname worth tracking. Falls back to regular, then to
 * nothing editable if neither is owned (Leg 10, per Vanny's call). */
export function activeNicknameEntry(row: DexRowData): CollectionEntry | null {
  if (row.shinyEntry?.owned) return row.shinyEntry
  if (row.regular?.owned) return row.regular
  return null
}

export function DexRow({ row, onToggleEntry, onOpenSprite, onOpenOrigin, onSaveOrigin, expandControl, indent }: DexRowProps): JSX.Element {
  const nicknameEntry = activeNicknameEntry(row)
  const { text: nicknameText, setText: setNicknameText, commit: commitNickname } = useNicknameEditor(nicknameEntry, onSaveOrigin)

  return (
    <tr className={indent ? 'dex-row-indent' : undefined}>
      <td>
        <SpriteThumbnail
          pokeapiId={row.pokeapiId}
          spriteFormSuffix={row.spriteFormSuffix}
          female={row.femaleSprite}
          displayName={row.displayName}
          onClick={() =>
            onOpenSprite({
              pokeapiId: row.pokeapiId,
              spriteFormSuffix: row.spriteFormSuffix,
              female: row.femaleSprite,
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
      <td>{row.firstAvailableGeneration}</td>
      <td>
        <input
          className="dex-nickname-input"
          value={nicknameText}
          onChange={(e) => setNicknameText(e.target.value)}
          onBlur={commitNickname}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
          disabled={!nicknameEntry}
          placeholder={nicknameEntry ? 'Optional' : undefined}
          title={
            row.regular?.owned && row.shinyEntry?.owned
              ? "Both the regular and shiny entry are owned — this edits the shiny entry's nickname."
              : undefined
          }
        />
      </td>
      <td>
        <input
          type="checkbox"
          disabled={!row.regular || row.alwaysShiny}
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
          Origin
        </button>
        {row.alwaysShiny && (
          <span className="dex-always-shiny-badge" title="No legitimate non-shiny of this form has ever existed">
            Always shiny
          </span>
        )}
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
          Origin
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
