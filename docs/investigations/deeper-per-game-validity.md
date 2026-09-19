# Deeper per-game validity: what's actually worth building

Design output for [Scope per-game form/gender/ball legality + curated Met Location
dataset] — Leg 1. No code in this leg. Same shape as `dex-completeness-tiers.md`'s Leg 1:
nail down what the milestone actually covers before building it — except this time the
scoping question the TODO item posed had a testable answer, so this doc answers it against
Vanny's real collection (`premierdex.sqlite`, read-only queries, not modified) rather than
reasoning about it in the abstract.

## The question Leg 1 was asked to resolve

TODO.md's framing: fixing just the obtainability model (postgame unlocks + pre-evolution
reachability) might already clear most of the false-positive Invalid Combo badges, which
would make Leg 2 much smaller than the full form/gender/ball-combo legality + curated
Met Location scope the milestone name implies. Worth confirming before committing to that
larger scope.

**Answer: partially.** Obtainability is indeed where the real problem lives (903 of 903
current false positives are a species-availability miss — zero come from the ball check),
but the specific fix the TODO item proposed for it — pre-evolution reachability — turns
out not to be the lever. The real gap is postgame *encounter/gift mechanics* that PokeAPI's
regional-dex data has no representation of at all, and it's heavily concentrated in two
games rather than spread evenly. See below.

## What the data actually shows

Query: every owned `collection_entries` row with a non-null `origin_game`, run through
`checkEntryValidity`'s existing logic against the committed `species-availability.json`.

- 4,228 owned entries carry an origin game.
- **903 (21%) are flagged invalid — all 903 on the species-availability check.** The
  caught-ball check flagged zero: Legends Arceus is the only game with a defined ball pool
  today, and no PLA entry in the collection has `caught_ball` set at all, so that axis is
  currently inert for this user regardless of how the pool data reads.
- Of the 903, **686 (76%) are Pokémon Platinum, 105 (12%) are Pokémon Emerald** — 88%
  combined. The remainder is Ultra Sun (28), Ultra Moon (28), and single-digit counts each
  for Shining Pearl, LeafGreen, White 2, Pearl, Sword, Violet, Alpha Sapphire.
- Platinum's 686 are near-entirely full evolutionary lines of ordinary Kanto/Johto species
  (Caterpie/Metapod/Butterfree, Pidgey/Pidgeotto/Pidgeot, Rattata/Raticate, Sandshrew/
  Sandslash, Oddish/Gloom/Vileplume, Poliwag/Poliwhirl/Poliwrath, Cubone/Marowak, dozens
  more) — species with no relationship to Sinnoh at all. `gameToPokedexes['platinum']`
  resolves to `extended-sinnoh` only (210 species, the base+postgame *Sinnoh* dex). The
  actual source is almost certainly Platinum's Great Marsh: after the National Dex unlock
  it hosts a large rotating daily encounter list spanning nearly every prior-gen species,
  which is a `/location-area` encounter table, not a regional Pokedex — nothing
  `fetch-species-availability.ts` reads captures it, and nothing in PokeAPI's
  `/pokedex`-shaped data could represent it without pulling in a structurally different
  endpoint.
- Emerald's 105 (Mew, Lugia, Ho-oh, plus a Johto-species cluster — Cyndaquil, Ledyba/
  Ledian, Spinarak/Ampharos line, Sunkern/Sunflora, Stantler, Miltank, Ambipom) mixes
  event-distribution legendaries with what's very likely a similar
  expanded-encounter-zone story, unconfirmed in detail but same shape as Platinum: a
  non-dex mechanic.
- **The TODO item's own headline example doesn't hold up under the data.** Ivysaur/Ultra
  Moon was cited as "reachable by evolving a caught Bulbasaur." Checked directly: Bulbasaur
  isn't in any of Ultra Moon's five regional-dex entries either (`updated-alola` and its
  three island sub-dexes). The real path is almost certainly USUM's Poké Pelago
  (Isle Aplenny/Abeens) starter-gift minigame, unlocked postgame — another mechanic outside
  regional-dex data, and one where the *pre-evolution* (Bulbasaur) was never obtainable by
  normal encounter either. A pre-evolution-reachability rule built on top of
  `species-evolution.json` would have flagged this exact chain the same way it's flagged
  today — **it fixes zero of the sampled real cases**, because in every checked instance the
  root of the chain was never in the base dex to begin with.
- Met Location: **0 of 5,172 owned entries have it set.** The free-text field the milestone
  proposes replacing with a curated dataset has never been used once.

## What this changes about the milestone's scope

**Pre-evolution reachability is not the fix.** It's still a correct, cheap addition in
principle (extending `species-evolution.json` from its current `isFinalEvolutionStage`-only
shape to full parent/child edges, then walking ancestors in `checkEntryValidity`), but the
investigation found no real false positive in this collection it would clear. Not worth
building as the headline Leg 2 deliverable; fine as a small bonus once other work touches
that file, not before.

**The actual lever is postgame encounter/gift data, and it doesn't need all 41 games.**
88% of current false positives come from exactly two games. A Leg 2 that curates postgame
availability for Platinum (Great Marsh's expanded encounter list) and Emerald (whatever its
equivalent turns out to be, needs its own confirmation) would clear the large majority of
today's false-positive volume. USUM's Ultra Wormhole (which explains the Tornadus/
Thundurus/Reshiram/Zekrom/Landorus/Yveltal cluster in the 28+28 count — Ultra Space lets
you catch almost any past legendary postgame) and Poké Pelago starter gifts are a third,
smaller, well-defined addition — worth including since the milestone's own motivating
example lives there. Every other game with zero observed false positives should stay
un-curated until (if ever) it actually produces one — matching how the ball-pool dataset
already works (Legends Arceus only, everything else falls back to "no data, don't flag").
This is a fundamentally different shape of dataset than `species-availability.json`: not a
per-game regional-dex pull, but a **per-mechanism supplemental unlock list** (Great Marsh's
species pool; Ultra Wormhole's "any past legendary/mythical" rule; Pelago's starter list),
hand-curated per mechanism rather than fetched, closer in spirit to `BALL_POOLS`' hand-built
narrow entries than to the PokeAPI-driven regional dex fetch.

**Ball-combo and form/gender-combo legality have no demonstrated need yet.** Zero current
false positives trace to the ball check. No investigation was done into per-game gender
anachronisms (e.g. a Gen I origin game with a non-`unknown` gender recorded — Gen I predates
the gender mechanic entirely) or the held-item-forme gaps `held-item-form-change-gap.md`
already catalogued (Zacian/Zamazenta version exclusivity, Ogerpon masks, Silvally's
`dex_distinct`/`non_boxable` inconsistency) because nothing in the data shows they're
currently producing bad badges. Recommend leaving both off the leg sequence entirely rather
than scoping them speculatively — pick them up only if a real false positive (or a
version-exclusive forme logged against the wrong game) actually surfaces, same "don't build
past what's shown to matter" reasoning as the ball-pool dataset's existing narrow scope.

**Curated Met Location dataset shouldn't be built yet.** Zero adoption today means there's
no evidence this is a field Vanny actually wants to fill in — a 41-game, route-level
curated location dataset is a large, multi-session undertaking (comparable in cost to its
own milestone, not a leg), and building it speculatively ahead of any usage signal
contradicts the "document/build patterns only once established" instinct that already
governs this project's docs. Recommend moving this half out of the current milestone
entirely — back to Future Milestones, gated on Vanny confirming she intends to start using
Met Location before it's scoped further. If/when that confirmation comes, worth scoping
small first (e.g. major cities/routes only, or a free-text field with lightweight
autocomplete suggestions drawn from a short hand list) rather than committing to exhaustive
per-route coverage up front.

## Recommended Leg 2 scope

A single, concrete, data-driven leg: hand-curate postgame supplemental-unlock data for
Platinum (Great Marsh) and USUM (Ultra Wormhole legendary/mythical list + Poké Pelago
starter gifts), confirm Emerald's mechanism and curate it too, and extend
`SpeciesAvailabilityData` (or a sibling dataset — shape TBD by whoever picks this up, likely
a `supplementalAvailability: Record<gameId, number[]>` unioned into the existing check
rather than a schema change) to consume it. Re-run this same DB query afterward to confirm
the false-positive count actually drops before considering the obtantability half done.
Everything else this milestone originally named (form/gender/ball-combo legality, curated
Met Location) moves out of the current milestone per the two sections above.

## Handoff

- **Leg 2:** postgame supplemental-unlock data for Platinum + Emerald + USUM, per "Recommended
  Leg 2 scope" above. Should close the milestone if the false-positive count drops as
  expected — no reason to believe the remaining scope (form/gender/ball, Met Location) needs
  its own leg right now.
- **Future Milestones:** curated Met Location dataset, gated on Vanny confirming actual
  intent to use the field. Form/gender/ball-combo legality, gated on a real false positive
  or wrong-game forme actually surfacing (not scoped speculatively).
