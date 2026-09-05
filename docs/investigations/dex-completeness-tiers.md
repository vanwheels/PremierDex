# Dex completeness tiers

Design output for [Dex completeness tier migration] — Leg 1. No code in this leg; this
doc is the shared definition Legs 2 (Box Templates), 3 (upgrade migration), and 4
(downgrade) all consume rather than each redefining it.

## Source material

Vanny's reference is Austin John's "HOME Living Dex Organizer" spreadsheet (Shiny Version
1.3.2), which offers 5 named dex tiers as columns against 4 named diff categories as
rows, each cell an "x" meaning that category is required for that tier:

| | Living Form | LivingFormLITE | Living | FinalFormForm | FinalForm |
|---|---|---|---|---|---|
| Regional Diffs | x | x | x | x | x |
| Pre Evos | x | x | x | | |
| Form Diffs | x | x | | x | |
| Gender Diffs | x | | | | |

Examples given: Regional Diffs = Original & Alolan Geodude. Pre Evos = Pichu, Pikachu, &
Raichu (all three vs. just the final-stage Raichu). Form Diffs = All Cap Pikachu & 47
Alcremie. Gender Diffs = Venusaur, Hippowdon, & Oinkalone.

The sheet has an identical "Regular" tab alongside this "Shiny" one — same 5 tiers, same
4 categories, just tracking the shiny color instead. That's 10 trackers total, not the 2
("regular species-only" / "complete form+gender") the milestone's original framing named —
this doc supersedes that framing; Legs 2-4's write-ups should be read against this table,
not the original wording.

## Mapping onto this codebase's data model

Three of the four rows already exist in some form:

- **Regional Diffs is not a toggle in this codebase — it's always on.** A regional form
  (Alolan Ninetales, etc.) is `formCategory: 'dex_distinct'` with `regionalGroup` set
  (`shared/types/pokemon.ts`). `computeCompletionStats` (`completionStats.ts`) already
  counts every `dex_distinct` form unconditionally, regional or not, at every axis
  setting — there's nothing to build here. (`foldRegionalIntoGeneration` is a separate,
  purely cosmetic concern: which *display bucket* a regional form's count lands in, not
  whether it counts. Unrelated to this row.)
- **Form Diffs = `CompletionStatsOptions.includeCosmeticVariants`.** The sheet's own
  examples (Cap Pikachu, Alcremie) are exactly this codebase's `cosmetic_variant`
  category (confirmed in `docs/investigations/form-categorization.md` — Cap Pikachu forms
  are stat/type-identical to base Pikachu, which is the `cosmetic_variant` classification
  rule). Already implemented, already wired to a checkbox in `CompletionStatsPanel.tsx`.
- **Gender Diffs = `CompletionStatsOptions.splitByGender`.** Already implemented, already
  wired to a checkbox.
- **Pre Evos: `Species.isFinalEvolutionStage` (Leg 5, 2026-09-04).** Originally nothing in
  the schema encoded evolution-chain membership or stage — confirmed by search, not
  assumed, at the time this doc was first written. Leg 5 closed that gap: `scripts/
  fetch-evolution-chains.ts` walks every PokeAPI `/evolution-chain` tree (branches
  included — Eevee's 8 eeveelutions, Tyrogue's 3, item-based branches like Slowpoke ->
  Slowbro/Slowking each mark their own target species final) and writes `data/pokemon/
  species-evolution.json`; `is_final_evolution_stage` is a plain species-level column,
  backfilled unconditionally on every `runSeed` (same re-sync pattern as forms'
  `home_boxable`/`shiny_locked`/`always_shiny`, since a species that's final today can
  gain a new evolution in a later game — Tangela -> Tangrowth, Ursaring -> Ursaluna).
  `isFinalEvolutionStage(form.speciesId)` in the pseudocode below now resolves directly to
  this column — no further data work needed. **Not done by Leg 5:** wiring
  `excludePreEvolutions` itself into `requiredUnits()`/`computeCompletionStats`/
  `BUILDABLE_TIERS` so FinalFormForm/FinalForm actually become selectable — that's the
  data acquisition only; the tier-computation wiring is its own follow-up (see TODO.md).

So the working model is **3 boolean axes** (`includeCosmeticVariants`, `splitByGender`,
and `excludePreEvolutions` — the data for the third exists as of Leg 5, but nothing yet
consumes it, see above), with dex_distinct/regional forms always included as the floor
every tier shares. The 5 named tiers are fixed presets over those axes, not a 4-axis
system:

| Tier | includeCosmeticVariants | splitByGender | excludePreEvolutions | Buildable today |
|---|---|---|---|---|
| Living Form | true | true | false | yes |
| LivingFormLITE | true | false | false | yes |
| Living | false | false | false | yes |
| FinalFormForm | true | false | true | blocked on tier-computation wiring (Leg 5's data exists, unconsumed) |
| FinalForm | false | false | true | blocked on tier-computation wiring (Leg 5's data exists, unconsumed) |

("Living" is the closest match to what the milestone's original wording called "regular
species-only" — it isn't species-only in the literal sense (regional forms still each
need their own entry, per Regional Diffs being always-on), it's just the floor tier: no
cosmetic variants, no gender split, no pre-evo filtering.)

## Shiny is a parallel track, not a 4th axis

The spreadsheet's separate Regular/Shiny tabs match how `computeCompletionStats` already
works: every `CompletionBucket` carries `regular` and `shiny` as two independent
`CompletionCount`s computed side by side off the same axis config and the same
`CollectionEntry` set (`shiny: boolean` on the entry, natural-keyed alongside `gender`).
A tier is therefore really **(axis config) × (color)** — "Living Form, shiny" is the same
axis config as "Living Form" applied to the `shiny` half of each unit's owned/total count,
already exactly what the `shiny`/`regular` fields on `CompletionBucket` give you. No new
concept needed for color; it's an existing dimension the tier system rides on top of.
`alwaysShiny`/`shinyLocked` forms are already excluded from the regular/shiny denominator
respectively (`addUnit` in `completionStats.ts`) — that stays unchanged under any tier.

## A tier's completeness set (for Legs 2 and 3 to consume)

"The completeness set for tier T against color C" is the enumerable list of required
`(formId, gender, shiny)` natural keys — the same triple `CollectionEntry` and
`collection_entries`' unique constraint already key on. Both later legs need exactly this
list, just for different purposes (Leg 2 stamps it into `box_placeholders` slots as
ghosts; Leg 3 diffs it against owned entries to find what a migration needs to ask
about), so it's worth defining once:

```
requiredUnits(tier, color, forms, species):
  for each form in forms:
    if form.formCategory == 'non_boxable': skip
    if form.formCategory == 'cosmetic_variant' and not tier.includeCosmeticVariants: skip
    if tier.excludePreEvolutions and not isFinalEvolutionStage(form.speciesId): skip   # data exists as of Leg 5 (species.isFinalEvolutionStage); this call site is not yet wired up
    if color == 'regular' and form.alwaysShiny: skip
    if color == 'shiny' and form.shinyLocked: skip
    genders = (form.hasGenderDifference and tier.splitByGender) ? [male, female]
            : (form.hasGenderDifference) ? [male]   # collapsed: either gender satisfies it, male is the canonical placeholder — see open question below
            : [unknown]
    for each gender in genders:
      yield (form.id, gender, color == 'shiny')
```

This is the same loop `computeCompletionStats` already runs — the difference is that
function folds straight into owned/total counts, where Legs 2/3 need the actual list of
keys (to stamp placeholders, or to diff against `collection_entries`). Worth factoring
`computeCompletionStats` to share this enumeration rather than reimplementing it
separately in Leg 2/3, but that's an implementation decision for those legs, not this one.

**Open question for Leg 3, not resolved here:** when a gender-diff form is collapsed
(`splitByGender` false, so only the `male` key is "required"), and the user already owns
that male entry, upgrading to a split tier needs to know whether they actually have a
male or a female individual before it can mark the right entry owned — a collapsed "owned"
checkbox doesn't currently distinguish which physical individual it represents. This is
exactly the "flag previously-unspecified-gender entries with the correct gender" gap Leg
3's TODO item already names; flagging here only to confirm Leg 1's tier definition doesn't
paper over it — Leg 3 still has to design that prompt/flow itself.

## Downgrade (Leg 4) resolves as: not an operation

Every axis in the table above only ever *adds* required units going up in tier — Living's
required set is a strict subset of LivingFormLITE's, which is a strict subset of Living
Form's (same relationship holds across the Pre-Evos pair once buildable). Nothing a higher
tier requires is ever absent from a lower tier's requirements. That means "downgrading"
from a complete tier back to a regular one isn't a data migration at all: a collection
that satisfies Living Form automatically satisfies Living and LivingFormLITE too, just by
computing completeness against the coarser tier's `requiredUnits()` — no entries need to
change, merge, or delete. There's nothing to build for Leg 4 beyond letting the user
select a coarser tier to display/track against, which Leg 2's tier-aware UI already gives
them for free. Leg 4 should close as this decision (see TODO.md), not as an
implementation.

## Correction (2026-09-04, Leg 6): a template is total-based, not pending-based

Leg 2 (below) built Apply Template around `pendingRequiredUnits()` — `requiredUnits()` minus
anything owned *anywhere* in the collection. Vanny's call after a same-day investigation
(TODO.md's Leg 6/7): that's the wrong concept. A template should stamp the *full*
`requiredUnits()` set every time, skipping only units a real entry already physically
occupies *in the target location* — not ones owned elsewhere. The box becomes a fixed full
layout of the tier/color; reconciling it against what's actually owned (wherever it sits) is
a separate action, Fill In (Leg 7), not something Apply Template itself does. This doc's
`requiredUnits()` pseudocode/table above is unaffected — only how a *template* consumes it
changes.

## Handoff

- **Leg 2 (Box Templates):** a template is a (tier, color) pair. Auto-populate stamps
  `requiredUnits(tier, color, ...)` minus already-owned/already-placed entries into
  `box_placeholders` — note `BoxPlaceholder` (`shared/types/box.ts`) currently only
  carries `speciesId`, not form/gender/shiny, so it needs widening before it can represent
  anything past the `Living` tier's species-level ghosts.
- **Leg 3 (upgrade migration):** diff `requiredUnits(targetTier, color, ...)` against
  owned `collection_entries`; the gender-collapse question above is the one piece this doc
  deliberately leaves for that leg to design.
- **Leg 5 (done, 2026-09-04):** evolution-chain data acquisition (PokeAPI
  `/evolution-chain` fetch pass + `species.is_final_evolution_stage` schema column + seed
  backfill) — see the corrected "Pre Evos" bullet above. Data-only, per its TODO scope: it
  does not wire `excludePreEvolutions` into `requiredUnits()`/`computeCompletionStats`/
  `BUILDABLE_TIERS`, so FinalFormForm/FinalForm still don't appear in the tier picker.
  That wiring is a new follow-up leg (see TODO.md), not part of this one.
