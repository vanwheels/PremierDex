import type { CollectionEntry } from '@shared/types/pokemon'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import { findOriginGame } from '@shared/data/origin-games'
import { ballPoolForGame } from '@shared/data/poke-balls'
import type { PokeBall } from '@shared/data/poke-balls'

export interface InvalidComboResult {
  invalid: boolean
  /** Human-readable reason(s), for the badge's title tooltip. Empty when invalid is
   * false. */
  reasons: string[]
}

const VALID: InvalidComboResult = { invalid: false, reasons: [] }

/**
 * A derived, non-blocking warning (Leg 6) — never a stored column, same treatment as
 * completionStats.ts — flagging when an owned entry's species or caught-ball doesn't
 * match Legs 4-5's per-game validity data for its origin game. Soft warn only, not a full
 * legality checker: missing or unmapped data reads as "can't verify" and is treated as
 * valid, never flagged, per SpeciesAvailabilityData's doc comment —
 * - a null originGame, or a game name absent from ORIGIN_GAMES, has nothing to check
 *   against;
 * - a game absent from (or empty in) gameToPokedexes (Colosseum/XD/GO) has no species
 *   data, so the species check is skipped for it;
 * - ballPoolForGame already falls back to the full POKE_BALLS list for any game without
 *   Leg 5's narrow pool, so the ball check needs no separate "do we have data" branch.
 */
export function checkEntryValidity(
  entry: CollectionEntry,
  speciesId: number,
  availability: SpeciesAvailabilityData
): InvalidComboResult {
  if (!entry.originGame) return VALID
  const game = findOriginGame(entry.originGame)
  if (!game) return VALID

  const reasons: string[] = []

  const dexNames = availability.gameToPokedexes[game.id]
  if (dexNames && dexNames.length > 0) {
    const available = dexNames.some((dexName) => availability.pokedexes[dexName]?.includes(speciesId))
    if (!available) reasons.push(`Not obtainable in ${game.name}`)
  }

  if (entry.caughtBall && !ballPoolForGame(game.name).includes(entry.caughtBall as PokeBall)) {
    reasons.push(`${entry.caughtBall} isn't obtainable in ${game.name}`)
  }

  return reasons.length > 0 ? { invalid: true, reasons } : VALID
}
