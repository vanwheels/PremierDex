# TODO

No milestone currently in progress — Box View Quick-Wins Sweep shipped 2026-09-19 (see
MILESTONES.md). Next milestone not yet picked.

## Unscheduled

Standalone items not part of the current milestone — pick up opportunistically or when
explicitly prioritized.

### [Ribbons & Marks: List/Collection view entry points] — unscheduled
Surfaced scoping Leg 4 of the Ribbons/Alpha/Size/Capture-Date Tracking milestone: the new
"Ribbons & Marks" modal only opens from Box view and Hybrid view (their detail panel had
room for a second button next to "Edit Origin"). List view (`DexTable`/`DexRow`) and the old
Collection view (`CollectionView`/`CollectionRow`) don't get an entry point yet — their
per-row "Origin" button is already crammed into a dense cell across 1000+ rows (x2 for
regular/shiny columns), so fitting a second control there is its own layout call, not a
mechanical copy of the Box/Hybrid wiring. Confirmed 2026-09-19 (AskUserQuestion) as
out-of-scope for Leg 4.
Last touched: 2026-09-19. Re-check count: 0.

### [Ribbons & Marks missing from JSON backup export/import] — unscheduled
Same gap shape as [Box names/empty boxes/placeholders missing from JSON backup export/import]
below, for the tables Leg 4 of the Ribbons/Alpha/Size/Capture-Date Tracking milestone added:
`collection-backup.ts`'s `exportCollection`/`importCollection` don't touch
`collection_entry_ribbons`/`collection_entry_marks` at all, so a restore silently drops every
recorded ribbon/mark. Not a quick fold-in — `CollectionExport` needs a version bump (v2→v3,
same "reject the old version outright" precedent as v1→v2), and entries are matched on
import by natural key (form/gender/shiny + duplicate ordinal, not raw id — see
`collection-backup.ts`'s `entryKey`), so ribbon/mark rows would need to travel with their
owning entry through that same remap rather than a naive id-keyed dump.
Last touched: 2026-09-19. Re-check count: 0.

### [Evolution-chain reachability for species availability] — unscheduled
Surfaced by Leg 2 of the (now-closed) Deeper Per-Game Validity milestone: re-running the
false-positive query after curating Platinum/Emerald/USUM's postgame supplemental data
(`src/shared/data/supplemental-availability.ts`) left a residual where most of the
remaining invalid species — Platinum's Ariados/Politoed, Emerald's Ledian/Flaaffy/
Ampharos/Sunflora/Ambipom, USUM's Ivysaur — are evolutions of a species the new
supplemental data *does* cover (e.g. Ariados from a Pal-Park-available Spinarak). Leg 1 of
that milestone found zero real cases for this exact idea (pre-evolution reachability) and
recommended against building it — but that check was run before any supplemental-unlock
data existed; now that Platinum/Emerald/USUM have real postgame data, the same idea (walk
a species' evolution ancestors, treat it as available if any ancestor is) would clear
several concretely-named real false positives. Needs `species-evolution.json` widened from
its current `isFinalEvolutionStage`-only shape to full parent/child edges (a
`fetch-evolution-chains.ts` change), then `checkEntryValidity` walking ancestors. Not
folded into Leg 2 — real scope, not a quick addition.
Last touched: 2026-09-19. Re-check count: 0.

### [Regional dex number in Box detail panel] — unscheduled
Raised alongside the Box View Polish milestone but out of scope for it: Species currently
only carries `regionalGroup` (a label), no actual per-game regional dex *number* — that
field doesn't exist in the data model at all yet. Needs its own scoping (which
game/region's numbering, one column vs. per-game) before it can be added to the info bar
alongside National Dex #.
Last touched: 2026-09-03. Re-check count: 0.

### [Bulk move: Box view support] — unscheduled
Follow-up to [Bulk move/duplicate entries between storage locations] (List view, see
COMPLETED.md), confirmed by Vanny 2026-09-04 while scoping that item: List view's
multi-select checkboxes act on one representative entry per form/gender/shiny slot (Box
Arrangement Leg 4's design), so a slot that already has hidden duplicate individuals can't
select or move the non-representative copies. Narrowed 2026-09-04: the Duplicate half of
this concern is resolved by [Storage Location "Duplicate" button] (see COMPLETED.md) —
that clones a whole location's roster directly at the DB level, bypassing List view's
one-representative-per-slot limit entirely. Only the Move half remains open. Not scoped:
likely extends Leg 4 of Box View Polish's existing ctrl/shift multi-select (currently
drag-move within one location's boxes) to support moving a selection across Storage
Locations too.
Last touched: 2026-09-04. Re-check count: 0.

### [Box names/empty boxes/placeholders missing from JSON backup export/import] — unscheduled
Surfaced while implementing [Add / rename boxes] (Leg 2 of Box View Polish, see
COMPLETED.md): the `boxes` table (id/storage_location_id/box_number/name) isn't part of
CollectionExport, so a backup round-trip silently drops every box's custom name and any
box with zero entries in it — same class of gap Leg 13 of Collection & Origin Tracking
fixed for trainerProfiles/storageLocations. Import itself is safe (collection-backup.ts's
importCollection re-runs schema.ts's backfillBoxes after restoring entries, so Box view
stays functional — no crash, no missing Box 1), it just can't restore a name or an
intentionally-empty box the export never captured. Widened at Leg 5 of Box View Polish
(see COMPLETED.md): the new `box_placeholders` table (storage_location_id/box_number/
box_slot/species_id) has the exact same gap — a backup round-trip silently drops every
"planned" placeholder too, same reasoning, same missing table. Needs a CollectionExport
version bump (v2 -> v3, same "reject the old version outright" precedent as v1->v2) plus
`boxes` and `boxPlaceholders` arrays in the export/import shape — worth fixing together
since both are the same underlying "a Box View Polish milestone table never got added to
CollectionExport" gap.
Last touched: 2026-09-04. Re-check count: 0.

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

### [Split schema.ts] — unscheduled
Crossed the ~300-line soft cap at Leg 5 (341 lines), 421 after Leg 3 of Box Arrangement's
box_number/box_slot retrofit, 466 after Leg 2 of Box View Polish added the `boxes` table +
backfillBoxes, 492 after that same milestone's Leg 5 added `box_placeholders`, 550 after
Leg 2 of the Dex completeness tier migration widened `box_placeholders` and added its own
rebuild block, now 567 after that same milestone's Leg 5 added `is_final_evolution_stage`
and its retrofit — 67 lines past the 500 hard cap. Each closed-set CHECK column (language,
caught_ball) has picked up its own "ALTER-time CHECK can't be widened later" rebuild block
over time, and that pattern will likely repeat if another CHECK-constrained column needs
the same treatment.
Deliberately NOT split as part of Leg 2 despite that leg adding the table/retrofit block
this item already flagged as the trigger to act on: investigating the split surfaced a real
ordering hazard first — several of the CHECK-widen rebuilds (the two sid 4294->999999
ones, at minimum) must run *before* later ADD COLUMN retrofits (language, caught_ball,
storage_location_id, box_number/box_slot) because their rebuilt table's column list doesn't
include those not-yet-added columns; naively extracting "the rebuild blocks" into one
function called once would silently drop that data on any install still carrying the old
sid CHECK. A correct split needs to either preserve that interleaving across two call sites
or thread the dependency explicitly — a design decision worth its own leg, not a fold-in
alongside unrelated feature work. Candidate split (unchanged from before): pull the
CHECK-widen rebuild blocks into their own module alongside the retrofit ALTERs, mirroring
how sqlite-storage.ts's export/import logic got split into collection-backup.ts (Leg 3 of
Box Arrangement — see COMPLETED.md) — just with the ordering hazard above designed around
explicitly this time.
Last touched: 2026-09-04. Re-check count: 1.

### [Split sqlite-storage.ts] — unscheduled
Surfaced while implementing Leg 3 of the Dex completeness tier migration: adding
`bulkSetEntryGender` (the "Resolve Gender Ambiguities" flow's write) pushed this file to
498 lines — 1 line under the 500 hard cap. Same file that already had its export/import
logic split out into collection-backup.ts (Leg 3 of Box Arrangement, see COMPLETED.md);
that precedent is the template if/when this needs to happen again. Not split now —
Scope says an adjacent improvement goes on TODO rather than folding into the leg that
surfaced it. Candidate split: the CollectionEntry-specific prepared statements/methods
(setOwned/setEntryOrigin/setEntryStorageLocation/box-position/bulk-* — roughly a third of
the file) into their own module, mirroring collection-backup.ts's pattern.
Last touched: 2026-09-04. Re-check count: 0.

### [Remove "Unassigned" as the default check-in bucket] — unscheduled
Raised by Vanny 2026-09-04: the Unassigned storage location is bad UX as a default landing
spot — better to let the user add a mon directly into whichever storage/box they want at
check-in time than default to Unassigned and require a manual move afterward. Leg 9 (see
COMPLETED.md; autoAssignLocation.ts) already covers the case where a specific location tab
is selected when checking a mon owned. The remaining gap is checking owned from a context
with no location tab selected (e.g. the main Dex Table) — that still lands in Unassigned.
Overlaps with [Bulk move/duplicate entries between storage locations] (would reduce the
need for it) and the false-positive Invalid Combo badges the Deeper Per-Game Validity &
Curated Met Locations milestone (above) is now scoping (many are on Unassigned entries).
Needs scoping: prompt for a location at check-in time? Keep Unassigned only as a fallback
when no locations exist yet?
Last touched: 2026-09-04. Re-check count: 0.

### [Undo support for Box moves] — unscheduled
Raised by Vanny 2026-09-04: Ctrl+Z to undo, plus a visible undo-move button, for Box view
drag/move operations (including Leg 4's multi-drag). No undo history exists today. Real
feature, not a quick fix — needs its own scoping (how deep a history, whether it covers
placeholder edits/deletes too or just moves).
Last touched: 2026-09-04. Re-check count: 0.

### [Apply Template: combined regular+shiny option] — unscheduled
Surfaced 2026-09-04 investigating a "Living Form Dex totals look wrong" report (see
COMPLETED.md's Leg 6 writeup — the totals themselves checked out fine). Vanny's actual ask:
Apply Template only takes one color (Regular or Shiny) per run today, requiring two separate
applies to stock a location for both. Not a small fix — doubles the placement math (each
required unit needs a regular *and* shiny ghost, competing for the same slots) — needs its
own scoping rather than folding into Leg 6.
Last touched: 2026-09-04. Re-check count: 0.

## Future Milestones (unscheduled)

Large items Vanny explicitly flagged as out of scope for a past milestone — logged here
so they aren't lost, not queued into a leg yet.

### [Curated Met Location dataset] — future milestone
Split out of the "Deeper Per-Game Validity & Curated Met Locations" milestone by Leg 1's
investigation (`docs/investigations/deeper-per-game-validity.md`): 0 of 5,172 owned entries
have `metLocation` set today, so there's no evidence this free-text field is actually
wanted filled in — a 41-game, route-level curated dataset is a large undertaking (its own
milestone, not a leg) not worth building speculatively ahead of any usage signal.
Blocked: needs Vanny to confirm she actually intends to start using Met Location before
this gets scoped further. If confirmed, start small (major cities/routes, or free-text with
lightweight autocomplete) rather than committing to exhaustive per-route coverage.
Last touched: 2026-09-19. Re-check count: 0.

### [Per-game form/gender/ball-combo legality] — future milestone
Split out of the "Deeper Per-Game Validity & Curated Met Locations" milestone by Leg 1's
investigation: zero of the collection's current false positives trace to the ball check
(no PLA entry has `caughtBall` set at all), and no per-game gender-anachronism or
held-item-forme case (see `docs/investigations/held-item-form-change-gap.md`'s Zacian/
Zamazenta/Ogerpon/Silvally catalogue) has been shown to actually misfire today.
Blocked: needs a real false positive or wrong-game forme to actually surface before this is
worth scoping — not built speculatively ahead of demonstrated need.
Last touched: 2026-09-19. Re-check count: 0.

### [Full UI/UX pass on the Dex interface] — future milestone
Raised by Vanny 2026-09-04: the interface has grown overly complex across several milestones
— many input fields, some overlapping in function (e.g. the tier picker's shortcut checkboxes
vs. the underlying `includeCosmeticVariants`/`splitByGender` checkboxes it drives, per-entry
vs. bulk vs. per-location Duplicate/Move actions). Wants a full pass over the UI to find a
more user-friendly, less redundant layout. Deliberately not scoped or folded into the current
milestone — milestone-sized investigation on its own, not a leg. Needs its own scoping pass
(which panels/modals, what "simpler" means concretely) before a leg sequence can be planned.
Last touched: 2026-09-04. Re-check count: 0.
</content>
