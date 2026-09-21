/**
 * Curated per-game Met Location lists (Leg 2 of the Curated Met Location dataset
 * milestone — see docs/investigations/curated-met-location.md for why this can't reuse
 * poke-balls.ts's BALL_POOLS shape as-is). Keyed by exact ORIGIN_GAMES `name` text, same
 * convention as BALL_POOLS — OriginModal.tsx resolves the typed-in game string by name,
 * not id.
 *
 * Curated one "map family" at a time (games that share an identical or near-identical
 * named-location set), in ORIGIN_GAMES release-date order (TODO.md's Legs 4-28 as of the
 * Leg 4 restructure) — a paired version (Red/Blue, Gold/Silver, Ruby/Sapphire, etc.) points
 * both names at the same base array rather than duplicating it, since same-generation
 * paired versions share the same map; a family's 3rd version/expansion (Yellow, Crystal,
 * Emerald, Platinum, Ultra Sun/Ultra Moon) gets its own leg to verify+layer in whatever
 * locations it actually adds or removes rather than assuming identity. The one confirmed
 * within-pair location split (not just an added/removed set) is Generation V's Black
 * City/White Forest, exclusive to Black/White respectively. Each list is Route 1..N in
 * numeric order followed by every other named city/town/landmark alphabetically — this
 * mirrors Serebii's own per-region location listing (routes first, then alphabetical),
 * rather than in-game story/traversal order, since reconstructing exact route-connection
 * order from wiki prose per game is a much easier source of transcription error than a
 * numeric-then-alphabetical sort.
 */

/**
 * Kanto, Generation I (Red/Blue/Yellow all share this same map). Routes 1-25 only — Routes
 * 26-28 are the Johto-Kanto connectors added in Generation II, not present in Red/Blue/
 * Yellow. Verified against Bulbapedia (Kanto, Cerulean Cave, Underground Path, Rocket
 * Hideout, Route 11, Route 22) and Serebii's Kanto map page (serebii.net/pokearth/kanto),
 * 2026-09-20. Re-verified for Leg 5 (Yellow): Yellow's changes from Red/Blue (a Route 19
 * house for the Pikachu-Surf minigame, a redesigned Cerulean Cave interior, a swapped
 * Viridian Forest item/trainer roster) are all sub-location content within named places
 * already on this list, not a new or removed named location — no layering needed.
 */
const KANTO_GEN1: readonly string[] = [
  'Route 1',
  'Route 2',
  'Route 3',
  'Route 4',
  'Route 5',
  'Route 6',
  'Route 7',
  'Route 8',
  'Route 9',
  'Route 10',
  'Route 11',
  'Route 12',
  'Route 13',
  'Route 14',
  'Route 15',
  'Route 16',
  'Route 17',
  'Route 18',
  'Route 19',
  'Route 20',
  'Route 21',
  'Route 22',
  'Route 23',
  'Route 24',
  'Route 25',
  'Celadon City',
  'Cerulean Cave',
  'Cerulean City',
  'Cinnabar Island',
  "Diglett's Cave",
  'Fuchsia City',
  'Indigo Plateau',
  'Lavender Town',
  'Mt. Moon',
  'Pallet Town',
  'Pewter City',
  'Pokémon Mansion',
  'Pokémon Tower',
  'Power Plant',
  'Rock Tunnel',
  'Rocket Hideout',
  'Safari Zone',
  'Saffron City',
  'Seafoam Islands',
  'Silph Co.',
  'S.S. Anne',
  'Underground Path (Routes 5–6)',
  'Underground Path (Routes 7–8)',
  'Vermilion City',
  'Victory Road',
  'Viridian City',
  'Viridian Forest'
]

/**
 * Johto + Kanto, Generation II (Gold/Silver share this map). Gold/Silver's world includes
 * both regions in the same cartridge (Kanto opens up after the 8th Johto badge), so this
 * list is Routes 1-46 (Kanto's 1-25 plus the new 26-28 connectors, then Johto's 29-46)
 * followed by every named place in both regions — not just Johto. Verified against
 * Bulbapedia's "List of locations by index number in Generation II" (the actual Town
 * Map/location-header index table the games use, index 0x00-0x5F), Bulbapedia's Mt. Silver
 * and Radio Tower articles, and web search cross-checks, 2026-09-20. Several Gen I Kanto
 * locations are deliberately NOT carried over from KANTO_GEN1 — GS's Kanto is a stripped-down
 * remake due to cartridge memory limits, confirmed absent from the index table and by direct
 * search: Cerulean Cave (collapsed), Pokémon Mansion (burned down with Cinnabar's volcano),
 * Silph Co. (public restricted to the lobby, no longer a separate index entry), Rocket
 * Hideout, Safari Zone (removed outright), S.S. Anne, Underground Path (Routes 7-8) (closed
 * off; only 5-6 remains, renamed here without the route-pair suffix since GS has only one),
 * and Viridian Forest (folded into Route 2, no longer a standalone area). The Lavender Town
 * "Pokémon Tower" from Gen I is renamed "Lavender Radio Tower" in Gen II (disambiguated from
 * Goldenrod's own "Goldenrod Radio Tower"). "Silver Cave" is this game's name for the
 * postgame Mt. Silver area — index table confirms Gen II's Town Map header literally reads
 * "Silver Cave", not "Mt. Silver". Battle Tower
 * and the S.S. Aqua/Fast Ship ferry both have index entries in the shared Gen II table, but
 * Battle Tower is confirmed Crystal-exclusive (added Leg 7), while S.S. Aqua is present in
 * Gold/Silver itself and kept here.
 */
const JOHTO_GEN2: readonly string[] = [
  'Route 1',
  'Route 2',
  'Route 3',
  'Route 4',
  'Route 5',
  'Route 6',
  'Route 7',
  'Route 8',
  'Route 9',
  'Route 10',
  'Route 11',
  'Route 12',
  'Route 13',
  'Route 14',
  'Route 15',
  'Route 16',
  'Route 17',
  'Route 18',
  'Route 19',
  'Route 20',
  'Route 21',
  'Route 22',
  'Route 23',
  'Route 24',
  'Route 25',
  'Route 26',
  'Route 27',
  'Route 28',
  'Route 29',
  'Route 30',
  'Route 31',
  'Route 32',
  'Route 33',
  'Route 34',
  'Route 35',
  'Route 36',
  'Route 37',
  'Route 38',
  'Route 39',
  'Route 40',
  'Route 41',
  'Route 42',
  'Route 43',
  'Route 44',
  'Route 45',
  'Route 46',
  'Azalea Town',
  'Blackthorn City',
  'Burned Tower',
  'Celadon City',
  'Cerulean City',
  'Cherrygrove City',
  'Cianwood City',
  'Cinnabar Island',
  'Dark Cave',
  "Diglett's Cave",
  "Dragon's Den",
  'Ecruteak City',
  'Fuchsia City',
  'Goldenrod City',
  'Goldenrod Radio Tower',
  'Ice Path',
  'Ilex Forest',
  'Indigo Plateau',
  'Lake of Rage',
  'Lavender Radio Tower',
  'Lavender Town',
  'Mahogany Town',
  'Mt. Moon',
  'Mt. Mortar',
  'National Park',
  'New Bark Town',
  'Olivine City',
  'Olivine Lighthouse',
  'Pallet Town',
  'Pewter City',
  'Power Plant',
  'Rock Tunnel',
  'Ruins of Alph',
  'Saffron City',
  'Seafoam Islands',
  'Silver Cave',
  'Slowpoke Well',
  'Sprout Tower',
  'S.S. Aqua',
  'Tin Tower',
  'Tohjo Falls',
  'Underground Path (Routes 5–6)',
  'Union Cave',
  'Vermilion City',
  'Victory Road',
  'Violet City',
  'Viridian City',
  'Whirl Islands'
]

/**
 * Johto + Kanto, Pokémon Crystal (Leg 7) — verified against Bulbapedia's Crystal Version
 * article and its Mt. Silver/Battle Tower (Generation II) articles, 2026-09-20. Crystal's
 * only change to the named-location set versus Gold/Silver is the addition of the Battle
 * Tower (Route 40, confirmed Crystal-exclusive and always accessible in the international
 * release — the Japanese release's Mobile System GB unlock requirement doesn't apply here).
 * Everything else Crystal changes (Cianwood's northward expansion, Dragon's Den's Dragon
 * Shrine, Mt. Mortar's redesigned layout, Goldenrod Dept. Store's rooftop, various visual
 * updates) is new content *within* an already-listed named location, not a new or renamed
 * one. In particular, despite JOHTO_GEN2's note above, Crystal does NOT rename "Silver
 * Cave" to "Mt. Silver" — Bulbapedia's Mt. Silver article confirms that split naming
 * ("Mt. Silver" for the foot of the mountain, "Mt. Silver Cave" for the interior) is
 * Generation IV-only (HGSS, Leg 15); Crystal keeps "Silver Cave" as Gold/Silver had it.
 */
const CRYSTAL_GEN2: readonly string[] = [
  ...JOHTO_GEN2.slice(0, JOHTO_GEN2.indexOf('Blackthorn City')),
  'Battle Tower',
  ...JOHTO_GEN2.slice(JOHTO_GEN2.indexOf('Blackthorn City'))
]

/**
 * Hoenn, Generation III (Ruby/Sapphire) (Leg 8). Routes 101-134 followed by every other
 * named location alphabetically. Verified against Bulbapedia's "List of locations by index
 * number in Generation III" (indices 0x00-0x57, the range Ruby/Sapphire recognize — Emerald
 * and FireRed/LeafGreen add indices beyond that) and Serebii's Hoenn Pokéarth pages,
 * 2026-09-20. Excludes generic/non-map indices in that range that aren't a real named place
 * a Pokémon could be met at: "Inside of Truck" (opening cutscene only), "Secret Base" (a
 * per-player system, not a fixed location — same reasoning Gen I/II excluded Day Care),
 * "Meteor Falls (unused)"/"Fiery Path (unused)"/"Jagged Pass (unused)" (unused duplicate
 * indices), and the Route 124/126/127/128/Sootopolis underwater sub-areas (route-tied dive
 * spots, not distinct named places — Serebii's own Hoenn location breakdown doesn't list
 * them separately either). Index 0x57 ("Ferry") is given its proper Ruby/Sapphire name,
 * "S.S. Tidal" (confirmed Generation III-present, not Emerald-exclusive), instead of the
 * generic index label — same treatment Gen II's "S.S. Aqua" got.
 *
 * One genuine within-pair location-name split found here, which contradicts this file's
 * earlier assumption (recorded in TODO.md before this leg) that Black City/White Forest was
 * the *only* one: index 0x42's "Hideout" is "Team Magma Hideout" in Ruby and "Team Aqua
 * Hideout" in Sapphire — the same physical base (northeast Lilycove City), reskinned per
 * version, not two separate locations. Layered onto the shared base per game below, same
 * splice pattern CRYSTAL_GEN2 uses above.
 */
const HOENN_GEN3_BASE: readonly string[] = [
  'Route 101',
  'Route 102',
  'Route 103',
  'Route 104',
  'Route 105',
  'Route 106',
  'Route 107',
  'Route 108',
  'Route 109',
  'Route 110',
  'Route 111',
  'Route 112',
  'Route 113',
  'Route 114',
  'Route 115',
  'Route 116',
  'Route 117',
  'Route 118',
  'Route 119',
  'Route 120',
  'Route 121',
  'Route 122',
  'Route 123',
  'Route 124',
  'Route 125',
  'Route 126',
  'Route 127',
  'Route 128',
  'Route 129',
  'Route 130',
  'Route 131',
  'Route 132',
  'Route 133',
  'Route 134',
  'Abandoned Ship',
  'Ancient Tomb',
  'Battle Tower',
  'Cave of Origin',
  'Desert Ruins',
  'Dewford Town',
  'Ever Grande City',
  'Fallarbor Town',
  'Fiery Path',
  'Fortree City',
  'Granite Cave',
  'Island Cave',
  'Jagged Pass',
  'Lavaridge Town',
  'Lilycove City',
  'Littleroot Town',
  'Mauville City',
  'Meteor Falls',
  'Mirage Island',
  'Mossdeep City',
  'Mt. Chimney',
  'Mt. Pyre',
  'New Mauville',
  'Oldale Town',
  'Pacifidlog Town',
  'Petalburg City',
  'Petalburg Woods',
  'Rustboro City',
  'Rusturf Tunnel',
  'Safari Zone',
  'Scorched Slab',
  'Seafloor Cavern',
  'Sealed Chamber',
  'Shoal Cave',
  'Sky Pillar',
  'Slateport City',
  'Sootopolis City',
  'Southern Island',
  'S.S. Tidal',
  'Verdanturf Town',
  'Victory Road'
]

const HOENN_RUBY: readonly string[] = [
  ...HOENN_GEN3_BASE.slice(0, HOENN_GEN3_BASE.indexOf('Verdanturf Town')),
  'Team Magma Hideout',
  ...HOENN_GEN3_BASE.slice(HOENN_GEN3_BASE.indexOf('Verdanturf Town'))
]

const HOENN_SAPPHIRE: readonly string[] = [
  ...HOENN_GEN3_BASE.slice(0, HOENN_GEN3_BASE.indexOf('Verdanturf Town')),
  'Team Aqua Hideout',
  ...HOENN_GEN3_BASE.slice(HOENN_GEN3_BASE.indexOf('Verdanturf Town'))
]

/**
 * Hoenn, Pokémon Emerald (Leg 9) — verified against Bulbapedia's "List of locations by
 * index number in Generation III" (index 0x3A onward, where Emerald's recognized indices
 * diverge from Ruby/Sapphire's) plus per-location Bulbapedia articles for anything the
 * index table's short names left ambiguous, 2026-09-20. Built from HOENN_GEN3_BASE (not
 * HOENN_RUBY/HOENN_SAPPHIRE) since Emerald's hideout situation isn't a version-exclusive
 * split — both teams' hideouts exist simultaneously:
 * - **Index 0x3A is renamed, not duplicated**: Ruby/Sapphire's "Battle Tower" and Emerald's
 *   "Battle Frontier" are the same index-table slot (confirmed via the index table itself),
 *   so Emerald's Battle Frontier *replaces* Battle Tower here rather than adding alongside
 *   it. The seven individual facilities (Battle Dome/Factory/Palace/Pike/Pyramid/Arena/
 *   Tower) don't have their own index-table entries — they share the Battle Frontier's
 *   single location slot.
 * - **The Lilycove hideout (HOENN_GEN3_BASE's shared index) stays Team Aqua Hideout** in
 *   Emerald, matching Sapphire's version of that physical location (confirmed via
 *   Bulbapedia's Team Aqua Hideout article: "the main base in Pokémon Sapphire, Emerald,
 *   and Alpha Sapphire").
 * - **Team Magma's hideout moves to a new, different physical location** in Emerald's
 *   story — mid-way through Jagged Pass, confirmed via Bulbapedia's Magma Hideout
 *   disambiguation page and its dedicated "Magma Hideout (Jagged Pass)" article. Not the
 *   same place as Ruby's Lilycove-area hideout, so given the disambiguated name here too
 *   rather than colliding on the bare "Team Magma Hideout" string.
 * - **New postgame/event locations** (confirmed Emerald-only via their individual
 *   Bulbapedia articles): Altering Cave (Route 103, opens after the Hall of Fame — not the
 *   Sevii Islands version FireRed/LeafGreen has), Artisan Cave, Birth Island, Desert
 *   Underpass (Route 114, requires the National Dex), Faraway Island, Marine Cave, Mirage
 *   Tower, Navel Rock, Terra Cave, and Trainer Hill.
 * - **Excluded**: the Marine Cave/Terra Cave "Underwater" sub-variants, and the Route 105/
 *   125/129 underwater areas tied to them — same dive-sub-area exclusion HOENN_GEN3_BASE's
 *   comment already applies to Route 124/126/127/128/Sootopolis.
 */
const HOENN_EMERALD: readonly string[] = [
  'Route 101',
  'Route 102',
  'Route 103',
  'Route 104',
  'Route 105',
  'Route 106',
  'Route 107',
  'Route 108',
  'Route 109',
  'Route 110',
  'Route 111',
  'Route 112',
  'Route 113',
  'Route 114',
  'Route 115',
  'Route 116',
  'Route 117',
  'Route 118',
  'Route 119',
  'Route 120',
  'Route 121',
  'Route 122',
  'Route 123',
  'Route 124',
  'Route 125',
  'Route 126',
  'Route 127',
  'Route 128',
  'Route 129',
  'Route 130',
  'Route 131',
  'Route 132',
  'Route 133',
  'Route 134',
  'Abandoned Ship',
  'Altering Cave',
  'Ancient Tomb',
  'Artisan Cave',
  'Battle Frontier',
  'Birth Island',
  'Cave of Origin',
  'Desert Ruins',
  'Desert Underpass',
  'Dewford Town',
  'Ever Grande City',
  'Fallarbor Town',
  'Faraway Island',
  'Fiery Path',
  'Fortree City',
  'Granite Cave',
  'Island Cave',
  'Jagged Pass',
  'Lavaridge Town',
  'Lilycove City',
  'Littleroot Town',
  'Marine Cave',
  'Mauville City',
  'Meteor Falls',
  'Mirage Island',
  'Mirage Tower',
  'Mossdeep City',
  'Mt. Chimney',
  'Mt. Pyre',
  'Navel Rock',
  'New Mauville',
  'Oldale Town',
  'Pacifidlog Town',
  'Petalburg City',
  'Petalburg Woods',
  'Rustboro City',
  'Rusturf Tunnel',
  'Safari Zone',
  'Scorched Slab',
  'Seafloor Cavern',
  'Sealed Chamber',
  'Shoal Cave',
  'Sky Pillar',
  'Slateport City',
  'Sootopolis City',
  'Southern Island',
  'S.S. Tidal',
  'Team Aqua Hideout',
  'Team Magma Hideout (Jagged Pass)',
  'Terra Cave',
  'Trainer Hill',
  'Verdanturf Town',
  'Victory Road'
]

const MET_LOCATIONS: Record<string, readonly string[]> = {
  'Pokémon Red': KANTO_GEN1,
  'Pokémon Blue': KANTO_GEN1,
  'Pokémon Yellow': KANTO_GEN1,
  'Pokémon Gold': JOHTO_GEN2,
  'Pokémon Silver': JOHTO_GEN2,
  'Pokémon Crystal': CRYSTAL_GEN2,
  'Pokémon Ruby': HOENN_RUBY,
  'Pokémon Sapphire': HOENN_SAPPHIRE,
  'Pokémon Emerald': HOENN_EMERALD
}

/**
 * Gift Pokémon and Mystery Gift distributions record their Met Location in-game as
 * "Fateful Encounter" rather than a real place — not a location at all, so it isn't part
 * of any per-game array above. Appended as an extra option for every curated game instead
 * of living in the per-game data, since it applies identically regardless of game/region.
 */
const FATEFUL_ENCOUNTER = 'Fateful Encounter'

/**
 * Curated Met Location list for a given origin-game name, or undefined if that game
 * isn't curated yet. Deliberately does not fall back to a flat superset the way
 * ballPoolForGame does — unlike Poké Balls, there's no closed set of "every location
 * across every game" to fall back to, so an uncurated game falls through to
 * OriginModal's free-text input instead of a restricted list.
 */
export function metLocationsForGame(gameName: string): readonly string[] | undefined {
  const locations = MET_LOCATIONS[gameName]
  return locations && [...locations, FATEFUL_ENCOUNTER]
}
