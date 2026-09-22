# Post-mortem: Curated Met Location dataset

**Shipped:** 2026-09-21. Legs 1-28. Commits `e842382`..`476d0bc`.

## What shipped

- **Leg 1 (design-only):** resolved the two open questions `deeper-per-game-validity.md`
  had left unanswered — a restricted `<select>` once a game is curated (not free-text
  suggestions), and narrow/opt-in per game rather than a broad shallow pass. Same reactive
  posture as `BALL_POOLS`.
- **Leg 2:** built the mechanism — `metLocationsForGame`/`MET_LOCATIONS` in
  `met-locations.ts`, wired into `OriginModal`'s Met Location field.
- **Legs 3-27:** one leg per "map family," each adding a named base array to
  `met-locations.ts` and extending `met-locations.test.ts`. Restructured mid-stream at Leg
  4, after Vanny flagged three domain corrections: paired versions (Red/Blue, Gold/Silver,
  etc.) share one map and don't need separate legs; Gift Pokémon/Mystery Gift record the
  fixed string "Fateful Encounter," not a real place; and Generation V's Black City/White
  Forest is a real within-pair location split, not assumed away. That collapsed the
  remaining Legs 5-43 (one-game-per-leg) down to Legs 5-28 (one-per-family), and the
  restructure held for the rest of the milestone with no further rework — three more
  within-pair splits turned up later (Team Magma/Aqua Hideout, Black Gate/White Gate, Black
  Tower/White Treehollow) and slotted into the same shared-base-plus-splice shape cleanly.
- **Leg 28:** Pokémon GO — the one entry with no in-game map or location-index data at all.
  Asked Vanny directly how to structure it rather than guessing a taxonomy, and shipped a
  normalized six-continent `GO_REGIONS` list per her call.

## Verification performed

Every leg verified against Bulbapedia (raw wikitext preferred over summarized reads — see
Friction) and/or Serebii before committing. `met-locations.test.ts` grew one describe
block per leg. `tsc --noEmit`, `vitest run`, and `eslint .` all clean after every leg;
final state 604/604 tests passing.

## What went well

- **Leg 1's scoping call (opt-in per curated game, not a broad shallow pass) held for the
  entire 28-leg run** with no rework needed.
- **The Leg 4 restructure (shared base array + version-specific splice) scaled cleanly**
  through every subsequent generation, including three more confirmed within-pair location
  splits beyond the originally-known Black City/White Forest.
- **Pulling raw wikitext instead of trusting WebFetch's summarized reads caught real
  fabrications** before they could ship as fact (Leg 15's impossible Olivine Lighthouse row
  in the wrong range; Leg 27's fabricated Mega Dimension DLC index breakdown).
- **Leg 28 stopped to ask instead of extending a mainline-game pattern that didn't actually
  fit** — Pokémon GO's regional-exclusive data is inconsistent free text with no clean
  enumerable shape, and guessing a taxonomy (verbatim Serebii strings, or a
  regions-plus-named-events split) risked shipping something expensive to walk back.

## Friction points

- **WebFetch's summarized reads of Bulbapedia pages fabricated plausible-looking wrong data
  at least twice** (Legs 15 and 27), each caught only by re-fetching raw wikitext and
  cross-checking ranges/counts directly against it. Real, recurring cost every time it
  happened — worth defaulting to raw wikitext from the start on any future index-table
  research rather than trying the summarized read first.
- **`met-locations.test.ts` passed the 500-line hard cap by Leg 19 and kept growing every
  leg after**, reaching 1330 lines by Leg 28. Flagged to Codebase File-Size Cleanup rather
  than split mid-milestone (each leg's own scope was one map family, not a file
  reorganization), but it's now well past due for that split.
- **No single verification method covered the whole milestone.** Generations with a
  Bulbapedia location-index page (I-VI, Legends Arceus, Legends Z-A) verified against raw
  wikitext directly; Generations VII and IX have no such page and needed a different
  method each time (category sweeps cross-checked per-article); Pokémon GO had neither and
  needed a design decision instead of a verification pass at all.

## Scope creep

None absorbed unprompted across 28 legs. DLC areas (Sword/Shield's Isle of Armor/Crown
Tundra, Scarlet/Violet's Teal Mask/Indigo Disk, Legends Z-A's Mega Dimension) were folded
into their base game's shared list on direct precedent rather than treated as new scope.
Every side-finding (the test-file split, future-milestone candidates) was filed to TODO.md
instead of being built in-leg.

## What changes for the next milestone

- Codebase File-Size Cleanup's `met-locations.test.ts` split entry is now overdue rather
  than just flagged — worth prioritizing before any future leg adds to that file further.
- No next milestone is picked. Future Milestones currently lists five candidates not fully
  blocked (Backup/Export Completeness, Codebase File-Size Cleanup, Remove "Unassigned"
  default, Species detail popup, Full UI/UX pass) plus one still gated on unmet conditions
  (Per-game form/gender/ball-combo legality) — Vanny's call, same as prior transitions.
- Leg 28's habit generalizes: when a leg's data genuinely has no precedent to extend (no
  index table, no map, no prior format to follow), stop and ask rather than picking a
  structure unilaterally — cheap to do before any code exists, expensive to unwind after.
