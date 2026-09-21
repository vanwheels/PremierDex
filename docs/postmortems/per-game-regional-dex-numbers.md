# Post-mortem: Per-Game Regional Dex Numbers

**Shipped:** 2026-09-20. Legs 1-2. Commits `ab5cdc3`..`a040fa6`.

## What shipped

- **Leg 1 (scoping):** Resolved the two open questions the TODO item posed: numbering ties
  to the entry's `originGame` (same field the existing Origin Game detail field keys off),
  and the 11 of 40 games mapping to multiple regional dexes show every applicable dex's
  number rather than collapsing to one. See `docs/investigations/regional-dex-numbers.md`.
  Commit `ab5cdc3`.
- **Leg 2 (implementation):** `fetch-species-availability.ts` now captures each PokeAPI dex
  entry's `entry_number` into a new `entryNumbers` field. `regional-dex-names.ts`
  hand-curates all 32 fetched dex names to a display name. `regionalDexNumbersForGame`
  looks up every applicable dex number for a species + origin game and is wired into
  `DexBoxDetailPanel.tsx`/`DexHybridDetailPanel.tsx` below the existing Origin Game field.
  Commit `a040fa6`.

## Verification performed

Leg 1: doc review only, no code. Leg 2: `tsc --noEmit` clean, full test suite (457 tests,
including new `regionalDexNumbers.test.ts`) passing; manual verification in the running app
(Vanny) confirming the multi-dex cases — an X/Y entry showing multiple Kalos sub-dex
numbers, a Sun/Moon entry showing up to 5.

## What went well

- The two-leg split (a dedicated scoping leg, then a single implementation leg) worked
  cleanly — Leg 1's investigation fully resolved both open design questions up front, so
  Leg 2 had no decisions left to make mid-implementation, just mechanical execution against
  the "Leg 2 scope" bullet list Leg 1 wrote out.
- The feature slotted into existing precedent almost for free: `entryNumbers` mirrors
  `pokedexes`' own keying, the display-name table mirrors `ORIGIN_GAME_VERSION_GROUP`'s
  hand-curated-structural-mapping category, and the lookup function mirrors
  `supplementalSpeciesForGame`'s "no data for this game reads as nothing to show" contract
  — no new patterns needed inventing.

## Friction points

None significant — no blockers hit during implementation, and manual verification
confirmed the rendering matched the design on the first pass.

## Scope creep

None — Leg 2 stayed within the exact scope Leg 1 wrote out; no adjacent improvements
surfaced.

## What changes for the next milestone

Nothing follow-on filed specifically from this milestone. Next milestone not yet picked
(see TODO.md).
