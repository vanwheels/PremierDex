# Post-mortem: Ribbons/Alpha/Size/Capture-Date Tracking

**Shipped:** 2026-09-19. Legs 1-5. Commits `ff73ea0`..`55141d7`.

## What shipped

- **Leg 1 (design-only):** verified all four markers against Bulbapedia/Serebii and Vanny's
  real collection rather than the original TODO framing. Found Alpha isn't
  Legends-Arceus-only (Legends Z-A reuses the mechanic, 693 owned entries there vs. 511 in
  Arceus) and the size-variance scalar predates PLA/Scarlet-Violet entirely (Gen VII, Let's
  Go Pikachu/Eevee). Resolved the Marks-vs-Ribbons question: Marks are a separate parallel
  system, not a Gen 9 Ribbons replacement, needing their own many-to-many join table. Split
  the rest of the milestone into 4 legs. See `docs/investigations/ribbons-alpha-size-capture-date.md`.
- **Leg 2:** `is_alpha` boolean + `capture_date` DATE columns, both self-referential, wired
  into OriginModal plus a badge. Smallest leg, no surprises.
- **Leg 3:** confirmed each applicable game's actual in-game size presentation (Let's Go,
  Legends Arceus, Scarlet/Violet, Legends Z-A, Pokémon GO) via research rather than assuming
  they all matched — they didn't (binary vs. 5-tier vs. 9-tier vs. 4-tag). Locked the bucket
  set to Scarlet/Violet's 9-tier vocabulary as the finest granularity any game shows.
- **Leg 4:** `collection_entry_ribbons`/`collection_entry_marks` join tables against a
  real-but-placeholder 20/22-name list, plus RibbonsMarksModal wired into Box/Hybrid view.
  First FK ever to target `collection_entries(id)`, which required retrofitting
  `foreign_keys=OFF` onto three pre-existing rebuild blocks.
- **Leg 5:** replaced the placeholder with the full curated sets — 117 ribbons, 53 marks —
  researched via two parallel subagents against Bulbapedia raw wikitext, cross-checked
  against Serebii. Found and fixed a real naming collision (Gen III/IV ribbons sharing
  identical display text across two generations) and corrected Leg 1's Nature-tied
  assumption for personality marks. Added a self-healing CHECK-widen rebuild to schema.ts
  for both join tables.

## Verification performed

Leg 1: read-only queries against the real collection informed the scoping, no code written.
Legs 2-4: `tsc --noEmit`, `vitest run`, `eslint .` clean after each; Leg 3's bucket-set
choice was checked against each game's confirmed in-game presentation before locking it.
Leg 5: two research subagents independently verified against Bulbapedia (raw MediaWiki
template data, not summarized prose) and Serebii before any code was written; both flagged
their own uncertainty explicitly (rank-tier display-text ambiguity, Nature-pairing
hallucination caught and discarded) rather than presenting guesses as fact. The CHECK-widen
rebuild was verified against a simulated pre-Leg-5 database (old placeholder CHECK, existing
rows) to confirm it rebuilds correctly and preserves data before wiring it into the real
schema. Final state: 425/425 tests passing, clean typecheck, clean lint.

## What went well

- **Leg 1's habit of checking assumptions against real data/live research before scoping
  legs caught two wrong premises early** (Alpha's scope, Size's game-of-origin) instead of
  building against them and discovering the gap later.
- **Running two research subagents in parallel (ribbons, marks) kept turnaround fast** for
  Leg 5's genuinely large curation task (170 names total) while keeping the main context
  clean of the raw research process.
- **A subagent flagging its own uncertainty was directly useful, not just noise**: the marks
  research caught and explicitly discarded a hallucinated Nature-to-Mark pairing table from
  an earlier automated fetch before it could have been transcribed into the shipped data as
  fact.

## Friction points

- **Leg 5 surfaced a real data-modeling problem the schema (built in Leg 4) hadn't
  anticipated**: Gen III Contest ribbons and Gen IV Super Contest ribbons share identical
  display text for two of four rank tiers across all 5 categories, which a flat
  CHECK-constrained string with `UNIQUE(entry_id, ribbon_name)` can't hold as two distinct
  holdable ribbons. Fixed with an app-level "(Sinnoh)" disambiguation suffix, documented as
  such rather than presented as an in-game label — but this is exactly the kind of
  cross-generation collision that a "flat name list, no lookup table" design is blind to
  until research actually surfaces the real names. Worth a quick scan for the same shape of
  collision before trusting a flat string list for any future closed-set data curation.
- **Both of Leg 5's real counts (117 ribbons, 53 marks) diverged from Leg 1's own estimates
  (~115, 43)** — not wrong in a way that mattered, but a reminder that a scoping leg's counts
  are an estimate to plan around, not a number the curation leg is bound to hit exactly.

## Scope creep

None absorbed unprompted. List/Collection view entry points, backup export/import coverage,
and Storage Location Duplicate cloning for ribbons/marks were all identified while building
Legs 4-5 and filed as separate Unscheduled TODO items rather than folded in.

## What changes for the next milestone

- Both remaining Future Milestones (Curated Met Location dataset, per-game form/gender/
  ball-combo legality) are still gated on conditions that haven't been met — no automatic
  next pick. Same as the transition into this milestone, the next one is Vanny's call.
- The Gen III/IV ribbon-name-collision fix is a useful precedent: when curating any future
  closed-set string data from real game sources, check for identical display text reused
  across eras/mechanisms before assuming a flat name list is safe to use as a primary key.
