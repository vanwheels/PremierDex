# Held-item form-change modeling gap

Filed alongside Leg 4's species-availability dataset (TODO.md's "Per-Game
Species-Availability Dataset") as a write-up, not a fix — the dataset is species-level
only, and this axis needs form-level, per-version legality data that's explicitly out of
this milestone's scope (see TODO.md's "Deeper per-game validity: form/gender legality +
curated Met Location list" future-milestone item).

## The gap

A handful of species change form based on a held item rather than through evolution,
regional variance, or a permanent event. `forms.json` already tracks the *existence* of
these forms (via `fetch-pokemon-forms.ts`'s categorization pass), but nothing in this
milestone's validity data — species-availability (Leg 4) or the ball pool (Leg 5) — can
say *which specific item/forme pairing is legitimately obtainable in which specific
game*. That's a different, finer-grained question than "is this species available in
this game" and needs its own dataset (which items exist in which games, and which
item↔forme mapping each held-item species uses) before it can be answered:

- **Arceus** — 18 Plates change its type. Already modeled as `non_boxable` in
  `forms.json` (per `fetch-pokemon-forms.ts`'s OVERRIDES: "neither represents its own
  Living Dex/Home box slot — only the base (no-item) form does"), so this one is a
  non-issue for the dex *slot* question. It would still matter for a future "which Plate
  did you catch it holding" tracking feature, which is unrelated to dex slots entirely.
- **Genesect** — same treatment as Arceus: its 4 Drives are `non_boxable` overrides, no
  dex-slot gap.
- **Giratina** — Origin forme (Griseous Orb) IS a `dex_distinct` slot (persists when
  transferred, only reverts if the Orb is removed in a game that has it). The Orb itself
  is a specific-game item; whether it was obtainable in the origin game recorded on an
  entry isn't checked here.
- **Zacian / Zamazenta** — Crowned formes (Rusted Sword / Rusted Shield) are version
  exclusives: Zacian's sword is a Sword-only pickup, Zamazenta's shield Shield-only.
  Species-availability's species-only grain can't express "Crowned Zacian is legitimate
  from Sword but not Shield" — that's a form+version combination, not a species+game
  one.
- **Silvally** — 17 Memory-driven type forms, same shape as Arceus's Plates but currently
  stored as `dex_distinct` (not overridden to `non_boxable` the way Arceus/Genesect are —
  unresolved inconsistency, not addressed here either).
- **Ogerpon** — 3 mask formes are permanently equipped (not swappable at will like
  Arceus/Genesect), so they're closer to Giratina's case: real `dex_distinct` slots, but
  which mask is legitimately available depends on the specific game/DLC.

## What a real fix needs

Not in scope here, but for when the future-milestone item picks this up: a per-game item
list (which key items/masks/memories exist in which version), plus a held-item → forme
mapping per species, combined with Leg 4/5's per-game data to produce actual
form+item-level legality instead of species-level availability. Until then, the Invalid
Combo Flag (Leg 6) only warns on species-level mismatches; a held-item forme recorded
against the "wrong" version-exclusive game (e.g. Crowned Zamazenta logged with origin
game Sword) won't be flagged.
