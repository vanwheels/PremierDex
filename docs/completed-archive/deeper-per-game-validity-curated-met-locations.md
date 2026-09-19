# Completed: Deeper Per-Game Validity & Curated Met Locations

Archived from `COMPLETED.md` at the milestone boundary — see
`docs/postmortems/deeper-per-game-validity-curated-met-locations.md` and `MILESTONES.md`.

## [Postgame supplemental-availability data: Platinum + Emerald + USUM] — Leg 2 (2026-09-19)
Closed the milestone: re-checking Leg 1's own Great Marsh hypothesis against real
Bulbapedia/Serebii data found zero overlap with Vanny's actual 98 invalid Platinum
species — the real mechanism is Pal Park (Platinum can migrate any Pokémon from a paired
Gen III cartridge), modeled as a Kanto+Hoenn dex-name union rather than a hand-typed list
since that's literally what Pal Park draws from. Emerald (Safari Zone Johto pool + Mew/
Lugia/Ho-Oh events) and USUM (Ultra Wormhole legendaries + Island Scan, not the assumed
"Poké Pelago starter gifts," which doesn't exist as a mechanic) also got corrected against
live research before curating. Re-running Leg 1's query: 756 of the milestone's 903
false positives now clear (84%). Full pivot writeup in
`docs/investigations/deeper-per-game-validity.md`'s "Leg 2 update" section. See commit
`8bc9631`.

## [Scope per-game form/gender/ball legality + curated Met Location dataset] — Leg 1 (2026-09-19)
Design-only leg, resolved against real data rather than just reasoning about it: read
`premierdex.sqlite` directly (read-only) to find that all 903 current Invalid Combo false
positives are species-availability misses (zero from the ball check), 88% concentrated in
just two games (Platinum, Emerald), and that the milestone's own headline
pre-evolution-reachability example (Ivysaur/Ultra Moon) doesn't actually hold up — the real
gap is postgame encounter/gift mechanics PokeAPI's regional-dex data can't represent at
all, not evolution-chain reachability. Full write-up and the resulting scope split (a
narrow Leg 2, plus form/gender/ball legality and curated Met Location both pushed to Future
Milestones, gated on demonstrated need) in `docs/investigations/deeper-per-game-validity.md`.
