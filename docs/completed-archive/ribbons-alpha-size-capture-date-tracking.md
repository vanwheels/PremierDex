# Completed: Ribbons/Alpha/Size/Capture-Date Tracking

Archived from `COMPLETED.md` at the milestone boundary — see
`docs/postmortems/ribbons-alpha-size-capture-date-tracking.md` and `MILESTONES.md`.

## [Ribbons & Marks data curation] — Leg 5 (2026-09-19)
Closed the milestone: replaced Leg 4's 20-ribbon/22-mark placeholder with the full curated
sets, researched via a subagent against Bulbapedia's raw wikitext and cross-checked against
Serebii — 117 ribbons (vs. Leg 1's ~115 estimate) and 53 marks (vs. Leg 1's 43 estimate, the
gap being Fishing/Curry/Destiny Mark, three real marks outside the original category
buckets). Surfaced and resolved a real naming collision (Gen III Hoenn Contest ribbons and
Gen IV Sinnoh Super Contest ribbons share identical Normal/Master-rank display text across
all 5 categories, which the CHECK-constrained-string schema can't hold as two distinct
ribbons — disambiguated with an app-level "(Sinnoh)" suffix on the Gen IV set) and found the
personality-mark group is not Nature-tied despite that being Leg 1's working assumption.
schema.ts gained a self-healing CHECK-widen rebuild for both join tables, same shape as the
existing caught_ball rebuild, verified against a simulated pre-Leg-5 database before
shipping. See commit `55141d7`.

## [Ribbons & Marks schema] — Leg 4 (2026-09-19)
`collection_entry_ribbons` and `collection_entry_marks`, two separate many-to-many join
tables (a Pokémon can hold several Ribbons; most Marks are single-value but Partner/
Gourmand/Itemfinder/Jumbo/Mini can coexist with another Mark), CHECK-constrained against a
real-but-placeholder name list pending Leg 5's full curation. New RibbonsMarksModal wired
into Box view and Hybrid view's detail panels. First FK ever to target
`collection_entries(id)`, so the three legacy CHECK-widen rebuild blocks needed
`foreign_keys=OFF` added around them too. List/Collection view entry points, backup export/
import, and Storage Location Duplicate cloning deliberately left out of scope — filed as
follow-up TODO items. See commit `56096fd`.

## [Size classification] — Leg 3 (2026-09-19)
Confirmed via Serebii/Bulbapedia research exactly what each applicable game shows a player
(Let's Go: 5-tier aura; Legends Arceus: binary aura only; Scarlet/Violet: 9-tier NPC
dialogue; Legends Z-A: 5-tier, confirmed as a real labeled summary-screen category — the one
unconfirmed row Leg 1 flagged; Pokémon GO: 4-tag). Locked the bucket set to
Scarlet/Violet's 9-tier vocabulary (`XXXS`...`XXXL`) as the finest granularity any game
actually shows, so every other game's coarser presentation maps onto a subset with no
information loss. Nullable CHECK-constrained `size_class` column, no per-game gating (same
trust-the-user-input precedent as `is_alpha`). See commit `8e7a04f`.

## [Alpha + Capture Date] — Leg 2 (2026-09-19)
`is_alpha` boolean and `capture_date` DATE columns on `collection_entries`, both
self-referential (no CHECK-widen concern). Confirmed Alpha isn't Legends-Arceus-only —
Legends Z-A reuses the same mechanic (693 owned entries there vs. 511 in Arceus). Wired into
OriginModal plus a small badge; Capture Date folded in per Leg 1's low-priority call. See
commit `ff73ea0`.

## [Scope Ribbons/Alpha/size/capture-date tracking] — Leg 1 (2026-09-19)
Design-only leg: verified each of the four markers against Bulbapedia/Serebii and Vanny's
real collection rather than the original TODO framing's assumptions. Found two of the four
were scoped narrower than reality — Alpha isn't Legends-Arceus-only, and the size-variance
scalar predates PLA/Scarlet-Violet entirely (introduced Let's Go Pikachu/Eevee, Gen VII,
silently carried through Sword/Shield/BDSP without ever being shown to the player). Also
resolved the Marks-vs-Ribbons question the TODO item posed: Marks are a separate parallel
system, not a Gen 9 replacement for Ribbons, needing their own many-to-many join table. Full
write-up and the resulting 4-leg sequence in
`docs/investigations/ribbons-alpha-size-capture-date.md`.
