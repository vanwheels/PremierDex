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
