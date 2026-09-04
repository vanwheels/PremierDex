import type { StorageLocation } from '@shared/types/storage-location'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import type { DexHybridTile } from './buildHybridTiles'
import { checkEntryValidity } from './invalidCombo'
import { defaultSpriteUrl } from './sprites'
import { BallIcon } from './BallIcon'

const DETAIL_SPRITE_SIZE = 64

interface DexHybridDetailPanelProps {
  tile: DexHybridTile | null
  storageLocations: StorageLocation[]
  speciesAvailability: SpeciesAvailabilityData
  onEditOrigin: () => void
}

/** One label/value pair, omitted entirely by the caller when the value is empty — same
 * "unset field just doesn't render a row" convention as originTitle's tooltip. */
function DetailField({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="dex-hybrid-detail-field">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

/**
 * Pinned-to-the-bottom detail panel for Leg 8's Hybrid grid (see TODO.md) — reuses
 * OriginModal's own field set (OT/TID/SID/nickname/origin game/ball/met location/storage
 * location, plus the home-boxable/shiny-locked/invalid-combo badges DexRow already shows)
 * rather than HOME's own Nature/stats block, which PremierDex has no data for. Read-only
 * display, matching Hybrid's own "read-only grid" framing — an Edit button opens the real
 * OriginModal (DexHybridGrid owns that) for anything beyond browsing.
 */
export function DexHybridDetailPanel({
  tile,
  storageLocations,
  speciesAvailability,
  onEditOrigin
}: DexHybridDetailPanelProps): JSX.Element {
  if (!tile) {
    return (
      <div className="dex-hybrid-detail-panel dex-hybrid-detail-empty">Select a Pokémon above to see its details.</div>
    )
  }

  const { row, shiny, entry } = tile
  const storageLocationName = storageLocations.find((loc) => loc.id === entry.storageLocationId)?.name ?? '—'
  const invalidCombo = entry.owned ? checkEntryValidity(entry, row.dexNumber, speciesAvailability) : null

  return (
    <div className="dex-hybrid-detail-panel">
      <img
        className="dex-hybrid-detail-sprite"
        src={defaultSpriteUrl(row.pokeapiId, row.spriteFormSuffix, shiny, row.femaleSprite)}
        alt={row.displayName}
        width={DETAIL_SPRITE_SIZE}
        height={DETAIL_SPRITE_SIZE}
      />
      <div className="dex-hybrid-detail-body">
        <h3>
          {row.displayName} {shiny && '(Shiny)'}
        </h3>
        <div className="dex-hybrid-detail-badges">
          {!row.homeBoxable && <span className="dex-not-home-boxable-badge">Not Home-boxable</span>}
          {!shiny && row.alwaysShiny && <span className="dex-always-shiny-badge">Always shiny</span>}
          {shiny && row.shinyLocked && <span className="dex-shiny-locked-badge">Shiny-locked</span>}
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
