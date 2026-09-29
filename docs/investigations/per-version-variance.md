# Per-version-within-generation variance: what PokeAPI covers

Leg 5 of the Species/Dex reference data layer milestone. Question: for the fields this
milestone stores, where does the answer differ between games of the same generation
(Diamond/Pearl vs. Platinum vs. HeartGold/SoulSilver), and does PokeAPI model that? Live-queried
`pokeapi.co/api/v2` 2026-09-25 (Pikachu, Tackle, Eevee/Magneton/Nosepass lines, all 540
evolution chains). No code changes — findings only.

## Granularity PokeAPI actually offers

- **Version group** (24 in `learnsets.json`; DP / Platinum / HGSS are three separate groups).
- **Generation** (the `past_*` fields).
- **Single value** (no history at all).

## Field by field

| Field | PokeAPI granularity | Status here |
|---|---|---|
| Learnsets | version group | Fully covered — `learnsets.json` keeps all 24 groups. |
| Move power/accuracy/PP/type/effect | `past_values[]`, tagged with the last version group the old value applied in | Covered by `moves.json` (Leg 4). |
| Types, base stats, EV yield, abilities | generation (`past_types`/`past_stats`/`past_abilities`) | Covered by `resolveFormAtGeneration`. Mainline games don't vary these within a generation, so generation is enough. |
| Capture rate, base happiness, gender rate, egg groups, `hatch_counter`, `base_experience` | single current value | No history, but nothing to key it by within a generation either. Cross-generation drift (egg steps) is Leg 6. |
| Evolution methods | version group, via `version_group` on each `evolution_details` entry | **Modeled by PokeAPI, lossy here** — see below. |
| Wild held items, flavor text, encounters | per version | Modeled by PokeAPI; out of this milestone's scope (encounters have their own tables). |

## The one real gap: evolution methods

Every one of the 676 `evolution_details` entries across 540 chains carries a `version_group`. It
is a "first appeared in" tag, not an exhaustive list: Eevee -> Leafeon lists Eterna Forest
(`diamond-pearl`), Pinwheel Forest (`black-white`), Kalos Route 20 (`x-y`), and so on. 60 edges
have more than one distinct method; the location/stone-alternative ones (Magneton -> Magnezone,
Eevee -> Leafeon/Glaceon, Nosepass -> Probopass) are the version-dependent cases. The rest are
form/gender splits (Vivillon, Alcremie, Meowstic), which are not version variance.

`fetch-evolution-chains.ts` (`method: methods.join(' or ')`) discards the tag, so the app shows
"At Eterna Forest ... or At Pinwheel Forest ... or Leaf Stone ..." with no way to say which
game each applies to. The data to fix this is already in the response the script fetches.

Not answerable from PokeAPI: PokeAPI gives one entry for `diamond-pearl` and nothing for
Platinum or HGSS, so it cannot say whether a Gen IV location rule differs between DPPt and HGSS.
That would need a hand-curated source, and the tag semantics ("since") would also mean an
un-tagged group inherits the previous entry, which is easy to get wrong.

## Not verifiable from PokeAPI

Move stat differences in Legends: Arceus and Brilliant Diamond/Shining Pearl: `past_values`
lists nothing for those groups (Tackle's only entries are `black-white`, `sun-moon`), so PokeAPI
either doesn't model them or they don't differ. Left unverified rather than guessed.

## Decision

**No override table.** The `BALL_POOLS` posture is reactive: a table is added when a concrete
wrong answer shows up. Nothing this milestone stores has a within-generation gap that PokeAPI
fails to model, except evolution methods, and those need a consumer-shaped fix (keep the
version-group tag through to the data) rather than a curated table. Deferred to Unscheduled
as `[Evolution methods per version group]`.

## Leg 2 scoping (2026-09-28): the two open questions

Leg 1 landed `methodsByVersionGroup`. Before display work is leg-sized, two things needed
resolving:

### Version-group chronology

Already exists, just not extracted anywhere reusable. `data/pokemon/learnsets.json`'s
`versionGroups` array is written in PokeAPI's own chronological `order` (see
`fetch-species-details.ts`'s `versionGroupMeta`/`buildLearnsetData`), 24 entries, each with a
`generation`. That's the ordering the "since" tag needs (an untagged later group inherits
whichever tagged method most recently precedes it) — it just needs pulling into a shared
module instead of re-derived.

One real gap found cross-checking it against `evolution-edges.json`'s actual tags: two version
groups evolution data uses aren't in that list —
- `the-isle-of-armor` — a genuine separate PokeAPI version group (Sword/Shield's Isle of Armor
  DLC, distinct from `sword-shield`; Kubfu/Urshifu-family evolutions are tagged with it).
  `learnsets.json`'s fetch apparently doesn't need DLC-specific groups, so it was never pulled.
- `legends-za` — Legends: Z-A. Missing from the same list, likely because it postdates
  whichever PokeAPI snapshot `learnsets.json` was last regenerated against.

So the shared chronology module needs these two added (order/generation looked up from
PokeAPI's `/version-group` directly) on top of extracting the other 24, not a verbatim copy.

Also worth flagging for whoever implements: PokeAPI's `order` field does not track real-world
release-date chronology once spinoffs interleave with mainline (e.g. `ruby-sapphire`,
`emerald`, `colosseum`, `xd`, `firered-leafgreen` in that literal order — not release order).
It's correct within the mainline-to-mainline lineage that "since" tags actually need
(diamond-pearl -> platinum -> heartgold-soulsilver is in the right order), so this shouldn't
bite in practice, but it means "PokeAPI's order" isn't a synonym for "release date" if a future
edge case involves a spinoff.

### Where the game context comes from

Not one missing piece — a patchwork, most of it currently discarded before it reaches the
popup:
- **Dex Locations pane** (`DexLocationDetail`/`DexLocations`): already knows a *specific*
  PokeAPI version (Diamond vs. Pearl vs. Platinum are separate `DexGame` entries, keyed by
  `versionName` — see `dexLocationIndex.ts`/`encountersFormat.ts`'s `gameRefForVersion`), but
  collapses it to a bare `generation` number before building `SpeciesDetailTarget`.
- **Box/Hybrid view, owned entries**: `entry.originGame` (`DexBoxDetailPanel.tsx`/
  `DexHybridDetailPanel.tsx`) is a specific named game, richer than a generation, but is
  never passed to `SpeciesDetailTarget` at all today.
- **Box/Hybrid view, unowned/placeholder cells**, and the **main Dex Table / Dex Pokémon
  List**: no game context exists at these call sites, period.
- **`SpeciesDetailPopup`/`EvolutionTree` themselves currently ignore `target.generation`
  entirely** — it's only consumed by `SpeciesPage`'s sprite-generation stepper, a separate,
  independently-changeable piece of state unrelated to the popup's evolution tree view.
- Nothing anywhere maps a specific game (`diamond`) to its version-group tag
  (`diamond-pearl`) — needed regardless of source, since `methodsByVersionGroup` is tagged at
  version-group granularity and every context above is game- or generation-level.

**Confirmed with Vanny 2026-09-28:**
- When no specific game is known (the majority of entry points — Dex Table, unowned Box/
  Hybrid cells), keep today's joined-list method string unchanged. Filtering only replaces
  the joined string when a specific game *is* known; nothing regresses for the no-context
  case.
- `entry.originGame` is worth threading through — extend `SpeciesDetailTarget` to carry a
  specific game (not just generation), sourced from the Dex Locations pane's selected version
  and from Box/Hybrid owned entries' `originGame`.

Split into Leg 3 (chronology + game->version-group mapping, pure data/logic, no UI change) and
Leg 4 (thread game context through `SpeciesDetailTarget` at the two known call sites + filter
`EvolutionTree`'s rendered method) — see TODO.md.
