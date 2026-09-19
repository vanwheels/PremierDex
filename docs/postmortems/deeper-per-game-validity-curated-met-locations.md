# Post-mortem: Deeper Per-Game Validity & Curated Met Locations

**Shipped:** 2026-09-19. Legs 1-2. Commits `d9d26b9`..`8bc9631`.

## What shipped

- **Leg 1 (design-only):** rather than build the milestone's originally-named scope
  (form/gender/ball-combo legality, a curated Met Location dataset, pre-evolution
  reachability) on assumption, read Vanny's real `premierdex.sqlite` directly to find what
  was actually causing false-positive Invalid Combo badges. All 903 were
  species-availability misses concentrated in three games, and the milestone's own
  headline example (Ivysaur/Ultra Moon) turned out not to be the pre-evolution-reachability
  case it was assumed to be. This cut the milestone down to a single concrete Leg 2, with
  form/gender/ball legality and curated Met Location both pushed back to Future Milestones
  gated on demonstrated need — see `docs/investigations/deeper-per-game-validity.md`.
- **Leg 2:** hand-curated postgame supplemental-availability data
  (`src/shared/data/supplemental-availability.ts`) for Platinum, Emerald, and Ultra Sun/
  Ultra Moon, unioned into `checkEntryValidity`'s existing species check. Before writing
  any data, re-verified Leg 1's own Great Marsh hypothesis against live Bulbapedia/Serebii
  research and then against the real invalid-species list — it didn't hold up at all. The
  actual mechanism turned out to be Pal Park (migrates anything already caught on a paired
  Gen III cartridge), modeled as a dex-name union rather than a hand-typed species list.
  Emerald and USUM's mechanisms needed similar factual correction before curating
  (Emerald's own Safari Zone gains a Johto pool; "Poké Pelago starter gifts" doesn't exist
  as a mechanic — Island Scan does). Result: 756 of the milestone's 903 false positives
  clear (84%).

## Verification performed

Leg 1: none (design-only, backed by direct read-only SQL queries against the real
collection). Leg 2: a dedicated research subagent verified each mechanism against
Bulbapedia/Serebii before any code was written; the resulting species lists were then
checked directly against `premierdex.sqlite` (read-only queries reproducing
`checkEntryValidity`'s logic) to confirm the actual false-positive count dropped as
expected, not just that the data looked plausible. `tsc --noEmit`, `vitest run` (407/407
passing), and `eslint .` all clean after the change.

## What went well

- **Leg 1's data-driven habit caught its own Leg 2 hypothesis being wrong before any code
  was written.** The milestone's original scope was reasoned about abstractly; Leg 1
  replaced that with a real query and cut two-thirds of the named scope. Leg 2 then applied
  the same discipline one level deeper — instead of trusting Leg 1's Great Marsh guess and
  hand-curating a list that would have shipped with zero actual effect, it re-verified the
  guess against live sources and the real data first, and found it wrong.
- **Delegating the mechanism research to a subagent kept the main context clean** while
  still producing a citable, cross-checked result (Bulbapedia raw wikitext + Serebii,
  cross-referenced) rather than a from-memory guess about 20-year-old game mechanics.

## Friction points

- **Leg 1's own headline hypothesis for Platinum (Great Marsh) turned out to be wrong**,
  discovered only when Leg 2 went to verify it against real data rather than transcribing
  it as given. The lesson generalizes: a data-driven investigation's own conclusions still
  need re-checking before the next leg builds on them, especially for claims about
  external systems (a 20-year-old game's mechanics) that weren't the direct subject of the
  original query.
- **A real, demonstrated need for evolution-chain reachability surfaced as a side effect**
  of Leg 2's fix (Ariados/Ledian/Flaaffy/Ampharos/Sunflora/Ambipom/Politoed/Ivysaur are
  evolutions of species the new supplemental data now covers) — the opposite of Leg 1's
  finding that pre-evolution reachability fixed zero real cases, because Leg 1 tested that
  idea before any supplemental data existed to make it useful. Filed as
  `[Evolution-chain reachability for species availability]` rather than folded into Leg 2.

## Scope creep

None absorbed unprompted. The Sinnoh-legendary dex-completeness gap (Heatran/Regigigas/
Cresselia/Shaymin missing from PokeAPI's own `extended-sinnoh` fetch) was folded into
Leg 2 rather than filed separately, since it was a single already-verified fact (4 ids)
directly adjacent to the same file and the same re-run verification, not new scope. A
residual handful of false positives with no confirmed in-game source at all (Cyndaquil,
Dunsparce, Qwilfish, Smoochum, Nuzleaf) were left undiagnosed rather than guessed at.

## What changes for the next milestone

- `[Evolution-chain reachability for species availability]` is a real, now-demonstrated
  follow-up (TODO.md) — worth picking up once `species-evolution.json` next needs a
  fetch-script touch, rather than as its own dedicated leg immediately.
- Curated Met Location dataset and per-game form/gender/ball-combo legality both remain in
  Future Milestones, still gated on the same conditions Leg 1 set (demonstrated intent to
  use Met Location; a real false positive or wrong-game forme actually surfacing for the
  ball/form axis).
