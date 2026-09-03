import type { StorageLocation, StorageLocationType } from '@shared/types/storage-location'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import { findOriginGame } from '@shared/data/origin-games'
import type { DexRowData, DexSection } from './types'

/**
 * Max generation a location type's real-world software/hardware can actually hold (Leg 5
 * of the User-Customizable Dex Layout milestone — see TODO.md's "Non-HOME locations show
 * all 1025 species as depositable"). Coarser than Legs 4/6's per-game
 * SpeciesAvailabilityData on purpose: none of these three location types map to a PokeAPI
 * regional dex the way an origin game does — each is a single storage
 * app/peripheral, not a game with its own catchable-species list. A location type absent
 * here (home) has no cap: it's today's universal always-depositable location, unaffected
 * by this leg. 'save_file' is deliberately absent too — its cap comes from the linked
 * Trainer Profile's own game via SpeciesAvailabilityData instead (see
 * isRowDepositableAtLocation), not a fixed generation number.
 *
 * Sources (Bulbapedia, confirmed 2026-09-03):
 * - ranch (My Pokémon Ranch, Wii, 2008): accepts deposits from Diamond/Pearl/Platinum
 *   directly, plus Pal Park transfers from Gen 3 games — Gen 4 is as far as anything
 *   depositable there goes.
 * - box (Pokémon Box: Ruby & Sapphire, GameCube, 2004): accepts Ruby/Sapphire directly,
 *   plus FireRed/LeafGreen/Colosseum/XD via link-cable transfer — Gen 3 is as far as
 *   anything depositable there goes.
 * - bank (Pokémon Bank, 3DS, 2013): connects to X/Y through Ultra Sun/Ultra Moon
 *   directly, plus Poke Transporter from Black/White/Black 2/White 2 and Virtual Console
 *   Gen 1/2 — Gen 7 is as far as anything depositable there goes. Deliberately not
 *   extended for Bank's later (Nov 2019) bidirectional bridge to Pokémon HOME, which can
 *   indirectly land newer species there — same kind of narrowed-for-now obtainability gap
 *   already logged against the per-game dataset in TODO.md's "Deeper per-game validity"
 *   item, not fixed here.
 */
export const LOCATION_TYPE_MAX_GENERATION: Partial<Record<StorageLocationType, number>> = {
  ranch: 4,
  box: 3,
  bank: 7
}

/**
 * Whether `row` can legitimately be deposited at `location` — the gate this leg wires
 * into the location-tab-scoped Dex Table view. `null` location (the Unassigned tab) is
 * never gated: it isn't a real location, so there's nothing to check against.
 *
 * An already-owned entry in this tab's scope always passes regardless of the cap
 * (`alreadyPresent`) — a real, existing Collection Entry is ground truth, and this is a
 * soft depositability gate on what's offered for *new* placement, not a retroactive
 * legality check on data that already exists (that's invalidCombo.ts's job, over origin
 * game rather than current location).
 */
export function isRowDepositableAtLocation(
  row: DexRowData,
  location: StorageLocation | null,
  trainerGame: string | null,
  availability: SpeciesAvailabilityData
): boolean {
  if (!location) return true
  if (row.regular?.owned || row.shinyEntry?.owned) return true

  if (location.locationType === 'save_file') {
    if (!trainerGame) return true // no linked Trainer Profile (or no game set) — nothing to check against
    const game = findOriginGame(trainerGame)
    if (!game) return true
    const dexNames = availability.gameToPokedexes[game.id]
    if (!dexNames || dexNames.length === 0) return true // no availability data for this game
    return dexNames.some((dexName) => availability.pokedexes[dexName]?.includes(row.dexNumber))
  }

  const maxGeneration = LOCATION_TYPE_MAX_GENERATION[location.locationType]
  if (maxGeneration === undefined) return true
  return row.firstAvailableGeneration <= maxGeneration
}

/**
 * Narrows already-built sections to the rows depositable at `location`, mirroring
 * filterDexSections' section-survival and cosmetic-promotion shape (see its doc comment)
 * so DexTable's rows[0]-carries-the-expand-toggle invariant holds here too. Runs ahead of
 * filterDexSections in App.tsx: this is a structural "can this even exist here" gate, not
 * one of the user's own DexFilters dimensions.
 */
export function filterDepositableSections(
  sections: DexSection[],
  location: StorageLocation | null,
  trainerGame: string | null,
  availability: SpeciesAvailabilityData
): DexSection[] {
  if (!location) return sections

  const depositable = (row: DexRowData): boolean => isRowDepositableAtLocation(row, location, trainerGame, availability)

  const result: DexSection[] = []
  for (const section of sections) {
    const matchedRows = section.rows.filter(depositable)
    if (matchedRows.length > 0) {
      const matchedCosmetic = section.cosmeticRows.filter(depositable)
      result.push({ ...section, rows: matchedRows, cosmeticRows: matchedCosmetic })
      continue
    }
    const matchedCosmetic = section.cosmeticRows.filter(depositable)
    if (matchedCosmetic.length > 0) {
      result.push({ ...section, rows: matchedCosmetic, cosmeticRows: [] })
    }
  }
  return result
}
