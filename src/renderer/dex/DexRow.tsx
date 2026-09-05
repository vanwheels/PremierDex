import type { CollectionEntry, CollectionEntryOriginInput } from '@shared/types/pokemon'
import type { StorageLocation } from '@shared/types/storage-location'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import { SpriteThumbnail } from './SpriteThumbnail'
import type { SpriteModalTarget } from './SpriteModal'
import type { OriginModalTarget } from './OriginModal'
import { originTitle } from './originSummary'
import { useNicknameEditor } from './useNicknameEditor'
import { checkEntryValidity } from './invalidCombo'
import type { DexRowData } from './types'
import { BallIcon } from './BallIcon'

const UNASSIGNED = ''

export interface ExpandControl {
  isExpanded: boolean
  onClick: () => void
  count: number
}

/** Leg 27: lets the user pin which candidate row (the collapse slot's own row, or one of
 * its cosmeticRows) displays when the section is collapsed, overriding pickCollapsedRow's
 * auto-pick. `value` null means "Auto" — see Species.collapsedDisplayFormId. */
export interface CollapsedDisplayControl {
  value: number | null
  options: Array<{ formId: number; label: string }>
  onChange: (formId: number | null) => void
}

interface DexRowProps {
  row: DexRowData
  onToggleEntry: (entryId: number, owned: boolean) => void
  onOpenSprite: (target: SpriteModalTarget) => void
  onOpenOrigin: (target: OriginModalTarget) => void
  onSaveOrigin: (entryId: number, input: CollectionEntryOriginInput) => void
  /** Per-entry assignment picker (Leg 3), given its own Non-Shiny/Shiny Loc. table
   * columns at Leg 9 rather than sitting inline in the owned/shiny cells. Disabled for an
   * unowned entry — there's nothing to place in a box until it's actually caught. Checking
   * an entry owned while a real location tab is selected assigns it there automatically
   * (App.tsx's handleToggleEntry); this picker is for reassigning afterward, or assigning
   * while on the Unassigned tab. */
  storageLocations: StorageLocation[]
  onSaveStorageLocation: (entryId: number, storageLocationId: number | null) => void
  /** [Bulk move entries between storage locations]: same per-entry granularity as the
   * Loc. picker above (a row can carry two independent owned entries, regular and shiny),
   * so selection lives at that level too — one checkbox beside each Loc. cell, not one per
   * row. */
  selectedEntryIds: Set<number>
  onToggleSelected: (entryId: number) => void
  /** Leg 6: backs the invalid-combo badge below — see invalidCombo.ts. */
  speciesAvailability: SpeciesAvailabilityData
  expandControl?: ExpandControl
  collapsedDisplayControl?: CollapsedDisplayControl
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

/** Leg 10: text shown in the read-only Game/Ball columns — gated to owned entries per
 * CollectionEntry's doc comment (these fields are only ever meaningful once owned, even
 * though a stale value can technically survive an unown/re-own cycle since
 * onToggleEntry doesn't clear them). '—' covers both "unowned" and "owned but unset". */
export function originGameCell(entry: CollectionEntry | null): string {
  return entry?.owned ? entry.originGame ?? '—' : '—'
}

export function caughtBallCell(entry: CollectionEntry | null): string {
  return entry?.owned ? entry.caughtBall ?? '—' : '—'
}

export function DexRow({
  row,
  onToggleEntry,
  onOpenSprite,
  onOpenOrigin,
  onSaveOrigin,
  storageLocations,
  onSaveStorageLocation,
  selectedEntryIds,
  onToggleSelected,
  speciesAvailability,
  expandControl,
  collapsedDisplayControl,
  indent
}: DexRowProps): JSX.Element {
  const nicknameEntry = activeNicknameEntry(row)
  const { text: nicknameText, setText: setNicknameText, commit: commitNickname } = useNicknameEditor(nicknameEntry, onSaveOrigin)

  // Leg 6: soft warning only — an unowned slot has no origin to check, and a valid
  // combo renders no badge at all.
  const invalidComboBadge = (entry: CollectionEntry | null): JSX.Element | null => {
    if (!entry?.owned) return null
    const result = checkEntryValidity(entry, row.dexNumber, speciesAvailability)
    if (!result.invalid) return null
    return (
      <span className="dex-invalid-combo-badge" title={result.reasons.join('; ')}>
        Invalid combo
      </span>
    )
  }

  const storageLocationSelect = (entry: CollectionEntry | null): JSX.Element => (
    <>
      <input
        type="checkbox"
        className="dex-bulk-select-checkbox"
        disabled={!entry?.owned}
        checked={entry ? selectedEntryIds.has(entry.id) : false}
        onChange={() => entry && onToggleSelected(entry.id)}
        title="Select for bulk move"
      />
      <select
        className="dex-storage-location-select"
        disabled={!entry?.owned}
        value={entry?.storageLocationId ?? UNASSIGNED}
        onChange={(e) =>
          entry && onSaveStorageLocation(entry.id, e.target.value === UNASSIGNED ? null : Number(e.target.value))
        }
        title="Storage location"
      >
        <option value={UNASSIGNED}>Unassigned</option>
        {storageLocations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.name}
          </option>
        ))}
      </select>
    </>
  )

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
        {collapsedDisplayControl && (
          <select
            className="dex-collapsed-display-select"
            value={collapsedDisplayControl.value ?? 'auto'}
            onChange={(e) =>
              collapsedDisplayControl.onChange(e.target.value === 'auto' ? null : Number(e.target.value))
            }
            title="Which form to display when this section is collapsed"
          >
            <option value="auto">Auto</option>
            {collapsedDisplayControl.options.map((opt) => (
              <option key={opt.formId} value={opt.formId}>
                {opt.label}
              </option>
            ))}
          </select>
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
        {invalidComboBadge(row.regular)}
      </td>
      <td className="dex-inline-origin-field" title={originGameCell(row.regular)}>
        {originGameCell(row.regular)}
      </td>
      <td className="dex-inline-origin-field" title={caughtBallCell(row.regular)}>
        {row.regular?.owned && row.regular.caughtBall && <BallIcon ball={row.regular.caughtBall} />}
      </td>
      <td>{storageLocationSelect(row.regular)}</td>
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
        {invalidComboBadge(row.shinyEntry)}
      </td>
      <td className="dex-inline-origin-field" title={originGameCell(row.shinyEntry)}>
        {originGameCell(row.shinyEntry)}
      </td>
      <td className="dex-inline-origin-field" title={caughtBallCell(row.shinyEntry)}>
        {row.shinyEntry?.owned && row.shinyEntry.caughtBall && <BallIcon ball={row.shinyEntry.caughtBall} />}
      </td>
      <td>{storageLocationSelect(row.shinyEntry)}</td>
    </tr>
  )
}
