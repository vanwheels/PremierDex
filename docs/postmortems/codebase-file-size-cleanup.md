# Post-mortem: Codebase File-Size Cleanup

**Shipped:** 2026-09-22. Legs 1-6. Commits `a1ffa3e`..`af9ea1d`.

## What shipped

- **Leg 1 (investigation-only):** confirmed Legs 2-5's line counts hadn't drifted since
  scoping, then swept `src`/`scripts`/`data` for untracked hard-cap (500+) violators.
  Found two: `schema.test.ts` (606 lines, folded into Leg 2's boundary) and
  `scripts/fetch-pokemon-forms.ts` (656 lines, scoped as Leg 6 — its docstring framed it as
  data-adjacent, but it's `.ts` logic, not data, so it didn't qualify for the static-data
  exemption `met-locations.ts`/`forms.json` get). Per Vanny, scope stayed hard-cap
  violators only — 11 files in the 300-499 soft-cap band were left alone.
- **Leg 2:** split `schema.ts`/`schema.test.ts` along the CHECK-widen-rebuild/
  retrofit-ALTER boundary into `schema-rebuilds.ts`, `schema-retrofits.ts`, and
  `schema-constants.ts`.
- **Leg 3:** split `sqlite-storage.ts` into `collection-entry-storage.ts`
  (CollectionEntry-specific writers), mirroring the existing `collection-backup.ts`
  extraction.
- **Leg 4:** split `useCollectionData.ts`'s box-position/undo-stack slice into a new
  `useBoxPositionUndo` hook.
- **Leg 5:** split `met-locations.test.ts` (1330 lines, grown past cap during the Curated
  Met Location dataset milestone) into 12 per-map-family files mirroring
  `met-locations.ts`'s own const groupings.
- **Leg 6:** split `fetch-pokemon-forms.ts` — pulled its hand-maintained data tables
  (OVERRIDES, SHINY_LOCKED, ALWAYS_SHINY, VERSION_GROUP_GENERATION, REGIONAL_GROUPS, and
  the ride-mode/starter/spurious-multi-form/gender-pair-multi-form species lists) into a
  sibling `pokemon-forms-data.ts`, leaving fetch/classification logic behind. 656 -> 458 +
  223 lines.

## Verification performed

Every leg's split verified with `tsc --noEmit` (both tsconfig projects) and `eslint .`
clean, and existing test suites re-run unchanged where a test file was itself split (Leg
2, Leg 5). No behavior changed in any leg — these were structural splits only, not
refactors of logic.

## What went well

- **Leg 1's sweep caught both real violators up front**, so the milestone never
  discovered a new hard-cap file mid-run — every leg after Leg 1 was pre-scoped.
- **Every split followed an existing precedent in the same file or a sibling one**
  (Leg 3 mirrored `collection-backup.ts`'s prior extraction; Leg 5 mirrored
  `met-locations.ts`'s own const groupings), so no leg needed to invent a new boundary
  from scratch.
- **Scope stayed hard-cap-only for the whole milestone**, per Vanny's Leg 1 call — no
  drift into splitting soft-cap (300-499 line) files that weren't in violation.

## Friction points

- **`met-locations.test.ts`'s growth past the cap was flagged during the Curated Met
  Location dataset milestone (Leg 19 of 28) but not split until this milestone's Leg 5**,
  nine legs later, by which point it had grown to 1330 lines. Splitting a test file as it
  crosses the cap, rather than deferring to a dedicated cleanup milestone, would have kept
  the deferred split smaller.
- **Leg 5's file deletion (`bd71b30`) needed a follow-up commit** — the split commit
  (`6d5237b`) added the 12 new per-family files but didn't stage the deletion of the
  original monolithic `met-locations.test.ts` alongside them.

## Scope creep

None absorbed unprompted across 6 legs. Leg 1 explicitly declined to widen scope to
soft-cap (300-499 line) files when it found 11 of them during its sweep, keeping the
milestone to hard-cap violators only, per Vanny's call.

## What changes for the next milestone

- When a file crosses the 500-line hard cap mid-milestone (as `met-locations.test.ts` did
  during Curated Met Location dataset), consider splitting it in the leg that pushes it
  over rather than deferring to a future cleanup pass — the file only grows larger in the
  meantime.
- No next milestone is picked. Future Milestones currently lists five candidates not fully
  blocked (Backup/Export Completeness, Remove "Unassigned" default, Species detail popup,
  Encounter tables + location/game search UI, Catch rate + capture probability calculator,
  Full UI/UX pass) plus one still gated on unmet conditions (Per-game form/gender/
  ball-combo legality) — Vanny's call, same as prior transitions.
