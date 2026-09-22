# Post-mortem: Species detail popup + evolution family tree

**Shipped:** 2026-09-22. Legs 1-4. Commits `87e694d`..`c5c8eb7`.

## What shipped

- **Leg 1:** Extended `fetch-evolution-chains.ts` to also write
  `data/pokemon/evolution-edges.json` (human-readable evolution method per edge, plus
  regional/variety branches like Raichu vs. Raichu-Alola recovered from PokeAPI's
  `evolution_details`). Commit `87e694d`.
- **Leg 2:** Built `EvolutionTree.tsx` (generation-stacked, flex-wrap layout) and the pure
  `evolutionFamilyTree.ts` tree-assembly logic — walks `Species.evolvesFromSpeciesId` to the
  chain root, then `evolution-edges.json` forward per (speciesId, formName) node so
  regional-form branches render as separate bubbles. Piped `evolutionEdges` from main to
  renderer via a new IPC channel. Commit `d55ea59`.
- **Leg 3:** Built the species detail popup shell (sprite/name, "View Evolution Family"
  button toggling into Leg 2's tree with a Back button, bubble clicks re-center the popup)
  and wired its entry point (ⓘ info button) into DexTable/DexRow (List view) and
  DexBoxDetailPanel (Box view). Commit `bca697c`.
- **Leg 4:** Fixed a bug Vanny found while checking Leg 3 in the running app: the tree only
  ever showed descendants of whichever species/form the popup was opened on, never earlier
  stages. Root cause was in neither the root-walk logic nor the evolution data, as first
  suspected — `sqlite-storage.ts`'s `listSpeciesStmt`/`getSpeciesStmt` never selected
  `evolves_from_species_id` in the first place, so every `Species` object reaching the
  renderer had `evolvesFromSpeciesId: undefined`. `findEvolutionFamilyRootSpeciesId`'s
  `!== null` check treated `undefined` as "has a parent," looked it up, found nothing, and
  broke out immediately — always returning the current species as its own root. Commit
  `c5c8eb7`.

## Verification performed

Leg 4: confirmed the root-walk/build logic and the real `species-evolution.json`/
`evolution-edges.json` data were both already correct by reimplementing
`findEvolutionFamilyRootSpeciesId`/`buildEvolutionFamilyTree` in a throwaway script against
the real ~1025-species dataset — 0 root mismatches within a family, 0 tree-size mismatches
across every member of all 540 evolution families — before looking at the query layer and
finding the missing column. Added a regression test (`sqlite-storage.test.ts`) asserting
`listSpecies()`/`setCollapsedDisplayForm()` surface a real `evolvesFromSpeciesId`. Full suite
(614/614) and `tsc --noEmit` clean.

## What went well

- **Ruling out the two suspects the TODO item explicitly named (the root-walk and the
  evolution data) with a real-data script before touching any code** avoided a wasted edit
  to already-correct logic and pointed straight at the actual layer (the SQL query) once
  both were cleared.

## Friction points

- **The `as SpeciesRow` cast on `better-sqlite3`'s `.get()`/`.all()` results let a
  required, non-optional field (`Species.evolvesFromSpeciesId: number | null`) silently
  become `undefined` with no compile-time signal** — `is_final_evolution_stage` was added to
  the same two SELECT statements when that column was introduced, but
  `evolves_from_species_id` was missed on both queries. Worth remembering that any new
  `Species`/`Form`/etc. column needs to be added to every hand-written SELECT that feeds
  `toSpecies`/`toForm`/etc., since the type system won't catch a mismatch there.

## Scope creep

None. Leg 4 stayed to the one bug named in its TODO.md entry; the Hybrid-view entry point
gap Leg 3 deliberately deferred stays a separate unscheduled TODO item, not folded in here.

## What changes for the next milestone

Nothing follow-on filed specifically from this milestone. Next milestone not yet picked (see
TODO.md).
