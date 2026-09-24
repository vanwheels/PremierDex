# Completed: Encounter display rework

Archived from `COMPLETED.md` at the milestone boundary — see
`docs/postmortems/encounter-display-rework.md` and `MILESTONES.md`.

## [Encounter display rework] — Leg 4 — 2026-09-24
Vanny's post-Leg 3 tweaks: Dex Locations tab widened (66rem) and split into per-method tables (Wild/Surfing/Fishing/Headbutt/Rock Smash/Special, `encounterMethods.ts`), dex # dropped from the encounter tables, and opening a species from a location now starts the species page on that game's generation (`SpeciesDetailTarget.generation`). Separately, the whole Dex list row is now the click target for opening a species. Tests/typecheck only; visual check pending. See commits `38710ac` and `d042aab`.

## [Encounter display rework] — Leg 3 — 2026-09-24
Dex Locations sub-tab is now three panes (Games -> that game's Locations -> species at the location, each with grouped Method/Levels/Conditions rows). A per-location toggle row appears only for conditions the location's encounters actually vary in (time, season, weather, swarm, PokéRadar, GBA slot; `encounterConditions.ts`); long-tail conditions (trades, coins, Safari blocks) stay inline. Decided NOT to fold regional/alternate forms to one entry per species: encounters are per-form and "Alolan Rattata" vs "Rattata" is the point of a location view. Verified by tests/typecheck only; visual check pending. See commit `ef0a32c`.

## [Encounter display rework] — Leg 2 — 2026-09-24
Species page Where to Find game sections are now collapsed `<details>` with a "Gold — 41 locations" summary, filtered to the Gen I-IX toggle, with fixed shared column widths and tabular numerals. Extracted `WhereToFindBox.tsx`. Verified by tests/typecheck only; visual check pending. See commit `81dc47f`.

## [Encounter display rework] — Leg 1 — 2026-09-24
Added `groupEncounterDetails` (`encountersFormat.ts`) and switched the Species page Where to Find to a single inline Levels column. Not yet checked against real Rattata data (prototype predicted 490 rows). See commit `98a92e5`.
