import type { StorageLocation } from '@shared/types/storage-location'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import type { BoxCell } from './types'
import { checkEntryValidity } from './invalidCombo'
import { defaultSpriteUrl } from './sprites'
import { BallIcon } from './BallIcon'

const DETAIL_SPRITE_SIZE = 64

interface DexBoxDetailPanelProps {
  cell: BoxCell | null
  storageLocations: StorageLocation[]
  speciesAvailability: SpeciesAvailabilityData
  onEditOrigin: () => void
}

/** Same label/value pair as DexHybridDetailPanel's own DetailField — not shared directly
 * since neither file is large enough yet to warrant pulling a two-line component out into
 * its own module. */
function DetailField({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="dex-hybrid-detail-field">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

/**
 * Read-only detail panel for Leg 6's Box grid, shown when a filled cell is clicked
 * (Vanny's call, 2026-09-03) — deliberately the same field set and CSS classes as
 * DexHybridDetailPanel (dex-hybrid-detail-*) rather than a parallel dex-box-detail-*
 * stylesheet, since the two panels are visually identical and only differ in what feeds
 * them (a BoxCell's single real individual vs. a DexHybridTile's form-slot pairing). An
 * Edit Origin button still opens the real OriginModal (DexBoxGrid owns that), matching
 * Hybrid's "read-only grid, real edit modal" split even though Box view's own arrangement
 * stays read-only until Leg 7.
 */
export function DexBoxDetailPanel({
  cell,
  storageLocations,
  speciesAvailability,
  onEditOrigin
}: DexBoxDetailPanelProps): JSX.Element {
  if (!cell) {
    return <div className="dex-hybrid-detail-panel dex-hybrid-detail-empty">Select a Pokémon in the box above to see its details.</div>
  }

  const { entry } = cell
  const storageLocationName = storageLocations.find((loc) => loc.id === entry.storageLocationId)?.name ?? '—'
  const invalidCombo = entry.owned ? checkEntryValidity(entry, cell.dexNumber, speciesAvailability) : null

  return (
    <div className="dex-hybrid-detail-panel">
      <img
        className="dex-hybrid-detail-sprite"
        src={defaultSpriteUrl(cell.pokeapiId, cell.spriteFormSuffix, entry.shiny, cell.femaleSprite)}
        alt={cell.displayName}
        width={DETAIL_SPRITE_SIZE}
        height={DETAIL_SPRITE_SIZE}
      />
      <div className="dex-hybrid-detail-body">
        <h3>{cell.displayName}</h3>
        <div className="dex-hybrid-detail-badges">
          {!cell.homeBoxable && <span className="dex-not-home-boxable-badge">Not Home-boxable</span>}
          {!entry.shiny && cell.alwaysShiny && <span className="dex-always-shiny-badge">Always shiny</span>}
          {entry.shiny && cell.shinyLocked && <span className="dex-shiny-locked-badge">Shiny-locked</span>}
          {invalidCombo?.invalid && (
            <span className="dex-invalid-combo-badge" title={invalidCombo.reasons.join('; ')}>
              Invalid combo
            </span>
          )}
        </div>
        {entry.owned ? (
          <>
            <dl className="dex-hybrid-detail-fields">
              {entry.nickname && <DetailField label="Nickname" value={entry.nickname} />}
              {entry.otName && <DetailField label="OT" value={entry.otName} />}
              {entry.tid !== null && <DetailField label="TID" value={String(entry.tid)} />}
              {entry.sid !== null && <DetailField label="SID" value={String(entry.sid)} />}
              {entry.language && <DetailField label="Language" value={entry.language} />}
              {entry.originGame && <DetailField label="Origin Game" value={entry.originGame} />}
              {entry.metLocation && <DetailField label="Met Location" value={entry.metLocation} />}
              <DetailField label="Storage Location" value={storageLocationName} />
            </dl>
            {entry.caughtBall && (
              <p className="dex-hybrid-detail-ball">
                <BallIcon ball={entry.caughtBall} /> {entry.caughtBall}
              </p>
            )}
            <button type="button" onClick={onEditOrigin}>
              Edit Origin
            </button>
          </>
        ) : (
          <p className="dex-hybrid-detail-unowned">Not yet owned.</p>
        )}
      </div>
    </div>
  )
}
