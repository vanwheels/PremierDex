import type { CollectionEntryOriginInput } from '@shared/types/pokemon'
import { SpriteThumbnail } from '../dex/SpriteThumbnail'
import type { SpriteModalTarget } from '../dex/SpriteModal'
import type { OriginModalTarget } from '../dex/OriginModal'
import { originTitle } from '../dex/originSummary'
import { useNicknameEditor } from '../dex/useNicknameEditor'
import type { CollectionRowData } from './types'

interface CollectionRowProps {
  row: CollectionRowData
  onOpenSprite: (target: SpriteModalTarget) => void
  onOpenOrigin: (target: OriginModalTarget) => void
  onSaveOrigin: (entryId: number, input: CollectionEntryOriginInput) => void
}

/** One owned individual — the Collection view's row shape, as opposed to DexRow's
 * form-pairing shape. Reuses SpriteThumbnail/SpriteModal/OriginModal and the nickname/
 * origin-summary helpers exactly as DexRow does, just wired to a single entry directly. */
export function CollectionRow({ row, onOpenSprite, onOpenOrigin, onSaveOrigin }: CollectionRowProps): JSX.Element {
  const { text: nicknameText, setText: setNicknameText, commit: commitNickname } = useNicknameEditor(row.entry, onSaveOrigin)

  return (
    <tr>
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
      <td>{row.displayName}</td>
      <td>
        <input
          className="dex-nickname-input"
          value={nicknameText}
          onChange={(e) => setNicknameText(e.target.value)}
          onBlur={commitNickname}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
          placeholder="Optional"
        />
      </td>
      <td>
        <button
          type="button"
          className="dex-origin-button"
          title={originTitle(row.entry)}
          onClick={() => onOpenOrigin({ entry: row.entry, displayName: row.displayName })}
        >
          Origin
        </button>
      </td>
    </tr>
  )
}
