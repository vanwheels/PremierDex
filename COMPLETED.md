# COMPLETED

## [Foldable species: display checked-off form when collapsed] — Leg 9 — 2026-09-02
Collapsed foldable-species rows (Unown, Maushold, etc.) always showed the base form
(`rows[0]`) regardless of which variant was actually owned/shiny, hiding a checked-off
cosmetic variant behind an unchecked default. Added `pickCollapsedRow` (checks `rows[0]`
then `cosmeticRows` in list order for the first owned-or-shiny entry, falling back to
`rows[0]`) and wired it into `DexTable`'s collapse-slot rendering; expanded view is
unaffected. User-facing override selector (Vanny's stretch idea) not implemented — logged
as `[User-facing selector for collapsed foldable-species form]`. See commit `5f1ae9c`.

## [origin-games.ts: Pokémon GO has a Trainer ID] — Leg 8 — 2026-09-02
Confirmed with Vanny: GO's visible Trainer ID is the 12-digit Trainer Code (friend
code), not a mainline-style TID/SID pair. Set `hasTrainerId: true` for GO, added an
optional per-game `trainerIdMax` override (999,999,999,999 for GO) since the existing
6-digit TID cap can't hold it, and threaded it through both `TrainerProfileForm.tsx`
and `OriginModal.tsx`. See commit `1719639`.

## [Pokémon name capitalization] — Leg 7 — 2026-09-02
Species/form names were stored as raw lowercase PokeAPI slugs and rendered as-is; every
display site traces back to one choke point (`buildDexSections.ts`'s `displayName`/
`heading` construction), so a single `capitalizeWords` helper there fixes the dex grid,
section headings, `OriginModal`, `SpriteModal`, and `SpriteThumbnail` in one pass. Also
capitalized form-name suffixes (e.g. "Deoxys (attack)" → "Deoxys (Attack)"), which were
lowercase before this and would otherwise have become a new inconsistency next to the
now-capitalized species name. Scope, per Vanny's call: simple title-case only, hyphens
preserved as word separators — no exceptions dictionary for the ~14 species whose real
names need punctuation the slug format drops (Farfetch'd, Mr. Mime, Nidoran♀/♂, etc.);
logged as `[Pokémon name punctuation exceptions]`. See commit `3693968`.

## [Spiky-Eared Pichu: HOME deposit + always-shiny flags] — Leg 6 — 2026-09-02
Added `alwaysShiny` as a new Form field — the opposite axis from the existing
`shinyLocked` (which means "never shiny"; `alwaysShiny` means "never non-shiny") —
plumbed through the same hand-maintained-fact path `shinyLocked` and `homeBoxable`
already use: schema column + migration, `sqlite-storage.ts`, `seed.ts`'s
insert/backfill, and `fetch-pokemon-forms.ts`'s `ALWAYS_SHINY` set (mirroring
`SHINY_LOCKED`). Set `homeBoxable: false` and `alwaysShiny: true` on Spiky-Eared Pichu
(`172:spiky-eared`) in `forms.json`, and `alwaysShiny: false` on all other 1556 rows.
Kept to the data layer only, per the TODO's explicit "data-only fix" framing — no
renderer changes, unlike `homeBoxable`/`shinyLocked` which both already have a `DexRow`
consumer. Flagged as a follow-up TODO (`[alwaysShiny UI consumer]`) rather than done here.

Legs 1-16 (Project Scaffold + Living Dex v1 milestones) archived at
`docs/completed-archive/project-scaffold.md` and `docs/completed-archive/living-dex-v1.md`.
See `MILESTONES.md` for the shipped-milestone index.

## [Paldea Tauros breed sort-order bug] — Leg 5 — 2026-09-02
Root cause wasn't `buildDexSections.ts` (its regional-grouping logic was already correct)
but the data-generation script: `fetch-pokemon-forms.ts`'s `regionalGroup` detection
required form_name to *exactly* equal alola/galar/hisui/paldea, so compound regional
form_names (Tauros's `paldea-combat-breed`/`-blaze-breed`/`-aqua-breed`, and Darmanitan's
`galar-standard`/`-zen`) fell through to `null` and stayed in their species section
instead of moving to the grouped regional section. Fixed with a `resolveRegionalGroup`
helper: exact match still always counts, and a hyphen-prefixed compound name now counts
too, but only when the variety also differs in types/stats — which is what keeps
`pikachu-alola-cap` (same prefix, identical stats, a cosmetic cap) correctly excluded
without a hardcoded species list. Hand-patched the 4 already-generated `forms.json` rows
to match rather than re-running the live PokeAPI fetch. See commit `074927a`.

## [Per-entry origin data + nicknames] — Leg 4 — 2026-09-02
Collection Entries get `trainer_profile_id` (provenance-only FK, orphaned to null on
profile delete rather than blocking it) plus origin_game/ot_name/tid/sid/nickname,
copied once from a picked Trainer Profile and then editable independently — never
re-synced if the source profile changes later. Regular and shiny entries of the same
form get independent editors via a new per-entry `OriginModal` (mirrors the existing
`SpriteModal` pattern), reached from a button next to each Owned/Shiny checkbox, gated
to owned entries. See commit `afe254b`.

Flagged, not fixed, while closing this leg: the existing TODO's backup export/import
gap for Trainer Profile/Storage Location now also drops the new `trainerProfileId`
link on restore (the copied snapshot fields themselves are unaffected). See that TODO
item for detail — left as Vanny's call whether to bump its priority.

Follow-up 2026-09-02: `OriginModal` (this leg's per-entry editor) required TID/SID
whenever the matched game showed them, same as `TrainerProfileForm` did before its own
fix — a blank TID/SID field couldn't be saved even though both are meant to be optional.
Brought it in line with `TrainerProfileForm`'s existing blank-parses-to-null handling.
See commit `23fbb57`.

Follow-up 2026-09-02: Vanny flagged that Gen I-VI games, while never displaying a Secret
ID on their in-game Trainer Card, do still have one internally — extractable with a tool
like PKHex — so the field shouldn't be hidden just because the game itself never shows
it. `origin-games.ts`'s `hasSecretId` now reads true for every mainline/spinoff game
(false only for Pokémon GO, which has no SID at all); the Gen VII+ cutoff was the wrong
signal — display-only, not availability. See commit `b596402`.

Follow-up 2026-09-02: Vanny corrected the range that follow-up shipped with — pre-Gen-VII
SID isn't capped at Gen VII+'s 4294 (that cap is `floor(32-bit ID / 1_000_000)`, specific
to Gen VII+'s derivation scheme), it can run up to 6 digits. Widened `SID_MAX` to match
`TID_MAX` (999999) in both entry forms, same "widest across any generation" approach the
DB CHECK and TID_MAX already used. Also widened the `trainer_profiles`/`collection_entries`
sid CHECK constraints from 0-4294 to 0-999999, with a data-preserving rebuild migration for
installs that already had the narrower constraint (unlike the earlier tid NOT NULL rebuild,
this one copies existing rows — both tables now hold real data from today's Legs). See
commit `e6554e6`.

## [Trainer Profile model] — Leg 1 — 2026-09-02
Standalone `trainer_profiles` table (game, OT name, TID/SID, optional label) with full
CRUD through StorageAdapter/IPC/preload, and a basic add/edit/delete panel in the
renderer. Not yet referenced by any Collection Entry (Leg 4) or the backup export flow
(see TODO's [Trainer Profile backup export/import]). See commit `2bd2543`.

Follow-up same day: TID/SID range was wrong (Bulbapedia confirms Gen I-VI shows a
5-digit TID and never displays a SID at all; Gen VII+ shows a 6-digit TID and a 4-digit
SID) — widened the CHECK constraints and made both columns nullable, with a schema
migration for the brief pre-widen shape. Also pulled `[Origin-game list]` (was Leg 3)
forward into this leg at Vanny's call: `shared/data/origin-games.ts` lists every
mainline title, Colosseum/XD, and Pokémon GO, each flagged for whether it shows a
Trainer ID and/or Secret ID; the Game field is now a datalist-backed autocomplete
sourced from that list, and TID/SID inputs hide themselves per the matched game's flags
(GO hides both; pre-Gen-VII hides SID only). See commit `f1e0612`.

Follow-up same day: the Game field's native `<datalist>` dropdown didn't scroll (and
isn't stylable at all — it's drawn outside the DOM), so swapped it for a small hand-rolled
combobox (`OriginGameInput.tsx`) with a proper `overflow-y: auto` popup. See commit
`30e1bf9`.

## [Storage Location model] — Leg 2 — 2026-09-02
Standalone `storage_locations` table (location_type enum: home/bank/box/ranch/save_file,
user-provided name, optional trainer_profile_id) with full CRUD through
StorageAdapter/IPC/preload, and a basic add/edit/delete panel in the renderer — mirrors
Leg 1's Trainer Profile shape throughout. Not yet referenced by any Collection Entry
(Leg 4) or the backup export flow (see TODO's [Trainer Profile + Storage Location backup
export/import]).

Resolved the TODO's open identity question first: researched Bulbapedia/Project Pokémon
on Pokémon Bank/Box/Ranch save structures and Pokémon HOME's account system — none of the
five location kinds expose a real, capturable identifier (Bank/Box/Ranch store nothing
usable; HOME's only account-level ID is a social friend code, not per-slot identity). Per
Vanny's call, identity is uniformly a user-provided name (no type-specific ID columns),
and a `CHECK` constraint requires trainer_profile_id set only for location_type =
'save_file', null for the other four — a save-file location is inherently "the boxes
inside trainer X's save." See commit `bf092e7`.
