# Post-mortem: Species database: full per-species pages

**Shipped:** 2026-09-23. Legs 1-5. Commits `be981f8`..`b69f4c7`.

## What shipped

- **Leg 1:** `scripts/fetch-species-details.ts` fetched PokeAPI's per-species/per-form
  dataset live (1025 species, 1329 forms, 6 growth rates, 313 abilities) into
  `data/pokemon/species-details.json`.
- **Leg 2:** wired that dataset through IPC/preload/`useCollectionData`, no UI yet.
- **Leg 3:** the page itself — a new `SpeciesPage` component reached via "View Full Page"
  from `SpeciesDetailPopup`, rendered as a real `AppView` sibling. Showed the fields Vanny's
  2026-09-22 triage confirmed wanted: abilities + descriptions, base happiness, experience
  growth, EVs earned, gender ratio, base catch rate.
- **Leg 4:** the catch-probability calculator on top of Leg 3's static catch rate — Gen
  III-VII shake-check formula, scoped to the five fixed-bonus balls (situational balls
  deferred to TODO.md's Unscheduled section).
- **Leg 5:** curated Safari Zone flee rate — the one wanted field PokeAPI has no data for
  at all. Sourced directly from three games' decompiled code (pret/pokeruby,
  pret/pokeemerald, pret/pokefirered) rather than a wiki, since no wiki tabulates the value
  per species. Shipped two verified tables (Hoenn Safari Zone Areas 1-4; Kanto Safari Zone
  remake), each on its own numeric scale, both left absent from every other game rather
  than guessed at.

## Verification performed

`tsc --noEmit`, `vitest run` (649/649 passing at milestone close), and `eslint .` clean
after every leg. Leg 5's data verified against primary sources (each game's own
decompiled `SpeciesInfo`/`species_info.h`/`base_stats.h`, fetched live via `gh`/`curl`), not
a wiki summary — Ruby and Emerald cross-checked against each other and found
byte-for-byte identical, catching that Emerald's own Areas 5-6 Johto additions carry a flee
rate of 0 in the source (not a real curated value) before it could ship as fabricated data.

## What went well

- **The reactive, opt-in-per-species shape (BALL_POOLS/curated Met Location's own
  precedent) scaled down cleanly to a field with only two curated locations.** No pressure
  to fabricate values for Great Marsh, the Johto Safari Zone, or any other Safari-Zone-style
  mechanic just to look complete — left absent, same as every other curated dataset in this
  codebase does for a game it hasn't gotten to yet.
- **Checking primary source code instead of a wiki summary paid off immediately.** An early
  WebFetch summary of Bulbapedia's Hoenn Safari Zone page listed Marill/Wooper/Quagsire as
  water encounters; the actual decompiled data shows all three at flee rate 0 (i.e., not
  really in the curated set). Cross-checking against the source before writing any data
  caught this before it shipped, same lesson the Curated Met Location milestone's own
  post-mortem already flagged about WebFetch summaries.

## Friction points

- **Leg 5 needed real research before any code could be written** — PokeAPI's gap wasn't
  discovered until this leg started (TODO.md's leg description already noted "confirmed live
  2026-09-23"), and the actual data source (ROM decompilation projects, not a Pokémon wiki)
  wasn't obvious going in. Took several rounds of web search and direct GitHub API/raw-file
  fetches to land on `pret/pokeruby`'s `safariZoneFleeRate` field as ground truth before any
  implementation work started.

## Scope creep

None absorbed. Leg 5 stayed scoped to the two Safari Zone locations with a verified,
source-confirmed per-species value (Hoenn Areas 1-4, Kanto remake) rather than expanding to
cover every Safari-Zone-style mechanic across every generation — Great Marsh and the Johto
Safari Zone remain uncurated, left for a follow-on leg if actually wanted rather than
speculatively built now.

## What changes for the next milestone

- Movesets and breeding/egg groups were deliberately kept out of this milestone's leg
  sequence (see TODO.md's original scoping note) — candidates for a follow-on
  species-database milestone if Vanny wants them.
- No next milestone is picked yet.
