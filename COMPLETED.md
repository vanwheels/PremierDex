# COMPLETED

## [Shiny-locked species/forms: schema + seed backfill] — Leg 15
2026-09-02. Added `shinyLocked` to `Form` end-to-end: `schema.ts` (new `shiny_locked`
column, both the fresh CREATE TABLE and an ALTER-TABLE retrofit for pre-existing dbs),
`shared/types/pokemon.ts`, `load-species-data.ts`, and a `SHINY_LOCKED` set in
`fetch-pokemon-forms.ts` (kept separate from the existing `OVERRIDES` map since it's a
plain set of locked keys, not a field-override map) covering the 47 locked
(species, form) pairs from Leg 14's audit doc, correctly excluding Zacian/Zamazenta per
Vanny's distribution-event policy call. `seed.ts` got an unconditional resync backfill
(`backfillShinyLocked`), same pattern as Leg 8's `home_boxable` backfill, so an
already-seeded local db picks up the correct value on next startup without touching
`collection_entries`. `sqlite-storage.ts`'s row mapper picks up the new column
automatically via its `SELECT *`, needed only a `FormRow`/`toForm` update. Patched the
47 keys into the existing `data/pokemon/forms.json` directly via a one-off script rather
than a full live re-fetch (verified all 47 keys matched a real row — no drift between
the audit doc and current form names) — same approach Leg 8 used for `home_boxable`.
See commit `6b78ddd`. Full change is `schema.ts`, `seed.ts`, `shared/types/pokemon.ts`,
`load-species-data.ts`, `fetch-pokemon-forms.ts`, `sqlite-storage.ts`,
`data/pokemon/forms.json`, plus new `seed.test.ts`/`sqlite-storage.test.ts`/
`buildDexSections.test.ts` fixture updates and a new backfill test. All 48 tests +
typecheck pass. UI wiring (how a locked shiny checkbox renders) stays open in TODO.md as
its own leg.

## [Shiny-locked species/forms: Zacian/Zamazenta correction] — Leg 14 follow-up
2026-09-02. Vanny corrected Leg 14's Zacian/Zamazenta note: their normal story gift is
non-shiny, but a legitimate shiny of each was distributed once via a past Mystery
Gift/serial-code event, and an event's expiration doesn't count toward "locked" since
collectors can still obtain preserved past distributions. That settled the operative
definition of `shinyLocked` for the upcoming schema leg (locked = no legitimate shiny
ever, by any means — not "is it currently obtainable") and reclassified Zacian/Zamazenta
(both already-tracked `base` dex_distinct rows, id 888/889) as NOT locked, reversing
Leg 14's tentative "confirmed locked" note. Flagged the same distribution-event test as
unconfirmed for the rest of the Event-Only bucket and for Koraidon/Miraidon, rather than
silently assuming it clears them too. Doc-only:
`docs/investigations/shiny-locked-audit.md`.

## [Shiny-locked species/forms audit] — Leg 14
2026-09-02. Cross-referenced Serebii's shiny-locked page against the live
`species.json`/`forms.json` row-by-row (not from memory) via a one-off Node script.
Resolved the TODO's open question: all 7 of Pikachu's event cap forms already exist as
distinct `forms.json` rows (no fetch-script gap) — `partner-cap` is correctly excluded
since it's the player's own Let's Go Pikachu, which can be legitimately shiny. Mapped
species-wide locks (Cosmog, Kubfu/Urshifu, Glastrier/Spectrier/Calyrex incl. its Ice/
Shadow Rider fusions, Ogerpon incl. all 3 masks, Hoopa incl. Unbound, the Gen 9
paradoxes/Loyal Three/Treasures of Ruin, Koraidon/Miraidon) against form-specific-only
locks (Vivillon's Poké Ball pattern only, Floette's Eternal Flower only, Ursaluna's
Bloodmoon only, Melmetal's Gmax only — bases NOT locked). Also confirmed via
Bulbapedia that non_boxable forms (Ash-Greninja, Magearna's Megas, Melmetal Gmax,
Urshifu Gmax, Terapagos's battle formes) are already hidden from the dex view entirely,
so a lock there is currently moot for the UI leg. Surfaced one out-of-scope discovery —
Zacian/Zamazenta are also shiny-locked per Bulbapedia, not just Gen 9 legendaries as the
original TODO assumed — filed as a blocking decision rather than folded in silently.
Full findings, source caveats (WebFetch can't reliably read Serebii's icon-based lock
table, only its plain-text lists), and the not-locked list:
`docs/investigations/shiny-locked-audit.md`. Data-audit only, no code changes — schema/
seed/UI legs remain open in TODO.md.

## [Wire homeBoxable into the collectible dex view] — Leg 13
2026-09-02. Asked Vanny how the 17 `homeBoxable: false` forms should render (own
section? greyed-out/hidden like cosmetic_variant? excluded like non_boxable?) — chose
"normal row + badge," matching the semantics that these are real, ownable dex_distinct
forms Home just hasn't added deposit support for yet, not a lesser or hidden category.
Added `homeBoxable` to `DexRowData` (`types.ts`), passed it through in
`buildDexSections.ts`'s `rowFor`, and rendered a `.dex-not-home-boxable-badge` span next
to the display name in `DexRow.tsx` when false, styled in `global.css`. No repo here
(not a git working directory), so no commit hash — full change is `types.ts`,
`buildDexSections.ts`, `DexRow.tsx`, `global.css`, plus a new
`buildDexSections.test.ts` case asserting the field passes through instead of filtering.
All 47 existing tests + typecheck still pass.

## [Sprite gaps: gen 6, animated, shiny] — Leg 12
2026-09-02. Investigated three reported gaps by checking the real CDN (GitHub API +
direct HTTP checks against raw.githubusercontent.com/PokeAPI/sprites), not from memory.
Gen 6: `sprites.ts` had the folder name wrong (`omega-ruby-alpha-sapphire`; the CDN's
real folder is `omegaruby-alphasapphire`), 404ing every gen-6 request. Animated: the
CDN serves gen-5 animated sprites as `.gif`, but `animatedSpriteUrl` appended `.png`,
404ing every animated request regardless of the gen-5 gate from Leg 11. Also confirmed
live that `sprites/pokemon/other/showdown/` holds Pokemon Showdown's animated GIFs
covering every generation/species (with `shiny/` and `back/` subfolders too) — added as
a second `AnimatedSource`, user-selected via a radio pair that only appears at gen 5
(Showdown is the only option elsewhere), per Vanny's call when flagged. Shiny: confirmed
live that `versions/generation-viii/brilliant-diamond-shining-pearl/shiny/` and
`versions/generation-ix/scarlet-violet/shiny/` don't exist on the CDN at all (0 files),
same as the already-documented gen-1 gap — `generationSpriteUrl` now falls back to the
evergreen `defaultSpriteUrl` shiny art for those three generations instead of building
a URL guaranteed to 404, per Vanny's call over disabling the checkbox. See commit
`37639da`.

## [Animated Sprites toggle] — Leg 11
2026-09-02. Added an Animated checkbox to `SpriteModal.tsx` alongside the existing
Shiny one, backed by new `hasAnimatedSprites`/`animatedSpriteUrl` in `sprites.ts`
gated to gen 5 only (the sole generation the CDN has an animated folder for) — the
checkbox disables itself outside gen 5. See commit `419cf0c`.

## [Base-form display naming] — Leg 10
2026-09-02. Swept live against PokeAPI (not from memory) and found 54 species — not just
the 4 originally named (Deoxys, Wormadam, Oricorio, Squawkabilly) — whose default variety
has a real non-generic `form_name` that the `'base'` storage convention was hiding.
Vanny chose to cover all of them, including the purely-cosmetic pattern/color groups
(Unown, Vivillon family, Alcremie, etc.), and to match the existing sibling-form label
style exactly rather than hand-written proper names. Fixed as a `BASE_FORM_NAMES`
lookup in `buildDexSections.ts`'s `formDisplayName`, feeding the true form_name through
the same formatting every non-base form already uses — no data-model change. Excludes
7 male/female-pair species (Frillish, Jellicent, Pyroar, Meowstic, Indeedee,
Basculegion, Oinkologne) whose only non-generic form_name is "male", not a real forme
name. Full species list and reasoning: `docs/investigations/home-depositability-audit.md`
section 4. See commit `d24e9b7`.

## [Missing form data: Unown/Vivillon/Flabébé line/Furfrou/Alcremie/Poltchageist/Sinistcha] — Leg 9
2026-09-02. Confirmed live against PokeAPI (per the investigation doc's open question)
that these species pack their variants as multiple `pokemon-form` entries under one
`pokemon` variety rather than separate varieties, and that those sub-forms' sprites are
keyed `"{basePokemonId}-{form_name}.png"` — not by a standalone numeric id the way every
other form's sprite is. Added a nullable `spriteFormSuffix` field threaded through
`Form`/schema/seed/sprites.ts alongside a new `fetchDefaultVarietySubForms` path in
`fetch-pokemon-forms.ts`, triggered generically off `defaultPokemon.forms.length > 1`
rather than a hardcoded species list. That generic trigger also corrected the same gap
for 20 species groups beyond the 7 originally named — including Arceus's 18 type-plates
and Silvally's 17 memory-types as `dex_distinct` rows — kept in scope per Vanny's call
when flagged. Caught and fixed a real bug before committing: the sub-form heuristic
initially compared every sub-form (including the species' own default look) against
itself, wrongly demoting each affected species' base row to `cosmetic_variant` and
hiding it behind the cosmetic-variant expand toggle; fixed by hardcoding the `is_default`
sub-form to `dex_distinct`, same as every other species' base row, and verified all 1025
species still have an anchor row. Re-fetched live: 228 new form rows, zero pre-existing
rows changed. Full species list and reasoning:
`docs/investigations/home-depositability-audit.md` section 3. See commit `5b9ef58`.

## [Home-depositability corrections for existing forms] — Leg 8
2026-09-02. Populated the `home_boxable` column (present in the schema since Leg 4 but
hardcoded to `1`/`true` on every insert) with real values for the 17 forms Home doesn't
yet accept: Dialga/Palkia/Giratina Origin, Necrozma Dawn Wings/Dusk Mane, Calyrex Ice/
Shadow Rider, Ogerpon's 3 masks, and Minior's 7 core color forms. Checked Minior's raw
PokeAPI `pokemon-form` response live first (`is_battle_only: false` for `minior-red`) to
confirm it's a genuine Home-support gap, not a heuristic bug in the existing
`is_battle_only` non_boxable check. Added a 17-entry `OVERRIDES` batch to
`fetch-pokemon-forms.ts`, hand-patched the same values into `forms.json` (no full live
refetch needed), and added a `seed.ts` backfill so an already-seeded local db picks up
the correction on next startup, matching the existing `pokeapi_id` backfill pattern.
`homeBoxable` reaches storage/types but has no UI consumer yet — filtering it into the
dex view is tracked separately in TODO.md. See commit `45353cb`.

## [Dex/species exclusions: totem, Let's Go starters, Koraidon/Miraidon modes] — Leg 7
2026-09-02. `scripts/fetch-pokemon-forms.ts` now skips generating a row for any variety
`isExcludedVariety` matches (totem `formName`, Pikachu/Eevee's Let's Go `starter`,
Koraidon/Miraidon's ride-mode forms) instead of fetching it and discarding it, checked
before the per-variety PokeAPI calls so excluded varieties cost nothing extra. Re-ran the
fetch and diffed old vs. new `forms.json`: exactly the 22 expected rows removed (12
totem + 2 starter + 8 ride-mode), nothing else changed. Since `runSeed` is INSERT-only
and never deletes, added a one-time `prunePreLeg7ExcludedForms` step (explicit
species_id/form_name pairs, not a diff against `forms.json`, so a bad fetch can never
delete real collection data) so an already-seeded local db gets these rows and their
`collection_entries` removed too. See commit `da06c05`.

## [Packaging/distribution] — Leg 6
2026-09-01. `electron-builder.yml`: NSIS/x64-only Windows target, `publish: github`
(vanwheels/PremierDex), `extraResources` shipping `data/pokemon/` outside asar (the gap
`load-species-data.ts` had been carrying a comment about since Leg 1), and `asarUnpack`
for `better-sqlite3`'s native binding. Also wired in-app auto-update via
`electron-updater`, reusing GW2-Squaded's pattern almost verbatim: a status-broadcasting
`registerUpdaterIpc` in main, `UpdaterBridge`/`UpdateStatus` shared types, folded into
the existing single `window.premierDex` bridge (PremierDex uses one bridge object,
unlike GW2-Squaded's several `window.gw2*` globals) rather than a separate global, and a
renderer `UpdateControls` component reusing `BackupControls`' CSS classes.
`npm run package:dir` was run locally to confirm the packaged app launches and that both
`extraResources` and `asarUnpack` land correctly — no automated test for the IPC wiring
itself (thin main-process glue, same as the GW2-Squaded original it's modeled on). See
commit `8217d63`.

## [Manual export/import (JSON)] — Leg 5
2026-09-01. Full-collection JSON backup/restore, the only backup path in v1 (no sync
backend). `StorageAdapter.exportCollection`/`importCollection` (sqlite-storage.ts) are
pure DB reads/writes; a separate `backup-ipc.ts` owns the native save/open dialog and
disk I/O, keeping Electron-dialog orchestration out of the storage layer. Import matches
entries by natural key (species id + form name + gender + shiny), not raw row id, since
AUTOINCREMENT ids aren't guaranteed stable across a reinstall or a different app
version's seed run — entries whose form no longer exists in the current install are
counted as skipped rather than erroring. Import is a full replace: every current entry
ends up owned exactly as the backup file says, including reset to unowned for anything
the file doesn't mention, since that's the expected meaning of "restore a backup" (the
renderer confirms this via `window.confirm` before importing). Species/forms themselves
are never written by import — `runSeed` already keeps those current on every startup.
UI: an Export…/Import… control row in `App.tsx` via the new `BackupControls.tsx`. Unit
tests cover the natural-key matching, full-replace reset, and skip-on-orphaned-form
behavior (`sqlite-storage.test.ts`) plus the backup-file shape validation
(`collection-export.test.ts`). See commit `5482414`.

## [Sprite display] — Leg 4
2026-09-01. PokeAPI sprite thumbnails in the grid with a click-to-enlarge modal and a
generation stepper (each form's firstAvailableGeneration through gen 9) plus a shiny
toggle. Required adding `pokeapiId` to the form data model — the sprite CDN keys files
on PokeAPI's numeric pokemon id, not on anything previously stored — so this leg also
re-ran the forms fetch against live PokeAPI. See commit `4963652`.

## [Spreadsheet-style Living Dex UI] — Leg 3
2026-09-01. Replaced the proof-of-pipeline table with the real grid: species-grouped
rows with dex #/Owned/Shiny checkbox columns, a gender-split toggle (off by default,
collapses to the male entry), a regional inline/grouped toggle, and a per-species
cosmetic-variant expand control. `src/renderer/dex/buildDexSections.ts` holds the pure
view-model logic (unit-tested); toggle state lives only in the renderer, never written
to storage. See commit `c6ae4d7`.

## [Form categorization data pass] — Leg 2
2026-09-01. Real per-form data (form_category/has_gender_difference/regional_group/
first_available_generation) for all 1025 species' 1351 forms, replacing the Leg 1
placeholder; `scripts/fetch-pokemon-forms.ts` derives it from live PokeAPI signals
rather than hand-curated trivia. See commit `45eecbf`. Full rationale and the two data
quirks the first full run surfaced (and fixed): `docs/investigations/form-categorization.md`.

## [Project Scaffold] — Leg 1
2026-09-01. Electron+React+TS+SQLite app shell (adapted from GW2-Squaded's electron-vite
structure), the Species/Form/CollectionEntry schema, an idempotent PokeAPI-backed seed
pipeline, and IPC/preload wiring proven end-to-end via a proof-of-pipeline renderer
screen. See commit `52b10de`. Full writeup: `docs/postmortems/project-scaffold.md`.
