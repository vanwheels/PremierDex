# Post-mortem: Evolution-Chain Reachability for Species Availability

**Shipped:** 2026-09-20. Legs 1-2. Commits `723278f`..`a50d76a`.

## What shipped

- **Leg 1:** Widened `species-evolution.json`/`fetch-evolution-chains.ts` to record each
  species' direct evolution parent (`evolvesFromSpeciesId`) alongside the existing
  `isFinalEvolutionStage`, threaded through a new `evolves_from_species_id` species-table
  column, row-mappers, the shared `Species` type, and seed.ts's backfill. Data acquisition
  and schema only, no `checkEntryValidity` change. Commit `723278f`.
- **Leg 2 (this leg):** Wired the ancestor walk into `checkEntryValidity`
  (`src/renderer/dex/invalidCombo.ts`) — it now takes a `speciesById: Map<number, Species>`
  lookup and walks `evolvesFromSpeciesId` parent pointers until it finds an available
  ancestor or runs out of chain. Threaded the lookup down through DexTable/DexBoxPane/
  DexHybridGrid (each builds it once via `useMemo` from their existing `species: Species[]`
  prop, following the same pattern already used by `DexResolveGenderModal`) to DexRow/
  DexBoxDetailPanel/DexHybridDetailPanel, which pass it into `checkEntryValidity`. Dropped
  the now-resolved evolution-chain-reachability forward-references in
  `supplemental-availability.ts`'s doc comments. Commit `a50d76a`.

## Verification performed

Leg 1: schema/data-only, verified via `seed.test.ts` and `tsc --noEmit` (see Leg 1's own
COMPLETED.md entry). Leg 2: extended `invalidCombo.test.ts` with a dedicated
evolution-chain-reachability describe block (direct-ancestor case, a two-hop walk past an
unavailable direct parent, a fully-unavailable chain, and a species absent from the lookup
entirely) — full suite (444/444) and `tsc --noEmit` clean. Then a read-only verification
script (tsx, `better-sqlite3` in readonly mode, never wrote to the DB) ran the real
`checkEntryValidity` against every owned `collection_entries` row with a non-null origin
game in `premierdex.sqlite`: all 8 named false positives (Platinum's Ariados/Politoed,
Emerald's Ledian/Flaaffy/Ampharos/Sunflora/Ambipom, USUM's Ivysaur) now clear; flagged-entry
count dropped from 147 (21 distinct species) to 84 (12 distinct species) — exactly the same
residual species set minus the 8 cleared, plus one bonus clear (Slowking, a King's-Rock
evolution the milestone hadn't specifically named) — confirming no new false positives were
introduced.

## What went well

- **The Leg 1/Leg 2 acquisition-vs-wiring split paid off exactly as intended**, mirroring
  the Dex completeness tier migration's own Leg 5/Leg 8 precedent — Leg 2 was a clean,
  mechanical wiring pass with no data questions left open, because Leg 1 had already
  resolved what data to fetch and how to store it.
- **The two-hop test case (Ampharos, via an unavailable Flaaffy up to an available Mareep)
  caught a real design requirement early** — a naive "check direct parent only" walk would
  have passed the single-hop cases but silently failed Ampharos, so writing that test before
  relying on manual/DB verification alone was worth it.
- **Reusing `tsx` to import the real TypeScript modules (`checkEntryValidity`,
  `origin-games.ts`, `supplemental-availability.ts`) for the DB verification script**, rather
  than reimplementing that logic in a throwaway JS query, meant the verification exercised
  the exact shipped code path, not a parallel approximation of it.

## Friction points

- **`tsx` needed an explicit `--tsconfig tsconfig.web.json` flag** to resolve the `@shared/*`
  path alias — the root `tsconfig.json` is reference-only with no `paths` of its own, so the
  first script run failed on `@shared/data` before that was added. Minor, but worth noting
  for the next ad-hoc verification script against this codebase.
- **The verification script needed the real collection's `evolves_from_species_id` data**,
  which only exists in the live app's SQLite file after `runSeed`'s backfill has actually run
  once — the on-disk `premierdex.sqlite` hadn't been reopened by the app since Leg 1 landed,
  so the column was present but unpopulated. Worked around by loading
  `data/pokemon/species-evolution.json` directly in the script (the same source `runSeed`
  itself reads) rather than trusting the DB column, keeping the check fully read-only.

## Scope creep

None. Leg 2 stayed exactly to its TODO.md scope (wire the walk, thread the lookup, verify,
drop the forward-reference) with no adjacent fixes folded in.

## What changes for the next milestone

Nothing follow-on filed specifically from this milestone. The remaining residual false
positives (Platinum's Dunsparce/Qwilfish/Smoochum, Emerald's Cyndaquil, USUM's Nuzleaf) have
no confirmed in-game source under any mechanism checked so far — per
`supplemental-availability.ts`'s doc comment, they stay un-curated rather than guessed at
until a real source surfaces. Next milestone not yet picked (see TODO.md).
