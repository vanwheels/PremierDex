# Post-mortem: Nav Restructuring, Visual Pass & Dex Table Redesign

**Shipped:** 2026-09-03. Legs 1-10, plus an unnumbered Diamond/Pearl theming addendum.
Commits `f8581ee`..`15c1bd8`.

## What shipped

- **Nav restructuring** (Leg 1): Trainer Profiles and Storage Locations became their own
  top-level tabs alongside Living Dex/Collection; Backup/Update controls moved to
  persistent chrome; Completion Stats folded into the Living Dex tab.
- **Full visual re-skin** (Leg 2): token-based CSS system (tokens/base/buttons/layout/
  tables/modals.css), dark-first Palkia/Dialga palette, three revisions to get comfortable
  luminance and real panel depth right. Extended after the leg (unnumbered addendum) with
  an explicit in-app Diamond/Pearl toggle plus a real Dialga-referenced Diamond palette,
  replacing the OS-only `prefers-color-scheme` switch Leg 2 had left as a known gap.
- **Storage Location sync**, spanning Legs 3, 5, 7-9: a nullable `storageLocationId` FK
  and free-text `metLocation` on `CollectionEntry` (Leg 3); Legends Arceus's six-ball pool
  wired into the Caught In picker plus a CHECK-constraint migration hazard caught and
  fixed along the way (Leg 5); per-location completion-stats filtering (Leg 7); a
  `DexLocationTabs` pill bar scoping the whole Living Dex view to one location at a time
  (Leg 8); the per-row location picker moved into its own Non-Shiny/Shiny Loc. table
  columns with auto-assign-on-check-in (Leg 9).
- **Per-game validity data + Invalid Combo flag** (Legs 4, 6): a species-availability
  dataset keyed by PokeAPI regional-dex name (not by game, so dex-sharing games share one
  list), and a derived (never stored) "Invalid combo" badge checking an owned entry's
  species/ball against its origin game.
- **Dex Table redesign's richer row fields** (Leg 10, this leg): Origin Game and Caught
  Ball surfaced as their own read-only Non-Shiny/Shiny column pairs — the field list was
  deliberately left TBD at leg-planning time until Met Location/Invalid Flag/ball/storage
  location all existed in the UI to inform the choice.

## Verification performed

Per leg: `npm run typecheck` and `npm test` (vitest, 244 tests by the end). Leg 5's ball
migration hazard was caught by reasoning through SQLite's ALTER-time CHECK-widening
limitation before it could bite an existing install, not by observed failure. Visual pass
revisions were checked against real Dialga/Palkia sprite and box-art references after the
first pass (memory-only colors) read as generically wrong.

## What went well

- **Deferring the Leg 10 field-list decision to leg-planning time paid off as designed.**
  Scoping it "TBD until the dependencies exist" (rather than guessing up front) meant the
  choice — Origin Game + Caught Ball as columns, OT/TID/SID/Language staying modal-only —
  was made with the full picture in view instead of being re-litigated mid-leg.
- **Established column patterns kept getting reused.** Leg 9's Non-Shiny/Shiny Loc. column
  pair became the direct template for Leg 10's Game/Ball columns; Leg 6's disabled-badge
  treatment and Leg 7's filter-before-stats logic composed cleanly into Leg 8's tabs
  without new design discussion.
- **A real correctness bug (the CHECK-widen migration hazard) was caught by reasoning
  about SQLite's constraints, not by hitting it** — same live-check discipline as the
  prior milestone, applied to a schema-migration risk instead of an external data source.

## Friction points

- **The Diamond/Pearl toggle addendum wasn't its own numbered leg**, unlike everything
  else in this milestone — it landed as a same-day follow-up to Leg 2 with two further
  revisions. It shipped fine, but it's the one piece of this milestone that doesn't map
  cleanly onto the leg sequence when read back from `MILESTONES.md`/this doc alone.

## Scope creep

None flagged during execution. The one deliberate scope narrowing (Leg 10's field list
staying TBD until Legs 3-9 landed) was a leg-planning decision, not creep discovered
mid-work.

## What changes for the next milestone

- When a leg's scope depends on an explicit end-of-milestone decision (like Leg 10's field
  list), consider surfacing the question to Vanny at leg-planning time rather than at leg
  start — the answer here didn't need anything Leg 10 itself produced, only Legs 3-9's.
- Give same-day addenda (like the Diamond/Pearl toggle) their own leg number when they're
  substantial enough to need multiple revisions, so the milestone's leg count stays a
  reliable map of what shipped.
