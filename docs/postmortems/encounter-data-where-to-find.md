# Post-mortem: Encounter data + Where to Find (PokeAPI-covered games)

**Shipped:** 2026-09-23. Legs 1-3. Commits `f1984cf`..`83c7442`.

## What shipped

- **Leg 1:** `scripts/fetch-encounters.ts` fetched PokeAPI's per-`/pokemon/{id}/encounters`
  dataset live for all 1329 distinct form pokeapiIds, restricted to the 22 PokeAPI-covered
  version groups (Gen 1-7, Let's Go, Sword/Shield + Isle of Armor/Crown Tundra DLC,
  Colosseum/XD) per `docs/investigations/pokeapi-encounter-coverage.md`. Wrote 927 forms'
  worth of encounters (1432 location areas, 64 methods, 38 versions) to
  `data/pokemon/encounters.json`, with dedup tables for location-area/method/version names.
- **Leg 2:** wired that dataset through IPC/preload/`useCollectionData` (`loadEncounters`),
  same static-file loading pattern as `speciesAvailability`/`speciesDetails` — no UI
  consumer yet.
- **Leg 3:** the "Where to Find" field on `SpeciesPage` — `encounterLocationsForForm`
  (`encountersFormat.ts`) groups the raw per-location/version/method rows into a per-location
  list, deduping versions that share an identical method/level/chance/condition combination
  into one games label (same precedent as Leg 5 of the Species database milestone's
  `safari-flee-rates.ts` Ruby/Sapphire/Emerald grouping). Sword/Shield's Isle of Armor/Crown
  Tundra DLC version names have no `ORIGIN_GAMES` entry of their own, so they resolve back to
  the base game id for sorting with a "(Isle of Armor)"/"(Crown Tundra)" suffix on the label.

## Verification performed

`tsc --noEmit`, `vitest run` (656/656 passing at milestone close), and `eslint .` clean after
every leg. Leg 3's grouping/formatting logic was also run directly against the real, live
`data/pokemon/encounters.json` (not just constructed test fixtures) via a throwaway vitest
case — confirmed correct output for Pikachu's DLC max-raid dens (games grouped and
DLC-suffixed correctly), a Celadon Prize Corner gift encounter with a coin-cost condition
value, and level-range/chance formatting — before that check was deleted.

## What went well

- **Splitting the original "encounter tables + location/game search UI" idea into this data
  milestone and a separate future map-UI milestone (see TODO.md's Future Milestones) kept
  this milestone's scope tight.** Three legs, no map assets or new `AppView` needed — just
  data fetch, IPC wiring, and a Dex-integrated proof of concept, exactly as scoped 2026-09-23.
- **PokeAPI's version names matched `ORIGIN_GAMES` ids exactly for every version except the
  four Isle of Armor/Crown Tundra DLC names**, confirmed while building Leg 3's
  `gameRefForVersion` — a direct id lookup covered the vast majority of games with no mapping
  table needed, and only the DLC's own 4 names needed a small explicit override.

## Friction points

- None worth recording — the three legs proceeded in the order scoped, with no rework.

## Scope creep

None absorbed. Leg 3 stayed to a text list tied into the existing `SpeciesPage`, not the
location/game browse UI with maps — that stayed split out to its own future milestone as
scoped at the outset.

## What changes for the next milestone

- The Location/game browse UI with maps (see TODO.md's Future Milestones) is the natural
  follow-on now that `encounters.json` exists, but still needs its own scoping pass (map
  assets, per-era treatment) before a leg sequence can be planned.
- Brilliant Diamond/Shining Pearl, Legends Arceus, Scarlet/Violet (+ DLC), and Legends Z-A
  remain undeferred — zero PokeAPI encounter coverage, left for a later hand-curation pass
  (same reactive, opt-in-per-game posture as `BALL_POOLS`/Met Location) if/when wanted.
- No next milestone is picked yet.
