# TODO

## Current Milestone: Encounter display rework

Scoped 2026-09-24 from Vanny's feedback on the Where to Find / Locations sub-tab: common
species (Rattata: 1,722 encounter rows across 59 areas) make both views unusable. PokeAPI
stores one row per slot and per time-of-day, so the fix is grouping, not removing data. A
prototype against the real `encounters.json` cut Rattata to 490 rows by merging same-level
slots (summing chance) and merging Morning/Day/Night when their breakdowns match. Slot numbers
aren't in the data and stay out of scope (RNG-only). Sequenced in 3 legs; Vanny will answer the
open design questions when the milestone opens: is the inline `Lv. 20 (30%), 21 (30%)` format
clear enough (vs. tags), and should Where to Find follow the Gen I-IX toggle (currently no).

### [Encounter display rework] — Leg 1
Shared grouping function replacing `encounterSectionsForForm`'s per-row output: group by
location/game/method/non-time conditions, merge same-level slots by summing chance, merge
identical time-of-day breakdowns. Species page rows show the inline level breakdown; covers
both views' data needs.
Last touched: 2026-09-24. Re-check count: 0.

### [Encounter display rework] — Leg 2
Species page Where to Find: each game section collapsed by default with a one-line summary
(e.g. "Gold — 41 locations").
Last touched: 2026-09-24. Re-check count: 0.

### [Encounter display rework] — Leg 3
Dex Locations sub-tab as three panes (Games -> that game's Locations -> species at the
location), time toggle shown only when the location has time-conditioned encounters (same rule
for other varying conditions: swarm, radar, dual-slot, season, weather). Also decides whether
regional/alternate forms fold to one entry per species like the Pokémon list.
Last touched: 2026-09-24. Re-check count: 0.

## Unscheduled

Standalone items not part of the current milestone — pick up opportunistically or when
explicitly prioritized. Small/low-priority items only; anything milestone-sized lives in
Future Milestones below.

### [Dex tab sprite-grid view mode] — unscheduled
Hybrid-view-style sprite grid as an alternative to the Dex tab's Pokémon list (Leg 4 shipped
the list only). Raised in the milestone scoping discussion and explicitly held out of Leg 4;
no sketch exists yet, so it needs one before it can be scoped.
Last touched: 2026-09-24. Re-check count: 0.

### [Situational Poké Balls in the catch-probability calculator] — unscheduled
Leg 4 of the Species database milestone scoped the catch calculator (`catchProbability.ts`)
to the five balls with a fixed catch-rate bonus under the Gen III+ shake-check formula
(Poké/Great/Ultra/Safari/Master). The rest of `poke-balls.ts`'s "Caught In" list — Net,
Nest, Dive, Repeat, Timer, Quick, Dusk, Fast, Level, Lure, Heavy, Love, Friend, Moon, Sport
— all have conditional bonuses (turn count, location, target level/weight/species, time of
day) the calculator doesn't collect inputs for yet. Pick up only if Vanny wants those balls
supported; would need one extra input per conditional ball, not a formula change.
Last touched: 2026-09-23. Re-check count: 0.

### [Generation-vii sprite URLs use the wrong extension] — unscheduled
Surfaced by Leg 11's live-CDN verification for back-sprite support: `generationSpriteUrl` in
`sprites.ts` builds every generation's URL with a `.png` extension, but the CDN's
`generation-vii/ultra-sun-ultra-moon` folder (both its flat front sprites and its `back/`
subfolder) serves `.gif` instead — confirmed live, e.g.
`.../generation-vii/ultra-sun-ultra-moon/25.png` 404s while `.../25.gif` returns 200. This is
pre-existing (predates Leg 11, affects the front sprite too, not something back-sprite support
introduced) and was never caught because nothing in the app currently exercises generation 7
specifically in a way that surfaced the broken image. Needs a per-generation extension map (or
a gen-7-specific override) alongside `GENERATION_GAME`/`ROMAN_NUMERALS`.
Last touched: 2026-09-22. Re-check count: 0.

### [DexBoxGrid.tsx / DexBoxPane.tsx over the file-size cap] — unscheduled
Surfaced by Leg 8 of the Species detail popup + evolution family tree milestone: threading
`formeSwitchGroups` through both files' props (same mechanical pattern `evolutionEdges` already
used) pushed `DexBoxGrid.tsx` to exactly 500 lines (the hard cap) and `DexBoxPane.tsx` to 506 —
`DexBoxPane.tsx` was already over the 500-line hard cap (502) before this leg. Small, purely
additive prop-threading isn't the moment to stop and split either file, so left for a dedicated
Codebase File-Size Cleanup-style pass — same treatment past legs of that milestone gave
fetch-pokemon-forms.ts/met-locations.test.ts (see COMPLETED.md).
Last touched: 2026-09-22. Re-check count: 0.

### [Species detail popup entry point on Hybrid view] — unscheduled
Leg 3 of the Species detail popup + evolution family tree milestone wired the info-button
entry point into DexTable/DexRow (List view) and DexBoxDetailPanel (Box view) per Vanny's
explicit scope (Dex Table/Box View only) — DexHybridGrid/DexHybridDetailPanel (Hybrid view)
don't have it yet, even though they share the same `dex-hybrid-detail-*` CSS classes as
DexBoxDetailPanel. Small addition if/when wanted — same pattern, just a third wiring site.
Last touched: 2026-09-22. Re-check count: 0.

### [App icon] — unscheduled
No custom icon exists yet (`build/icon.png` per electron-builder convention, matching
GW2-Squaded) — packaged builds currently ship with Electron's default icon. Not blocking
local/internal packaging, so left off the leg sequence. Confirmed 2026-09-02: stays
unscheduled and outside any milestone grouping — Vanny will submit the artwork when it's
ready rather than this being scoped into a leg.
Blocked: needs production-quality PokéBall-or-similar artwork before a real public
release.
Last touched: 2026-09-02. Re-check count: 0.

### [Virtualize the Dex Table body] — unscheduled
Leg 2 (2026-09-03) fixed the worst of the resize/tab-switch lag (memoized data pipeline
was already fine; the real costs were a full unmount/remount on tab switch and
table-layout: auto forcing per-row remeasurement on resize) — see COMPLETED.md. A smaller
residual delay remains on both, inherent to keeping ~1000+ real DOM rows around: resize
still reflows row heights when column-width changes affect text wrapping, and un-hiding
the table on tab switch still costs a browser layout+paint pass over every row even
though React no longer rebuilds them. Fully eliminating either needs windowing (only
~20-40 rows in the DOM at once), which was set aside during Leg 2 as too large a lift for
that leg — would need reworking how expand/collapse and cosmetic rows work under a
virtualizer, plus sticky-header handling.
Confirmed 2026-09-03: Vanny finds the post-Leg-2 delay acceptable for now — pick this up
only if it becomes a real problem, not proactively.
Last touched: 2026-09-03. Re-check count: 0.

## Future Milestones (unscheduled)

Items too large for a single leg — need their own scoping pass before a leg sequence can
be planned. Some are grouped because they share a root cause or precedent fix; others are
standalone but milestone-sized on their own.

### [Location/game browse UI with maps] — future milestone
Split out 2026-09-23 from the Encounter data milestone above: a new top-level view (sibling
`AppView` to `species`/`dex`, per `App.tsx`) for browsing encounters by location or by game,
with somewhat interactable maps per game. No map assets exist anywhere in the repo yet.
Gens 1-7 and (mostly) Sword/Shield share a map convention (breaks up each route/city,
highlights the selected area) usable as design inspiration; Scarlet/Violet largely breaks
that convention and Legends Arceus/Z-A break it entirely (open world), so map treatment
needs per-era variants, not one universal system. Pokémon GO gets no map (real-world
location data). Confirmed 2026-09-23: ship placeholder/schematic maps (simple region/route
layout, not polished cartographic art) rather than blocking on sourced/commissioned art —
same deferred-polish posture as the App icon item below. Needs its own
scoping pass (data is available once the current milestone's `encounters.json` ships, so
this can be scoped independently of that data-build work) before a leg sequence can be
planned.
Last touched: 2026-09-23. Re-check count: 0.

### [Backup/Export Completeness] — future milestone
Two CollectionExport gaps with the same shape and the same fix pattern (version bump v2→v3,
same "reject the old version outright" precedent as v1→v2) — worth scoping and shipping
together rather than as separate milestones:
- **Ribbons & Marks missing from JSON backup export/import**: Surfaced by Leg 4 of the
  Ribbons/Alpha/Size/Capture-Date Tracking milestone. `collection-backup.ts`'s
  `exportCollection`/`importCollection` don't touch `collection_entry_ribbons`/
  `collection_entry_marks` at all, so a restore silently drops every recorded ribbon/mark.
  Entries are matched on import by natural key (form/gender/shiny + duplicate ordinal, not
  raw id — see `entryKey`), so ribbon/mark rows would need to travel with their owning
  entry through that same remap rather than a naive id-keyed dump.
- **Box names/empty boxes/placeholders missing from JSON backup export/import**: Surfaced
  while implementing Leg 2 of Box View Polish (Add/rename boxes). The `boxes` table
  (id/storage_location_id/box_number/name) isn't part of CollectionExport, so a backup
  round-trip silently drops every box's custom name and any box with zero entries in it —
  same class of gap Leg 13 of Collection & Origin Tracking fixed for
  trainerProfiles/storageLocations. Import itself is safe (`importCollection` re-runs
  `backfillBoxes` after restoring entries, so Box view stays functional), it just can't
  restore a name or an intentionally-empty box. Widened at Leg 5 of Box View Polish: the
  `box_placeholders` table (storage_location_id/box_number/box_slot/species_id) has the
  exact same gap.
Last touched: 2026-09-19. Re-check count: 0.

### [Remove "Unassigned" as the default check-in bucket] — future milestone
Raised by Vanny 2026-09-04: the Unassigned storage location is bad UX as a default landing
spot — better to let the user add a mon directly into whichever storage/box they want at
check-in time than default to Unassigned and require a manual move afterward. Leg 9 (see
COMPLETED.md; autoAssignLocation.ts) already covers the case where a specific location tab
is selected when checking a mon owned. The remaining gap is checking owned from a context
with no location tab selected (e.g. the main Dex Table) — that still lands in Unassigned.
Overlaps with Box View Move & Undo Operations (above — reduces the need for manual moves)
and the false-positive Invalid Combo badges the Deeper Per-Game Validity & Curated Met
Locations milestone scoped (many are on Unassigned entries). Needs scoping: prompt for a
location at check-in time? Keep Unassigned only as a fallback when no locations exist yet?
Last touched: 2026-09-04. Re-check count: 0.

### [Per-game form/gender/ball-combo legality] — future milestone
Split out of the "Deeper Per-Game Validity & Curated Met Locations" milestone by Leg 1's
investigation: zero of the collection's current false positives trace to the ball check
(no PLA entry has `caughtBall` set at all), and no per-game gender-anachronism or
held-item-forme case (see `docs/investigations/held-item-form-change-gap.md`'s Zacian/
Zamazenta/Ogerpon/Silvally catalogue) has been shown to actually misfire today.
Blocked: needs a real false positive or wrong-game forme to actually surface before this is
worth scoping — not built speculatively ahead of demonstrated need.
Last touched: 2026-09-19. Re-check count: 0.

### [Sprite system overhaul] — future milestone
Raised in Vanny's 2026-09-24 feedback pass on the Species page; scoped as its own milestone,
needs a design/discussion pass before legs can be planned. Current sprites come from PokeAPI's
per-generation folders only, which leaves gaps: Gen 1 has no shiny art (don't show a shiny slot
there), Gen 2 sprites aren't transparent PNGs, Gen 7 shows nothing (see the Generation-vii
extension item under Unscheduled — subsumed by this), and Gen 8/9 fall back to boxed BDSP/SV
art with no shiny variants. Wanted: official 3D models for Gen 7+ (animated as a bonus), and
per-version sprite sets where a generation's games differ — D/P/Pt vs HG/SS, R/S vs FR/LG vs
Emerald — shown side by side like the reference Serebii-style Images section. Open questions:
sprite source per generation (PokeAPI's `other/home` renders / Showdown animated sets / other),
whether to bundle or fetch, and how the per-version toggle fits the Gen I-IX strip.
Last touched: 2026-09-24. Re-check count: 0.

### [Species/Dex reference data layer] — future milestone
Split out 2026-09-24 during Full UI/UX pass scoping: base stats, movesets, egg groups, Base
Egg Steps, and per-form types don't exist anywhere in the current data model
(`species-details.ts` has only capture rate/happiness/growth rate/gender rate/abilities/EV
yield; `pokemon.ts` has no type field at all). Also needed: per-generation type/ability
variance (e.g. the Fairy-type split at Gen VI) and per-version-within-generation variance
(e.g. Diamond/Pearl/Platinum vs. HeartGold/SoulSilver) for the Species page's Gen I-IX strip
to eventually drive more than sprite art. Types and base stats are cheap additions (same
`/pokemon/{id}` PokeAPI endpoint the fetch script already hits for abilities/EV yield);
movesets and egg groups need new endpoints/fetch-script work, closer in shape to the
Encounter data milestone. Blocks a follow-up leg of Full UI/UX pass Leg 4 (Dex tab
Types/BST columns, Moves sub-tab, move/egg-group search) and the Species page's full
generation-toggle behavior beyond sprites. Needs its own scoping pass before a leg sequence
can be planned.
Last touched: 2026-09-24. Re-check count: 0.

