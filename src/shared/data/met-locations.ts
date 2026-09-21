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

/**
 * Johto + Kanto, Pokémon HeartGold/SoulSilver (Gen 4, shared base list — Johto+Kanto remake)
 * (Leg 15). Distinct from both JOHTO_GEN2 (the Gen II original, different index table
 * entirely) and SINNOH_GEN4_BASE/PLATINUM_SINNOH (Sinnoh isn't accessible from HGSS's own
 * map at all, despite all three sharing the Generation IV engine). Verified against
 * Bulbapedia's raw wikitext for "List of locations by index number in Generation IV"
 * (fetched directly via the MediaWiki API's action=raw, same source SINNOH_GEN4_BASE/
 * PLATINUM_SINNOH cite), 2026-09-21. That table's gold-colored rows ("debuted in Pokémon
 * HeartGold and SoulSilver, so are only recognized by those games") are indices 0x007E-0x00EA
 * (126-234 decimal) — exactly HGSS's own Johto+Kanto map, symmetric with how
 * PLATINUM_SINNOH used the white+grey rows for Platinum's own full Sinnoh map and included
 * no Johto/Kanto content. The table's white rows (Sinnoh, recognized by all five Gen IV
 * games for trade-display purposes) are deliberately NOT included here for the same reason
 * PLATINUM_SINNOH excluded the gold rows: "recognized" (so a traded-in Pokémon displays its
 * real origin instead of "Faraway place") is not the same as "physically present in this
 * game's own explorable map," and Sinnoh is not part of HGSS's map at all.
 *
 * An initial WebFetch-summarized read of this same page fabricated a plausible-looking but
 * internally-inconsistent row (an "Olivine Lighthouse, index 0068, white" claim that would
 * place a Johto location inside the Sinnoh-only white range and contradicts that same
 * response's own reported gold-row range) — caught by cross-checking against the row range
 * rather than trusted outright. Re-fetched as raw wikitext via direct download (Bash curl)
 * and read verbatim instead for every fact this comment cites, none of it model-summarized.
 *
 * Two of Diamond/Pearl/Platinum's own naming precedents recur here, applied identically:
 * - **{{FB|x|y}} templates display only "y"**, not the linked page's full title — index
 *   0x00C9's {{FB|Kanto|Power Plant}} is "Power Plant" here (already JOHTO_GEN2's name for
 *   the same building, unaffected by the remake), not "Kanto Power Plant".
 * - **ALLCAPS index-table stub text is a wiki stylization, not the real display name** —
 *   "DIGLETT's Cave" and "SLOWPOKE Well" are given their real proper-case names, "Diglett's
 *   Cave" and "Slowpoke Well", matching every prior leg's treatment of the same two
 *   locations and PLATINUM_SINNOH's "ROTOM's Room" → "Rotom's Room".
 *
 * New resolutions specific to this leg:
 * - **Two piped links needed their target page's title, not the shortened display text**:
 *   index 0x00D4's [[Olivine Lighthouse|Lighthouse]] and index 0x00D0's [[Goldenrod Radio
 *   Tower|Radio Tower]] display short text that would collide with Sinnoh's own "Vista
 *   Lighthouse"-vs-generic-"Lighthouse" ambiguity or read as unhelpfully vague standing
 *   alone; resolved to the full page title each links to, "Olivine Lighthouse" and
 *   "Goldenrod Radio Tower", matching JOHTO_GEN2's own names for the same two buildings.
 *   Confirmed via Bulbapedia's "Radio Tower" disambiguation page that Goldenrod's is the
 *   *only* one with a Generation IV index — Lavender Town's own former Pokémon Tower (renamed
 *   "Lavender Radio Tower" in Generation II, per JOHTO_GEN2's comment) has no index-table row
 *   here at all, confirmed absent from the table directly rather than assumed: HGSS folds it
 *   into a non-catchable part of Lavender Town, so it isn't a selectable Met Location in this
 *   game the way it was in Gold/Silver/Crystal.
 * - **"Tin Tower" (Generation II) is renamed "Bell Tower" in HGSS** — confirmed via
 *   Bulbapedia's Bell Tower article directly; not a rename this file invented, the physical
 *   Ecruteak tower's real in-game name changed with the remake.
 * - **Index 0x00DD's {{ka|Victory Road}} <small>([[Kanto]])</small> uses the same
 *   wiki-disambiguation-only parenthetical pattern SINNOH_GEN4_BASE's index 0x0036 (Sinnoh's
 *   own Victory Road) already has** — SINNOH_GEN4_BASE dropped the "(Sinnoh)" qualifier since
 *   it's a Bulbapedia article-disambiguation aid, not real in-game text; same treatment here,
 *   bare "Victory Road". There is only one Victory Road index in this table for HGSS (the one
 *   between Route 26 and Indigo Plateau) — Johto and Kanto share this single location per
 *   Bulbapedia/Serebii, it doesn't get a second, separate Johto-side entry.
 * - **Two new NPC-name indices, "Mr. Pokémon" (0x07DD) and "Primo" (0x07DE), are excluded**
 *   as special gift-Pokémon catch-context strings rather than real places — the same
 *   reasoning SINNOH_GEN4_BASE already applied to excluding "Day-Care Couple".
 * - **Route 47 and Route 48 are genuine HGSS-exclusive new routes** (confirmed via Bulbapedia/
 *   StrategyWiki: carved into the cliffs west of Cianwood, leading to the rebuilt Johto Safari
 *   Zone and the Embedded Tower's legendary encounters) — included in the numeric Route
 *   sequence alongside 1-46, not part of any prior-generation Johto list.
 * - **The rebuilt Johto Safari Zone's own gate, "Safari Zone Gate", plus its brand-new
 *   surrounding areas (Cliff Cave, Frontier Access, Bellchime Trail, Sinjoh Ruins, Embedded
 *   Tower, Pokéwalker, Cliff Edge Gate) are all confirmed HGSS-only additions** via their own
 *   index-table gold rows, none present in Generation II's Johto at all.
 * - **"Mt. Silver" (the exterior mountain, index 0x0089) and "Mt. Silver Cave" (the interior,
 *   index 0x00DB, piped from the same "Mt. Silver" article) are two distinct indices**,
 *   mirroring PLATINUM_SINNOH's already-noted Generation IV split of "Mt. Silver"/"Mt. Silver
 *   Cave" naming (referenced in SINNOH_GEN4_BASE's comment as HGSS-only, now confirmed
 *   directly) — kept as two separate list entries rather than collapsed to one.
 */
const JOHTO_GEN4: readonly string[] = [
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
  'Route 47',
  'Route 48',
  'Azalea Town',
  'Bell Tower',
  'Bellchime Trail',
  'Blackthorn City',
  'Burned Tower',
  'Celadon City',
  'Cerulean Cave',
  'Cerulean City',
  'Cherrygrove City',
  'Cianwood City',
  'Cinnabar Island',
  'Cliff Cave',
  'Cliff Edge Gate',
  'Dark Cave',
  "Diglett's Cave",
  "Dragon's Den",
  'Ecruteak City',
  'Embedded Tower',
  'Frontier Access',
  'Fuchsia City',
  'Goldenrod City',
  'Goldenrod Radio Tower',
  'Goldenrod Tunnel',
  'Ice Path',
  'Ilex Forest',
  'Indigo Plateau',
  'Lake of Rage',
  'Lavender Town',
  'Mahogany Town',
  'Mt. Moon',
  'Mt. Mortar',
  'Mt. Silver',
  'Mt. Silver Cave',
  'National Park',
  'New Bark Town',
  'Olivine City',
  'Olivine Lighthouse',
  'Pallet Town',
  'Pewter City',
  'Pokéathlon Dome',
  'Pokéwalker',
  'Power Plant',
  'Rock Tunnel',
  'Ruins of Alph',
  'Safari Zone',
  'Safari Zone Gate',
  'Saffron City',
  'Seafoam Islands',
  'Sinjoh Ruins',
  'Slowpoke Well',
  'Sprout Tower',
  'S.S. Aqua',
  'Team Rocket HQ',
  'Tohjo Falls',
  'Union Cave',
  'Vermilion City',
  'Victory Road',
  'Violet City',
  'Viridian City',
  'Viridian Forest',
  'Whirl Islands'
]

/**
 * Unova, Generation V (Black/White, shared base list) (Leg 16). Verified against
 * Bulbapedia's raw wikitext for "List of locations by index number in Generation V"
 * (fetched directly via the MediaWiki API's action=raw, same sourcing method Legs 13-15
 * used), 2026-09-21. That table's white-background rows are indices 00000-00116 ("appeared
 * in Black and White" per the table's own header note); indices 00117-00153 plus 30015 are
 * Black 2/White 2-exclusive (Leg 17's concern, not included here) and are shaded light blue
 * in the table for that reason.
 *
 * Excluded as non-place special indices, same reasoning as prior generations' Mystery
 * Zone/Faraway place/region-name exclusions: **index 00000** (a blank placeholder row),
 * **00001 Mystery Zone**, **00002 Faraway place** (the generic fallback string shown for an
 * unrecognized index, not a real location), and **00003** ("<name>'s <location>", a
 * templated placeholder for visiting another player's Entralink world, not a fixed string).
 *
 * **Indices 00076-00105 are excluded as duplicates, not new locations**: the table shades
 * them light blue and labels each "(Entralink)", but every one of them is the exact same
 * named place already listed under its own primary index (e.g. 00076 is "Nimbasa City
 * (Entralink)", the same in-game display text "Nimbasa City" as index 00009) — the
 * "(Entralink)" suffix is the wiki table's own annotation for "recorded when met in another
 * player's world," not part of the actual Met Location string the game displays. Confirmed
 * by the table itself giving no distinct display text for these rows versus their
 * already-listed counterparts.
 *
 * A dedicated index-table row is treated as a real distinct place regardless of whether it
 * has its own dedicated Bulbapedia article, same convention SINNOH_GEN4_BASE/PLATINUM_SINNOH
 * established — applies here to Musical Theater (index 00049, a {{DL}} template link to a
 * section of the Pokémon Musical article rather than a standalone page), Gear Station,
 * Unity Tower, and the ten named Gate buildings (Accumula/Undella/Nacrene/Castelia/Nimbasa/
 * Opelucid/Black/White/Bridge/Route Gate).
 *
 * **A second within-pair location split, alongside the already-known Black City/White
 * Forest one**: Black Gate (index 00112) and White Gate (index 00113) are each
 * version-exclusive too, not both-games locations despite sharing the same white-background
 * shading as every other BW-range index — confirmed via Bulbapedia's Black Gate article
 * directly ("This gate is only present in Black and Black 2" for its Route 14/Route 15
 * connections to Black City, contrasted with White Gate being "only present in White and
 * White 2," connecting to White Forest instead). Makes sense given Black Gate physically
 * leads to Black-exclusive Black City and White Gate to White-exclusive White Forest — the
 * index table's per-index shading tracks "engine recognizes this index" (both games
 * recognize both indices for trade-display purposes, matching the file's earlier Platinum/
 * HGSS precedent that "recognized" isn't "physically present in this game's own map"), not
 * "physically reachable in this cartridge." Both splits layered onto the shared base per
 * game below, same splice pattern HOENN_RUBY/HOENN_SAPPHIRE uses.
 *
 * {{OBP|Victory Road|Black and White}} <small>(Black and White)</small> uses the same
 * wiki-disambiguation-only parenthetical pattern SINNOH_GEN4_BASE/JOHTO_GEN4 already
 * dropped — bare "Victory Road" here, there is only one in this game.
 */
const UNOVA_GEN5_BASE: readonly string[] = [
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
  'Abundant Shrine',
  'Abyssal Ruins',
  'Accumula Gate',
  'Accumula Town',
  'Anville Town',
  'Battle Subway',
  'Bridge Gate',
  'Castelia City',
  'Castelia Gate',
  'Celestial Tower',
  "Challenger's Cave",
  'Chargestone Cave',
  'Cold Storage',
  'Desert Resort',
  'Dragonspiral Tower',
  'Dreamyard',
  'Driftveil City',
  'Driftveil Drawbridge',
  'Entralink',
  'Entree Forest',
  'Gear Station',
  'Giant Chasm',
  'Guidance Chamber',
  'Icirrus City',
  'Lacunosa Town',
  'Liberty Garden',
  'Lostlorn Forest',
  'Marvelous Bridge',
  'Mistralton Cave',
  'Mistralton City',
  'Moor of Icirrus',
  'Musical Theater',
  'Nacrene City',
  'Nacrene Gate',
  'Nimbasa City',
  'Nimbasa Gate',
  "N's Castle",
  'Nuvema Town',
  'Opelucid City',
  'Opelucid Gate',
  'P2 Laboratory',
  'Pinwheel Forest',
  'Poké Transfer Lab',
  'Pokémon League',
  'Relic Castle',
  'Route Gate',
  'Royal Unova',
  'Rumination Field',
  'Shopping Mall',
  'Skyarrow Bridge',
  'Striaton City',
  'Trial Chamber',
  'Tubeline Bridge',
  'Twist Mountain',
  'Undella Bay',
  'Undella Gate',
  'Undella Town',
  'Unity Tower',
  'Victory Road',
  'Village Bridge',
  'Wellspring Cave'
]

const UNOVA_BLACK: readonly string[] = [
  ...UNOVA_GEN5_BASE.slice(0, UNOVA_GEN5_BASE.indexOf('Bridge Gate')),
  'Black City',
  'Black Gate',
  ...UNOVA_GEN5_BASE.slice(UNOVA_GEN5_BASE.indexOf('Bridge Gate'))
]

const UNOVA_WHITE: readonly string[] = [
  ...UNOVA_GEN5_BASE,
  'White Forest',
  'White Gate'
]

/**
 * Unova, Pokémon Black 2/White 2 (Leg 17) — verified against the same raw wikitext
 * UNOVA_GEN5_BASE's comment cites (Bulbapedia's "List of locations by index number in
 * Generation V", action=raw), 2026-09-21. That comment's forward-looking note about indices
 * 00117-00153 plus 30015 (shaded light blue, "Black 2/White 2-exclusive") is confirmed here.
 * Built as a full literal base list (like HOENN_EMERALD/PLATINUM_SINNOH, not a simple
 * UNOVA_GEN5_BASE splice) since the changes aren't a single insertion:
 * - **Index 00036 is renamed, not duplicated**: the wikitext's own version-conditional markup
 *   ({{sup/5|BW}}[[Cold Storage]] / {{sup/5|B2W2}}[[Pokémon World Tournament|PWT]]) puts
 *   Black/White's Cold Storage and Black 2/White 2's Pokémon World Tournament at the same
 *   index — confirmed independently via the Pokémon World Tournament article: "It is located
 *   south of Driftveil City, where the Cold Storage used to be," and a Cold-Storage-caught
 *   Pokémon traded into Black 2/White 2 displays "PWT" as its Met Location because the two
 *   share codepoint 0x0024. Same "index renamed" treatment as HOENN_EMERALD's Battle
 *   Tower→Battle Frontier and PLATINUM_SINNOH's Battle Tower→Battle Frontier/GTS→Global
 *   Terminal. Cold Storage is therefore absent from this list entirely, replaced by "Pokémon
 *   World Tournament".
 * - **Index 00134 is a second, separate "Victory Road"** — Black/White's own Victory Road
 *   (index 00040, already on UNOVA_GEN5_BASE) is a different physical place from Black
 *   2/White 2's relocated Victory Road, per the wikitext's disambiguating {{OBP}} template
 *   parenthetical, but both display the identical in-game string "Victory Road" — listed once
 *   here, no functional difference from a single occurrence.
 * - **Routes 19-23** (indices 00124-00128) are new, added to the numeric Route sequence
 *   alongside 1-18 carried over from Black/White's own map.
 * - **The rest of indices 00117-00153 (except unused index 00138) are new named places**:
 *   Aspertia City/Gate, Virbank City/Complex/Gate, Humilau City, Pokéstar Studios, Join
 *   Avenue, Floccesy Town/Ranch, Lentimas Town, Castelia Sewers, Reversal Mountain, Strange
 *   House, Plasma Frigate, Relic Passage, Clay Tunnel, Seaside Cave, Cave of Being, Hidden
 *   Grotto, Marine Tube, Nature Preserve, Medal Office, Underground Ruins, and the Rock
 *   Peak/Iceberg/Iron Chamber trio and Pledge Grove.
 * - **Index 30015, Pokémon Dream Radar**, is this generation's equivalent of a transfer/
 *   distribution-context location (same class as Poké Transfer Lab/Pal Park elsewhere in this
 *   file) — the 3DS eShop app used to catch Therian Forme Tornadus/Thundurus/Landorus for
 *   transfer into either game, not version-locked, so kept in the shared base rather than
 *   split per version.
 *
 * **A third within-pair location split, alongside Unova's already-known Black City/White
 * Forest and Black Gate/White Gate ones**: Black Tower (index 00139) and White Treehollow
 * (index 00140) are each natively exclusive to one version — confirmed via Bulbapedia's Black
 * Tower article directly ("a training facility initially exclusive to Pokémon Black 2," with
 * White Treehollow the White 2 counterpart) — despite sharing the same "new in this
 * generation" shading as every other index in the 00117-00153 range. The Black City article
 * confirms the existing Black/White split extends across the whole generation too: "Black
 * City is exclusive to Pokémon Black and Pokémon Black 2." A same-game Tower
 * Key/Treehollow-Key trade can grant cross-version access to the other side's City/Tower pair
 * (e.g. a Black 2 Tower Key sent to a White 2 cartridge unlocks Black City and Black Tower
 * there), but that's a cross-cartridge transfer mechanic analogous to Entralink's own
 * cross-version visits in Black/White (already excluded as a real Met Location generator by
 * UNOVA_GEN5_BASE's comment) — not native availability, so not folded into the other
 * version's own array. Black City/Black Gate/Black Tower layered onto Black 2, White
 * Forest/White Gate/White Treehollow onto White 2, same splice pattern UNOVA_BLACK/UNOVA_WHITE
 * uses.
 */
const UNOVA_GEN5_B2W2_BASE: readonly string[] = [
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
  'Abundant Shrine',
  'Abyssal Ruins',
  'Accumula Gate',
  'Accumula Town',
  'Anville Town',
  'Aspertia City',
  'Aspertia Gate',
  'Battle Subway',
  'Bridge Gate',
  'Castelia City',
  'Castelia Gate',
  'Castelia Sewers',
  'Cave of Being',
  'Celestial Tower',
  "Challenger's Cave",
  'Chargestone Cave',
  'Clay Tunnel',
  'Desert Resort',
  'Dragonspiral Tower',
  'Dreamyard',
  'Driftveil City',
  'Driftveil Drawbridge',
  'Entralink',
  'Entree Forest',
  'Floccesy Ranch',
  'Floccesy Town',
  'Gear Station',
  'Giant Chasm',
  'Guidance Chamber',
  'Hidden Grotto',
  'Humilau City',
  'Iceberg Chamber',
  'Icirrus City',
  'Iron Chamber',
  'Join Avenue',
  'Lacunosa Town',
  'Lentimas Town',
  'Liberty Garden',
  'Lostlorn Forest',
  'Marine Tube',
  'Marvelous Bridge',
  'Medal Office',
  'Mistralton Cave',
  'Mistralton City',
  'Moor of Icirrus',
  'Musical Theater',
  'Nacrene City',
  'Nacrene Gate',
  'Nature Preserve',
  'Nimbasa City',
  'Nimbasa Gate',
  "N's Castle",
  'Nuvema Town',
  'Opelucid City',
  'Opelucid Gate',
  'P2 Laboratory',
  'Pinwheel Forest',
  'Plasma Frigate',
  'Pledge Grove',
  'Poké Transfer Lab',
  'Pokémon Dream Radar',
  'Pokémon League',
  'Pokémon World Tournament',
  'Pokéstar Studios',
  'Relic Castle',
  'Relic Passage',
  'Reversal Mountain',
  'Rock Peak Chamber',
  'Route Gate',
  'Royal Unova',
  'Rumination Field',
  'Seaside Cave',
  'Shopping Mall',
  'Skyarrow Bridge',
  'Strange House',
  'Striaton City',
  'Trial Chamber',
  'Tubeline Bridge',
  'Twist Mountain',
  'Undella Bay',
  'Undella Gate',
  'Undella Town',
  'Underground Ruins',
  'Unity Tower',
  'Victory Road',
  'Village Bridge',
  'Virbank City',
  'Virbank Complex',
  'Virbank Gate',
  'Wellspring Cave'
]

const UNOVA_BLACK_2: readonly string[] = [
  ...UNOVA_GEN5_B2W2_BASE.slice(0, UNOVA_GEN5_B2W2_BASE.indexOf('Bridge Gate')),
  'Black City',
  'Black Gate',
  'Black Tower',
  ...UNOVA_GEN5_B2W2_BASE.slice(UNOVA_GEN5_B2W2_BASE.indexOf('Bridge Gate'))
]

const UNOVA_WHITE_2: readonly string[] = [
  ...UNOVA_GEN5_B2W2_BASE,
  'White Forest',
  'White Gate',
  'White Treehollow'
]

/**
 * Kalos, Generation VI (Pokémon X/Y, shared base list) (Leg 18). Verified against
 * Bulbapedia's raw wikitext for "List of locations by index number in Generation VI"
 * (fetched directly via the MediaWiki API's action=raw, same sourcing method Legs 13-17
 * used), 2026-09-21. That table's white-background rows are indices 00000-00168 ("appeared
 * in X and Y" per the table's own header note); indices 00170-00354 plus 60004 are Omega
 * Ruby/Alpha Sapphire-exclusive (Leg 19's concern, shaded light Hoenn-color, not included
 * here) — same white/shaded-region split Legs 13-17's Sinnoh/Unova tables used.
 *
 * Excluded as non-place special indices, same reasoning as every prior generation's Mystery
 * Zone/Faraway place exclusions: **index 00000** (a blank placeholder row, "----------"),
 * **00002 Mystery Zone**, and **00004 Faraway Place** (the generic fallback string for an
 * unrecognized index).
 *
 * **A pattern new to this generation, requiring its own judgment call**: every one of
 * Kalos's 22 numbered routes has a second, immediately-following index for an alternate
 * name (e.g. index 00008 "Route 1" / 00009 "Route 1, Vaniville Pathway") — confirmed via
 * Bulbapedia's own Route article ("Kalos routes that are numbered also have names, such as
 * Route 10 also being known as the Menhir Trail") and Kalos Route 1's article ("The route
 * is also known as Vaniville Pathway"), not a Kalos-specific sub-area the way Generation
 * I/II's Underground Path pairs were. Unlike Generation V's excluded Entralink-duplicate
 * indices (UNOVA_GEN5_BASE's comment — same display text as their primary counterpart, so
 * excluded), each Kalos alt-name index carries genuinely distinct display text from its
 * route's numbered name, and this whole table's stated purpose is cataloguing exactly the
 * index values usable as a Met Location — so, per this file's standing "a dedicated
 * index-table row is a real distinct place regardless of a dedicated article" rule
 * (established at SINNOH_GEN4_BASE/PLATINUM_SINNOH), all 22 are included here as their own
 * list entries rather than folded into their route's numbered name. Index 00103's template
 * call is a Bulbapedia typo (it invokes {{rt|21|...}} instead of {{rt|22|...}}) but the row
 * sits directly after Route 22 (00102) and before Kalos's Victory Road (00104), and Kalos
 * Route 22's own article confirms "Détourner Way" as Route 22's (not Route 21's) alternate
 * name directly — corrected here rather than trusted verbatim.
 *
 * A dedicated index-table row is treated as a real distinct place regardless of whether it
 * has its own article, same convention SINNOH_GEN4_BASE/PLATINUM_SINNOH/UNOVA_GEN5_BASE
 * established — applies here to Zubat Roost (index 00135, a named sub-area within
 * Connecting Cave, index 00134), Lumiose Station and Kiloude Station ({{DL}} links to
 * sections of North Boulevard/Kiloude City rather than standalone articles, same treatment
 * as Unova's Musical Theater), Ambrette Aquarium, and the Pokémon League's five individual
 * Elite Four chambers (Blazing/Flood/Ironworks/Dragonmark/Radiant Chamber, {{DL}} links to
 * Pokémon League (Kalos) sections) — the same "named facility with its own index, not a
 * generic repeated building type" reasoning that already included Sinnoh's individual
 * Battle Frontier facilities and Black 2/White 2's Rock Peak/Iceberg/Iron Chamber trio.
 *
 * Index 00168's {{kal|Unknown Dungeon}} is a real, small, postgame-only cave accessible from
 * Pokémon Village (confirmed via Bulbapedia's dedicated "Unknown Dungeon (Kalos)" article —
 * disambiguated from the unrelated Cerulean Cave/Nameless Cavern/Mystery Dungeon uses of the
 * same phrase), not a placeholder despite the generic-sounding name.
 *
 * "Victory Road" (index 00104, {{kal|Victory Road}} <small>(Kalos)</small>) and "Pokémon
 * League" (index 00106) drop their wiki-disambiguation-only parentheticals, same treatment
 * SINNOH_GEN4_BASE/JOHTO_GEN4/UNOVA_GEN5_BASE already gave their own single same-region
 * Victory Road/Pokémon League entries.
 */
const KALOS_GEN6: readonly string[] = [
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
  'Ambrette Aquarium',
  'Ambrette Gate',
  'Ambrette Town',
  'Anistar City',
  'Anistar Gate',
  'Aquacorde Town',
  'Avance Trail',
  'Azure Bay',
  'Battle Chateau',
  'Battle Maison',
  'Blazing Chamber',
  'Camphrier Town',
  'Chamber of Emptiness',
  'Connecting Cave',
  'Coumarine City',
  'Coumarine Gate',
  'Couriway Gate',
  'Couriway Town',
  'Cyllage City',
  'Dendemille Gate',
  'Dendemille Town',
  'Dernière Way',
  'Détourner Way',
  'Dragonmark Chamber',
  'Flood Chamber',
  'Fourrage Road',
  'Friend Safari',
  'Frost Cavern',
  'Geosenge Town',
  'Glittering Cave',
  'Grande Vallée Way',
  'Ironworks Chamber',
  'Kalos Power Plant',
  'Kiloude City',
  'Kiloude Station',
  'Laverre City',
  'Laverre Gate',
  'Laverre Nature Trail',
  'Lost Hotel',
  'Lumiose Badlands',
  'Lumiose City',
  'Lumiose Gate',
  'Lumiose Station',
  'Lysandre Labs',
  'Mamoswine Road',
  'Mélancolie Path',
  'Menhir Trail',
  'Miroir Way',
  'Muraille Coast',
  'Ouvert Way',
  'Palais Lane',
  'Parfum Palace',
  'Parterre Way',
  'Poké Ball Factory',
  'Pokémon League',
  'Pokémon League Gate',
  'Pokémon Village',
  'Prism Tower',
  'Radiant Chamber',
  'Reflection Cave',
  'Rivière Walk',
  'Santalune City',
  'Santalune Forest',
  "Sea Spirit's Den",
  'Shabboneau Castle',
  'Shalour City',
  'Shalour Gate',
  'Snowbelle City',
  'Snowbelle Gate',
  'Spikes Passage',
  'Team Flare Secret HQ',
  'Terminus Cave',
  'Tower of Mastery',
  'Unknown Dungeon',
  'Vallée Étroite Way',
  'Vaniville Pathway',
  'Vaniville Town',
  'Versant Road',
  'Victory Road',
  'Winding Woods',
  'Zubat Roost'
]

/**
 * Hoenn, Pokémon Omega Ruby/Alpha Sapphire (Gen 6, shared base list — Hoenn remake, distinct
 * from Legs 8/9's original Ruby/Sapphire/Emerald Hoenn map) (Leg 19). Verified against the
 * same raw wikitext KALOS_GEN6's comment cites (Bulbapedia's "List of locations by index
 * number in Generation VI", action=raw), 2026-09-21. That comment's forward-looking note
 * about indices 00170-00354 plus 60004 (shaded Hoenn-color, "exclusive to Omega Ruby and
 * Alpha Sapphire") is confirmed here.
 *
 * **"Recognized" isn't "physically present," same precedent as HGSS/Platinum**: the
 * wikitext's own header states "Pokémon Omega Ruby and Alpha Sapphire have all location
 * headers programmed in that Pokémon X and Y do" — i.e. ORAS's engine recognizes KALOS_GEN6's
 * indices too, so a Pokémon transferred in from X/Y displays its real Kalos Met Location
 * rather than Faraway Place. That's the same "recognized for trade-display, not on this
 * game's own map" distinction JOHTO_GEN4's comment already established for HGSS/Sinnoh and
 * PLATINUM_SINNOH's comment established for Platinum/HGSS's gold rows — ORAS's own curated
 * list here is only its native Hoenn range (00170-00354, 60004), not KALOS_GEN6 layered in,
 * matching how PLATINUM_SINNOH never layered in JOHTO_GEN4's Johto/Kanto range either.
 *
 * Excluded as non-place special indices, same reasoning as every prior generation: **index
 * 00276** ("???" / Inside of Truck, opening-cutscene-only — same exclusion HOENN_GEN3_BASE's
 * comment already applies), **index 00354** (Secret Base, a per-player system not a fixed
 * location, same reasoning as before), and **index 60004** ("an old hot-springs visitor," a
 * Mythical-Egg-event catch-context string, not a real place — same class as Platinum's
 * Day-Care Couple/HGSS's Mr. Pokémon/Primo exclusions). Index 60002's Day-Care Couple/"Day
 * Care helpers" split (version text differs, physical row doesn't) is excluded for the same
 * reason, and isn't in the Hoenn-shaded range at all — it's shared with X/Y's own table.
 *
 * **No within-pair location split, unlike original Ruby/Sapphire**: indices 00292 (Team Aqua
 * Hideout) and 00314 (Team Magma Hideout) are each single, version-non-conditional rows —
 * both teams' hideouts are visitable in both Omega Ruby and Alpha Sapphire (the Delta
 * Episode's postgame content), same "both exist simultaneously" pattern HOENN_EMERALD's
 * comment already established. Unlike Emerald, though, Team Magma Hideout here is at
 * Ruby/Sapphire's original Lilycove-area location, not Emerald's relocated Jagged Pass one —
 * confirmed via Bulbapedia's Magma Hideout disambiguation page, which names Omega Ruby
 * alongside Ruby/Sapphire for the Lilycove-area "Team Magma Hideout" article specifically,
 * keeping Emerald's distinct "Magma Hideout (Jagged Pass)" separate. Plain "Team Magma
 * Hideout" is used here, not the "(Jagged Pass)" qualifier.
 *
 * New Hoenn-remake locations confirmed via their own dedicated Bulbapedia articles: Sea
 * Mauville (a reskin/rename of the original Abandoned Ship), Battle Resort (replaces the
 * original Battle Tower/Emerald's Battle Frontier), and the DexNav-era Mirage Spot system —
 * Mirage Forest, Mirage Cave, Mirage Island, Mirage Mountain, Trackless Forest, Pathless
 * Plain, Nameless Cavern, Fabled Cave, Gnarled Den, Crescent Isle, Secret Islet, Secret
 * Shore, and Secret Meadow — a set of rotating remote areas replacing RSE's single, static
 * "Mirage Island." "Soaring in the sky" (index 00348, the Mega Latios/Latias overworld-flight
 * encounter context) is confirmed via its own dedicated Bulbapedia article as a real,
 * distinct catch context rather than a placeholder, so it's included, matching lowercase
 * "sky" per the article's own title casing.
 *
 * {{ho|Pokémon League}}/{{ho|Victory Road}} <small>([[Hoenn]])</small> drop their
 * wiki-disambiguation-only parentheticals, same treatment every prior region-specific
 * Victory Road/Pokémon League entry in this file already gets.
 */
const HOENN_ORAS: readonly string[] = [
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
  'Ancient Tomb',
  'Battle Resort',
  'Cave of Origin',
  'Crescent Isle',
  'Desert Ruins',
  'Dewford Town',
  'Ever Grande City',
  'Fabled Cave',
  'Fallarbor Town',
  'Fiery Path',
  'Fortree City',
  'Gnarled Den',
  'Granite Cave',
  'Island Cave',
  'Jagged Pass',
  'Lavaridge Town',
  'Lilycove City',
  'Littleroot Town',
  'Mauville City',
  'Meteor Falls',
  'Mirage Cave',
  'Mirage Forest',
  'Mirage Island',
  'Mirage Mountain',
  'Mossdeep City',
  'Mt. Chimney',
  'Mt. Pyre',
  'Nameless Cavern',
  'New Mauville',
  'Oldale Town',
  'Pacifidlog Town',
  'Pathless Plain',
  'Petalburg City',
  'Petalburg Woods',
  'Pokémon League',
  'Rustboro City',
  'Rusturf Tunnel',
  'Safari Zone',
  'Scorched Slab',
  'Sea Mauville',
  'Seafloor Cavern',
  'Sealed Chamber',
  'Secret Islet',
  'Secret Meadow',
  'Secret Shore',
  'Shoal Cave',
  'Sky Pillar',
  'Slateport City',
  'Soaring in the sky',
  'Sootopolis City',
  'Southern Island',
  'S.S. Tidal',
  'Team Aqua Hideout',
  'Team Magma Hideout',
  'Trackless Forest',
  'Verdanturf Town',
  'Victory Road'
]

/**
 * Alola, Pokémon Sun/Moon (Gen 7, shared base list) (Leg 20) — the first family with no
 * Bulbapedia "List of locations by index number" page to verify against (confirmed via a
 * direct MediaWiki opensearch query: Generations I-VI each have one, Generation VII has
 * none). Generation VII's games don't expose a raw index table the way earlier generations
 * do, so this list is instead built from two complementary Bulbapedia sources cross-checked
 * against each other: the main [[Alola]] article's "Notable locations" Settlements/Landmarks
 * tables (2026-09-21), and `Category:Sun and Moon locations` (fetched via the MediaWiki API's
 * categorymembers query, 2026-09-21) — the latter is Bulbapedia's own per-location tagging of
 * "this place is reachable in Sun/Moon specifically," which is what actually caught this
 * leg's one real mistake (see below) and is trusted as the more authoritative signal whenever
 * the two sources disagree.
 *
 * **Seafolk Village correction**: initially assumed Ultra Sun/Ultra Moon-exclusive because
 * it's absent from the Alola article's settlements table (which only gives it a population
 * figure tagged {{sup/7|USUM}}) and its own article's intro only mentions Mina's trial "in
 * Pokémon Ultra Sun and Ultra Moon." Both are true but misleading — checking the article's
 * own Pokémon/Items sections directly (not just its intro paragraph) turned up genuine
 * Su=yes/M=yes-tagged fishing encounters, a gift Aerodactyl, and a Steenee trade, all present
 * in Sun and Moon too. Confirmed via `Category:Sun and Moon locations` including it. Kept in
 * this leg as a lesson for later ones: check an article's actual encounter/item data, not
 * just its lead paragraph, before excluding something as version-exclusive.
 *
 * **Confirmed genuinely Ultra Sun/Ultra Moon-exclusive** (absent from `Category:Sun and Moon
 * locations` *and* each article's own text states "only appears in {{g|Ultra Sun and Ultra
 * Moon}}" or equivalent, checked individually rather than inferred from the category alone):
 * Big Wave Beach, Sandy Cave, Heahea Beach, Pikachu Valley, Poni Beach, Plains Grotto, Team
 * Rocket's Castle (the Episode RR/Rainbow Rocket postgame base), and the whole Ultra Wormhole
 * free-roam realm set added by USUM's Ultra Warp Ride (Ultra Crater, Ultra Desert, Ultra
 * Forest, Ultra Jungle, Ultra Plant, Ultra Ruin, Ultra Space Wilds, Ultra Megalopolis) —
 * confirmed via each Ultra Beast's own Bulbapedia Availability template, which lists only
 * Ultra Sun/Ultra Moon versions for Kartana, Celesteela, Guzzlord, and Poipole. **Dividing
 * Peak Tunnel is the one edge case where the category tag and the article text disagree**:
 * it's tagged `Category:Sun and Moon locations` (the physical passage connecting Routes 7-8
 * exists in both versions) but its own article states it "cannot be visited as a distinct
 * location [in Sun/Moon], only appearing as one in Ultra Sun and Ultra Moon" — the explicit
 * text is trusted over the category tag here, so it's excluded from this leg (Leg 21's
 * concern instead).
 *
 * **Sun/Moon's own Ultra Beast encounters resolve to locations already on this list, not new
 * Ultra-space names** — confirmed via each Ultra Beast's Bulbapedia Availability template:
 * Nihilego (Diglett's Tunnel or Wela Volcano Park), Buzzwole (Melemele Meadow, Sun only),
 * Pheromosa (Verdant Cavern, Moon only), and Xurkitree (Lush Jungle or Memorial Hill) are all
 * one-time story encounters at real, already-curated Alola locations. The climactic
 * Lusamine/Nihilego confrontation location is a genuine exception, though: Bulbapedia's
 * Ultra Deep Sea article confirms that dimension is "known as Ultra Space" specifically in
 * Sun and Moon (USUM renames it "Ultra Deep Sea" — Leg 21's name to use instead), so "Ultra
 * Space" is included here as SM's own name for it, not USUM's generic umbrella term for the
 * broader interdimensional concept.
 *
 * **No version-exclusive split for the Sunne/Moone landmark pairs, unlike Black City/White
 * Forest**: Altar of the Sunne/Altar of the Moone and Lake of the Sunne/Lake of the Moone are
 * each one Sun-primary and one Moon-primary location, but Bulbapedia confirms both halves of
 * each pair become accessible in *both* versions post-Champion via the Ultra Wormhole at the
 * other altar — same "both exist simultaneously" pattern HOENN_EMERALD's Team Aqua/Magma
 * Hideout comment already established, not a genuine per-version split. All four locations
 * are on this single shared Sun/Moon base list rather than split into separate Sun/Moon
 * arrays. **Secluded Shore is Sun/Moon's own name** for the beach USUM renames "Ula'ula
 * Beach" (confirmed via that location's infobox: `location_name=Ula'ula Beach`,
 * `other_info=Secluded Shore`) — Leg 21 will use the USUM name instead for the same place.
 *
 * **Poké Pelago is a genuine catch location, not a menu/system feature**: confirmed via its
 * own article — a wild Pokémon that lingers on Isle Abeens can be added directly to the
 * party or PC boxes, a real (if unusual) catch mechanic, unlike Festival Plaza (no confirmed
 * catch mechanism found in its article, excluded here) or Secret Base/Day Care-style
 * per-player systems excluded in earlier generations.
 *
 * **Excluded as generic repeated building types, not single fixed places** — same reasoning
 * Colosseum's Mayor's House/Pyrite Bldg exclusion already established: Poké Mart, Pokémon
 * Center, and Pokémon Center Café (identical in every town) and Aether Base (the same generic
 * name shared by three unrelated physical buildings — Heahea City, Route 8, and Route 16).
 * Also excluded: Faraway place (Generation VII's fallback string for an unrecognized origin,
 * same class as Mystery Zone/Faraway Place in earlier generations), Player's house (a
 * per-player structure), and Melemele/Akala/Ula'ula/Poni Island (Alola's four island names
 * used as region-level groupings, not granular Met Location values — same reasoning
 * SINNOH_GEN4_BASE's comment already applied to excluding the Kanto/Johto/Hoenn/Sinnoh
 * region-name indices).
 *
 * Building-interior entries kept despite sounding generic, since each is a single,
 * distinctly-named facility rather than a repeated template (same reasoning
 * SINNOH_GEN4_BASE's Poffin House/Cycle Shop/GTS precedent already established): Battle
 * Buffet, Battle Royal Dome, Battle Tree, Pokémon Nursery, Thrifty Megamart (Abandoned Site,
 * disambiguated from the functioning store folded into Royal Avenue itself), and Tide Song
 * Hotel.
 */
const ALOLA_SM: readonly string[] = [
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
  'Aether House',
  'Aether Paradise',
  'Akala Outskirts',
  'Altar of the Moone',
  'Altar of the Sunne',
  'Ancient Poni Path',
  'Battle Buffet',
  'Battle Royal Dome',
  'Battle Tree',
  'Berry fields',
  'Blush Mountain',
  'Brooklet Hill',
  "Diglett's Tunnel",
  'Exeggutor Island',
  'Haina Desert',
  'Hano Beach',
  'Hano Grand Resort',
  "Hau'oli Cemetery",
  "Hau'oli City",
  'Heahea City',
  'Hokulani Observatory',
  'Iki Town',
  "Kala'e Bay",
  'Konikoni City',
  'Lake of the Moone',
  'Lake of the Sunne',
  'Lush Jungle',
  'Mahalo Trail',
  'Malie City',
  'Malie Garden',
  'Melemele Meadow',
  'Melemele Sea',
  'Memorial Hill',
  'Mount Hokulani',
  'Mount Lanakila',
  'Paniola Ranch',
  'Paniola Town',
  'Po Town',
  'Poké Pelago',
  'Pokémon League',
  'Pokémon Nursery',
  'Poni Breaker Coast',
  'Poni Coast',
  'Poni Gauntlet',
  'Poni Grove',
  'Poni Meadow',
  'Poni Plains',
  'Poni Wilds',
  'Resolution Cave',
  'Royal Avenue',
  'Ruins of Abundance',
  'Ruins of Conflict',
  'Ruins of Hope',
  'Ruins of Life',
  'Seafolk Village',
  'Seaward Cave',
  'Secluded Shore',
  'Shady House',
  'Tapu Village',
  'Ten Carat Hill',
  'Thrifty Megamart (Abandoned Site)',
  'Tide Song Hotel',
  "Trainers' School",
  "Ula'ula Meadow",
  'Ultra Space',
  'Vast Poni Canyon',
  'Verdant Cavern',
  'Wela Volcano Park'
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
  'Pokémon Platinum': PLATINUM_SINNOH,
  'Pokémon HeartGold': JOHTO_GEN4,
  'Pokémon SoulSilver': JOHTO_GEN4,
  'Pokémon Black': UNOVA_BLACK,
  'Pokémon White': UNOVA_WHITE,
  'Pokémon Black 2': UNOVA_BLACK_2,
  'Pokémon White 2': UNOVA_WHITE_2,
  'Pokémon X': KALOS_GEN6,
  'Pokémon Y': KALOS_GEN6,
  'Pokémon Omega Ruby': HOENN_ORAS,
  'Pokémon Alpha Sapphire': HOENN_ORAS,
  'Pokémon Sun': ALOLA_SM,
  'Pokémon Moon': ALOLA_SM
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
