import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import { regionalDexDisplayName } from '@shared/data/regional-dex-names'

export interface RegionalDexNumber {
  dexDisplayName: string
  entryNumber: number
}

/**
 * Per-Game Regional Dex Numbers milestone, Leg 2 — see
 * docs/investigations/regional-dex-numbers.md for why this returns every applicable dex's
 * number rather than collapsing to one: `gameId` maps to more than one regional dex for 11
 * of 40 games (Kalos's 3 co-equal sub-dexes; Alola/Galar/Paldea's base dex plus
 * sub-region/DLC dexes), and a species can have an independent entry number in each.
 *
 * Same "no data for this game reads as nothing to show, not a flag" contract as
 * checkEntryValidity (invalidCombo.ts) and supplementalSpeciesForGame: a `gameId` absent
 * from `gameToPokedexes`, or a dex the species has no entry in, is simply omitted from the
 * result rather than treated as an error.
 */
export function regionalDexNumbersForGame(
  gameId: string,
  speciesId: number,
  availability: SpeciesAvailabilityData
): RegionalDexNumber[] {
  const dexNames = availability.gameToPokedexes[gameId]
  if (!dexNames) return []

  const results: RegionalDexNumber[] = []
  for (const dexName of dexNames) {
    const entryNumber = availability.entryNumbers[dexName]?.[speciesId]
    if (entryNumber !== undefined) {
      results.push({ dexDisplayName: regionalDexDisplayName(dexName), entryNumber })
    }
  }
  return results
}
