# Completed: Species/Dex reference data layer

Archived from `COMPLETED.md` at the milestone boundary — see
`docs/postmortems/species-dex-reference-data-layer.md` and `MILESTONES.md`.

## [Species/Dex reference data layer] — Leg 8 — 2026-09-25
The `growthRates`/`eggGroups`/`abilities` maps in `species-details.json` are now key-sorted on write (`sortRecord`), and the committed file was re-sorted once. `species`/`forms` needed no change — integer keys already serialize in ascending order. See commit `ff0f2a8`.

## [Species/Dex reference data layer] — Leg 7 — 2026-09-25
`moves.json` entries now carry an in-game English `name` (`Double-Edge`, `U-turn`), and the 88 moves that
had `effect: null` fall back to the newest English flavor text (whitespace-collapsed), so no move is
left without an effect string. Flavor text is longer and less mechanical than a short effect; the type
comment says so. See commit `29336b8`.

## [Species/Dex reference data layer] — Leg 6 — 2026-09-25
Base egg steps are now per-generation: `baseEggSteps(hatchCounter, generation)` uses 256 (II/III/VII),
255 (IV), 257 (V/VI), 128 (VIII/IX), defaulting to Gen IX. BDSP reads as 128 since it's keyed by
generation number, not game — accepted imprecision, noted in the file. See commit `f7d3491`.

## [Species/Dex reference data layer] — Leg 5 — 2026-09-25
Investigation only, no override table. PokeAPI already models learnsets and move history per version
group and types/stats/abilities per generation; the one real gap is evolution methods, whose per-entry
`version_group` tag `fetch-evolution-chains.ts` discards (scheduled in Unscheduled). See
`docs/investigations/per-version-variance.md`.

## [Species/Dex reference data layer] — Leg 4 — 2026-09-25
Move metadata (type, damage class, power, accuracy, PP, English short effect, `past_values`) for all 822
learnset moves in `data/pokemon/moves.json` (139 KB) via new `npm run fetch-move-data`, with its own
`loadMoves` IPC channel and `moveData` in `useCollectionData`. 88 Gen VIII/IX moves have `effect: null`
(PokeAPI has no effect text for them) — see Unscheduled. See commit `14f06c8`.

## [Species/Dex reference data layer] — Leg 3 — 2026-09-25
Per-form learnsets written to `data/pokemon/learnsets.json` (3.7 MB, 1329 forms, 822 moves, 24 version groups)
from the same `/pokemon/{id}` pass as species details, with its own `loadLearnsets` IPC channel and
`learnsetData` in `useCollectionData`. Per-version-group granularity; entries identical across groups are
merged, names deduped into sorted tables. See commit `d197018`.

## [Species/Dex reference data layer] — Leg 2 — 2026-09-25
Per-species `eggGroups` (slugs) and raw `hatchCounter` added to `SpeciesDetailEntry`, plus an
`eggGroups` slug -> English name table (slugs don't title-case to in-game names, e.g. `plant` ->
Grass). `baseEggSteps` in `src/shared/egg-steps.ts` converts cycles to steps using the spec's
`cycles * 255 + 255`, which is only the Gen IV convention (fixed in Leg 6). See commit `0a60908`.

## [Species/Dex reference data layer] — Leg 1 — 2026-09-25
Per-form types, base stats and PokeAPI's `past_types`/`past_stats`/`past_abilities` (incl. per-era EV
yield and Gen I `special`) added to `FormDetailEntry` and regenerated `species-details.json`; parsing
and a `resolveFormAtGeneration` layering helper live in `src/shared/form-history.ts` with tests. Existing
`speciesDetails` load path needed no changes. See commit `4233d13`.
