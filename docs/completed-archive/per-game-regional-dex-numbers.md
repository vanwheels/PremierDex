# Completed: Per-Game Regional Dex Numbers

Archived from `COMPLETED.md` at the milestone boundary — see
`docs/postmortems/per-game-regional-dex-numbers.md` and `MILESTONES.md`.

## [Per-Game Regional Dex Numbers Leg 2: capture entry numbers and wire into detail panels] — 2026-09-20
`fetch-species-availability.ts` now captures each PokeAPI dex entry's `entry_number` into a
new `entryNumbers` field on `SpeciesAvailabilityData` (re-run live against PokeAPI;
`data/pokemon/species-availability.json` refreshed — 32 distinct dexes). `src/shared/data/
regional-dex-names.ts` hand-curates all 32 dex names to a display name; `regionalDexNumbersForGame`
(`src/renderer/dex/regionalDexNumbers.ts`) looks up every applicable dex's number for a
species + origin game, per Leg 1's "show all, don't collapse" decision, and is wired into
`DexBoxDetailPanel.tsx`/`DexHybridDetailPanel.tsx` below the existing Origin Game field —
checked for other sibling detail panels showing a per-entry dex number field; none found.
Verified in the running app (Vanny) — multi-dex rendering (Kalos X/Y sub-dexes, Sun/Moon up
to 5 numbers) confirmed. See commit `a040fa6`.

## [Per-Game Regional Dex Numbers Leg 1: scoping] — 2026-09-20
Resolved the two open questions from the TODO item: numbering ties to the entry's
`originGame`, and the 11 of 40 games mapping to multiple regional dexes (Kalos's 3
co-equal sub-dexes; Alola/Galar/Paldea's base+sub-region/DLC dexes) show every applicable
dex's number rather than collapsing to one (Vanny's call, AskUserQuestion). Confirmed the
regional dex number itself needs no new fetch — PokeAPI's `/pokedex` response (already
fetched by `fetch-species-availability.ts`) carries `entry_number` per species; the script
just discards it today. No code changed this leg. See
`docs/investigations/regional-dex-numbers.md`. Commit `ab5cdc3`.
