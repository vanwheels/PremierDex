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

/**
 * Kanto + Sevii Islands, Pokémon FireRed/LeafGreen (Gen 3, shared base list) (Leg 10) — the
 * Kanto remake, distinct from KANTO_GEN1's original Red/Blue/Yellow map despite covering the
 * same region. Verified against Bulbapedia's "List of locations by index number in Generation
 * III" (FireRed/LeafGreen's own index range, distinct from Ruby/Sapphire/Emerald's) and
 * Serebii's per-island Sevii Islands Pokéarth pages (One through Seven Island, each fetched
 * individually), 2026-09-20.
 *
 * Mainland Kanto carries over from KANTO_GEN1 unchanged — no named location is added,
 * removed, or renamed versus Red/Blue/Yellow (confirmed by web search specifically for the
 * one plausible candidate: "Pokémon League" is not a separate Met Location from "Indigo
 * Plateau", contrary to an initial index-table read — Indigo Plateau is simply the Pokémon
 * League's home, one location, not two. Also declined to add "Route 4 (Pokémon Center)"/
 * "Route 10 (Pokémon Center)" as distinct locations: the index-table source that suggested
 * these gave inconsistent index numbers for an unrelated entry (Trainer Tower) across two
 * separate reads, and no independent source corroborates a Route-outbuilding Pokémon Center
 * ever having its own Met Location distinct from its route — not included without
 * corroboration).
 *
 * The Sevii Islands are FireRed/LeafGreen's real addition: the seven island settlements
 * (One Island through Seven Island) plus every named sub-area confirmed via Serebii's
 * dedicated per-island pages — One Island (Treasure Beach, Kindle Road, Mt. Ember), Two
 * Island (Cape Brink), Three Island (Three Isle Port, Three Isle Path, Bond Bridge, Berry
 * Forest), Four Island (Icefall Cave), Five Island (Five Isle Meadow, Memorial Pillar, Water
 * Labyrinth, Resort Gorgeous, Rocket Warehouse, Lost Cave), Six Island (Water Path, Pattern
 * Bush, Green Path, Outcast Island, Altering Cave — a distinct physical location from
 * Emerald's Route 103 Altering Cave, same as HOENN_EMERALD's comment already notes — Ruin
 * Valley, Dotted Hole), and Seven Island (Trainer Tower, Canyon Entrance, Sevault Canyon,
 * Tanoby Ruins, Tanoby Key). Plus the two event-exclusive islands, Navel Rock and Birth
 * Island.
 *
 * The seven Tanoby Chambers (confirmed via Bulbapedia's dedicated Tanoby Chambers article,
 * including its trivia note that the generic "Tanoby Chambers" index is never actually used
 * as a Met Location — it always defaults to the specific chamber's own name) are listed
 * individually rather than under one umbrella name: Monean, Liptoo, Weepth, Dilford, Scufib,
 * Rixy, and Viapois Chamber.
 */
const KANTO_GEN3: readonly string[] = [
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
  'Altering Cave',
  'Berry Forest',
  'Birth Island',
  'Bond Bridge',
  'Canyon Entrance',
  'Cape Brink',
  'Celadon City',
  'Cerulean Cave',
  'Cerulean City',
  'Cinnabar Island',
  "Diglett's Cave",
  'Dilford Chamber',
  'Dotted Hole',
  'Five Island',
  'Five Isle Meadow',
  'Four Island',
  'Fuchsia City',
  'Green Path',
  'Icefall Cave',
  'Indigo Plateau',
  'Kindle Road',
  'Lavender Town',
  'Liptoo Chamber',
  'Lost Cave',
  'Memorial Pillar',
  'Monean Chamber',
  'Mt. Ember',
  'Mt. Moon',
  'Navel Rock',
  'One Island',
  'Outcast Island',
  'Pallet Town',
  'Pattern Bush',
  'Pewter City',
  'Pokémon Mansion',
  'Pokémon Tower',
  'Power Plant',
  'Resort Gorgeous',
  'Rixy Chamber',
  'Rock Tunnel',
  'Rocket Hideout',
  'Rocket Warehouse',
  'Ruin Valley',
  'Safari Zone',
  'Saffron City',
  'Scufib Chamber',
  'Seafoam Islands',
  'Sevault Canyon',
  'Seven Island',
  'Silph Co.',
  'Six Island',
  'S.S. Anne',
  'Tanoby Key',
  'Tanoby Ruins',
  'Three Island',
  'Three Isle Path',
  'Three Isle Port',
  'Trainer Tower',
  'Treasure Beach',
  'Two Island',
  'Underground Path (Routes 5–6)',
  'Underground Path (Routes 7–8)',
  'Vermilion City',
  'Viapois Chamber',
  'Victory Road',
  'Viridian City',
  'Viridian Forest',
  'Water Labyrinth',
  'Water Path',
  'Weepth Chamber'
]

/**
 * Orre, Pokémon Colosseum (Gen 3, no paired version) (Leg 11) — a fundamentally different
 * shape from every prior family: Colosseum has zero wild encounters, so there's no
 * Routes-first ordering to apply (it has no "Route N" locations at all — every area is a
 * discrete named hub, not overland terrain) and every Pokémon (starter, Shadow Pokémon
 * snagged, gifts/trades) is met at one of these fixed story locations instead. Alphabetical
 * throughout. Verified against Bulbapedia's "List of locations by index number in Pokémon
 * Colosseum and Pokémon XD" (Colosseum column of the shared GCN location-index table) plus
 * individual location articles for anything the index table's short names left ambiguous,
 * 2026-09-20.
 *
 * Deliberately excludes generic building interiors that have their own Bulbapedia articles
 * but aren't a distinct Met Location from their parent town — Mayor's House and Pyrite Bldg
 * (ordinary apartment/rental buildings) and Card e Room (an e-Reader peripheral feature, not
 * a place) — same reasoning KANTO_GEN1/HOENN_GEN3_BASE already applied to Poké
 * Marts/Pokémon Centers and non-place indices like "Secret Base"/"Inside of Truck". Kept
 * in, despite being building interiors too, because each is a standalone plot-critical
 * facility rather than a generic building type repeated across towns (same class as Silph
 * Co. or Team Magma/Aqua Hideout): Cipher Lab, Prestige Precept Center, and Snagem Hideout.
 * Relic Stone is Agate Village's shrine landmark but confirmed via its own index-table row,
 * same treatment Olivine Lighthouse/Ruins of Alph got in JOHTO_GEN2. Under Colosseum and
 * Deep Colosseum are confirmed distinct facilities (northern The Under vs. an unknown depth
 * below it), not the same place under two names. Tower Colosseum is this game's own name for
 * the Realgam Tower arena — "Realgam Colosseum" is XD's name for the same physical location,
 * confirmed via that location's Bulbapedia article, so Colosseum's list uses "Tower
 * Colosseum" here (XD's own list is Leg 12's concern). S.S. Libra, Kaminko's House, Citadark
 * Isle, and Cipher Key Lair are confirmed XD-exclusive (Leg 12), not included here.
 */
const ORRE_COLOSSEUM: readonly string[] = [
  'Agate Village',
  'Cipher Lab',
  'Deep Colosseum',
  'Mt. Battle',
  'Orre Colosseum',
  'Outskirt Stand',
  'Phenac City',
  'Phenac Stadium',
  'Prestige Precept Center',
  'Pyrite Cave',
  'Pyrite Colosseum',
  'Pyrite Town',
  'Relic Cave',
  'Relic Stone',
  'Snagem Hideout',
  'The Under',
  'The Under Subway',
  'Tower Colosseum',
  'Under Colosseum'
]

/**
 * Orre, Pokémon XD: Gale of Darkness (Gen 3, no paired version, kept separate from Leg 11's
 * Colosseum list per Vanny 2026-09-20 — the two games' location-index tables have no entries
 * in common per Bulbapedia). Same shape as Colosseum: no Routes, alphabetical throughout.
 * Verified against the same shared "List of locations by index number in Pokémon Colosseum
 * and Pokémon XD" table (XD column this time) plus individual location articles, 2026-09-20.
 *
 * Overlaps with ORRE_COLOSSEUM on the towns/facilities both games revisit — Agate Village,
 * Cipher Lab, Mt. Battle, Orre Colosseum, Outskirt Stand, Phenac City, Pyrite Town, Relic
 * Stone, and Snagem Hideout all have their own index-table row in the XD column too, not just
 * Colosseum's. The Under, The Under Subway, Under Colosseum, Deep Colosseum, Pyrite Cave,
 * Pyrite Bldg, Relic Cave, Phenac Stadium, Pyrite Colosseum, Prestige Precept Center, and
 * Mayor's House have no XD-column row at all (confirmed via the index table directly, not
 * inferred) — Colosseum-exclusive, not layered in here.
 *
 * XD's own additions: Gateon Port, Pokémon HQ Lab, Kaminko's House, Citadark Isle, Cipher Key
 * Lair, S.S. Libra, Realgam Tower, and the three Poké Spots (Rock/Oasis/Cave) — XD's actual
 * wild encounters, unlike Colosseum's zero. Named per the dedicated Poké Spot article rather
 * than the index table's shortened "Rock"/"Oasis"/"Cave" link text, same reasoning
 * ORRE_COLOSSEUM's "Relic Stone" already applies to a piped short name. Deliberately does
 * NOT include "Realgam Colosseum" (XD's own name, confirmed via that location's Bulbapedia
 * article, for the specific arena Colosseum calls "Tower Colosseum") as a location distinct
 * from "Realgam Tower" — unlike Colosseum, whose index table gives that arena room its own
 * "Tower Colosseum" index separate from the rest of the tower, XD's index table has no
 * separate index for it at all; every room in the building, arena included, indexes as plain
 * "Realgam Tower". Whatever the prose name is, the game's own Met Location data has no way to
 * produce "Realgam Colosseum" as a value in XD.
 */
const ORRE_XD: readonly string[] = [
  'Agate Village',
  'Cave Poké Spot',
  'Cipher Key Lair',
  'Cipher Lab',
  'Citadark Isle',
  'Gateon Port',
  "Kaminko's House",
  'Mt. Battle',
  'Oasis Poké Spot',
  'Orre Colosseum',
  'Outskirt Stand',
  'Phenac City',
  'Pokémon HQ Lab',
  'Pyrite Town',
  'Realgam Tower',
  'Relic Stone',
  'Rock Poké Spot',
  'S.S. Libra',
  'Snagem Hideout'
]

/**
 * Sinnoh, Generation IV (Diamond/Pearl, shared base list) (Leg 13). Routes 201-230 followed
 * by every other named location alphabetically. Verified against Bulbapedia's raw wikitext
 * for "List of locations by index number in Generation IV" (fetched directly via the
 * MediaWiki API's action=raw, not a rendered/summarized page — the table's per-row
 * background-color markup is the actual DP/Platinum/HGSS availability signal and doesn't
 * survive naive HTML-to-text summarization) and Serebii's Sinnoh Pokéarth pages, 2026-09-21.
 * Indices 0x0000-0x006F are white ("recognized by all games," i.e. present since Diamond/
 * Pearl); 0x0070 onward turns grey (Platinum-only) then gold (HGSS-only migrated Johto/Kanto
 * locations, irrelevant here).
 *
 * Surprising result that contradicts an easy assumption: **Fight Area, Survival Area, Resort
 * Area, Stark Mountain, Battle Tower, Seabreak Path, Hall of Origin, and the Verity/Valor/
 * Acuity Cavern trio are all white (index 0x0050-0x0059) — already in Diamond/Pearl, not a
 * Platinum-exclusive "Battle Zone" addition.** Diamond/Pearl's Elite-Four postgame already
 * includes the Battle Zone and Stark Mountain's Heatran, same as Platinum. What Platinum
 * actually adds on top (confirmed grey, index 0x0070-0x007D, excluded from this list — Leg
 * 14's concern): the Battle Frontier and its four facilities (replacing Diamond/Pearl's plain
 * Battle Tower), Distortion World (Platinum lets you catch Giratina there directly; Diamond/
 * Pearl catches it in Turnback Cave itself, already on this list), a "Global Terminal"
 * building distinct from Diamond/Pearl's own GTS (below), Villa, Battleground, ROTOM's Room,
 * T.G. Eterna Bldg, and Iron/Iceberg/Rock Peak Ruins (Platinum lets you catch the Regis
 * directly in Sinnoh; Diamond/Pearl only gets them via Pal Park transfer from Ruby/Sapphire/
 * Emerald, already covered by HOENN_GEN3_BASE/HOENN_EMERALD).
 *
 * Building-interior entries (Galactic HQ, Jubilife TV, Pokétch Co., GTS, Trainers' School,
 * Mining Museum, Flower Shop, Cycle Shop, Contest Hall, Poffin House, Foreign Building,
 * Pokémon Day Care, Veilstone Store, Game Corner, Canalave Library, Vista Lighthouse,
 * Sunyshore Market, Pokémon Mansion, Footstep House, Cafe, Grand Lake, Restaurant, Battle
 * Park) are included despite being generic-sounding — unlike Colosseum's excluded Mayor's
 * House/Pyrite Bldg, each of these has its own dedicated index-table row, confirmed via the
 * raw wikitext directly, not inferred from a wiki article existing. Display names resolved
 * from Bulbapedia's {{FB|x|y}} template semantics (links to page "x y", displays only "y") —
 * e.g. index 0x0047 displays as "Galactic HQ", not "Team Galactic HQ". "Cafe" (not "Café") is
 * Diamond/Pearl's spelling specifically; Platinum/HGSS use the accented "Café" per the
 * wikitext's version-conditional markup.
 *
 * Excluded as not real places despite having index rows, same reasoning as Mystery Zone/
 * "Inside of Truck"/region-name indices elsewhere in this file: **Mystery Zone** (index
 * 0x0000, internal map-ID placeholder, inaccessible without exploiting glitches per the
 * wikitext itself); **Day-Care Couple** (index 0x07D0, a special egg-Pokémon catch-context
 * string analogous to FATEFUL_ENCOUNTER, not a place — no prior generation's list adds an
 * equivalent entry either, so not started here); and the **Kanto/Johto/Hoenn/Sinnoh
 * region-name indices** (0x07D3-0x07D6), which the wikitext explicitly states "are not
 * directly used for Pokémon caught in their respective regions" — they exist only as
 * Pal-Park-migration game-of-origin labels, never producible as an actual Met Location value
 * in a Generation IV game.
 */
const SINNOH_GEN4_BASE: readonly string[] = [
  'Route 201',
  'Route 202',
  'Route 203',
  'Route 204',
  'Route 205',
  'Route 206',
  'Route 207',
  'Route 208',
  'Route 209',
  'Route 210',
  'Route 211',
  'Route 212',
  'Route 213',
  'Route 214',
  'Route 215',
  'Route 216',
  'Route 217',
  'Route 218',
  'Route 219',
  'Route 220',
  'Route 221',
  'Route 222',
  'Route 223',
  'Route 224',
  'Route 225',
  'Route 226',
  'Route 227',
  'Route 228',
  'Route 229',
  'Route 230',
  'Acuity Cavern',
  'Acuity Lakefront',
  'Amity Square',
  'Battle Park',
  'Battle Tower',
  'Cafe',
  'Canalave City',
  'Canalave Library',
  'Celestic Town',
  'Contest Hall',
  'Cycle Shop',
  'Eterna City',
  'Eterna Forest',
  'Fight Area',
  'Floaroma Meadow',
  'Floaroma Town',
  'Flower Paradise',
  'Flower Shop',
  'Footstep House',
  'Foreign Building',
  'Fuego Ironworks',
  'Fullmoon Island',
  'Galactic HQ',
  'Game Corner',
  'Grand Lake',
  'Great Marsh',
  'GTS',
  'Hall of Origin',
  'Hearthome City',
  'Iron Island',
  'Jubilife City',
  'Jubilife TV',
  'Lake Acuity',
  'Lake Valor',
  'Lake Verity',
  'Maniac Tunnel',
  'Mining Museum',
  'Mt. Coronet',
  'Newmoon Island',
  'Old Chateau',
  'Oreburgh City',
  'Oreburgh Gate',
  'Oreburgh Mine',
  'Pal Park',
  'Pastoria City',
  'Poffin House',
  'Pokémon Day Care',
  'Pokémon League',
  'Pokémon Mansion',
  'Pokétch Co.',
  'Ravaged Path',
  'Resort Area',
  'Restaurant',
  'Ruin Maniac Cave',
  'Sandgem Town',
  'Seabreak Path',
  'Sendoff Spring',
  'Snowpoint City',
  'Snowpoint Temple',
  'Solaceon Ruins',
  'Solaceon Town',
  'Spear Pillar',
  'Spring Path',
  'Stark Mountain',
  'Sunyshore City',
  'Sunyshore Market',
  'Survival Area',
  "Trainers' School",
  'Trophy Garden',
  'Turnback Cave',
  'Twinleaf Town',
  'Valley Windworks',
  'Valor Cavern',
  'Valor Lakefront',
  'Veilstone City',
  'Veilstone Store',
  'Verity Cavern',
  'Verity Lakefront',
  'Victory Road',
  'Vista Lighthouse',
  'Wayward Cave'
]

/**
 * Sinnoh, Pokémon Platinum (Leg 14) — verified against the same raw wikitext SINNOH_GEN4_BASE's
 * comment cites (Bulbapedia's "List of locations by index number in Generation IV",
 * fetched via action=raw, 2026-09-21), confirming that comment's forward-looking summary of
 * indices 0x0070-0x007D (grey, "debuted in Platinum, recognized by Platinum/HGSS only"):
 * Battle Frontier and its four facilities (Battle Arcade, Battle Castle, Battle Factory,
 * Battle Hall — replacing Diamond/Pearl's plain Battle Tower, same "index renamed, not
 * duplicated" treatment HOENN_EMERALD's Battle Tower→Battle Frontier got), Distortion World,
 * Global Terminal, Villa, Battleground, Rotom's Room, T.G. Eterna Bldg, and Iron/Iceberg/Rock
 * Peak Ruins. Built as a full literal list rather than a splice off SINNOH_GEN4_BASE (like
 * HOENN_EMERALD, not HOENN_RUBY/SAPPHIRE) since the changes aren't a single insertion:
 * - **Battle Tower removed, not kept alongside Battle Frontier** — same reasoning as Emerald's
 *   Battle Tower→Battle Frontier: the wikitext's index-renamed-not-duplicated pattern means a
 *   Platinum-native catch can never produce "Battle Tower" as a Met Location value, since the
 *   place itself doesn't exist in Platinum's map.
 * - **GTS removed, replaced with Global Terminal** — confirmed via Bulbapedia's Global
 *   Terminal article: physically the same Jubilife City building as Diamond/Pearl's GTS, but
 *   Platinum's engine renames the index itself, so a Platinum-native GTS-trade Pokémon's Met
 *   Location reads "Global Terminal", never "GTS".
 * - **"Cafe" (Diamond/Pearl) becomes "Café" (Platinum)** — confirmed via the wikitext's
 *   version-conditional {{sup/4|DP}}/{{sup/4|PtHGSS}} markup on that row: same index/place
 *   (Café Cabin), different display spelling per version, not a separate location.
 * - **"ROTOM's Room" index displays as "Rotom's Room"** — the wikitext's row label is stylized
 *   in caps, but Bulbapedia's own dedicated article for the location (and every in-game/guide
 *   reference) titles it "Rotom's Room"; used here rather than the wikitext's raw caps, same
 *   as KANTO_GEN1/HOENN_GEN3_BASE resolving other locations' real display names over a source
 *   table's shorthand.
 * - **Turnback Cave (already white/all-games on SINNOH_GEN4_BASE) is kept, not replaced** —
 *   Distortion World is Platinum's new *separate* index for catching Giratina directly;
 *   Turnback Cave itself remains a real, distinct, accessible place in Platinum too.
 */
const PLATINUM_SINNOH: readonly string[] = [
  'Route 201',
  'Route 202',
  'Route 203',
  'Route 204',
  'Route 205',
  'Route 206',
  'Route 207',
  'Route 208',
  'Route 209',
  'Route 210',
  'Route 211',
  'Route 212',
  'Route 213',
  'Route 214',
  'Route 215',
  'Route 216',
  'Route 217',
  'Route 218',
  'Route 219',
  'Route 220',
  'Route 221',
  'Route 222',
  'Route 223',
  'Route 224',
  'Route 225',
  'Route 226',
  'Route 227',
  'Route 228',
  'Route 229',
  'Route 230',
  'Acuity Cavern',
  'Acuity Lakefront',
  'Amity Square',
  'Battle Arcade',
  'Battle Castle',
  'Battle Factory',
  'Battle Frontier',
  'Battle Hall',
  'Battle Park',
  'Battleground',
  'Café',
  'Canalave City',
  'Canalave Library',
  'Celestic Town',
  'Contest Hall',
  'Cycle Shop',
  'Distortion World',
  'Eterna City',
  'Eterna Forest',
  'Fight Area',
  'Floaroma Meadow',
  'Floaroma Town',
  'Flower Paradise',
  'Flower Shop',
  'Footstep House',
  'Foreign Building',
  'Fuego Ironworks',
  'Fullmoon Island',
  'Galactic HQ',
  'Game Corner',
  'Global Terminal',
  'Grand Lake',
  'Great Marsh',
  'Hall of Origin',
  'Hearthome City',
  'Iceberg Ruins',
  'Iron Island',
  'Iron Ruins',
  'Jubilife City',
  'Jubilife TV',
  'Lake Acuity',
  'Lake Valor',
  'Lake Verity',
  'Maniac Tunnel',
  'Mining Museum',
  'Mt. Coronet',
  'Newmoon Island',
  'Old Chateau',
  'Oreburgh City',
  'Oreburgh Gate',
  'Oreburgh Mine',
  'Pal Park',
  'Pastoria City',
  'Poffin House',
  'Pokémon Day Care',
  'Pokémon League',
  'Pokémon Mansion',
  'Pokétch Co.',
  'Ravaged Path',
  'Resort Area',
  'Restaurant',
  'Rock Peak Ruins',
  "Rotom's Room",
  'Ruin Maniac Cave',
  'Sandgem Town',
  'Seabreak Path',
  'Sendoff Spring',
  'Snowpoint City',
  'Snowpoint Temple',
  'Solaceon Ruins',
  'Solaceon Town',
  'Spear Pillar',
  'Spring Path',
  'Stark Mountain',
  'Sunyshore City',
  'Sunyshore Market',
  'Survival Area',
  'T.G. Eterna Bldg',
  "Trainers' School",
  'Trophy Garden',
  'Turnback Cave',
  'Twinleaf Town',
  'Valley Windworks',
  'Valor Cavern',
  'Valor Lakefront',
  'Veilstone City',
  'Veilstone Store',
  'Verity Cavern',
  'Verity Lakefront',
  'Victory Road',
  'Villa',
  'Vista Lighthouse',
  'Wayward Cave'
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
  'Pokémon Emerald': HOENN_EMERALD,
  'Pokémon FireRed': KANTO_GEN3,
  'Pokémon LeafGreen': KANTO_GEN3,
  'Pokémon Colosseum': ORRE_COLOSSEUM,
  'Pokémon XD: Gale of Darkness': ORRE_XD,
  'Pokémon Diamond': SINNOH_GEN4_BASE,
  'Pokémon Pearl': SINNOH_GEN4_BASE,
  'Pokémon Platinum': PLATINUM_SINNOH
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
