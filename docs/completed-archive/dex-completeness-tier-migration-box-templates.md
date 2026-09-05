# Completed: Dex Completeness Tier Migration & Box Templates

Archived from `COMPLETED.md` at the milestone boundary — see
`docs/postmortems/dex-completeness-tier-migration-box-templates.md` and `MILESTONES.md`.

## [Wire excludePreEvolutions into tier computation] — Leg 8 (2026-09-04)
`requiredUnits` (boxTemplates.ts) and `computeCompletionStats` (completionStats.ts) both
accepted an `excludePreEvolutions` config flag already, but neither ever filtered on it —
the `Species.isFinalEvolutionStage` data Leg 5 added just sat unread, so FinalFormForm and
FinalForm stayed excluded from `BUILDABLE_TIERS`. Both functions now take a
`species: Species[]` param and skip a form whose species isn't `isFinalEvolutionStage`
when the tier/options ask for it. `CompletionStatsOptions` grew a matching
`excludePreEvolutions` field (with its own checkbox in `CompletionStatsPanel`, mirrored
into `applyTierToOptions`/`matchingTier`), and `BUILDABLE_TIERS` now lists all 5 named
tiers instead of the 3 that never touched this axis. See commit `49037c1`.

## [Fill In raided sibling locations bugfix] — 2026-09-04
Reported by Vanny: after Duplicate Storage Location, Fill In on the duplicate left an
individual showing as both boxed and unboxed, surviving a reload. Root cause: Duplicate
clones every entry as a fresh higher-id row landing unboxed in the new location, and Fill
In's lowest-id-wins tie-break reached past that local clone to raid the original
location's own (lower-id) individual instead, stranding the clone unboxed while draining
the original. `computeFillInPlacements` now prefers a same-location candidate before
falling back to lowest-id collection-wide. See commits `9db814d` (diagnostic logging added
mid-investigation, superseded by the actual fix) and `56d0e40` (the fix).

## [Fill In from owned collection] — Leg 7 — 2026-09-04
Companion to Leg 6: walks a location's ghost placeholders and, for each, moves an
already-owned individual with no existing box home into its slot — preferring the
lowest-id unboxed candidate and leaving already-boxed-elsewhere copies alone. Gender
matching mirrors `isUnitSatisfied`'s existing collapsed-representative rule (a `'male'`
placeholder on a gender-diff form accepts either gender; `'female'` is strict), confirmed
with Vanny this session. See commit `e2e8ca9`.

## [Resolve Gender Ambiguities bugfix] — 2026-09-04
Reported by Vanny: clicking Resolve didn't make the banner go away. Root cause was Leg 3's
own design gap — leaving an entry on Male wrote nothing back, so it had no way to record
"reviewed" and re-appeared forever. Added a real `gender_confirmed` column (schema
migration) instead of overloading the `gender` value itself, plus a per-row Male/Female
toggle in the Dex table so a gender can still be corrected after confirming, per Vanny's
call — box position isn't auto-reconciled when that happens (accepted manual cleanup). See
commit `f4fb715`.

## [Redefine Apply Template as total-based + Remove Template] — Leg 6 — 2026-09-04
Corrects Leg 2's original concept (surfaced investigating a "totals look wrong" report —
the totals themselves were fine, see `docs/investigations/dex-completeness-tiers.md`'s
Correction section): a template now stamps the tier's *full* required set every time,
skipping only units a real entry already physically occupies in the target location, not
whatever's owned anywhere in the collection. Also ships "Clear Placeholders", a
per-Storage-Location bulk wipe of every `box_placeholders` row there (template-stamped and
manually-set alike). See commit `69a27d4`.

## [Evolution-chain data (Pre-Evos axis)] — Leg 5 — 2026-09-04
PokeAPI `/evolution-chain` fetch pass (`scripts/fetch-evolution-chains.ts`) writing
`data/pokemon/species-evolution.json`, new `species.is_final_evolution_stage` schema
column + retrofit, and an unconditional `runSeed` backfill. Data acquisition only — the
`excludePreEvolutions` axis still isn't wired into `requiredUnits()`/
`computeCompletionStats`/`BUILDABLE_TIERS`, filed as a new follow-up (Leg 8). See commit
`15461fa`.

## [Dex completeness tier migration] — Leg 4 (2026-09-04)
Closed as a decision, not an implementation — see Leg 1 below. Downgrading from a complete
tier to a regular one needs no migration: a collection satisfying a higher tier
automatically satisfies every lower one, since tiers only ever add required units going
up. Nothing to build.

## [Dex completeness tier migration] — Leg 3 — 2026-09-04
Resolve Gender Ambiguities: the flow Leg 1's investigation doc deliberately left
undesigned. Scoped down from a generic tier-migration wizard to just this one action —
only the splitByGender axis ever needs a real data correction, the other two tiers are
already a live diff. See commit `77c8038`.

## [Dex completeness tier migration] — Leg 2 (2026-09-04)
Built Box Templates: an "Apply Template…" action in Box view stamps a tier's
`requiredUnits()` (new `boxTemplates.ts`) into empty box slots location-wide in dex order,
skipping anything already owned or already placeholder'd, creating new boxes as needed.
Widened `BoxPlaceholder`/`box_placeholders` from species-only to `(formId, gender, shiny)`
to represent that, with a schema rebuild block migrating any pre-existing install's rows.
Also promoted the tier concept out of Box view alone: `completionStats.ts` now exposes
`DexTier`/`TIER_CONFIGS`/`applyTierToOptions`/`matchingTier`, and `CompletionStatsPanel`
(shown above List/Hybrid/Box view alike) gained a tier picker that's a shortcut into the
same `includeCosmeticVariants`/`splitByGender` checkboxes, per Vanny's call mid-leg.
Manually-set placeholders (right-click an empty slot) keep their species-only UI but now
resolve to a concrete canonical form/gender under the hood, and any placeholder can be
clicked to see its specific requirement as text in the detail panel — sprite art stays
plain either way, per Vanny's call. See commit `3f59871`.
Note: schema.ts crossed the 500-line hard cap to 550 doing this (the table-widening rebuild
block this leg added). Deliberately not split in the same leg — see TODO.md's
[Split schema.ts] for why a hasty split here was a real correctness risk, not a shortcut.

## [Dex completeness tier migration] — Leg 1 (2026-09-04)
Design-only. Decoded Vanny's reference (Austin John's HOME Living Dex Organizer
spreadsheet) into a 3-axis tier system — `includeCosmeticVariants` and `splitByGender`
already exist in `completionStats.ts`; a third axis (excluding pre-evolutions) needs
evolution-chain data that doesn't exist in the schema at all, split out as Leg 5. Also
resolved Leg 4 (downgrade) as a non-operation: every tier's required set is a strict
subset of the tier above it, so "downgrading" is just viewing completion against a coarser
tier, no data changes needed. Full writeup, the decoded tier table, and the
`requiredUnits()` shape Legs 2/3 consume: `docs/investigations/dex-completeness-tiers.md`.
