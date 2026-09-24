# PokeAPI encounter-data coverage investigation

Investigation for [Encounter tables + location/game search UI] — future milestone. Answers
the open question TODO.md raised on 2026-09-21: is PokeAPI's encounter data complete enough
to build full per-game encounter tables from, or does this need hand-curation like the Met
Location dataset did? Live-queried `pokeapi.co/api/v2` directly (curl), 2026-09-23. No code
changes this pass — findings only.

## Method

Checked `/pokemon/{id}/encounters` (per-species, all games/locations at once) for a sample
of species chosen to be present in specific recent games, plus `/location-area/` listings
and individual `/location-area/{name}` lookups to check whether Paldea/Hisui locations exist
as API resources at all versus existing but empty.

## Data shape, where it exists

`/pokemon/{id}/encounters` returns, per location-area, a `version_details` array keyed by
game version, each with `max_chance` and an `encounter_details` list of
`{ min_level, max_level, chance, method: {name}, condition_values: [...] }`.
`condition_values` covers time-of-day, radar on/off, swarm, radio, season, and — confirmed on
Crown Tundra Wooloo — weather (`weather-intense-sun`). This is richer than what RBDex/Showdown
surfaces (method + flat %) and maps cleanly onto the location-detail master/detail layout
from the RBDex reference screenshots (location list left, per-method encounter breakdown with
% right). `encounter-method` has 60+ distinct values (walk, surf, rods, headbutt, rock-smash,
horde, SOS, hidden-grotto, dynamax-adventure, snag, etc.) — good granularity for however the
UI groups methods per era.

## Coverage: confirmed present

Full species-level encounter data exists for:
- Gen 1-6 core series: Red/Blue/Yellow, Gold/Silver/Crystal, Ruby/Sapphire/Emerald/
  FireRed/LeafGreen, Diamond/Pearl/Platinum/HeartGold/SoulSilver, Black/White/Black 2/
  White 2, X/Y/Omega Ruby/Alpha Sapphire.
- Gen 7: Sun/Moon/Ultra Sun/Ultra Moon (verified via Yungoos, #734).
- Let's Go Pikachu/Eevee (verified via Meowth, #52).
- Sword/Shield, including the Isle of Armor and Crown Tundra DLC (verified via Wooloo #831
  and Skwovet #819) — Wild Area weather/overworld-spawn conditions are represented via
  `condition_values`, not just static tables.
- Colosseum/XD (Orre): no traditional route encounters (matches these games' actual design —
  wild Pokémon barely exist; most are Shadow Pokémon snagged from trainers), but the `snag`/
  `snag-rematch` encounter methods and Orre-region location-areas (Pyrite, Phenac, Realgam
  Tower, etc.) do exist as API resources, so the same per-location structure still applies
  with a different method vocabulary.

## Coverage: confirmed absent

Zero encounter data for the newest four generations' mainline releases:
- **Brilliant Diamond/Shining Pearl** — checked via Bidoof (#399) and Pachirisu (#417), both
  known to appear in BDSP; only `diamond`/`pearl`/`platinum` (the originals) show up, no
  `brilliant-diamond`/`shining-pearl` version entries at all.
- **Legends Arceus** — same two species checked, no `legends-arceus` version entries.
  Hisui-region locations exist as API resources (`hisui-lake-verity-area`, etc.) but are
  empty stubs: `GET /location-area/hisui-lake-verity-area` returns
  `"pokemon_encounters": []`. The resource was scaffolded but never populated.
- **Scarlet/Violet (+ Teal Mask/Indigo Disk DLC)** — checked via Lechonk (#915, common
  Paldea route mon) and Fidough (#926, SV-native species): both return `[]` for
  `/encounters`. Worse than Legends Arceus's case — no Paldea location-areas exist as API
  resources at all (`/location-area/?limit=2000` has zero `paldea`-prefixed area names,
  only bare `location` entries like `paldea-south-province-area-one` with no matching
  `-area` resource). There's no stub to eventually fill in; this would need location-area
  resources created from scratch if PokeAPI ever adds it.
- **Legends Z-A**: not directly tested, but given Legends Arceus (its immediate
  predecessor, same open-world design lineage) has only empty stubs, and Z-A is newer still,
  it's a safe bet coverage is nonexistent here too.
- **Pokémon GO**: not a version PokeAPI tracks at all (absent from `/version/`) — expected,
  confirms TODO.md's existing note that GO needs real-world location data, not this API.

## Conclusion

PokeAPI is **not** a complete single source for this milestone. It fully covers Gen 1-7,
Let's Go, and Sword/Shield (the bulk of the ~41-game roster by count), but has a clean,
total gap across the four newest mainline entries people are most likely to actually be
playing right now: BDSP, Legends Arceus, Scarlet/Violet, and (almost certainly) Legends Z-A.
This isn't partial/noisy data that needs cleanup — it's either an empty stub or no resource
at all, so there's nothing to merge or reconcile, only to fill in separately.

This mirrors the Met Location dataset's own resolution: no single API/dataset has full
coverage, so the same hand-curation-per-game approach (verified against Bulbapedia/Serebii,
same standard `supplemental-availability.ts` and `met-locations.ts` were held to) would be
needed for those four games regardless of which path the rest of this milestone takes.

## Open decision for Vanny

Not resolved here — this is a scope call, not something derivable from the data:
- Ship encounter tables for the PokeAPI-covered games first (Gen 1-7, Let's Go, SwSh, Orre)
  and hand-curate BDSP/Legends Arceus/Scarlet-Violet/Legends Z-A as a later, separate pass
  (same reactive posture as `BALL_POOLS` and Met Location's per-game curation) — or
- Treat full coverage of the current/most-played games as a blocking requirement before this
  milestone is considered done, meaning hand-curation for those four games has to be sequenced
  in from the start rather than deferred.

Whichever path, TODO.md's "OK to split into as many milestones as makes sense" note already
covers splitting data-build from UI — this finding suggests a further split by data source
(PokeAPI-backed games vs. hand-curated games) is worth folding into that scoping pass too.
