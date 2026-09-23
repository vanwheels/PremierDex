import { ORIGIN_GAMES } from './origin-games'

/**
 * Curated Safari Zone flee rates (Leg 5 of the Species database milestone — see TODO.md).
 * PokeAPI has no flee-rate field anywhere (confirmed live 2026-09-23), and unlike
 * met-locations.ts/poke-balls.ts's BALL_POOLS this isn't tabulated per-species on
 * Bulbapedia or Serebii either — the only reliable source found is each game's own
 * decompiled source (pret/pokeruby, pret/pokeemerald, pret/pokefirered on GitHub), which
 * stores a `safariZoneFleeRate` u8 field per species in its SpeciesInfo struct. Verified
 * 2026-09-23 by fetching src/data/pokemon/{base_stats,species_info}.h directly from all
 * three repos: Ruby and Emerald produce byte-for-byte identical non-zero entries (19
 * species — Hoenn Safari Zone Areas 1-4, the areas both games share; Emerald's own Areas
 * 5-6 Johto additions, see supplemental-availability.ts's EMERALD_SAFARI_ZONE_JOHTO, all
 * carry a flee rate of 0 in the source and are deliberately left uncurated below rather
 * than assumed to inherit a value), and FireRed/LeafGreen's own field is a separate
 * 24-species table on a different numeric scale (25-125 vs. Hoenn's 4-10) — different
 * escape-factor formula constants per game, not a transcription error (each game converts
 * its stored value into an actual per-turn escape percentage differently; this dataset
 * stores the raw source value, same "display the raw stat" precedent as `captureRate` on
 * SpeciesPage, not a computed probability).
 *
 * Same reactive, opt-in-per-species posture as BALL_POOLS/curated Met Location: only
 * species with a real, source-confirmed non-zero flee rate are listed. A species/game
 * combination absent here has no curated data — SpeciesPage hides the field entirely
 * rather than showing a fabricated or zero value. Sapphire reuses Ruby's table rather than
 * being independently re-verified: pret has no separate pokesapphire repo, since Ruby and
 * Sapphire share one upstream codebase (pret/pokeruby builds both versions).
 *
 * Great Marsh (Platinum), the Johto Safari Zone (HeartGold/SoulSilver), and any other
 * Safari-Zone-style mechanic aren't curated here — no Generation IV+ flee-rate field has
 * been located/verified yet. Left for a follow-on leg if/when actually wanted, same
 * "no data, don't flag" precedent as everywhere else in this dataset.
 */

export interface SafariFleeRateSet {
  location: string
  /** ORIGIN_GAMES ids this flee-rate table applies to, in ORIGIN_GAMES order. */
  gameIds: readonly string[]
  fleeRates: Readonly<Record<number, number>>
}

/**
 * Hoenn Safari Zone, Areas 1-4 (Ruby/Sapphire/Emerald) — verified 2026-09-23 directly
 * against pret/pokeruby's and pret/pokeemerald's species_info.h/base_stats.h (identical
 * values in both).
 */
const HOENN_SAFARI_ZONE: SafariFleeRateSet = {
  location: 'Hoenn Safari Zone',
  gameIds: ['ruby', 'sapphire', 'emerald'],
  fleeRates: {
    25: 6, // Pikachu
    43: 4, // Oddish
    44: 6, // Gloom
    54: 6, // Psyduck
    55: 8, // Golduck
    74: 4, // Geodude
    84: 8, // Doduo
    85: 10, // Dodrio
    111: 4, // Rhyhorn
    118: 4, // Goldeen
    119: 6, // Seaking
    127: 8, // Pinsir
    129: 4, // Magikarp
    177: 6, // Natu
    178: 8, // Xatu
    202: 4, // Wobbuffet
    203: 4, // Girafarig
    214: 8, // Heracross
    231: 10 // Phanpy
  }
}

/** Kanto Safari Zone (FireRed/LeafGreen remake) — verified 2026-09-23 directly against
 * pret/pokefirered's species_info.h. */
const KANTO_SAFARI_ZONE: SafariFleeRateSet = {
  location: 'Kanto Safari Zone',
  gameIds: ['firered', 'leafgreen'],
  fleeRates: {
    29: 50, // Nidoran♀
    30: 75, // Nidorina
    32: 50, // Nidoran♂
    33: 75, // Nidorino
    46: 50, // Paras
    47: 75, // Parasect
    48: 50, // Venonat
    49: 75, // Venomoth
    54: 50, // Psyduck
    60: 50, // Poliwag
    79: 50, // Slowpoke
    84: 50, // Doduo
    102: 75, // Exeggcute
    111: 75, // Rhyhorn
    113: 125, // Chansey
    115: 125, // Kangaskhan
    118: 50, // Goldeen
    119: 75, // Seaking
    123: 125, // Scyther
    127: 125, // Pinsir
    128: 125, // Tauros
    129: 25, // Magikarp
    147: 100, // Dratini
    148: 125 // Dragonair
  }
}

const SAFARI_ZONES: readonly SafariFleeRateSet[] = [HOENN_SAFARI_ZONE, KANTO_SAFARI_ZONE]

export interface SafariFleeRateEntry {
  location: string
  /** Display-joined game names for this location, e.g. "Ruby/Sapphire/Emerald". */
  gamesLabel: string
  fleeRate: number
}

function gamesLabel(gameIds: readonly string[]): string {
  return gameIds.map((id) => ORIGIN_GAMES.find((g) => g.id === id)?.name.replace(/^Pokémon /, '') ?? id).join('/')
}

/** Curated Safari Zone flee-rate entries for a species, one per curated location it
 * appears in — `[]` if this species has no curated data anywhere (SpeciesPage hides the
 * field entirely in that case, same opt-in contract as this file's other exports). */
export function safariFleeRatesForSpecies(speciesId: number): SafariFleeRateEntry[] {
  return SAFARI_ZONES.flatMap((zone) => {
    const fleeRate = zone.fleeRates[speciesId]
    return fleeRate === undefined ? [] : [{ location: zone.location, gamesLabel: gamesLabel(zone.gameIds), fleeRate }]
  })
}
