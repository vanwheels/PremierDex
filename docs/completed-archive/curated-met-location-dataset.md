# Completed: Curated Met Location dataset

Archived from `COMPLETED.md` at the milestone boundary — see
`docs/postmortems/curated-met-location-dataset.md` and `MILESTONES.md`.

## [Curated Met Location dataset Leg 28: curate Pokémon GO] — 2026-09-21
Added `GO_REGIONS`. Pokémon GO is the one game in this dataset with no in-game map or
location-index data structure to verify against — it's GPS-based, and Bulbapedia/Serebii's
own regional-exclusive documentation for it turned out to be inconsistent free text per
species (lat/long bands, "Iberian Peninsula", "Eastern Hemisphere", specific event cities
like "New York City") rather than a fixed list of named places. Asked Vanny directly how to
structure this rather than guessing a taxonomy (regions-only vs. regions+named events vs.
importing Serebii's strings verbatim) — she picked a small closed set of standardized
regions over either extreme. Shipped a normalized six-continent list (Africa, Asia, Europe,
North America, Oceania, South America) instead of importing any per-species free text, since
every real-world catch location falls under exactly one of these regardless of how a given
species' exclusivity boundary happens to be worded upstream. Closes the milestone — every
`ORIGIN_GAMES` map family is now curated. See commit `476d0bc`.

## [Curated Met Location dataset Leg 27: curate Pokémon Legends: Z-A] — 2026-09-21
Added `LUMIOSE_GEN9` (230 entries), sourced from Bulbapedia's raw wikitext for "List of
locations by index number in Pokémon Legends: Z-A" (action=raw fetch via curl, 2026-09-21 —
WebFetch's own summarized read of the same page fabricated a plausible-looking but wrong
"Mega Dimension DLC" range breakdown, so the raw wikitext was pulled directly instead of
trusting the summarized tool result). Unlike Paldea (Leg 26), this game has an index-number
page, so generic-sounding shop/café names were NOT excluded as a category heuristic — the
table directly confirms dozens of individually-indexed named businesses (Café Cyclone,
Sushi High Roller, five explicitly generic fallback strings) as genuine Met Location values,
the same standard HISUI_GEN8 already applied to its own shops. Sector N (per-district) and
Wild Zone N sequences sort numerically rather than by raw string order, same treatment
Route N sequences have always gotten, to avoid interleaving "Sector 10" between "Sector 1"
and "Sector 2". Folded the Mega Dimension DLC's Hyperspace locations into the same shared
list, per the Leg 26 Kitakami/Blueberry Academy DLC precedent. Excluded the same non-place
categories (Mystery Zone, Faraway place, blank/unused indices, cross-game transfer/event
range 30001-60005) every prior generation's list already established. See commit
`d32aca1`.

## [Curated Met Location dataset Leg 26: curate Pokémon Scarlet/Violet] — 2026-09-21
Added `PALDEA_BASE`/`PALDEA_SCARLET`/`PALDEA_VIOLET`. Paldea has no numbered routes at all
(confirmed via Bulbapedia's own article) and Generation IX has no location-index wiki page to
verify against, so this leg built from Bulbapedia's Scarlet/Violet/Kitakami/Blueberry Academy
location categories instead, using "does this region-page bullet get its own wikilink" as the
inclusion test in place of an index-table row — an unlinked bullet (most of Ten Sights of
Paldea/Six Wonders of Kitakami's own members) folds into its parent area rather than getting
its own entry. Verified Team Star's five squad bases have no catchable Pokémon (their "Star
Barrage" is a scripted non-catch battle) by reading each base's own article directly rather
than assuming a named building always has one. Mesagoza's academy is a genuine within-pair
location-name split (Naranja Academy/Uva Academy, same building) where every player receives
their first partner Pokémon there. Folded the Teal Mask/Indigo Disk DLC areas into this same
shared list, per the precedent Leg 23 set for Sword/Shield's own DLC. See commit `4c17a5b`.

## [Curated Met Location dataset Leg 25: curate Pokémon Legends: Arceus] — 2026-09-21
Added `HISUI_GEN8`, sourced from Bulbapedia's raw wikitext for "List of locations by index
number in Pokémon Legends: Arceus" (action=raw fetch, 2026-09-21), cross-checked against
Serebii's Hisui region map for spelling — Serebii's map labels two areas differently
("Heartwood Heights"/"Aipom Hills" vs. Bulbapedia's index-table Nominative Form "The
Heartwood"/"Aipom Hill"); the index table won since it's the actual in-game Met Location
string, not the overworld map label. Unlike BDSP's table, this page has a single Locative/
Nominative Form pair per index, so no Summary/Overworld ambiguity to resolve. Excluded
Mystery Zone and Faraway place (same non-place fallback categories every prior generation's
list already established) plus the blank index 00000 and unused index 00138. Excluded
indices 30001-60004 entirely — cross-game transfer/event categories (region names for
Pokémon transferred in from other games, Pokémon GO/HOME, movie/event/Link Trade
distributions), not real Hisui locations. Kept Galaxy Hall's individually-indexed floors
(First Floor, Second Floor, Third Floor, Basement) as their own entries rather than folding
them into Galaxy Hall, since each has its own genuine index-table Nominative Form distinct
from Galaxy Hall's own separate index — not the BDSP building-interior situation where only
the parent location's string is ever actually produced. See commit `48cd80a`.

## [Curated Met Location dataset Leg 24: curate Pokémon Brilliant Diamond/Shining Pearl] — 2026-09-21
Added `BDSP_SINNOH`, verified independently against Bulbapedia's raw wikitext for BDSP's own
location-index page (action=raw fetch, 2026-09-21) rather than assuming Leg 13's Diamond/
Pearl list carries over — it doesn't. That page's table splits each index into Locative/
Nominative × Summary/Overworld sub-columns instead of SINNOH_GEN4_BASE's single color-coded
column; cross-checked a same-index counterexample (Canalave Gym, Nominative-Summary "Canalave
Gym" vs Nominative-Overworld "Canalave City") against the known real behavior (Gyms never
produce their own Met Location) to confirm Nominative-Overworld is the field this list is
built from — then used the page's own "Unused" section (strings confirmed "present in the
game data, but not assigned to any location") as independent confirmation for every removal.
Added Grand Underground (new wild-encounter mechanic; all named sub-zones/caves fold into one
flat value) and Ramanas Park (confirmed via internal Japanese room-name comments to be Pal
Park's direct replacement). Renamed Mt. Coronet to Mount Coronet. Removed 25 Diamond/Pearl
building interiors and lake-guardian caverns (Cafe, Canalave Library, Contest Hall, Cycle
Shop, Flower Shop, Footstep House, Foreign Building, Game Corner, Grand Lake, GTS, Jubilife
TV, Mining Museum, Pal Park, Poffin House, Pokémon Day Care, Pokémon Mansion, Pokétch Co.,
Restaurant, Sunyshore Market, Trainers' School, Veilstone Store, Vista Lighthouse, Acuity/
Valor/Verity Cavern) that fold into their parent city/lake's name in this remake. See commit
`50fda41`.

## [Curated Met Location dataset Leg 23: curate Pokémon Sword/Shield] — 2026-09-21
Added `GALAR_GEN8`, verified against `Category:Sword and Shield locations`/`Category:Galar
locations` (and its Wild Area/Isle of Armor/Crown Tundra subcategories) cross-checked
per-article, 2026-09-21. Confirmed with Vanny to include both paid DLC areas (Isle of Armor,
Crown Tundra) in this one shared list, since there's no separate DLC origin-game entry and
excluding them would leave those Met Locations unselectable in OriginModal's restricted
picker — sets the precedent Leg 26 (Scarlet/Violet DLC) should follow. Found no
location-name version split despite this generation's heavy species-level exclusivity:
Galar Mine/Galar Mine No. 2, Split-Decision Ruins, and Tower summit (where Zacian is caught
in Sword and Zamazenta in Shield) are each confirmed shared. Dropped Bulbapedia's "(Galar)"
disambiguation suffix from the three Ruins and the "Galar" prefix from routes, same
normalization Leg 22's Kanto comment already established for its own game. Caught one
research trap worth flagging for later legs: a first-pass summarized read of Tower summit's
own article (grouped with two genuinely no-catch locations) missed that it's the real
Zacian/Zamazenta catch site — only caught by cross-checking each legendary's own "Location"
field directly. Excluded nine Stadium venues, five pure-battle facilities (Battle Tower,
Rose Tower, Energy Plant, Tower of Darkness/Waters), generic buildings (Poké Mart, Pokémon
Center, Battle Café, Herb Shop), four region/sub-region names, and two anime-only locations
(Ancient castle, Karna's Poké Ball factory) a first-pass category pull turned up. See commit
`7d0063f`.

## [Curated Met Location dataset Leg 22: curate Pokémon Let's Go, Pikachu!/Let's Go, Eevee!] — 2026-09-21
Added `KANTO_LETS_GO`, a third distinct Kanto map alongside KANTO_GEN1 and KANTO_GEN3 —
verified against `Category:Let's Go, Pikachu! and Let's Go, Eevee! locations` (same
category-sweep method Legs 20/21 used for Generation VII, which has no Bulbapedia
index-number page), cross-checked per-article, 2026-09-21. Confirmed "Kanto" route/location
prefixes and suffixes in the category listing (Kanto Route 1, Kanto Power Plant, Victory
Road (Kanto), Pokémon Mansion (Kanto), Underground Path (Kanto Routes 5–6)/(7–8)) are
Bulbapedia disambiguation only, not in-game text — normalized to the plain names this file's
other Kanto lists already use. Confirmed the Safari Zone is absent (replaced thematically by
GO Park) and that Team Rocket Hideout is this game's own name for Generation I's Rocket
Hideout. Kept three gift/fossil locations (Cinnabar Lab, Pewter Museum of Science,
Professor Oak's Laboratory) and included GO Park on direct mechanical confirmation (a
genuine Poké-Ball catch event resets the Pokémon's Original Trainer, the same transfer-then-
catch class Sinnoh's Pal Park already represents) since no source directly quotes GO Park's
Met Location string. Excluded six generic buildings with no confirmed catch/gift (Celadon
Condominiums — Let's Go removed its Eevee gift — Celadon Department Store, Celadon Game
Corner, Player's house, Poké Mart, Pokémon Center) plus "Kanto" and "Hometown" as non-places
and three locations lacking corroboration (Pokémon Day Care — no Eggs exist in this game —
Pokémon League Reception Gate, Sea Cottage). See commit `c7552d3`.

## [Curated Met Location dataset Leg 21: curate Pokémon Ultra Sun/Ultra Moon] — 2026-09-21
Added `ALOLA_ULTRA_SUN`/`ALOLA_ULTRA_MOON`, verified against
`Category:Ultra Sun and Ultra Moon locations` cross-checked per-article, same discipline
ALOLA_SM's Leg 20 comment established. Confirmed every USUM-exclusive addition ALOLA_SM's
forward-looking note flagged, plus three more the category sweep turned up on its own
(Battle Agency, Kantonian Gym, Megalo Tower), and excluded Alola Photo Club as a generic
repeated building (two physical instances, same class as Poké Mart). Caught a second
category-tagging gap after Leg 20's Seafolk Village one: Poni Plains is missing from the
USUM locations category entirely despite a full USUM encounter/item/Trainer table on its own
article — kept, not treated as removed. The real finding: the Ultra Warp Ride realm set isn't
fully shared between Ultra Sun and Ultra Moon — Ultra Crater/Ultra Desert are Ultra
Moon-exclusive and Ultra Forest/Ultra Jungle are Ultra Sun-exclusive (matching each pair's own
Ultra Beast's known version-exclusivity), so this leg needed two full literal arrays rather
than one shared list, the milestone's third confirmed within-pair split after Black
City/White Forest (Leg 16) and Team Aqua/Magma Hideout (Leg 8) — and the first one inside a
3rd-version-style title's own additions rather than the base pair. See commit `d6d88be`.

## [Curated Met Location dataset Leg 20: curate Pokémon Sun/Moon] — 2026-09-21
Added `ALOLA_SM`, the first curated family with no Bulbapedia location-index table to verify
against — confirmed via direct opensearch that Generation VII never got one, unlike Gens
I-VI. Built instead from the Alola article's Settlements/Landmarks tables cross-checked
against `Category:Sun and Moon locations` (fetched via the MediaWiki API), with individual
article checks for anything ambiguous. That cross-check caught a real mistake mid-leg:
Seafolk Village looked Ultra Sun/Ultra Moon-exclusive from the settlements table and its
article's intro alone, but its own catch/item data confirmed it's in Sun/Moon too. Resolved
Sun/Moon's own Ultra Beast encounters (Nihilego, Buzzwole, Pheromosa, Xurkitree) to
already-curated locations rather than USUM-only Ultra-realm names, and confirmed the
Sunne/Moone altar and lake pairs are both accessible in both versions post-Champion, not a
Black City/White Forest-style split. Left Leg 21 (Ultra Sun/Ultra Moon) a head start with
the full list of confirmed USUM-exclusive additions and the two SM→USUM location renames.
See commit `f97f090`.

## [Curated Met Location dataset Leg 19: curate Pokémon Omega Ruby/Alpha Sapphire] — 2026-09-21
Added `HOENN_ORAS`, verified against the same raw Generation VI location-index wikitext Leg
18 cited — Leg 18's forward-looking flag of indices 00170-00354 plus 60004 as the ORAS-
exclusive range confirmed here. The wikitext's own header states ORAS's engine recognizes
every X/Y (Kalos) index too, for trade-display on transferred Pokémon — same "recognized for
display, not physically on this game's map" distinction Legs 14/15 established for
Platinum/HGSS, so `HOENN_ORAS` stays just the native Hoenn range rather than layering
`KALOS_GEN6` in. Confirmed no within-pair split (unlike original Ruby/Sapphire): both teams'
hideouts are single, version-non-conditional rows, visitable in both games via the Delta
Episode — but Team Magma's hideout sits at Ruby/Sapphire's original Lilycove-area location,
not Emerald's relocated Jagged Pass one. Curated the DexNav-era Mirage Spot system (13
locations replacing RSE's single static Mirage Island) and confirmed "Soaring in the sky" is
a real catch context (Mega Latios/Latias overworld flight), not a placeholder, via its own
dedicated Bulbapedia article. Flagged `met-locations.test.ts` (now 765 lines, 265 past the
hard cap) to Codebase File-Size Cleanup's future-milestone list rather than splitting it
unprompted mid-leg. See commit `8059a00`.

## [Curated Met Location dataset Leg 18: curate Pokémon X/Y] — 2026-09-21
Added `KALOS_GEN6`, verified against Bulbapedia's raw Generation VI location-index wikitext
(indices 00000-00168, "appeared in X and Y" per the table's header note; 00170-00354 plus
60004 are Omega Ruby/Alpha Sapphire-exclusive, left for Leg 19). Surfaced a pattern new to
this generation: every one of Kalos's 22 numbered routes has a second index for an alternate
name (Route 1/Vaniville Pathway, Route 10/Menhir Trail, etc.) — confirmed via Bulbapedia's
Route article and per-route articles as genuinely distinct display text, not Generation V's
excluded same-text Entralink duplicates, so all 22 were included as their own entries per
this file's standing "a dedicated index row is a real place" rule. Also caught and corrected
a Bulbapedia template typo: index 00103 invokes Route 21's template but the row belongs to
Route 22 (confirmed via Kalos Route 22's own article, "Détourner Way"). See commit `0bec4a9`.

## [Curated Met Location dataset Leg 17: curate Pokémon Black 2/White 2] — 2026-09-21
Added `UNOVA_GEN5_B2W2_BASE` plus the Black 2/White 2 split, verified against the same raw
Generation V location-index wikitext Leg 16 cited — Leg 16's forward-looking flag of indices
00117-00153 plus 30015 as the Black 2/White 2-exclusive range confirmed here. Built as a full
literal list (like Leg 9/14's Emerald/Platinum) rather than a UNOVA_GEN5_BASE splice: Cold
Storage's index renames to Pokémon World Tournament rather than duplicating (confirmed via
the PWT article — a Cold-Storage catch traded into Black 2/White 2 displays "PWT" because they
share codepoint 0x0024, same index-renamed-not-duplicated pattern as Leg 9's Battle
Tower→Battle Frontier), Routes 19-23 extend the numeric sequence, and Pokémon Dream Radar
(index 30015) is included as a transfer-context location. Surfaced a third within-pair split
beyond Black City/White Forest and Black Gate/White Gate: Black Tower and White Treehollow are
each natively version-exclusive despite sharing the same index shading as the rest of the new
range — confirmed via Bulbapedia's Black Tower article rather than assumed from the shading.
See commit `052f775`.

## [Curated Met Location dataset Leg 16: curate Pokémon Black/White] — 2026-09-21
Added `UNOVA_GEN5_BASE` plus the Black/White split, verified against Bulbapedia's raw
Generation V location-index wikitext (indices 00000-00116, the range the table's header note
says "appeared in Black and White"; 00117-00153 plus 30015 are Black 2/White 2-exclusive,
left for Leg 17). Excluded the 00076-00105 "(Entralink)" range as duplicates rather than new
locations — each one is the same in-game display string as its already-listed primary index,
just tagged for "met in another player's world." Surfaced a second within-pair location split
beyond the already-known Black City/White Forest one: Black Gate and White Gate are each
version-exclusive too, confirmed via Bulbapedia's Black Gate article directly rather than
assumed from the index table's shading (which tracks engine recognition for trade display,
not physical presence in-cartridge — same distinction Legs 14/15 established for Platinum/
HGSS). See commit `ad6f0f0`.

## [Curated Met Location dataset Leg 15: curate Pokémon HeartGold/SoulSilver] — 2026-09-21
Added `JOHTO_GEN4`, verified against the same raw Generation IV location-index wikitext prior
legs cite — its gold-colored rows (indices 0x007E-0x00EA, "recognized by HeartGold/SoulSilver
only") are exactly HGSS's own Johto+Kanto map, symmetric with how Leg 14 used the white+grey
rows for Platinum's own Sinnoh map and included nothing from Johto/Kanto. An initial
WebFetch-summarized read fabricated an internally-inconsistent row (an "Olivine Lighthouse"
claim placed in the Sinnoh-only white range, contradicting that same response's own reported
gold-row bounds) — caught by cross-checking the range rather than trusted outright; re-fetched
the page as raw wikitext via direct download and read it verbatim instead. Confirmed several
remake-specific renames/splits: Tin Tower → Bell Tower, Silver Cave split into exterior "Mt.
Silver" and interior "Mt. Silver Cave", and that Lavender Town's former Pokémon/Radio Tower has
no index at all in HGSS (only Goldenrod's Radio Tower is a selectable Met Location here) —
confirmed via Bulbapedia's Radio Tower disambiguation page rather than assumed. Also added
Route 47/48 and the rebuilt Johto Safari Zone's new surrounding areas (all confirmed
HGSS-exclusive), and excluded two new NPC-name indices (Mr. Pokémon, Primo) as gift-context
strings rather than real places, same treatment Leg 13 gave Day-Care Couple. See commit
`9239f7e`.

## [Curated Met Location dataset Leg 14: curate Pokémon Platinum] — 2026-09-21
Added `PLATINUM_SINNOH`, verified Leg 13's forward-looking summary of the grey (Platinum-only)
index range against the same raw wikitext table: Battle Frontier + its four facilities
(replacing the plain Battle Tower, same index-renamed-not-duplicated treatment as Emerald's
Battle Tower→Battle Frontier), Distortion World, Global Terminal (replacing GTS), Villa,
Battleground, Rotom's Room, T.G. Eterna Bldg, and the three Regi ruins. Also caught a
version-conditional spelling difference the wikitext flags that Leg 13 didn't need: Diamond/
Pearl's "Cafe" becomes "Café" in Platinum (same index/place, different per-version display
text). Built as a full literal list, not a splice off `SINNOH_GEN4_BASE`, since the change set
mixes additions, a removal, and a rename rather than one clean insertion. See commit `1193090`.

## [Curated Met Location dataset Leg 13: curate Pokémon Diamond/Pearl] — 2026-09-21
Added `SINNOH_GEN4_BASE`, verified via Bulbapedia's Generation IV location-index table's raw
wikitext (not a rendered-page summary, which gave contradictory answers twice). Surfaced a
genuinely surprising result: Fight Area/Survival Area/Resort Area/Stark Mountain/Battle
Tower/Hall of Origin/the three lake Caverns are already in Diamond/Pearl, not a Platinum-only
"Battle Zone" as commonly assumed — Platinum's real additions (Battle Frontier, Distortion
World, Global Terminal, Villa, Battleground, ROTOM's Room, T.G. Eterna Bldg, the three Regi
Ruins) are left for Leg 14 to layer in. See commit `ab64f5f`.

## [Curated Met Location dataset Leg 12: curate Pokémon XD: Gale of Darkness] — 2026-09-20
Added `ORRE_XD`, kept separate from Leg 11's `ORRE_COLOSSEUM` since the two games' location-
index tables share no entries. Verified against the same shared Bulbapedia GCN location-index
table (XD column) plus individual location articles: confirmed nine locations (Agate Village,
Cipher Lab, Mt. Battle, Orre Colosseum, Outskirt Stand, Phenac City, Pyrite Town, Relic Stone,
Snagem Hideout) are shared with Colosseum's list via their own XD-column row, while The
Under/Under Colosseum/Deep Colosseum/Pyrite Cave/Phenac Stadium/Pyrite Colosseum/Prestige
Precept Center have no XD-column row at all; added XD's own locations (Gateon Port, Pokémon HQ
Lab, Kaminko's House, Citadark Isle, Cipher Key Lair, S.S. Libra, Realgam Tower) plus its three
Poké Spots (Rock/Oasis/Cave) — XD's only wild encounters, unlike Colosseum's zero. Declined to
add "Realgam Colosseum" (XD's own name for the arena Colosseum calls "Tower Colosseum") since
XD's index table gives that room no index distinct from the rest of Realgam Tower, unlike
Colosseum's. See commit `8138e73`.

## [Curated Met Location dataset Leg 11: curate Pokémon Colosseum] — 2026-09-20
Added `ORRE_COLOSSEUM`, the first family with a fundamentally different shape from every
prior one: Colosseum has zero wild encounters, so there's no Routes-first ordering to
apply — the whole list is alphabetical. Verified against Bulbapedia's GCN location-index
table (Colosseum column) plus individual location articles to resolve ambiguous cases:
excluded generic building interiors that aren't distinct Met Locations (Mayor's House,
Pyrite Bldg, Card e Room) but kept standalone plot-critical facilities (Cipher Lab,
Prestige Precept Center, Snagem Hideout); confirmed Under Colosseum and Deep Colosseum are
two distinct facilities, not the same place twice; used "Tower Colosseum" over "Realgam
Colosseum" since the latter is XD's name for the same arena; confirmed S.S. Libra,
Kaminko's House, Citadark Isle, and Cipher Key Lair are XD-exclusive, left for Leg 12. See
commit `4763753`.

## [Curated Met Location dataset Leg 10: curate Pokémon FireRed/LeafGreen] — 2026-09-20
Added `KANTO_GEN3`, confirming mainland Kanto is unchanged from `KANTO_GEN1` (the one
plausible addition, a separate "Pokémon League" location, turned out via web search to be
the same place as Indigo Plateau) and layering in the Sevii Islands — seven island
settlements plus every named sub-area, verified against Bulbapedia's FireRed/LeafGreen
index range and Serebii's per-island Pokéarth pages. Listed the seven Tanoby Chambers
individually rather than under one umbrella name, per Bulbapedia's confirmation the generic
index is never an actual Met Location. Declined to add "Route 4/10 (Pokémon Center)" as
distinct locations — the only source for them gave inconsistent index numbers for an
unrelated entry across two reads, with no independent corroboration. See commit `23fe04b`.

## [Curated Met Location dataset Leg 9: curate Pokémon Emerald] — 2026-09-20
Added `HOENN_EMERALD`, built off Leg 8's `HOENN_GEN3_BASE` rather than either paired
version's array since Emerald's hideout situation isn't a version-exclusive split — both
teams' hideouts exist simultaneously. Verified against Bulbapedia's Generation III
location-index table (index 0x3A onward, where Emerald's recognized range diverges from
Ruby/Sapphire's) plus per-location articles for anything the index table's short names
left ambiguous: index 0x3A is a rename (Battle Tower → Battle Frontier), not an addition;
the Lilycove hideout stays Team Aqua Hideout (matching Sapphire) while Team Magma's
hideout relocates to a new physical location partway through Jagged Pass; ten postgame/
event locations added (Altering Cave, Artisan Cave, Birth Island, Desert Underpass,
Faraway Island, Marine Cave, Mirage Tower, Navel Rock, Terra Cave, Trainer Hill). See
commit `2720a0c`.

## [Curated Met Location dataset Leg 8: curate Pokémon Ruby/Sapphire] — 2026-09-20
Added `HOENN_GEN3_BASE` (Routes 101-134 plus every other named place), verified against
Bulbapedia's Generation III location-index table (the 0x00-0x57 range Ruby/Sapphire
actually recognize, distinct from Emerald/FireRed-LeafGreen's wider range) and Serebii's
Hoenn Pokéarth pages. Excluded non-place indices in that range (opening truck cutscene,
per-player Secret Bases, unused duplicate indices, route-tied underwater dive spots).
Surfaced a second within-pair location-name split beyond Leg 4's assumed Black
City/White Forest exclusivity: index 0x42's hideout is "Team Magma Hideout" in Ruby and
"Team Aqua Hideout" in Sapphire (same physical base, reskinned per version) — layered onto
the shared base as `HOENN_RUBY`/`HOENN_SAPPHIRE`, same splice pattern `CRYSTAL_GEN2` used.
TODO.md's restructure note updated to stop treating BW as the only possible split. See
commit `82f08dd`.

## [Curated Met Location dataset Leg 7: curate Pokémon Crystal] — 2026-09-20
Verified Crystal against Leg 6's `JOHTO_GEN2` base: Bulbapedia's Crystal Version article and
its Mt. Silver/Battle Tower (Generation II) articles confirm Crystal's only named-location
change from Gold/Silver is adding the Battle Tower (Route 40, always accessible
internationally); Leg 6's speculation that Crystal renames Silver Cave to Mt. Silver turned
out to be wrong — that split naming is HGSS-only (Leg 15), corrected in `JOHTO_GEN2`'s
comment. Everything else Crystal changes (Cianwood's expansion, Dragon's Den's shrine, Mt.
Mortar's redesign, Goldenrod's rooftop) is new content within an already-listed location.
See commit `d475756`.

## [Curated Met Location dataset Leg 6: curate Pokémon Gold/Silver] — 2026-09-20
Added `JOHTO_GEN2`, the first multi-region base list (Gold/Silver's Kanto opens up after the
8th Johto badge, so the game's actual Met Location options span both regions, not just
Johto). Verified against Bulbapedia's Generation II location-index table (the real Town
Map/location-header index the games use) rather than assuming KANTO_GEN1 carries over
unchanged — cross-checked by direct search that GS's cartridge-memory-limited Kanto remake
really does drop Cerulean Cave, Pokémon Mansion, Silph Co.'s upper floors, Rocket Hideout,
Safari Zone, S.S. Anne, the Routes 7-8 Underground Path, and Viridian Forest as a standalone
area, and renames Pokémon Tower to Lavender Radio Tower. Also confirmed Battle Tower (present
in the same index table) is a Crystal-exclusive addition, left for Leg 7 to layer in rather
than included here. See commit `9086a4b`.

## [Curated Met Location dataset Leg 5: curate Pokémon Yellow] — 2026-09-20
Verified Yellow against the Leg 3/4 `KANTO_GEN1` base: researched documented Yellow-vs-
Red/Blue differences (a Route 19 house for the Pikachu-Surf minigame, a redesigned Cerulean
Cave interior, a swapped Viridian Forest item/trainer roster) and confirmed each is
sub-location content within a named place already on the list, not a new or removed named
location. Aliased `'Pokémon Yellow'` to `KANTO_GEN1` with no layering needed. See commit
`9a6e445`.

## [Curated Met Location dataset Leg 4: restructure to shared lists, add Fateful Encounter, curate Blue] — 2026-09-20
Vanny flagged three domain corrections before Leg 5 started: paired versions (Red/Blue,
Gold/Silver, Ruby/Sapphire, etc.) share an identical map and shouldn't each get their own
leg; Gift Pokémon/Mystery Gift record "Fateful Encounter" rather than a real location; and
Generation V's Black City/White Forest is the one confirmed within-pair location split.
Restructured `met-locations.ts` from Leg 3's one-array-per-game shape (which had explicitly
argued against aliasing) to a named base-array-per-family shape, with `metLocationsForGame`
now appending "Fateful Encounter" to every curated game. Closed out Blue as the trivial
output of that restructure (aliased to Red's `KANTO_GEN1` array). Also collapsed TODO.md's
remaining Legs 5–43 from one-game-per-leg down to Legs 5–28, one per map family. See commit
`277097f`.

## [Curated Met Location dataset Leg 3: curate Pokémon Red] — 2026-09-20
First real curated list: Routes 1-25 plus every other named Kanto city/town/landmark
(Cerulean Cave, the two Underground Paths, Rocket Hideout, etc.), ordered numeric routes
first then alphabetical, matching Serebii's own Kanto map listing rather than in-game
traversal order (lower risk of a route-connection transcription error). Verified against
Bulbapedia (Kanto, Cerulean Cave, Underground Path, Rocket Hideout, Route 11, Route 22) and
Serebii's Kanto map page. `met-locations.test.ts`'s "curated game" case now points at
Pokémon Red instead of the Leg 2 placeholder. See commit `6cb68df`.

## [Curated Met Location dataset Leg 2: build the mechanism] — 2026-09-20
`shared/data/met-locations.ts` (empty `MET_LOCATIONS` record + `metLocationsForGame`,
mirroring `poke-balls.ts`) and `OriginModal.tsx`'s Met Location field now switch to a
restricted `<select>` once `metLocationsForGame` returns a list, same stale-value handling
as `ballOptions`. Deviated from the Leg 1 handoff's test plan: it assumed "OriginModal's
existing tests" to extend, but no React component tests exist anywhere in this repo yet
(vitest is `environment: 'node'`, `include` is `*.test.ts` only, no `@testing-library/react`
dependency) — standing up that infra for one ternary was real scope beyond this leg, so only
`met-locations.test.ts` was added and the input/select switch was verified manually instead
(per CLAUDE.md's default for UI changes). See commit `e842382`.

## [Curated Met Location dataset Leg 1: decide the dataset's shape] — 2026-09-20
Doc-only scoping leg, no code. Resolved the two open questions `deeper-per-game-validity.md`
had left unanswered by checking with Vanny directly (not data-derivable, unlike that leg's
own questions): restricted `<select>` once a game is curated rather than free-text
suggestions, and narrow/opt-in per game with zero games curated at ship rather than a broad
shallow pass — same reactive posture as `BALL_POOLS`. Also worked out why `met_location`
can't take `caught_ball`'s exact DB-CHECK shape (no flat cross-game superset to check
against) and stays a plain unconstrained `TEXT` column, with the restriction enforced only
in `OriginModal`'s UI. Full writeup: `docs/investigations/curated-met-location.md`.
