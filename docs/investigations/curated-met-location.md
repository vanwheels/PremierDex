# Curated Met Location dataset: deciding the shape

Design output for [Curated Met Location dataset] — Leg 1. No code this leg — same kind of
decide-before-building pass as `deeper-per-game-validity.md`'s own Leg 1, which split this
milestone out in the first place and left its shape as an open question rather than
deciding it (0 of 5,172 owned entries had `metLocation` set at the time, so it was pushed to
Future Milestones pending an actual usage signal). Vanny confirmed 2026-09-20 she intends to
start using it, promoting this back to the current milestone.

## What was already known going in

`metLocation` has been a plain free-text `TEXT` column since the nav-restructuring
milestone (schema.ts's own comment on it: "free text this milestone... a curated per-game
location list is deferred"). `deeper-per-game-validity.md` flagged two genuinely open
questions rather than resolving them:

- Does curated data narrow the existing free-text field (autocomplete-style suggestions),
  or replace it with a restricted picker?
- How much of the ~41-game `origin-games.ts` roster gets curated up front — a little for
  every game, or nothing until a specific game is actually needed?

Both were real product decisions, not things derivable from the collection data the way
`deeper-per-game-validity.md`'s own questions were (that leg had a testable answer; this one
doesn't) — so this leg resolved them with Vanny directly rather than guessing.

## Decisions (confirmed with Vanny, 2026-09-20)

1. **Restricted dropdown once a game is curated**, not suggestions layered on free text. A
   game with a curated location list gets a `<select>` in `OriginModal`, same posture as
   Caught In/Language — not a free-text field with hints. A game with no curated list yet
   keeps today's plain free-text `<input>`, unchanged.
2. **Narrow and opt-in per game, zero games curated at ship.** Same reactive posture as
   `BALL_POOLS` (Legends Arceus only, curated because Leg 5 had a demonstrated need, every
   other game falls through to the uncurated behavior) — this leg's own doc-only Leg 1 plus
   the implementation Leg 2 below build the mechanism only. Vanny had no specific game in
   mind to start with, so no game gets curated data yet; curation happens opportunistically,
   one game at a time, whenever she's actually about to log entries for it.

## Why this can't reuse `BALL_POOLS`' exact shape

`POKE_BALLS` is one closed, flat set, DB-enforced via a CHECK constraint; `BALL_POOLS` only
narrows which subset of that *same* closed set the picker offers per game — the DB doesn't
care which game wrote which ball, because every ball name is a member of the one shared
superset either way.

Met Location has no such superset. An uncurated game's location is genuinely unbounded free
text (there's no flat "every location across every game" list to check against), so a CHECK
constraint can't shadow this the way it does for `caught_ball`/`language`/`size_class`.
Giving it one now — even just against whatever's curated so far — would resurrect the exact
"SQLite can't ALTER a CHECK constraint, needs a full table rebuild" pain schema.ts already
documents at length for every one of those columns, except recurring on every future game
this dataset picks up rather than a handful of one-time migrations.

So `met_location` stays a plain, unconstrained `TEXT` column at the DB layer — this leg
needs no schema.ts change. The restriction lives entirely in the UI layer:

- New `shared/data/met-locations.ts`, mirroring `poke-balls.ts`'s `BALL_POOLS` shape:
  `Record<gameName, readonly string[]>`, keyed by `ORIGIN_GAMES`'s `name` (not `id`, same
  reasoning as `BALL_POOLS` — matches how `OriginModal` already resolves the typed-in game
  string), starting empty.
- `metLocationsForGame(gameName)` returns that game's list, or `undefined` if the game isn't
  curated yet. Deliberately *not* falling back to a flat list the way `ballPoolForGame`
  does — there is no sensible flat superset of locations to fall back to.
- `OriginModal.tsx`'s Met Location field switches control type on that result: the existing
  free-text `<input>` when `metLocationsForGame` returns nothing, a `<select>` restricted to
  that list when it returns one. This is the one genuinely new UI pattern this leg
  introduces — every other field in that form is either always-text or always-a-picker;
  nothing today switches its control type based on another field's value.

## Handoff

**Leg 2** (mechanism only, no curated games yet):
- `shared/data/met-locations.ts` — empty `Record` + `metLocationsForGame` helper, doc-comment
  conventions matching `poke-balls.ts`.
- `OriginModal.tsx` — Met Location switches between text input and select based on
  `metLocationsForGame(selectedGame)`.
- Tests: a `met-locations.test.ts` mirroring `poke-balls.test.ts`'s shape (empty-record
  fallback behavior), plus coverage in `OriginModal`'s existing tests for the input/select
  switch — needs at least one fixture game curated to exercise the select path, so use a
  throwaway test-only entry rather than a real game.
- No schema.ts / migration work.

**Future, opportunistic** (not this milestone's Leg 2 — its own small leg each time):
curate a specific game's major-city/route list only when Vanny names a game she's about to
start logging entries for. Verify each list against Bulbapedia/Serebii before committing it,
same standard `supplemental-availability.ts`'s mechanisms were held to.
