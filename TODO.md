# TODO

Ribbons & Marks: List/Collection View Entry Points shipped 2026-09-20 (see MILESTONES.md).

## Current Milestone: Curated Met Location dataset

### [Curated Met Location dataset] — Leg 2
Leg 1 (`docs/investigations/curated-met-location.md`) decided the shape: a restricted
`<select>` once a game is curated (not suggestions on free text), narrow and opt-in per
game with zero games curated at ship — same reactive posture as `BALL_POOLS`. This leg
builds the mechanism only, no curated games yet:
- `shared/data/met-locations.ts` — empty `Record<gameName, readonly string[]>` +
  `metLocationsForGame` helper, mirroring `poke-balls.ts`'s `BALL_POOLS`/`ballPoolForGame`.
- `OriginModal.tsx` — Met Location field switches between today's free-text `<input>` and a
  restricted `<select>` based on whether `metLocationsForGame(selectedGame)` returns a list.
- Tests for both. No schema.ts change — `met_location` stays an unconstrained `TEXT` column
  (seeing why a per-game CHECK doesn't fit here is in the Leg 1 doc).
Last touched: 2026-09-20. Re-check count: 0.

## Unscheduled

Standalone items not part of the current milestone — pick up opportunistically or when
explicitly prioritized. Small/low-priority items only; anything milestone-sized lives in
Future Milestones below.

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

### [Codebase File-Size Cleanup] — future milestone
Three files past the line-count caps, candidates for the same split pattern
(collection-backup.ts's extraction from sqlite-storage.ts, Leg 3 of Box Arrangement, is the
template):
- **Split schema.ts**: 567 lines, 67 past the 500 hard cap — grew via the box/placeholder
  tables, the Dex completeness tier migration, and `is_final_evolution_stage`'s retrofit.
  Each closed-set CHECK column (language, caught_ball, sid) has picked up its own
  "ALTER-time CHECK can't be widened later" rebuild block over time, and that pattern will
  likely repeat. Investigating the split (during Leg 2 of the tier migration) surfaced a
  real ordering hazard: several CHECK-widen rebuilds (the two sid 4294→999999 ones, at
  minimum) must run *before* later ADD COLUMN retrofits (language, caught_ball,
  storage_location_id, box_number/box_slot) because their rebuilt table's column list
  doesn't include those not-yet-added columns. Naively extracting "the rebuild blocks"
  into one function called once would silently drop that data on any install still
  carrying the old sid CHECK — a correct split needs to preserve that interleaving or
  thread the dependency explicitly. Candidate split: pull the CHECK-widen rebuild blocks
  into their own module alongside the retrofit ALTERs, with the ordering hazard designed
  around explicitly.
- **Split sqlite-storage.ts**: 498 lines, 1 under the hard cap as of Leg 3 of the Dex
  completeness tier migration (`bulkSetEntryGender`). Candidate split: the
  CollectionEntry-specific prepared statements/methods (setOwned/setEntryOrigin/
  setEntryStorageLocation/box-position/bulk-* — roughly a third of the file) into their own
  module, mirroring collection-backup.ts's pattern. Now 743 lines as of Leg 3 of the Box
  View Move & Undo Operations milestone (`restoreEntryBoxPositions`), well past the cap.
- **Split useCollectionData.ts**: 501 lines, 1 past the 500 hard cap as of Leg 3 of the Box
  View Move & Undo Operations milestone (`restoreEntryBoxPositions`'s renderer-side undo
  plumbing pushed it over). Candidate split: the box-position/undo-stack slice
  (setEntryBoxPosition/swapEntryBoxPositions/fillBoxSlots/moveEntriesToLocation/undo and
  their apply/snapshot helpers — roughly the same "one feature area" carve-out as the other
  two files above) into its own hook, composed back in by useCollectionData.
Last touched: 2026-09-20. Re-check count: 0.

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

### [Species detail popup + evolution family tree] — future milestone
Raised by Vanny 2026-09-20: a popup for a selected species, with a button that opens its
evolution family tree — each species in its own circular "bubble," arrows along the
evolution edges (reusing `evolvesFromSpeciesId`, see the Evolution-Chain Reachability
milestone), each arrow labeled with how that evolution happens. Vanny plans other features
for this same popup beyond the family tree, not yet specified. Deliberately not scoped —
Vanny will provide a mockup when this milestone comes up.
Last touched: 2026-09-20. Re-check count: 0.

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
