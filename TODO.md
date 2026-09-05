# TODO

## Current Milestone: Dex Completeness Tier Migration & Box Templates

Picked up 2026-09-04 from Future Milestones. Both halves (tier migration and Box
Templates) share a "what counts as complete for tier X" definition, so scoping is bundled
into Leg 1 before either gets built.

### [Fill In from owned collection] — Leg 7
Companion to Leg 6 (now landed, see COMPLETED.md), per Vanny's 2026-09-04 clarification:
once a location's boxes hold a full template layout of ghost placeholders, a "Fill In"
action walks them and, for each placeholder with a matching owned individual somewhere in
the collection, moves that entry into the placeholder's slot (ghost -> real entry). Scoped
per Vanny's answers: prefer an owned individual that isn't already boxed anywhere (no
existing home) over one that would have to be pulled out of another box; if only
already-boxed copies exist, leave the placeholder as a ghost rather than relocating one.
When multiple unboxed copies match one required unit (e.g. 3 shiny female Eevees), move the
first and leave the rest where they are — same "one representative individual, others
untouched" precedent already used elsewhere (List view's bulk actions, box arrangement).
Needs its own implementation design (new IPC bulk-write, matching/ordering rule for "first"
when several unboxed candidates tie) before a leg estimate.
Last touched: 2026-09-04. Re-check count: 0.

### [Wire excludePreEvolutions into tier computation] — Leg 8
Follow-up to Leg 5 (evolution-chain data acquisition, see COMPLETED.md): `Species.
isFinalEvolutionStage` exists and is seeded/backfilled correctly, but nothing reads it yet.
`requiredUnits()` (boxTemplates.ts) has an `excludePreEvolutions` branch that's always a
no-op today ("never true for BUILDABLE_TIERS"); `computeCompletionStats` needs the same
filter. Once both honor it, `BUILDABLE_TIERS` (completionStats.ts) can add `finalFormForm`/
`finalForm`, surfacing them in both the Completion Stats and Box Templates tier pickers.
Not scoped further — needs a look at whether `requiredUnits`/`computeCompletionStats` take
`Species[]` today or would need a new param to look up `isFinalEvolutionStage` by
`form.speciesId`.
Last touched: 2026-09-04. Re-check count: 0.

## Unscheduled

Standalone items not part of the current milestone — pick up opportunistically or when
explicitly prioritized.

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

### [Jump directly to a Box] — unscheduled
Raised by Vanny 2026-09-04: no way to select a specific box directly — currently requires
paging through boxes in order via the box tray/scroller. Wants a direct picker (box
number entry, list, or grid) to jump straight there. Not scoped, but looks like a small,
self-contained addition to DexBoxTray/DexBoxPane — candidate quick win.
Last touched: 2026-09-04. Re-check count: 0.

### [Remove "Unassigned" as the default check-in bucket] — unscheduled
Raised by Vanny 2026-09-04: the Unassigned storage location is bad UX as a default landing
spot — better to let the user add a mon directly into whichever storage/box they want at
check-in time than default to Unassigned and require a manual move afterward. Leg 9 (see
COMPLETED.md; autoAssignLocation.ts) already covers the case where a specific location tab
is selected when checking a mon owned. The remaining gap is checking owned from a context
with no location tab selected (e.g. the main Dex Table) — that still lands in Unassigned.
Overlaps with [Bulk move/duplicate entries between storage locations] (would reduce the
need for it) and the false-positive Invalid Combo badges under [Deeper per-game validity:
form/gender legality + curated Met Location list] (many are on Unassigned entries). Needs
scoping: prompt for a location at check-in time? Keep Unassigned only as a fallback when no
locations exist yet?
Last touched: 2026-09-04. Re-check count: 0.

### [Multi-select highlight verification] — unscheduled
Raised by Vanny 2026-09-04: multi-selected mons in Box view should all read as highlighted.
Leg 4 of Box View Polish (see COMPLETED.md) already added ctrl/shift multi-select with a
per-slot `isSelected` prop driving the `dex-hybrid-tile-selected` CSS class
(DexBoxPane.tsx, DexBoxGridCell.tsx) — needs a look at why that isn't reading as
sufficiently highlighted in practice: could be the style is too subtle across several
selected tiles at once, or an interaction bug clearing/limiting selection.
Last touched: 2026-09-04. Re-check count: 0.

### [Undo support for Box moves] — unscheduled
Raised by Vanny 2026-09-04: Ctrl+Z to undo, plus a visible undo-move button, for Box view
drag/move operations (including Leg 4's multi-drag). No undo history exists today. Real
feature, not a quick fix — needs its own scoping (how deep a history, whether it covers
placeholder edits/deletes too or just moves).
Last touched: 2026-09-04. Re-check count: 0.

### [Placeholder sprites sized to match Box sprites] — unscheduled
Raised by Vanny 2026-09-04: planned-placeholder sprites (added in Leg 5 of Box View
Polish, see COMPLETED.md) render at a different size than the regular Box view sprites.
Likely a small CSS/sizing fix in DexBoxGridCell.tsx/SpriteThumbnail.tsx — candidate quick
win.
Last touched: 2026-09-04. Re-check count: 0.

### [Apply Template: combined regular+shiny option] — unscheduled
Surfaced 2026-09-04 investigating a "Living Form Dex totals look wrong" report (see
COMPLETED.md's Leg 6 writeup — the totals themselves checked out fine). Vanny's actual ask:
Apply Template only takes one color (Regular or Shiny) per run today, requiring two separate
applies to stock a location for both. Not a small fix — doubles the placement math (each
required unit needs a regular *and* shiny ghost, competing for the same slots) — needs its
own scoping rather than folding into Leg 6.
Last touched: 2026-09-04. Re-check count: 0.

### [Box view scroller lag] — unscheduled
Raised by Vanny 2026-09-04: noticeable lag/delay scrolling through boxes in Box view.
Distinct from [Virtualize the Dex Table body] (that's the main Dex Table; this is the Box
view/box tray). Some cost is expected given the sprite grid rendering, but worth
investigating load/render strategy (e.g. lazy-loading offscreen boxes, sprite caching)
before accepting it as a hard limit.
Last touched: 2026-09-04. Re-check count: 0.

## Future Milestones (unscheduled)

Large items Vanny explicitly flagged as out of scope for a past milestone — logged here
so they aren't lost, not queued into a leg yet.

### [Ribbons/Alpha/size/capture-date tracking] — future milestone
Ribbon tracking, with an Alpha marker bundled into the same pass since both are per-entry
badges. Size classification and capture date noted as possible additions at the same
time, capture date flagged by Vanny as very low priority. All blocked on Ribbons being
scoped first.
Last touched: 2026-09-02. Re-check count: 0.

### [Full UI/UX pass on the Dex interface] — future milestone
Raised by Vanny 2026-09-04: the interface has grown overly complex across several milestones
— many input fields, some overlapping in function (e.g. the tier picker's shortcut checkboxes
vs. the underlying `includeCosmeticVariants`/`splitByGender` checkboxes it drives, per-entry
vs. bulk vs. per-location Duplicate/Move actions). Wants a full pass over the UI to find a
more user-friendly, less redundant layout. Deliberately not scoped or folded into the current
milestone — milestone-sized investigation on its own, not a leg. Needs its own scoping pass
(which panels/modals, what "simpler" means concretely) before a leg sequence can be planned.
Last touched: 2026-09-04. Re-check count: 0.

### [Deeper per-game validity: form/gender legality + curated Met Location list] — future milestone
Split out of a past milestone during its 2026-09-02 leg-planning pass: the initial
validity dataset only covers species-availability-per-game + Legends Arceus's ball pool,
and Met Location ships as free text — both deliberately narrowed so that milestone's legs
stayed small. This item covers the fuller versions: per-game form/gender/ball-combo
legality (beyond just ball pool), and a curated real-locations-per-game dataset
(routes/cities/areas) to replace the free-text Met Location field. Needs its own scoping
before being picked up, same as Ribbons/Dex-tier above.
Confirmed 2026-09-03 via real usage: this is no longer just a "nice to have deeper"
enhancement — a large chunk of Vanny's Unassigned entries are showing false-positive
Invalid Combo badges. Root cause (read in invalidCombo.ts): the species-availability
dataset only encodes each game's base regional dex, so it doesn't account for (a)
postgame unlocks that expand the catchable pool past the base dex, or (b) a species being
reachable by evolving a catchable pre-evolution even when the evolved form itself isn't in
the wild encounter table (e.g. Ivysaur logged as Ultra Moon origin — not directly
catchable there, but reachable by evolving a caught Bulbasaur). Both are obtainability
gaps in the current data model, not edge cases. Vanny confirmed 2026-09-03 this stays
queued behind the then-current milestone despite the urgency; that milestone (Box View
Polish & Multi-Box Editing) has since shipped 2026-09-04, so nothing is queued ahead of
this any more — worth a fresh call on whether it's picked up next given the urgency.
Last touched: 2026-09-04. Re-check count: 1.
</content>
