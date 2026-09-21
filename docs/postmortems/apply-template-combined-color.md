# Post-mortem: Apply Template — Combined Regular+Shiny

**Shipped:** 2026-09-20. Legs 1-3 + one follow-up fix. Commits `c382c86`..`75f57f2`.

## What shipped

- **Leg 1:** `DexColor` gained a `'both'` value. `requiredUnits` walks `forms`
  species-by-species (`groupFormsBySpecies`) and appends each species' regular unit(s) then
  its shiny unit(s) before the next species — paired-per-species ordering, confirmed with
  Vanny over a regular-block-then-shiny-block pass — so downstream placement needed no
  interleaving logic of its own. `pendingRequiredUnits`/`placeUnitsIntoSlots`/
  `countAvailableSlots`/`extraBoxesNeeded` needed no code changes at all, already unit-
  count/list agnostic. Commit `c382c86`.
- **Leg 2:** Extracted `DexBoxGrid.tsx`'s `handleApplyTemplate` (box-creation math +
  sequential `onAddBox` awaits + the batched `onSetBoxPlaceholders` call) into a new
  `applyTemplate.ts` module, mirroring `collection-backup.ts`'s extraction from
  `sqlite-storage.ts`. Pure refactor, brought `DexBoxGrid.tsx` from 511 to 488 lines (back
  under the 500 hard cap) ahead of Leg 3's UI growth. Commit `8f80688`.
- **Leg 3:** Added the third radio option (Regular / Shiny / Both) to
  `DexApplyTemplateModal.tsx` and a combined-case preview line. No changes needed in
  `DexBoxGrid.tsx`/`applyTemplate.ts` — Leg 2's extraction already threaded `DexColor`
  through generically. Commit `fd0e6ba`.
- **Follow-up fix (same day):** Manual verification of Leg 3 surfaced that placeholder ghost
  sprites (grid tile and detail-panel preview) always rendered the plain, non-shiny sprite
  regardless of the placeholder's own `shiny` field — a deliberate Leg 2 (Dex completeness
  tier migration) call from before a box could ever have a regular and shiny ghost for the
  same species sitting adjacent. Combined Color's paired placement now puts exactly that
  pair next to each other, where two identical-looking ghosts read as confusing. Fixed both
  spots to pass `shiny` through to sprite rendering, matching how a real boxed entry already
  renders. Commit `75f57f2`.

## Verification performed

Leg 1/2: `tsc --noEmit` clean, existing + new unit tests (`boxTemplates.test.ts`,
`applyTemplate.test.ts`) passing. Leg 3 + follow-up: manual verification in the running app
(Vanny) — applied 'Both' against an empty location and confirmed regular/shiny ghosts land
paired per species in dex order; confirmed the shiny-sprite fix renders correctly in both
the grid cell and the detail panel's bottom preview after the follow-up fix.

## What went well

- **Leg 1's placement-math design absorbed 'both' with zero changes to the placement/
  counting functions** — `pendingRequiredUnits`/`placeUnitsIntoSlots` were already generic
  over "however many units, in whatever order," so the entire combined-color feature reduced
  to "emit units in a smarter order" at the `requiredUnits` level.
- **Leg 2's proactive file-size extraction paid off exactly as scoped** — Leg 3's UI-only
  diff landed in an already-under-cap `DexBoxGrid.tsx` with no additional splitting needed.

## Friction points

- **A stale doc comment caused the shiny-sprite bug to survive three legs unnoticed** —
  `BoxPlaceholderCell`'s Leg 2 (Dex completeness tier migration) comment stated sprite
  rendering "deliberately ignores [gender/shiny] and always shows the plain base-form art"
  as a settled decision, which read as still-correct through Legs 1-3 even though Combined
  Color's paired placement was exactly the scenario that decision hadn't anticipated. Manual
  verification (not typecheck/unit tests, which had no reason to catch a sprite-choice
  behavior) is what actually caught it.

## Scope creep

The shiny-sprite fix was flagged as out-of-scope for Leg 3 before being applied (Vanny opted
to fix it immediately as a same-day follow-up rather than defer to TODO.md) — surfaced by
manual verification, not planned ahead of time.

## What changes for the next milestone

Nothing follow-on filed specifically from this milestone. Next milestone not yet picked (see
TODO.md).
