# Ribbons/Alpha/Size/Capture Date: what each marker actually needs

Design output for [Scope Ribbons/Alpha/size/capture-date tracking] — Leg 1. No code in this
leg. Same shape as `dex-completeness-tiers.md` and `deeper-per-game-validity.md`'s own Leg
1s: nail down representation and real scope before building, verified against
Bulbapedia/Serebii rather than from memory, and checked against Vanny's real collection
(`premierdex.sqlite`, read-only query, not modified) where that data is informative.

## What the collection actually shows

Owned entries by origin game (5,172 total owned), the ones relevant to this milestone:

| Game | Owned entries |
|---|---|
| Pokémon Legends: Z-A | 693 |
| Pokémon Legends: Arceus | 511 |
| Pokémon Violet | 497 |
| Pokémon Scarlet | 112 |
| Pokémon GO | 168 |
| Pokémon Sword | 42 |
| Pokémon Shield | 14 |

Legends Arceus + Legends Z-A alone are 1,204 entries (23% of the collection) — Alpha and
Size aren't a minor afterthought the way the original TODO framing ("Alpha is the simplest
of the four") might suggest; they're simple to *represent*, but they touch a real fraction
of real data.

## Ribbons and Marks

Confirmed as the real design problem the original scoping flagged, but the shape is
different from "Ribbons, and a separate decision about whether Marks count as Ribbons":

- **Ribbons**: ~115 distinct ribbons total across Gen III–IX (32 in Gen III, 48 in Gen IV, 9
  in Gen V, 16 in Gen VI, 4 in Gen VII, 5 in Gen VIII, 3 in Gen IX, per Bulbapedia's "List of
  Ribbons in the games"). A Pokémon can hold several at once — genuinely needs a
  many-to-many join table, as the original scoping assumed. Many older ribbons (all 20
  Hoenn Contest Ribbons, Sinnoh Super Contest Ribbons, Hoenn/Sinnoh/Johto Battle Tower
  Ribbons) are retired on transfer to Gen VI+: the individual ribbon is silently replaced by
  a single Contest Memory Ribbon or Battle Memory Ribbon.
- **Marks are a separate, parallel system, not a Ribbons variant** — introduced Sword/Shield
  (Gen VIII), continued Scarlet/Violet (Gen IX): 43 distinct marks total (35 from Sw/Sh:
  weather/time/activity marks like Curry/Fishing/Rainy, 28 personality marks, plus 8 new in
  S/V: Jumbo, Mini, Itemfinder, Partner, Gourmand, Alpha, Mightiest, Titan). Where Ribbons
  commemorate achievements, Marks describe how/where an individual was caught or a
  physical trait. **Answering the original scoping question directly: Marks do not count as
  Ribbons** — different real-world mechanic, different acquisition rule, needs its own axis.
- A Pokémon can hold only **one Mark at a time in the common case** — unlike Ribbons, a Mark
  is fixed at the moment of capture, not earned later. But it's not a clean single-value
  column either: Partner/Gourmand/Itemfinder Marks can coexist with another Mark already
  held, and Jumbo/Mini can coexist with another Mark under specific Scale conditions.
  **Recommendation: model Marks as its own many-to-many join table too** (same shape as
  Ribbons) rather than a nullable single column — it's a handful of real exceptions a single
  column can't represent, and reusing one join-table pattern for both axes is simpler than a
  column plus a documented "except when..." carve-out.
- **Pokémon GO has neither system** — no Ribbons, no Marks (its per-Pokémon "medals" are a
  different, trainer-level mechanic). GO's 168 owned entries are inapplicable to both axes,
  same "some games just don't have this axis" shape as `caughtBall`'s Legends-Arceus-only
  pool.
- Scope explicitly does **not** include which Ribbon/Mark is currently "equipped" as a
  battle Title — that's a cosmetic, session-specific choice in the actual games, irrelevant
  to a collection tracker recording what an individual *has*, not what it's currently
  displaying.
- Deliberately **not resolving** in this leg: whether a curated ribbon list should track
  only currently-obtainable ribbons or the full historical ~115 including retired ones. The
  app has no concept of "which game context is this individual currently viewed in" (an
  origin-Gen-III Pokémon still sitting on its original cartridge via a `save_file` storage
  location genuinely could hold the original Hoenn Contest Ribbon; the same individual once
  moved to `home` would have had it converted). Building that legality cross-reference is
  exactly the kind of speculative complexity `deeper-per-game-validity.md` already
  recommended against for ball/form legality — recommend the curated list just offer the
  full historical name list and let the user pick, with no auto-legality-checking, same
  "don't build past demonstrated need" call.
- This is the single biggest curation task in the milestone: ~115 named ribbons + 43 named
  marks, each needing source/era metadata, sourced from Bulbapedia/Serebii the same way the
  postgame supplemental-availability data was (subagent research, verified, not
  from-memory). Big enough to split schema from data curation into two legs, mirroring how
  the last milestone split "add the table" from "curate the dataset."

## Alpha

Confirmed simple, but **wider than originally scoped**: Alpha Pokémon are not
Legends-Arceus-only. Pokémon Legends: Z-A (released 2025-10-16) brings the mechanic back
with the same core shape (larger, red-eyed, guaranteed high-IV variants). No other tracked
origin game reuses "Alpha" for a conflicting concept.

- Representation stands as originally scoped: a plain boolean `is_alpha` column on
  `collection_entries`, same shape as `shiny`. Applies to Legends Arceus (511 owned) and
  Legends Z-A (693 owned) — 1,204 entries, real usage, not a hypothetical.
  `collection_entries` already isn't game-gated at the schema level (`caught_ball`/
  `language` are validated the same loose way), so no CHECK is needed to restrict which game
  can set it — same trust-the-user-input precedent as the rest of the origin fields.
  Applies to both `Pokémon Legends: Arceus` and `Pokémon Legends: Z-A` `origin_game` values.
- One wrinkle surfaced by the Marks research above, worth naming so the leg that builds this
  doesn't rediscover it: Scarlet/Violet grants an **Alpha Mark** to a Pokémon transferred in
  from Legends Arceus/Z-A via HOME. That's a Marks-system detail, not something `is_alpha`
  needs to derive — an S/V entry that started life as a transferred Alpha just gets
  `is_alpha = true` set directly on entry, same as any other field. Keep the two axes
  decoupled; don't try to infer one from the other.
- UI needs only a badge, same tier as other per-entry markers already shown in the info bar/
  Box tile decorations — no new picker or modal.
- Small enough to fold into one leg with Capture Date, as originally scoped.

## Size classification

**Materially different scope than the TODO item assumed.** The individual size/weight
scalar (an internal 0–255 value per Pokémon) didn't start with Legends Arceus or
Scarlet/Violet — it began in **Generation VII with Let's Go, Pikachu!/Eevee!**, and has
carried through every game since, but it's only *shown to the player* in some of them:

| Game | Scalar exists? | Shown to player? |
|---|---|---|
| Let's Go Pikachu/Eevee | Yes | Yes (aura color, Pokédex tallest/shortest tracking) |
| Sword/Shield, BDSP | Yes | **No** — assigned and stored, never surfaced |
| Legends Arceus | Yes | Yes (visible height variation, Pokédex research tasks reference "Tall/Small Specimen") |
| Scarlet/Violet | Yes | Yes (XXXS–XXXL size categories; a Hiker NPC grants Jumbo/Mini Marks at the 0/255 extremes) |
| Legends Z-A | Yes (confirmed "Pokémon Size Variance" mechanic exists) | Yes, exact in-game presentation not yet confirmed |
| Pokémon GO | Separate mechanic — its own XXS/XS/XL/XXL categories, not the same 0–255 scalar | Yes |

Sword/Shield and BDSP are excluded from this feature entirely: the value exists internally
but is never shown to a player, so there's nothing for a manual-entry tracker to record —
Vanny has no way to look it up in those games even if she wanted to.

- Applicable games: Let's Go Pikachu/Eevee (14 owned), Legends Arceus (511), Scarlet (112),
  Violet (497), Legends Z-A (693), Pokémon GO (168) — ~1,995 entries, 39% of the collection.
  Larger real footprint than Ribbons/Marks or Alpha.
- **Representation decision: a bucketed size class, not a raw 0–255 scalar and not a
  per-species percentile.** The raw scalar is what the games actually store, but it's a
  manual-entry app — Vanny can't read a hidden internal number off her cartridge, only
  whatever bucket/category the game's own UI shows her. Scarlet/Violet's XXXS–XXXL
  vocabulary is the most granular thing any game actually surfaces to a player, so that's
  the natural bucket set; Pokémon GO's own XXS/XXL extremes map onto the same labels even
  though it's a mechanically separate system, since they represent the same "how big is
  this individual" concept a player is recording. Same shape as `caught_ball`/`language`: a
  single nullable CHECK-constrained TEXT column on `collection_entries`.
- **Not resolved here, needs its own leg's research**: Legends Arceus and Legends Z-A don't
  use the XXXS–XXXL vocabulary in-game (PLA shows aura color + "Tall/Small Specimen"
  Pokédex-task language; Z-A's exact presentation wasn't confirmed by this leg's research).
  The leg that builds this needs to confirm what each game actually shows and decide whether
  to map every game onto one shared bucket set (probably yes, for a simple single column) or
  accept that some games' "size" entry is a coarser approximation of the true in-game
  presentation than others.

## Capture date

Confirmed as originally scoped, no surprises: Met Date is a real stored field in every
mainline game since Generation III (shown on a Pokémon's Memo/summary screen, alongside Met
Location — which `collection_entries.met_location` already tracks as free text with no
matching date column today). Generation I/II have no Met Date mechanic at all, consistent
with those games already having the loosest origin-tracking support in this schema.

- A plain nullable DATE column, no CHECK needed (dates aren't a closed set) — no per-game
  gating required, same reasoning `met_location` already uses.
- Vanny flagged this very low priority even within the milestone. Folds into the Alpha leg
  as originally suggested — both are simple additive columns edited through the existing
  OriginModal, no new UI surface needed beyond a field/badge each.

## Recommended leg sequence

Replaces this Leg 1 entry in TODO.md:

1. **Leg 2 — Alpha + Capture Date.** `is_alpha` boolean and `capture_date` DATE columns on
   `collection_entries`, wired into OriginModal and a small badge. Smallest, most contained
   leg; no data curation needed.
2. **Leg 3 — Size classification.** Confirm Legends Arceus/Z-A's actual in-game size
   presentation (small research pass, same rigor as the rest of this doc), pick the final
   bucket set, add the CHECK-constrained `size_class` column, wire into OriginModal + badge.
3. **Leg 4 — Ribbons & Marks schema.** `collection_entry_ribbons` and
   `collection_entry_marks` join tables (both many-to-many, same shape), plus whatever
   minimal UI lets an entry's ribbon/mark set be viewed and edited (a modal, likely — this
   is the one marker needing more than a badge). No curated data yet; ships against a
   placeholder/manual-entry list if needed to unblock the UI.
4. **Leg 5 — Ribbons & Marks data curation.** Hand-curate the ~115 named ribbons and 43
   named marks with source/era metadata, verified against Bulbapedia/Serebii (research
   subagent, same approach as `supplemental-availability.ts`), replacing Leg 4's placeholder
   list.

## Handoff

- **Leg 2:** Alpha + Capture Date, per above. Smallest, start here.
- **Leg 3:** Size classification — needs a short research check on PLA/Z-A's exact
  presentation before locking the bucket set, otherwise straightforward.
- **Legs 4–5:** Ribbons & Marks — the real work of this milestone. Split schema from data
  curation rather than one large leg, matching this project's "smaller slice per leg"
  preference and the precedent set by the postgame-availability data split last milestone.
