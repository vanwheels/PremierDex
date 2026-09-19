/**
 * Postgame supplemental species-unlock mechanics (Leg 2 of the Deeper Per-Game Validity
 * milestone) that PokeAPI's regional-Pokedex data has no representation of at all — see
 * docs/investigations/deeper-per-game-validity.md. Hand-curated, same "closer to
 * poke-balls.ts's BALL_POOLS than to the fetched species-availability.json" shape Leg 1
 * called for: each entry here is a real, confirmed in-game mechanism, not a per-game
 * guess, and a game absent from SUPPLEMENTAL_SPECIES has no supplemental data (same
 * "no data, don't flag" fallback as ballPoolForGame).
 *
 * Verified against Vanny's real collection (2026-09-19), which overturned Leg 1's own
 * hypothesis for Platinum's spike: Great Marsh's confirmed species list has zero overlap
 * with the 98 species actually flagged invalid for Platinum. The real mechanism is Pal
 * Park (Route 221): Platinum can migrate any Pokémon already owned on a paired Gen III
 * cartridge (Ruby/Sapphire/Emerald/FireRed/LeafGreen), which explains 87 of 98 (89%)
 * directly — modeled as a dex-name union (reusing species-availability.json's own
 * already-fetched Kanto/Hoenn dex data) rather than a hand-typed species list, since
 * that's literally what Pal Park draws from. Great Marsh is deliberately NOT curated:
 * it's a real mechanism, but building it here would be pure speculation with zero
 * demonstrated effect on this collection, the exact thing this dataset's narrow-scope
 * precedent (BALL_POOLS, species-availability.json) exists to avoid.
 *
 * Residual false positives this leg doesn't clear (documented, not fabricated data):
 * Platinum's Ariados/Politoed/Dunsparce/Qwilfish/Smoochum, Emerald's Cyndaquil/Ledian/
 * Flaaffy/Ampharos/Sunflora/Ambipom, and USUM's Ivysaur/Nuzleaf. Most of these
 * (Ariados/Ledian/Flaaffy/Ampharos/Sunflora/Ambipom/Politoed/Ivysaur) are evolutions of a
 * species this file *does* cover — a real, now-demonstrated case for evolution-chain
 * reachability that Leg 1 found no evidence for before this data existed. See TODO.md's
 * "[Evolution-chain reachability for species availability]" for that follow-up. Cyndaquil,
 * Dunsparce, Qwilfish, Smoochum, and Nuzleaf have no confirmed in-game source in their
 * recorded origin game at all — left un-curated rather than guessed at.
 */
import type { SpeciesAvailabilityData } from '../types/species-availability'

/**
 * Emerald's Hoenn Safari Zone, Areas 5-6: unlocked by completing the National Pokédex,
 * stocked with Johto species available nowhere else in Ruby/Sapphire/Emerald (confirmed
 * via Bulbapedia + Serebii, cross-checked 2026-09-19). Base/wild-encounterable stages
 * only — see this file's doc comment for why their evolutions aren't listed here too.
 */
const EMERALD_SAFARI_ZONE_JOHTO = [
  165, 167, 179, 190, 191, 204, 207, 209, 213, 216, 223, 224, 228, 234, 241
]

/**
 * Emerald's event-distribution legendaries/mythical: Mew (Faraway Island, via the Old Sea
 * Map event item) and Lugia/Ho-Oh (Navel Rock, via the MysticTicket event item) — both
 * legitimate in-game encounters gated on a now-expired but real distribution event, not
 * cheat devices.
 */
const EMERALD_EVENT_LEGENDARIES = [151, 249, 250]

/**
 * USUM's Ultra Wormhole postgame legendary catch pool (Ultra Space, after the main
 * story). Split by version since the pool differs between Ultra Sun and Ultra Moon; BOTH
 * also includes several legendaries gated on already owning a specific earlier pair
 * (Suicune/Rayquaza/Giratina/Landorus/Kyurem) — modeled the same as any other available
 * species since this check doesn't track combo prerequisites, matching how the ball check
 * likewise skips mechanism detail.
 */
const USUM_ULTRA_WORMHOLE_BOTH = [
  144, 145, 146, 150, 245, 377, 378, 379, 384, 480, 481, 482, 487, 488, 638, 639, 640, 645, 646
]
const USUM_ULTRA_WORMHOLE_ULTRA_SUN_ONLY = [243, 250, 381, 383, 483, 485, 641, 643, 716]
const USUM_ULTRA_WORMHOLE_ULTRA_MOON_ONLY = [244, 249, 380, 382, 484, 486, 642, 644, 717]

/**
 * USUM's Island Scan (QR Scanner), identical in both versions: a rotating weekly schedule
 * of pre-National-Dex starter species from other regions, unlocked by scanning QR codes.
 * Only the exact stage listed is directly encounterable this way (base Kanto starters,
 * middle-stage Hoenn/Sinnoh starters, fully-evolved Kalos starters) — the milestone's own
 * motivating example (Ivysaur/Ultra Moon) needs the evolution-chain-reachability follow-up
 * noted in this file's doc comment, not a direct list entry, since Ivysaur itself was
 * never the species Island Scan grants (Bulbasaur is).
 */
const USUM_ISLAND_SCAN_STARTERS = [1, 4, 7, 253, 256, 259, 388, 391, 394, 652, 655, 658]

/**
 * Sinnoh legendaries/mythical genuinely catchable within Platinum's own story/postgame
 * (Stark Mountain, Snowpoint Temple, Turnback Cave, the Shaymin event) that PokeAPI's
 * `extended-sinnoh` regional-dex data omits outright — confirmed live: none of these 4
 * ids appear in species-availability.json's `extended-sinnoh` entry. A dex-fetch
 * completeness gap, not a migration/encounter mechanic, but it belongs here rather than
 * as a schema change since it's a single hand-verified fact about one game's dex data.
 */
const PLATINUM_DEX_OMITTED_LEGENDARIES = [485, 486, 488, 492]

/**
 * Per-game supplemental species pool, keyed by ORIGIN_GAMES id. A game absent here has no
 * supplemental data — same "no data for this game" contract as
 * SpeciesAvailabilityData.gameToPokedexes. Platinum is handled separately in
 * supplementalSpeciesForGame below since its mechanism (Pal Park) is a dex-name union
 * rather than a flat list.
 */
const SUPPLEMENTAL_SPECIES: Record<string, number[]> = {
  emerald: [...EMERALD_SAFARI_ZONE_JOHTO, ...EMERALD_EVENT_LEGENDARIES],
  'ultra-sun': [...USUM_ULTRA_WORMHOLE_BOTH, ...USUM_ULTRA_WORMHOLE_ULTRA_SUN_ONLY, ...USUM_ISLAND_SCAN_STARTERS],
  'ultra-moon': [...USUM_ULTRA_WORMHOLE_BOTH, ...USUM_ULTRA_WORMHOLE_ULTRA_MOON_ONLY, ...USUM_ISLAND_SCAN_STARTERS]
}

/** Regional-dex names Platinum's Pal Park draws from: Ruby/Sapphire's and Emerald's
 * shared Hoenn dex, plus FireRed/LeafGreen's Kanto dex. */
const PAL_PARK_SOURCE_DEXES = ['kanto', 'hoenn']

/**
 * Extra species ids available in `gameId` beyond its regular
 * SpeciesAvailabilityData.gameToPokedexes entry, or `[]` for a game with no supplemental
 * mechanism curated (same "no data" contract throughout this module).
 */
export function supplementalSpeciesForGame(gameId: string, availability: SpeciesAvailabilityData): number[] {
  if (gameId === 'platinum') {
    const fromPalPark = PAL_PARK_SOURCE_DEXES.flatMap((dex) => availability.pokedexes[dex] ?? [])
    return [...fromPalPark, ...SUPPLEMENTAL_SPECIES.emerald, ...PLATINUM_DEX_OMITTED_LEGENDARIES]
  }
  return SUPPLEMENTAL_SPECIES[gameId] ?? []
}
