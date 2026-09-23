# Completed: Species database: full per-species pages

Archived from `COMPLETED.md` at the milestone boundary — see
`docs/postmortems/species-database-full-per-species-pages.md` and `MILESTONES.md`.

## [Safari Zone flee rate (curated, opt-in)] — 2026-09-23
Leg 5 of the Species database: full per-species pages milestone — last leg, closes out the
milestone. PokeAPI has no flee-rate field anywhere, and it isn't tabulated per-species on
Bulbapedia/Serebii either, so this needed data sourced directly from each game's own
decompiled code (pret/pokeruby, pret/pokeemerald, pret/pokefirered on GitHub each store a
`safariZoneFleeRate` byte per species). Verified live 2026-09-23: Ruby and Emerald produce
identical values for the 19 species in Hoenn Safari Zone Areas 1-4; FireRed/LeafGreen's
Kanto Safari Zone has its own separate 24-species table on a different numeric scale.
Emerald's Areas 5-6 Johto additions carry a flee rate of 0 in the source and are left
uncurated rather than guessed at — same reactive, opt-in-per-species posture as
`BALL_POOLS`/curated Met Location. New `safari-flee-rates.ts`, wired into `SpeciesPage` as
a field that only renders when a species has curated data. See commit `b69f4c7`.

## [Catch-probability calculator] — 2026-09-23
Leg 4 of the Species database: full per-species pages milestone. Added
`catchProbability.ts` (Gen III-VII shake-check formula, scoped to the five fixed-bonus
balls — Poké/Great/Ultra/Safari/Master) and wired current-HP%/status-condition/Poké-Ball
inputs into `SpeciesPage` on top of Leg 3's static base catch rate. Situational balls
(Quick, Timer, Net, etc.) deferred — see TODO.md's Unscheduled section. See commit
`010ead0`.

## [Full species page shell + core wanted fields] — 2026-09-23
Leg 3 of the Species database: full per-species pages milestone. New `SpeciesPage`
component, reached via a "View Full Page" button on `SpeciesDetailPopup`'s info view and
rendered as a new `species` sibling of `App.tsx`'s `AppView` enum (the same "real page"
precedent Trainer Profiles/Storage Locations already used). Shows normal/shiny sprite
thumbnails (SpriteModal's new `initialShiny` prop) plus abilities + descriptions, base
happiness, experience growth, EVs earned, gender ratio, and base catch rate off Leg 2's
`speciesDetails` dataset, formatted by new unit-tested helpers in `speciesPageFormat.ts`. No
calculator yet (Leg 4). See commit `60dcade`.

## [Wire species-detail dataset through IPC + renderer] — 2026-09-23
Leg 2 of the Species database: full per-species pages milestone. Added
`PokemonIpcChannel.loadSpeciesDetails`, its `pokemon-ipc.ts` handler, the preload
bridge/index methods, and a `speciesDetails` slot in `useCollectionData` — same
one-line-per-file pattern as `loadEvolutionEdges`/`loadFormeSwitchGroups`. No UI; verified
via a clean `npm run typecheck` and confirming `data/pokemon/species-details.json` (Leg 1's
live fetch output) is in place to be read.

## [PokeAPI species-detail dataset fetch] — 2026-09-23
Leg 1 of the Species database: full per-species pages milestone. Wrote
`scripts/fetch-species-details.ts`, `src/shared/types/species-details.ts`, and
`loadSpeciesDetailsData()`, then ran the fetch live against PokeAPI (1025 species, 1329
distinct forms, 6 growth rates, 313 abilities). See commit `be981f8`.
