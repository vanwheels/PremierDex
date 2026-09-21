# Completed: Apply Template — Combined Regular+Shiny

Archived from `COMPLETED.md` at the milestone boundary — see
`docs/postmortems/apply-template-combined-color.md` and `MILESTONES.md`.

## [Shiny box placeholders rendered with plain sprite art] — follow-up (2026-09-20)
Placeholder ghost sprites (DexBoxGridCell's grid tile and DexBoxDetailPanel's bottom
preview) always rendered the plain, non-shiny sprite regardless of the placeholder's own
`shiny` field — a deliberate Leg 2 (Dex completeness tier migration) call from before a box
could ever have a regular and shiny ghost for the same species sitting adjacent. Combined
Color's paired placement now puts exactly that pair next to each other, where two
identical-looking ghosts read as confusing. Both spots now pass `shiny` through to sprite
rendering and show the shiny badge, matching how a real boxed entry already renders. See
commit `75f57f2`.

## [Apply Template Combined Color Leg 3: UI wiring] — 2026-09-20
Added the third radio option (Regular / Shiny / Both) to `DexApplyTemplateModal.tsx` and a
combined-case preview line. No changes needed in `DexBoxGrid.tsx`/`applyTemplate.ts` —
Leg 2's extraction already threads `DexColor` generically through to Leg 1's placement
math. See commit `fd0e6ba`.

## [Apply Template Combined Color Leg 2: extract apply-template orchestration] — 2026-09-20
`DexBoxGrid.tsx`'s `handleApplyTemplate` (box-creation math + sequential `onAddBox` awaits +
the batched `onSetBoxPlaceholders` call) moved into a new `applyTemplate.ts` module, mirroring
`collection-backup.ts`'s extraction from `sqlite-storage.ts`. Pure refactor, now unit-tested
directly (not reachable before except through the component). Brought `DexBoxGrid.tsx` from
511 to 488 lines, back under the 500 hard cap. See commit `8f80688`.

## [Apply Template Combined Color Leg 1: placement math] — 2026-09-20
`DexColor` gained `'both'`; `requiredUnits` walks forms species-by-species and emits each
species' regular unit(s) then its shiny unit(s) before the next species, so downstream
placement lands them in adjacent slots with no interleaving logic needed elsewhere.
`pendingRequiredUnits`/`placeUnitsIntoSlots`/`countAvailableSlots`/`extraBoxesNeeded`
needed no code changes — already unit-count/list agnostic. See commit `c382c86`.
