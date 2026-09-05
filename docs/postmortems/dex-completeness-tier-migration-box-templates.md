# Post-mortem: Dex Completeness Tier Migration & Box Templates

**Shipped:** 2026-09-04. Legs 1-8. Commits `4e81eba`..`49037c1`.

## What shipped

- **Tier definition** (Leg 1): decoded Vanny's reference (Austin John's HOME Living Dex
  Organizer spreadsheet) into a 3-boolean-axis system (`includeCosmeticVariants`,
  `splitByGender`, `excludePreEvolutions`) over the existing `CompletionStatsOptions`
  shape, plus the `requiredUnits()` definition later legs consume. Also resolved
  "downgrade" (Leg 4) as a non-operation: every tier's required set is a strict subset of
  the tier above it, so no migration is needed to view completion against a coarser tier.
- **Box Templates** (Leg 2, corrected Leg 6): an "Apply Template…" action in Box view
  stamps a tier's `requiredUnits()` into empty box slots location-wide in dex order,
  creating boxes as needed. `BoxPlaceholder`/`box_placeholders` widened from species-only
  to `(formId, gender, shiny)` to represent this. Leg 6 corrected the semantics after a
  same-day investigation: a template stamps the tier's *full* set every time, skipping
  only what already occupies a slot in the *target location* — not whatever's owned
  anywhere in the collection — plus a "Clear Placeholders" bulk wipe.
- **Tier picker promoted dashboard-wide** (Leg 2): `completionStats.ts` gained
  `DexTier`/`TIER_CONFIGS`/`applyTierToOptions`/`matchingTier`, with `CompletionStatsPanel`
  (shown above every Dex view) getting a tier dropdown as a shortcut into the underlying
  checkboxes.
- **Resolve Gender Ambiguities** (Leg 3, bugfixed same day): the one flow Leg 1 deliberately
  left undesigned — only `splitByGender` ever needs a real data correction (a collapsed
  owned entry's actual gender). Shipped, then bugfixed same day: the original design wrote
  nothing back when confirming Male, so the banner never cleared — fixed with a real
  `gender_confirmed` column instead of overloading `gender` itself.
- **Evolution-chain data** (Leg 5): PokeAPI `/evolution-chain` fetch pass writing
  `data/pokemon/species-evolution.json`, a new `species.is_final_evolution_stage` column,
  and an unconditional seed backfill. Data-only — deliberately split from the
  tier-computation wiring that consumes it.
- **Fill In** (Leg 7, bugfixed same day): walks a location's ghost placeholders and moves
  an already-owned, not-yet-boxed individual into each one, preferring the lowest id.
  Bugfixed same day: a raided-sibling-location bug (a fresh Duplicate-Storage-Location
  clone getting stranded unboxed while Fill In drained the original location's copy
  instead) — fixed by preferring a same-location candidate before falling back to
  lowest-id collection-wide.
- **`excludePreEvolutions` wired for real** (Leg 8): `requiredUnits`/`computeCompletionStats`
  both take a `species: Species[]` param now and actually skip a non-final-evolution-stage
  form when the tier/options ask for it — the data Leg 5 acquired sat unread until this
  leg. `BUILDABLE_TIERS` widened from 3 to all 5 named tiers as a result, surfacing
  FinalFormForm/FinalForm in both the Completion Stats and Box Templates pickers.

## Verification performed

Per leg: `tsc --noEmit` and `vitest run`. At milestone close: typecheck clean, 398/398
tests passing across 39 files. Vanny manually verified Apply Template, Fill In, and
Resolve Gender Ambiguities against her real collection at each leg's close (surfacing both
bugfixes); Leg 8's new checkbox/tiers are pending her own manual pass in the running app.

## What went well

- **Leg 1's upfront design doc paid for itself across 7 later legs** — every leg cited its
  `requiredUnits()` pseudocode or tier table directly rather than re-deriving the axis
  system, and Leg 8 could implement the pre-evolution filter as a literal transcription of
  a line the doc had already written.
- **Splitting data acquisition (Leg 5) from tier-computation wiring (Leg 8) kept both legs
  small** — Leg 5 could ship `is_final_evolution_stage` and its seed backfill without also
  having to touch `requiredUnits`/`computeCompletionStats`/`BUILDABLE_TIERS`/the tier
  picker UI in the same diff.
- **Both post-ship bugfixes (Resolve Gender Ambiguities, Fill In) were caught by Vanny's
  own manual verification within the same day**, not left to surface later — the
  "manual verification for visual/UI changes" convention held up in practice here.

## Friction points

- **The Leg 6 correction cost a real rework**: Leg 2 built Apply Template on a
  pending-based concept (skip anything owned *anywhere*), which turned out to be the wrong
  model once Vanny used it — investigating a same-day "totals look wrong" report led to
  redefining it as total-based instead. The wrong model wasn't caught until real usage,
  not at Leg 2's design/review stage.
- **schema.ts crossed its hard cap during this milestone** (492 -> 567 lines across Legs 2
  and 5's table additions/retrofits) and is now 67 lines past the 500 hard cap. Flagged as
  `[Split schema.ts]` in TODO.md but deliberately not split mid-milestone — the CHECK-widen
  rebuild ordering hazard investigated at Leg 2's close needs its own leg to get right.

## Scope creep

None absorbed unprompted into a leg. Two same-day bugfixes (Resolve Gender Ambiguities,
Fill In raided sibling locations) were fixed immediately rather than filed, since both
were regressions in features this same milestone had just shipped, not new asks. The
`[Apply Template: combined regular+shiny option]` and `[Bulk move: Box view support]`
follow-ups Vanny raised while using Leg 6/7's features were filed to TODO.md rather than
folded in, per the Scope convention.

## What changes for the next milestone

- `[Split schema.ts]` is now overdue by the project's own threshold (567 lines against a
  500 hard cap) — worth picking up before or alongside whichever future milestone next
  adds a table to it, rather than letting a 3rd CHECK-widen rebuild block land on top.
- No other loose threads from this milestone's own scope: Legs 1-8 were the full planned
  sequence, and both bugfixes surfaced during it are resolved.
