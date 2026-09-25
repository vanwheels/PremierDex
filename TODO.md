# TODO

## Unscheduled

Standalone items not part of the current milestone — pick up opportunistically or when
explicitly prioritized. Small/low-priority items only; anything milestone-sized lives in
Future Milestones below.

### [Evolution methods per version group] — Leg 1
`fetch-evolution-chains.ts` joins distinct `evolution_details` methods with " or " and drops each
entry's `version_group` tag, so Magnezone/Leafeon/Glaceon/Probopass show every game's location as
alternatives with no game attached. PokeAPI tags all 676 entries; keep the tag through to
`evolution-edges.json` and decide the display (per-game filter vs. labeled list) before scoping the UI.
See `docs/investigations/per-version-variance.md`.
Last touched: 2026-09-25. Re-check count: 0.

### [Species page Where to Find method tables] — unscheduled
The Dex Locations pane now splits encounters into Wild/Surfing/Fishing/Headbutt/Rock Smash/
Special tables (`encounterMethods.ts`, added in a Leg 3 follow-up at Vanny's request). The
Species page Where to Find still shows one mixed table per game; apply the same split there
only if Vanny wants it — `EncounterRow.category` is already populated.
Last touched: 2026-09-24. Re-check count: 0.

### [Ability description popup in Dex list] — unscheduled
Clicking an ability name in the Dex Pokémon list would open a small popup with its description
(the whole row now opens the species page, so this needs a stopPropagation on the ability).
Needs ability description data — check whether `species-details.json` carries it before scoping.
Last touched: 2026-09-24. Re-check count: 0.

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

