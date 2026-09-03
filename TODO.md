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
Last touched: 2026-09-03. Re-check count: 0.

## [Split sqlite-storage.ts] — unscheduled
Already over the ~300-line soft cap before Leg 3 (415 lines) and now at 457 after Leg 3's
storage-location FK/met-location additions — still under the 500-line hard cap, so not
urgent, but growing. Candidate split: pull the exportCollection/importCollection backup
logic (and its natural-key matching helpers) into its own module, mirroring how
schema.ts's retrofit blocks already got split out into schema-ball.test.ts/
schema-language.test.ts on the test side.
Last touched: 2026-09-03. Re-check count: 0.

## Current Milestone: Nav restructuring → Visual pass → Storage Location sync → Dex Table redesign

Scoped into 10 legs during a 2026-09-02 leg-planning pass. Decisions locked that day:
`storageLocationId` is a nullable FK (no forced migration — entries can sit unassigned
indefinitely); Met Location ships as free text this milestone (a curated per-game
location list is deferred — see the Future Milestones item below); the per-game validity
dataset ships narrow — species-availability-per-game + Legends Arceus's ball pool only,
not full form/gender/ball-combo legality (also deferred below); the Invalid Flag is
derived at read time, not a stored column, same treatment as `completionStats.ts`; nav
restructuring expands the existing top-tab pattern rather than moving to a sidebar; the
visual pass (Leg 2) is a full re-skin — theme/color, layout density, and component
styling all in scope, not a targeted fix.

## [Per-Storage-Location Completion Stats] — Leg 7
Extend completion-stats logic to scope owned/shiny stats to a given storageLocationId.
Logic only — UI consumption waits for Leg 8's tabbed table. Depends on Leg 3.
Last touched: 2026-09-02. Re-check count: 0.

## [Dex Table Redesign: Per-Location Tabs] — Leg 8
Tabbed-per-Storage-Location structure for the Living Dex table (using Storage Location's
existing `name` field as the tab label — no schema change needed there), plus an
Unassigned tab for null storageLocationId entries, wired to Leg 7's stats per tab.
Depends on Legs 3 and 7.
Last touched: 2026-09-02. Re-check count: 0.

## [Dex Table Redesign: Storage Location Assignment] — Leg 9
Move storage-location assignment from Leg 3's interim picker into the redesigned table
itself. Depends on Leg 8.
Last touched: 2026-09-02. Re-check count: 0.

## [Dex Table Redesign: Richer Row Fields] — Leg 10
Richer per-row info beyond today's sprite/#/name/gen/nickname/owned/shiny — exact field
list still TBD, to be decided once Met Location, Invalid Flag, ball, and storage location
all actually exist in the UI. Depends on Legs 3-9 landing first.
Last touched: 2026-09-02. Re-check count: 0.

## Future Milestones (post-current)

Large items Vanny explicitly flagged as out of scope for the current milestone — logged
here so they aren't lost, not queued into a leg yet.

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
Split out of the current milestone during its 2026-09-02 leg-planning pass: the initial
validity dataset only covers species-availability-per-game + Legends Arceus's ball pool,
and Met Location ships as free text — both deliberately narrowed so that milestone's legs
stayed small. This item covers the fuller versions: per-game form/gender/ball-combo
legality (beyond just ball pool), and a curated real-locations-per-game dataset
(routes/cities/areas) to replace the free-text Met Location field. Needs its own scoping
before being picked up, same as Ribbons/Dex-tier above.
Last touched: 2026-09-02. Re-check count: 0.
