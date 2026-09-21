# Per-game regional dex numbers: scoping

Leg 1 of the Per-Game Regional Dex Numbers milestone. No code in this leg — resolves the
two open questions the TODO item posed (which game/region's numbering, one column vs.
per-game) before Leg 2 builds anything.

## What data is available

`fetch-species-availability.ts` already fetches PokeAPI's `/pokedex/{name}` endpoint per
regional dex and writes `data/pokemon/species-availability.json` — but only keeps each
entry's species id, discarding the `entry_number` field the same response carries. The
regional dex number is already one field away from data the project fetches today; no new
endpoint or fetch pass is needed, just capturing a field the script currently throws out.

## The multi-dex problem

`gameToPokedexes` (same file) maps 11 of 40 games to more than one regional dex, with two
different shapes:

- **No single base dex exists at all.** X/Y map to three co-equal sub-region dexes
  (`kalos-central`, `kalos-coastal`, `kalos-mountain`) — there's no "whole Kalos" dex in
  PokeAPI to prefer.
- **A base dex plus sub-region/DLC dexes.** Sun/Moon/Ultra Sun/Ultra Moon map to a
  combined Alola dex (`original-alola`/`updated-alola`) plus four island sub-dexes
  (Melemele/Akala/Ula'ula/Poni), each with its own independent numbering. Sword/Shield map
  to `galar` plus the two DLC area dexes (Isle of Armor, Crown Tundra); Scarlet/Violet map
  to `paldea` plus its two DLC dexes (Kitakami, Blueberry). A species can appear in the
  base dex, a sub-dex, or both, with an unrelated number in each.

A single "regional dex #" field can't represent this without either picking a winner
(losing information for species that are also in a sub-dex) or, for Kalos specifically,
picking one of three equally-arbitrary dexes to call "the" number.

## Decision (Vanny, 2026-09-20)

**Show all applicable dex numbers**, not one collapsed value. For a given entry's origin
game, look up every regional dex that game maps to, and for each one the species has an
entry in, show that dex's name and number. A Sun/Moon entry that's in both the main Alola
dex and its home island's dex shows both; an X/Y entry shows whichever of the three Kalos
sub-dexes it actually appears in (one, two, or all three); a species that's SwSh-base-dex
only shows just "Galar #—".

Consequence worth flagging for Leg 2's UI: Sun/Moon/Ultra Sun/Ultra Moon entries can show
up to 5 numbers (main dex + up to 4 island dexes), since PokeAPI numbers the island dexes
independently rather than as a subset view of the main one. That's the direct result of
"show all applicable" applied to that game's real dex structure, not a separate design
choice.

## Which game's numbering to show

Tied to the entry's `originGame`, the same field the existing "Origin Game" detail field
and `checkEntryValidity`'s species-availability check already key off. An entry with no
origin game recorded shows no regional number, same as it shows no Origin Game field today
— this isn't a new gap, just the existing "unset origin game" case extended to a new field.

## Leg 2 scope (not started)

- Extend `fetch-species-availability.ts` to capture `entry_number` per pokedex entry
  (species id -> entry number map, not just the sorted id list it writes today), written
  as a new field alongside the existing `pokedexes` map so `SpeciesAvailabilityData`'s
  current consumers (`checkEntryValidity` et al.) are untouched.
- Hand-curate a pokedex-name -> display-name table (`galar` -> "Galar", `kalos-central` ->
  "Kalos (Central)", `original-melemele` -> "Melemele Island", etc.) for the 20ish distinct
  dex names this touches — same category of hand-written structural mapping as
  `ORIGIN_GAME_VERSION_GROUP`, not obtainability data.
- Add a lookup (given a species id + origin game id) -> list of `{dexDisplayName,
  entryNumber}` pairs, and render it in `DexBoxDetailPanel.tsx` (and any sibling detail
  panels showing "National Dex #" today — `DexHybridDetailPanel` at minimum, needs a
  quick check for others) below the existing Origin Game field.
- No schema/DB change needed — this is derived from already-recorded `originGame` +
  static data, not a new stored column.

## Handoff

Leg 1 (this doc) is the full scoping pass — both open questions the TODO item posed are
resolved above. Leg 2 is a single implementation leg: extend the fetch script, add the
display-name table, wire the lookup into the detail panel(s).
