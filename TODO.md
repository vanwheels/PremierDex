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

## Current Milestone: User-Customizable Dex Layout

Started 2026-09-03. Legs 1-6 below are the real-usage bug/UI fixes surfaced right after
the Nav/Visual/Dex-Table-Redesign milestone shipped (see that milestone's post-mortem) —
folded in here as foundation work rather than their own milestone, since several touch
the same Dex Table/Completion Stats surface the layout-customization feature will build
on. The layout-customization feature itself (the milestone's actual goal — letting Vanny
define how their Living Dex displays as a persisted choice, not just a transient filter)
still needs a scoping/design pass with Vanny before its legs get numbered; it'll be added
as Leg 7+ once that spec exists.

## [Ball column shows text instead of the ball icon] — Leg 1
The Dex Table's Non-Shiny/Shiny Ball columns (Leg 10 of the prior milestone) render
caughtBallCell() as plain text via dex-inline-origin-field instead of reusing the
existing BallIcon component (built in the Collection milestone's Leg 28, already used in
CollectionRow). Fix: swap DexRow.tsx's ball cells to render <BallIcon ball={...} /> the
same way CollectionRow does.
Last touched: 2026-09-03. Re-check count: 0.

## [Table resize/tab-switch performance] — Leg 2
Resizing the app window makes the Dex/Completion tables noticeably laggy while columns
reflow, and switching into the Living Dex tab is laggy on its own even without resizing.
Likely a full re-render/re-computation of all ~1025 dex rows on every resize tick and
every tab mount rather than memoized layout — needs profiling to confirm before picking a
fix (debounce resize, memoize buildDexSections/filterDexSections, or virtualize the table
body).
Last touched: 2026-09-03. Re-check count: 0.

## [Dex Table column widths don't use expanded horizontal space] — Leg 3
Widening the window only grows the gap between the Name and Gen columns — the Game/Ball
columns stay fixed-narrow and truncate all but the shortest game names (e.g. "GO"). Needs
the table's column-width distribution reworked (colgroup widths or table-layout: fixed
with real per-column basis) so extra width goes to the columns that actually need it.
Last touched: 2026-09-03. Re-check count: 0.

## [Completion tables should share a row on wide windows] — Leg 4
The three Completion Stats tables currently stack vertically with a lot of unused
horizontal space beside them on wide windows. Fit two (or, if the app's minimum window
width matches Vanny's other apps like GW2-Squaded, all three) side by side instead.
Depends on Leg 3's column-width rework landing first since both are about the Living Dex
tab's use of horizontal space.
Last touched: 2026-09-03. Re-check count: 0.

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

## Future Milestones (unscheduled)

Large items Vanny explicitly flagged as out of scope for a past milestone — logged here
so they aren't lost, not queued into a leg yet. Candidates for whatever gets scoped after
the current milestone.

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
