# Post-mortem: Species/Dex reference data layer

**Shipped:** 2026-09-25. Legs 1-8. Commits `4233d13`..`ff0f2a8`. Full leg log:
`docs/completed-archive/species-dex-reference-data-layer.md`.

## What shipped

- **Leg 1:** per-form types, base stats and PokeAPI's `past_types`/`past_stats`/`past_abilities`
  in `species-details.json`, plus `resolveFormAtGeneration` (`src/shared/form-history.ts`).
- **Leg 2:** per-species egg groups and raw `hatchCounter`, with a slug -> English name table.
- **Leg 3:** per-form learnsets (`learnsets.json`, 3.7 MB, 1329 forms, 24 version groups) with
  their own IPC channel.
- **Leg 4:** move metadata (`moves.json`, 822 moves) via `npm run fetch-move-data`, own IPC channel.
- **Leg 5:** investigation only — `docs/investigations/per-version-variance.md`. PokeAPI already
  models per-version-group variance except evolution methods; no override table built.
- **Leg 6:** base egg steps made per-generation (fixing Leg 2's Gen IV-only assumption).
- **Leg 7:** move display names and a flavor-text fallback for the 88 moves with no effect text.
- **Leg 8:** name-keyed maps in `species-details.json` sorted on write so regeneration diffs are clean.

## Verification performed

`vitest run` 738/738 passing at milestone close. Each leg added unit tests for its shared logic.
No UI consumers exist by design, so nothing was checked visually. The Leg 8 sort was applied to the
committed JSON offline; the fetch script itself was not re-run against live PokeAPI afterward.

## What went well

- Scoping corrected the original item text before any code: egg groups, `hatch_counter` and
  movesets all came from endpoints the scripts already hit, so only moves needed a new endpoint.
- Splitting learnsets and moves into their own files/IPC channels kept `species-details.json` small.
- Leg 5 answered "do we need an override table?" with a documented no, instead of building one.

## Friction points

- **Two data-correctness gaps were fixed in follow-up legs:** Leg 2's egg-step formula was only right
  for Gen IV (Leg 6), and Leg 4's `moves.json` lacked display names and left 88 moves without an
  effect string (Leg 7).
- Non-deterministic key order in `species-details.json` was tracked as an Unscheduled item and only
  fixed in the final leg.

## Scope creep

Legs 6-8 were added after the original scope, but each was a fix to this milestone's own output,
not new capability. The per-version override table was explicitly not absorbed (Leg 5 deferred it).

## What changes for the next milestone

- For fetched datasets, consider spot-checking a few known values per generation/era before calling a leg done.
- Make fetch-script output deterministic in the leg that creates it.
- The consuming UI (Dex tab Types/BST columns, Moves sub-tab, move/egg-group search, Species page
  generation toggle) is the follow-up milestone; not yet scoped.
- Open item carried to Unscheduled: `Evolution methods per version group`, the one real
  per-version gap Leg 5 found.
