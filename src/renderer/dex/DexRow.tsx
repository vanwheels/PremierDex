import { useEffect, useState } from 'react'
import type { CollectionEntry, CollectionEntryOriginInput } from '@shared/types/pokemon'
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

/** Origin summary shown as the origin button's tooltip once set — OT/TID/SID/language/
 * game, the same fields the modal itself edits. Omits whichever of TID/SID/language is
 * null (unshown by that origin game, or just never set) rather than printing "TID: —". */
function originTitle(entry: DexRowData['regular']): string | undefined {
  if (!entry || !entry.otName) return undefined
  const parts = [`OT: ${entry.otName}`]
  if (entry.tid !== null) parts.push(`TID: ${entry.tid}`)
  if (entry.sid !== null) parts.push(`SID: ${entry.sid}`)
  if (entry.language) parts.push(entry.language)
  if (entry.originGame) parts.push(entry.originGame)
  return parts.join(' · ')
}

export function DexRow({ row, onToggleEntry, onOpenSprite, onOpenOrigin, onSaveOrigin, expandControl, indent }: DexRowProps): JSX.Element {
  const nicknameEntry = activeNicknameEntry(row)
  const [nicknameText, setNicknameText] = useState(nicknameEntry?.nickname ?? '')

  // Re-sync local text when the edited entry (or its stored nickname) changes out from
  // under this input — a toggle to/from owned swaps which entry is active, and an
  // external update (e.g. another window) can change the stored value directly.
  useEffect(() => {
    setNicknameText(nicknameEntry?.nickname ?? '')
  }, [nicknameEntry?.id, nicknameEntry?.nickname])

  const commitNickname = (): void => {
    if (!nicknameEntry) return
    const trimmed = nicknameText.trim()
    if (trimmed === (nicknameEntry.nickname ?? '')) return
    // Full-row snapshot update (see CollectionEntryOriginInput) — carry the entry's
    // existing origin fields through unchanged so this nickname-only edit doesn't blank
    // them out.
    onSaveOrigin(nicknameEntry.id, {
      trainerProfileId: nicknameEntry.trainerProfileId,
      originGame: nicknameEntry.originGame,
      otName: nicknameEntry.otName,
      tid: nicknameEntry.tid,
      sid: nicknameEntry.sid,
      language: nicknameEntry.language,
      nickname: trimmed || null
    })
  }

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
          Origin
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
