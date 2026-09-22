# TODO

## Current Milestone: Species detail popup + evolution family tree

Raised by Vanny 2026-09-20, shipped Legs 1-4 2026-09-22, reopened same day: Vanny reviewed
the tree in the running app and came back with layout feedback, a form-category bug, and a
new feature request. Scoped into four more legs below.

### [Species detail popup + evolution family tree] — Leg 7
New feature raised by Vanny 2026-09-22, data half: alternate forms that are form *changes*
rather than evolutions (Deoxys' Normal/Attack/Defense/Speed via Meteorite, trigger varies by
game; Rotom's appliance forms; Giratina's Origin Forme via Griseous Orb; Shaymin's Sky Forme
via Gracidea; Kyurem's Black/White fusion via DNA Splicers; Necrozma's Dusk Mane/Dawn
Wings/Ultra fusion; Calyrex's Ice/Shadow Rider via Reins of Unity; etc.) should be viewable
side by side in the popup, noted as not being evolutions. No existing data models this at
all — PokeAPI's evolution-chain endpoint (what `fetch-evolution-chains.ts` already pulls)
doesn't include forme-switch items since it doesn't consider these evolutions. Comparable in
size to Leg 1's evolution-edges.json pipeline: needs its own pass to identify every species
with a non-evolutionary forme-switch group, the switch method/item, and any per-game
variation (Deoxys' trigger differs by game version). Data acquisition only — no UI in this
leg, see Leg 8.
Last touched: 2026-09-22. Re-check count: 0.

### [Species detail popup + evolution family tree] — Leg 8
UI half of Leg 7: wires the forme-group data into the species detail popup as a side-by-side
view of a species' alternate formes, distinct from the evolution family tree, labeled with
the switch method and noted as not an evolution. Needs its own scoping pass once Leg 7's
data shape is known — e.g. whether this lives in the existing popup as a second section next
to "View Evolution Family," or a separate tab/toggle.
Last touched: 2026-09-22. Re-check count: 0.

### [Species detail popup + evolution family tree] — Leg 9
Follow-up from Leg 5's horizontal rework, raised by Vanny 2026-09-22 after checking it live:
Eevee's 8-way branch (the widest case in the whole dataset) still needs work on two fronts —
the long method text for Leafeon ("Knows a Grass Move + Level Up at Special Location...") and
Glaceon's evolutions collides/wraps awkwardly in the narrow `.evolution-tree-arrow` column,
and the tall single-column stack of 8 siblings forces the popup into scroll (`.evolution-tree`'s
`max-height: 70vh`/`overflow: auto` from Leg 5) rather than fitting on screen. Needs its own
design pass rather than another size/spacing tweak — e.g. a narrower/differently-wrapped
arrow label, or reconsidering whether every branching family must be a single vertical column.
Last touched: 2026-09-22. Re-check count: 0.

## Unscheduled

Standalone items not part of the current milestone — pick up opportunistically or when
explicitly prioritized. Small/low-priority items only; anything milestone-sized lives in
Future Milestones below.

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

### [Encounter tables + location/game search UI] — future milestone
Raised by Vanny 2026-09-21, after the Curated Met Location dataset milestone shipped: once
full encounter tables exist for every curated Met Location across all games, the app needs a
new UI system for searching Pokémon and viewing where they're encountered — linked to the
Dex/storage feature. Needs to support browsing encounters by location or by game, which
implies somewhat interactable maps per game. Confirmed 2026-09-21: OK to split into as many
milestones as makes sense once this is picked up (e.g. data build vs. UI as separate
milestones) — written down now just to capture the idea, not to lock in a single scope.
Data sourcing unresolved: no known dataset/API confirmed to have full per-game encounter
data yet. PokeAPI (already used for ChoiceBuds) is the only known candidate — needs
investigating whether its coverage is complete enough, or whether this needs hand-curation
like the Met Location lists were. Map convention: gens 1-7 and (mostly) Sword/Shield use a
map that distinctly breaks up each route/city and highlights the selected area — usable as
design inspiration. Scarlet/Violet largely breaks that convention, and Legends Arceus/Z-A
break it entirely (open world), so map treatment likely needs per-era variants rather than
one universal system. Pokémon GO gets no map — real-world location data, not a fixed map.
Blocked: needs the encounter-table data itself built first (not yet started/scoped) before
this UI work can be scoped for real.
Last touched: 2026-09-21. Re-check count: 0.

### [Catch rate + capture probability calculator] — future milestone
Raised by Vanny 2026-09-21, split out from the Encounter tables + location/game search UI
idea above rather than bundled into it. Eventually clicking a Pokémon (in the planned
species detail popup, see the Species detail popup + evolution family tree entry below)
should show its base catch rate; later, a capture probability calculator on top of that,
since capture probability depends on base catch rate, current HP, status condition, and
Poké Ball type. Vanny suggested checking for an existing open-source calculator/formula to
adapt rather than building the formula from scratch. Deliberately not scoped — written down
to capture the idea only.
Last touched: 2026-09-21. Re-check count: 0.

### [Full UI/UX pass on the Dex interface] — future milestone
Raised by Vanny 2026-09-04: the interface has grown overly complex across several milestones
— many input fields, some overlapping in function (e.g. the tier picker's shortcut checkboxes
vs. the underlying `includeCosmeticVariants`/`splitByGender` checkboxes it drives, per-entry
vs. bulk vs. per-location Duplicate/Move actions). Wants a full pass over the UI to find a
more user-friendly, less redundant layout. Deliberately not scoped or folded into the current
milestone — milestone-sized investigation on its own, not a leg. Needs its own scoping pass
(which panels/modals, what "simpler" means concretely) before a leg sequence can be planned.
Confirmed 2026-09-20 (Vanny, after using it): List view's right-click context menu for
Ribbons & Marks/Edit Origin (Ribbons & Marks: List/Collection View Entry Points milestone,
`DexTable`/`DexRow`) works but is unintuitive — right-clicking specifically the Origin
button area to reach it isn't discoverable. Revisit the List view entry point mechanic as
part of this pass rather than fixing in isolation.
Last touched: 2026-09-20. Re-check count: 0.
