# TODO

## [App icon] — unscheduled
No custom icon exists yet (`build/icon.png` per electron-builder convention, matching
GW2-Squaded) — packaged builds currently ship with Electron's default icon. Not blocking
local/internal packaging, so left off the leg sequence. Confirmed 2026-09-02: stays
unscheduled and outside any milestone grouping — Vanny will submit the artwork when it's
ready rather than this being scoped into a leg.
Blocked: needs production-quality PokéBall-or-similar artwork before a real public
release.
Last touched: 2026-09-02. Re-check count: 0.

## [Virtualize the Dex Table body] — unscheduled
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

## [Split schema.ts] — unscheduled
Crossed the ~300-line soft cap at Leg 5 (341 lines, still well under the 500 hard cap) —
each closed-set CHECK column (language, caught_ball) has picked up its own "ALTER-time
CHECK can't be widened later" rebuild block over time, and that pattern will likely repeat
if another CHECK-constrained column needs the same treatment. Candidate split: pull the
CHECK-widen rebuild blocks (sid-4294, caught_ball) into their own module alongside the
retrofit ALTERs, mirroring the sqlite-storage.ts split idea below.
Confirmed 2026-09-03: deliberately kept out of the User-Customizable Dex Layout milestone
— orthogonal code health, not blocking. Stays standalone; pick up opportunistically if a
leg in that milestone happens to touch this file anyway.
Last touched: 2026-09-03. Re-check count: 0.

## [Split sqlite-storage.ts] — unscheduled
Already over the ~300-line soft cap before Leg 3 (415 lines) and now at 457 after Leg 3's
storage-location FK/met-location additions — still under the 500-line hard cap, so not
urgent, but growing. Candidate split: pull the exportCollection/importCollection backup
logic (and its natural-key matching helpers) into its own module, mirroring how
schema.ts's retrofit blocks already got split out into schema-ball.test.ts/
schema-language.test.ts on the test side.
Confirmed 2026-09-03: deliberately kept out of the User-Customizable Dex Layout milestone
— orthogonal code health, not blocking. Stays standalone; pick up opportunistically if a
leg in that milestone happens to touch this file anyway.
Last touched: 2026-09-03. Re-check count: 0.

## Current Milestone: User-Customizable Dex Layout (Phase 1: View Modes)

Started 2026-09-03. Legs 1-6 below are the real-usage bug/UI fixes surfaced right after
the Nav/Visual/Dex-Table-Redesign milestone shipped (see that milestone's post-mortem) —
folded in here as foundation work rather than their own milestone, since several touch
the same Dex Table/Completion Stats surface the view-mode work will build on.

Scoped 2026-09-03: the original ask ("let Vanny pick a persisted display layout") turned
out to bundle two very different pieces once Vanny described the target — three view
modes (List/Box/Hybrid, mockups from Pokémon HOME) plus arbitrary box arrangement with
duplicate owned copies and unowned-but-placed placeholder slots. The second piece needs
`CollectionEntry`'s `UNIQUE(form_id, gender, shiny)` constraint dropped (owned becomes a
real per-individual count, not a checkbox) and a real box/slot data model tied to Storage
Locations — too large and too load-bearing to design inline. Split in two per Vanny's
call: this milestone (Legs 1-8) ships List and Hybrid read-only on today's data;
[Box Arrangement / Real Inventory Data Model] (future milestone, below) covers
editing/duplicates/slot-position once that's separately scoped.

Re-scoped further 2026-09-03, same day: Box view (originally Leg 8) got pulled out of
this milestone entirely and folded into the Box Arrangement future-milestone item
instead of staying a Phase 1 leg. Vanny pointed out a real box can hold several regular
and shiny copies of the same species mixed together (e.g. a box of assorted shiny and
non-shiny Woopers) — a "Box view" that's supposed to look like a real box is a claim
about real per-individual contents, not a rendering choice, and today's schema can't
represent more than one regular + one shiny per species at all. Building it now would
mean shipping something that calls itself a box but can never show what a real box
looks like. Hybrid stayed in Phase 1 since Vanny only ever described it as "the list,
just sprites" — it never claimed to reflect real box contents, so the same checklist
ceiling doesn't misrepresent it the way it would Box view.

## [Non-HOME locations show all 1025 species as depositable] — Leg 5
Ranch/Box/individual-save-file storage locations currently list every species as
depositable in their Dex Table view — there's no per-location-type/per-game
species-eligibility filter today (confirmed: filterDexSections.ts has no
location-type-aware species gating). Needs a depositable-species-per-location-type
dataset (e.g. Ranch capped at Gen 4) mirroring the per-game validity approach from Legs
4/6 of the prior milestone, then wiring it into the location-tab-scoped view.
Last touched: 2026-09-03. Re-check count: 0.

## [Existing dex entries stuck in Unassigned instead of vanny's HOME dex] — Leg 6
Vanny's pre-existing collection entries are showing under the Unassigned location tab
instead of the 'vanny' HOME storage location. autoAssignLocation.ts (Leg 9 of the prior
milestone) only assigns a location on a fresh check-in while a location tab is selected —
entries checked in before storage locations existed (Leg 3) or while a different tab was
active never got backfilled. Needs investigation into whether a one-time backfill
(default un-located owned entries to the trainer's HOME location) is the right fix, or
whether this is an import-path bug instead.
Last touched: 2026-09-03. Re-check count: 0.

## [List view mode] — Leg 7
Reframe the existing Dex Table as one of three selectable view modes (a mode
switcher alongside/replacing DexFilterBar) rather than the only layout, and persist
the chosen mode across reloads — this is what actually delivers "define how your dex
displays as a persisted choice," the layout-customization milestone's original ask.
Otherwise the current table's behavior stays as-is; this leg is mostly plumbing the
mode switch + persistence around it.
All three view modes share one underlying data path (buildDexSections ->
filterDexSections -> sortDexSections) rather than each mode having its own filtering —
confirmed with Vanny 2026-09-03: a scope like "generation 1-6 only" must apply
identically across List/Box/Hybrid, species outside the active filter don't appear in
any of them, not just List.
Last touched: 2026-09-03. Re-check count: 0.

## [Hybrid view mode] — Leg 8
HOME-derived read-only grid: sprite-only tiles flowing continuously with the window
width — no box-style page boundaries, confirmed 2026-09-03 over the paginated
alternative real HOME's own List View screen actually uses. Tile population: each
DexRowData row contributes up to two tiles (regular-slot + shiny-slot, mirroring List
view's existing two-column pairing) — a real sprite when that slot is owned, a
greyed-out placeholder when it's within the active filter scope but unowned, nothing at
all when the row itself is filtered out. Detail panel pinned to the bottom of the page,
confirmed 2026-09-03 to reuse the Origin modal's existing fields (OT/TID/SID/nickname/
origin game/ball/met location/storage location, plus the home-boxable/shiny-locked/
invalid-combo badges) rather than HOME's own Nature/stats block, which PremierDex has no
data for.
Last touched: 2026-09-03. Re-check count: 0.

## Future Milestones (unscheduled)

Large items Vanny explicitly flagged as out of scope for a past milestone — logged here
so they aren't lost, not queued into a leg yet. Candidates for whatever gets scoped after
the current milestone.

## [Box Arrangement / Real Inventory Data Model] — future milestone
Split out of the User-Customizable Dex Layout milestone during its 2026-09-03
leg-planning pass (see that milestone's intro note) — the harder half of Vanny's
original ask, deliberately deferred past Phase 1's read-only view modes. Vanny's calls so
far: (1) duplicate owned copies of the same species/form should be real tracked
individuals, not a visual trick — drop CollectionEntry's `UNIQUE(form_id, gender,
shiny)` constraint (a SQLite table-rebuild migration, same class of hazard as the
CHECK-widen rebuilds already handled in schema.ts) and turn "owned" into a per-individual
count/list rather than a boolean, the way the Collection view already models entries; (2)
arranged boxes are the same thing as real Storage Locations, not a separate planning
concept — a box becomes a numbered sub-unit of a Storage Location (e.g. HOME Box 3) with
real per-entry slot positions, and unowned species can still be placed into a slot as a
greyed-out placeholder.
Box view mode itself (a HOME-style 30-cell grid, 5 rows x 6 columns, sprite-only,
right-click action menu) moved here from Phase 1 the same day, 2026-09-03: Vanny pointed
out a real box can hold several regular and shiny copies of one species mixed together
(e.g. a box of assorted shiny/non-shiny Woopers) — Box view's entire premise is showing
real per-individual box contents, which today's single-regular/single-shiny-per-species
schema can't represent at all. Building it before this milestone's data model exists
would ship something that calls itself a box but can never look like one. (Hybrid view
stayed in Phase 1 — Vanny only ever described it as "the list, just sprites," so the same
ceiling doesn't misrepresent it.)
Needs its own scoping pass before picked up: this touches completionStats.ts,
filterDexSections.ts, invalidCombo.ts, autoAssignLocation.ts, and
exportCollection/importCollection's natural-key matching (currently keyed on
form_id/gender/shiny, which collides once duplicates are real) — plus the editing UX
itself (drag-and-drop vs. a menu-based add/remove/swap flow, per Vanny's own "without
overcomplicating UI" concern) and Box view's own build (grid, pagination, right-click
menu) on top of the new data. Depends on Phase 1's Hybrid grid component existing first
as a starting point, since Box view's tile rendering will likely share code with it.
Last touched: 2026-09-03. Re-check count: 0.

## [Dex completeness tier migration] — future milestone
Migrating a collection from a regular living dex/shiny living dex (species-only) up to a
complete living dex/shiny living dex (form + gender included), and figuring out whether
downgrading is even possible. Upgrading needs a way to flag previously-unspecified-gender
entries with the correct gender the user actually possesses. Vanny called this out as
large and needing real scoping work before it's picked up — not for this milestone.
Last touched: 2026-09-02. Re-check count: 0.

## [Ribbons/Alpha/size/capture-date tracking] — future milestone
Ribbon tracking, with an Alpha marker bundled into the same pass since both are per-entry
badges. Size classification and capture date noted as possible additions at the same
time, capture date flagged by Vanny as very low priority. All blocked on Ribbons being
scoped first.
Last touched: 2026-09-02. Re-check count: 0.

## [Deeper per-game validity: form/gender legality + curated Met Location list] — future milestone
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
queued behind the User-Customizable Dex Layout milestone despite the urgency.
Last touched: 2026-09-03. Re-check count: 0.
