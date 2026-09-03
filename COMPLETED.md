# COMPLETED

## [User-facing selector for collapsed foldable-species form] — Leg 27 — 2026-09-02
Leg 9's stretch idea, now implemented: a dropdown next to the expand/collapse toggle lets
the user pin which form (base or a cosmetic variant) displays when a foldable species'
section is collapsed, overriding pickCollapsedRow's owned/shiny auto-pick. Persisted per
species (`species.collapsed_display_form_id`, nullable = Auto) rather than session-only —
Vanny's call — and sticks even if the picked form's owned/shiny state later changes. Not
wired into backup export/import: species rows are never restored on import (an existing,
pre-leg limitation — seed data owns them), so a restored backup won't carry the pick
forward. See commit `4de59c5`.

## [Rename 'Owned' to 'Non-Shiny'] — Leg 26 — 2026-09-02
Display-only rename across the three places the "Owned" column/filter/header sits next to
its shiny counterpart (DexTable's sortable column header, DexFilterBar's tri-state filter,
CompletionStatsPanel's stats table headers). The underlying `owned` field/sortKey/IPC name
is untouched — it's a genuine ownership boolean used by both regular and shiny entries, not
the thing being renamed. See commit `48edcba`.

## [Kyurem Black/White should not be Home-boxable] — Leg 25 — 2026-09-02
Data-only fix, same shape as the other Home-support gaps in
docs/investigations/home-depositability-audit.md: set `homeBoxable: false` on Kyurem's
`black`/`white` forms in forms.json and added matching OVERRIDES entries in
fetch-pokemon-forms.ts. No code changes — homeBoxable was already fully plumbed through
storage/filtering/UI as of Leg 8. See commit `7384fa0`.

## [alwaysShiny UI consumer] — Leg 24 — 2026-09-02
Threaded `Form.alwaysShiny` through to `DexRowData` and gave it the mirror-image
treatment of `shinyLocked`: disables the *regular* checkbox and shows an "Always shiny"
badge on the shiny-only side of the row, so Spiky-Eared Pichu can't be marked
owned-and-not-shiny. See commit `708b5bb`.

## [Female-form sprites missing] — Leg 23 — 2026-09-02
Root cause was bigger than Leg 22's framing: the female split row/entry has never shown
a distinct sprite for *any* of the 103 hasGenderDifference forms, not just the handful
flagged — buildDexSections/buildCollectionGroups never passed gender through to the
sprite URL builders at all. Threaded a `female` boolean through sprites.ts and the
SpriteThumbnail/SpriteModal/DexRow/CollectionRow chain to build PokeAPI CDN's real
female/ subfolder path. Separately patched forms.json to drop a genuinely broken
duplicate 'female' row on Frillish/Jellicent/Pyroar (PokeAPI's gender split there is a
second pokemon-form entry with all-null sprite fields, already redundant with
hasGenderDifference on the base row). Xerneas/Sinistea/Polteageist/Poltchageist/
Sinistcha's forms flagged by Leg 22 are unrelated to gender and have no sprite source at
all — left as-is. See commit `d1c9335`.

## [Species-forms data bugs] — Leg 22 — 2026-09-02
Investigation split the leg's four claims into two different root causes, not one shared
bug as originally framed. (1) Mothim, Scatterbug, and Spewpa: PokeAPI's `/pokemon/{id}.forms`
array structurally mirrors a related evolution-chain species (Burmy's cloaks, Vivillon's
patterns) even though these species never actually change appearance — confirmed live, every
one of those sub-forms' sprite fields comes back null, unlike Burmy's/Vivillon's own real
sub-forms. Fixed by excluding these 3 species from `fetchDefaultVarietySubForms`'s
`forms.length > 1` detection (`SPURIOUS_MULTI_FORM_SPECIES`), so they fall through to the
plain single-'base'-form path; `forms.json` patched to match and `formNames.ts`'s now-stale
`BASE_FORM_NAMES` entries for the three removed. (2) Arceus's 18 plates and Genesect's 4
drives: per Vanny's call, these are held-item-driven type changes (remove the Plate/Drive
and it reverts), not a persistent Home-depositable state — reclassified `non_boxable` via
`OVERRIDES` rather than left `dex_distinct`, so they're filtered from the dex entirely
instead of needing to "fold." Wormadam's 3 cloaks were investigated and left as-is: they
genuinely differ in type/stats and are separate Living Dex slots in the real games (unlike
Burmy's, which are cosmetic-only) — not a bug. See commit `11992b8`.

## [Group by Dex number in Collection] — Leg 21 — 2026-09-02
Added `dexNumber` as a fourth `CollectionGroupBy` mode alongside Origin Game/OT/Shiny.
Since every form of a species shares its national dex number, the group is the species
itself — forms fold into one group the same way `buildDexSections`' species sections do.
Group key is the zero-padded dex number (so groups sort numerically); label is `#<n>
<species name>`. See commit `19d4d62`.

## [Group by OT should key on TID/SID, not name] — Leg 20 — 2026-09-02
`buildCollectionGroups`'s 'ot' grouping keyed on `otName` alone, so Vanny's multiple
same-named-but-distinct trainers ("vanny" from different games/saves) landed in one
merged group. Group key is now the TID+SID pair when both are set (`otName` stays
display-only), falling back to the old name-keyed grouping for entries with no tid/sid on
file. Group sort order switched from comparing keys to comparing labels, since the key is
no longer guaranteed to be the display name for 'ot'. See commit `a26956e`.

## [Configurable completion stats breakdown] — Leg 19 — 2026-09-02
Replaced `completionStats.ts`'s single hardcoded "By Generation" breakdown with one
computation driven by three independent toggles — include cosmetic variants, split by
gender, fold regional forms into generation totals — surfaced as checkboxes in
`CompletionStatsPanel`, all defaulting off (matching the two existing precedents for these
exact axes: `DexOptions.splitGenderRows` and `DexSection.cosmeticRows`, both
collapsed/hidden by default). Fixes the regional-form double count along the way: a
regional form (e.g. Alolan Meowth, Gen 7) now lands only in `byRegionalGroup` by default
instead of also inflating its own generation's bucket; the fold-in toggle restores the old
behavior on top of the always-separate Regional section. See commit `3f56987`.

## [Collection view by origin/OT/Shiny] — Leg 18 — 2026-09-02
A separate top-level view (tab toggle next to the existing Living Dex grid) that browses
owned entries grouped by one dimension at a time — Origin Game, OT, or Shiny — rather than
species-first. Ribbon/Alpha grouping stayed out of scope, per the TODO item's own framing
(blocked on those markers not existing in the schema yet). Vanny's calls, confirmed before
implementation: a separate view rather than reshaping DexTable in place, one grouping
dimension at a time (no nesting), and owned entries only (origin/OT/shiny data is only
ever meaningful for an owned CollectionEntry). New `buildCollectionGroups` groups by
`entry.originGame`/`otName`/`shiny`, with a catch-all "No origin set"/"No OT set" bucket
sorted last; origin-game ordering reuses the existing `compareGames` release-date sort
(`shared/gameSort.ts`) rather than a new one. `formDisplayName`/`capitalizeWords`
(species/form name formatting), the nickname-input wiring, and the origin-summary tooltip
were pulled out of `buildDexSections.ts`/`DexRow.tsx` into shared modules
(`dex/formNames.ts`, `dex/useNicknameEditor.ts`, `dex/originSummary.ts`) so the new
Collection row reuses the exact same logic instead of duplicating it. See commit
`fc51ac1`.

## [Dex sort] — Leg 16 — 2026-09-02
Clickable column headers (#, Name, Gen, Owned, Shiny — Vanny's call over a SortSelect-
style dropdown) on the Living Dex grid, cycling asc → desc → back to unsorted (natural
dex order) on repeated clicks of the same header. A new `Gen` column was added since
generation wasn't previously a visible column but was one of the four requested sort
dimensions. Sorting reorders whole species sections only (Vanny's call) — a section's own
row order (cosmetic variants, gender splits) never changes; the sort key is read off each
section's first row (dex#/name/generation are uniform within a species already), and a
grouped-mode regional-cluster section (no single speciesId) sorts on whichever species
landed in that slot first. Owned/shiny sort is "any row in the section has an owned
regular/shiny entry" (Vanny's call over "every row"), matching how the existing owned/
shiny filter tri-states already treat a section. New `sortDexSections`, run after
`filterDexSections` in App's pipeline — presentation-only, never persisted, same
convention as `DexOptions`/`DexFilters`. See commit `50bb09e`.

## [Dex search/filter] — Leg 15 — 2026-09-02
One free-text `DexFilters.query` field (rather than a box per dimension) matches name,
dex#, nickname, and origin settings (OT name/origin game/language/TID/SID) across either
owned entry — folds in the two dimensions Vanny's 2026-09-02 pass added on top of the
original name/dex# scope. Paired with independent tri-state (any/yes/no) filters for
owned, shiny, regional form, and the existing homeBoxable/shinyLocked badge flags, plus a
generation dropdown (1-CURRENT_MAX_GENERATION). `regionalGroup` added to `DexRowData`
(mirroring `Form.regionalGroup`) since the row didn't carry it before — needed for the
regional filter, independent of `DexOptions.regionalMode`'s inline/grouped *layout*
toggle. New `filterDexSections` runs after `buildDexSections`, over its already-shaped
output, dropping a section only when none of its rows or cosmeticRows match; a
cosmeticRow-only match (e.g. searching an Unown letter by name) gets promoted into `rows`
since the expand toggle that normally reveals cosmeticRows lives on rows[0], which would
otherwise be filtered out. `DexFilterBar` is presentation-only like `DexToolbar` — never
persisted. See commit `e5653f6`.

## [Origin language/country field] — Leg 14 — 2026-09-02
Resolved the TODO's open scoping question first, with Vanny: "language" means the
in-game language flag every Pokémon carries internally (Japanese/English/French/German/
Italian/Spanish/Korean/Chinese Simplified/Chinese Traditional — `shared/data/
languages.ts`'s `ORIGIN_LANGUAGES`), not a free-text country — "country" was dropped
entirely, since Pokémon's own data has no such concept. Added as a nullable `language`
column on both `trainer_profiles` and `collection_entries`, following Leg 4's existing
copy-once-then-independently-editable pattern: `TrainerProfileForm`/`OriginModal` both
get a `<select>` (unlike the free-text `game` field, language is a genuinely closed set,
so it's DB-CHECK-constrained the same way `gender`/`form_category` are, and validated at
the schema layer rather than left to app-level trust). Reaches every existing origin
touchpoint: `setEntryOrigin`, backup export/import, `DexRow`'s origin tooltip and its
nickname-only-edit snapshot (carrying language through unchanged, same as it already did
for game/OT/TID/SID). No `CollectionExport` version bump — same as Leg 4's fields, this
extends an already-covered array rather than changing the export's top-level shape; an
old backup missing the field imports as `null` via the existing `wanted?.field ?? null`
pattern. See commit `f66fcd7`.
Follow-up: [Dex search/filter]'s Leg 15 TODO item widened to include language now that it
exists alongside the other origin fields.

## [Trainer Profile + Storage Location backup export/import] — Leg 13 — 2026-09-02
`CollectionExport` bumped to v2 (v1 never shipped in a release, so no migration path):
added `trainerProfiles`/`storageLocations` arrays, restoring both on import as a full
wipe-and-recreate that preserves each row's original id — the only way to keep
`collection_entries.trainer_profile_id` and `storage_locations.trainer_profile_id` valid
without a remapping step, since TrainerProfile's `label` field means natural-key matching
(as used for forms) can't uniquely identify a profile. `importCollection` also now
restores each entry's `trainerProfileId`/origin/nickname fields (previously only `owned`
was ever touched), with the same full-replace semantics: absent from the backup means
reset to null, matching `owned`'s existing reset-to-unowned behavior. A malformed/
hand-edited backup whose entry references a `trainerProfileId` missing from its own
`trainerProfiles` array gets that link dropped to null rather than failing the whole
import. See commit `8c2688d`.

## [Trainer Profile + Storage Location sort] — Leg 12 — 2026-09-02
Added a shared "Sort by" dropdown (game — release order, game — A–Z, OT Name/Name — A–Z)
to both TrainerProfilesPanel and StorageLocationsPanel; previously both just rendered in
insertion/query order with no sort control. Release order reuses ORIGIN_GAMES' existing
array order (already release-date-ordered — see OriginGameInput.tsx) via a new
`originGameOrder` lookup. A Storage Location's "game" is its linked Trainer Profile's game
(null for every non-save_file location, which sorts last regardless of mode). Sort state
is local/presentation-only, not persisted, mirroring DexToolbar.tsx's convention. See
commit `ce1b965`.

## [TID visibility when setting Pokémon origin] — Leg 11 — 2026-09-02
OriginModal's "Copy from Trainer Profile" dropdown now appends the TID to each option
(`— TID <n>`) when the profile has one, so similarly named/labeled profiles can be told
apart before picking. See commit `4381def`.

## [Move nicknames out of Origin field] — Leg 10 — 2026-09-02
Nicknames were living inside the Origin button/modal on the Living Dex grid (the button
showed the nickname text in place of "Origin" once set, and OriginModal had its own
Nickname field). Gave them their own "Nickname" column between Name and Owned instead —
an inline text input, committed on blur/Enter, that writes straight through the existing
setEntryOrigin IPC call (a full-row snapshot write) carrying the entry's other origin
fields through unchanged. OriginModal no longer touches nickname at all; its Save now
always passes the entry's existing value through untouched.
A dex row can have both a regular and a shiny entry owned at once, each with an
independent nickname, but the column holds a single input — per Vanny's call, it edits
whichever is "active" with shiny taking precedence when both are owned (see DexRow's
`activeNicknameEntry`, unit tested in DexRow.test.ts). No data-layer changes — the
`nickname` column and CollectionEntryOriginInput shape are unchanged; this was a
UI-only move. See commit `e47972c`.

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

## [Completion stats dashboard] — Leg 17 — 2026-09-02
Owned%/shiny% completion stats (overall, by generation, by regional group), computed
directly from Form/CollectionEntry rather than through buildDexSections' row shaping —
needed both genders of a gender-diff form counted regardless of the splitGenderRows
display toggle, which hides the female entry entirely when off. `alwaysShiny` forms are
excluded from the regular denominator and `shinyLocked` forms from the shiny one, so a
structurally-unownable unit doesn't cap completion below 100%. Scoped to species-only per
Vanny's 2026-09-02 call on the TODO's own flagged ambiguity: no dex-tier (regular vs.
complete living dex) breakdown until that concept exists — see TODO.md's [Dex
completeness tier migration] future-milestone item, which stays open for that follow-on.
See commit `57676df`.

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
