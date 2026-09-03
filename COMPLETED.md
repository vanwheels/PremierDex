# COMPLETED

## [Dex Table Redesign: Storage Location Assignment] — Leg 9 — 2026-09-03
"Move assignment into the redesigned table" was ambiguous between auto-assign-on-check-in,
a manual-only dedicated column, and drag-and-drop between tabs — asked Vanny, who picked
auto-assign-on-check-in. Checking an entry owned while a real location tab is selected now
assigns it there in the same action (`autoAssignedLocationOnCheckIn`, wired into `App.tsx`'s
`handleToggleEntry`). Leg 3's per-row `<select>` also moved out of the cramped Non-Shiny/
Shiny cells into its own "Non-Shiny Loc."/"Shiny Loc." columns, staying disabled for unowned
entries and available for reassigning afterward or assigning while on the Unassigned tab.
See commit `f3ceeee`.

## [Dex Table Redesign: Per-Location Tabs] — Leg 8 — 2026-09-03
Added a `DexLocationTabs` pill bar (alphabetical by name, fixed Unassigned tab last) above
the Living Dex view, feeding Leg 7's `filterEntriesByStorageLocation` into both
`buildDexSections` and `computeCompletionStats` from the one selected tab — so the table
rows and the stats panel above it scope to the same location at once. An entry unowned
everywhere still only shows as checkable under the Unassigned tab (storageLocationId:
null covers both "never owned" and "owned but unassigned"), which is intended: Leg 3's
interim per-row picker (moving into this table at Leg 9) is still the only way to assign a
location, so a species has nowhere else to be checkable from until it's given one. See
commit `22defa6`.

## [Per-Storage-Location Completion Stats] — Leg 7 — 2026-09-03
Added `filterEntriesByStorageLocation`, a pre-filter callers run on the entries array
before `computeCompletionStats` to scope owned/shiny counts to one storage location (or
`null` for the Unassigned bucket) — totals stay collection-wide since which forms are
collectible doesn't depend on which box is being viewed. Logic only, per the leg's scope;
Leg 8 wires it into the tabbed table. See commit `2bb2356`.

## [Invalid Combo Flag] — Leg 6 — 2026-09-03
Derived, non-blocking "Invalid combo" badge on an owned Living Dex entry whose species
or caught ball doesn't match Legs 4-5's validity data for its origin game — computed at
read time, never a stored column, same treatment as `completionStats.ts`. Species-
availability data needed its own IPC channel/bridge method to reach the renderer for the
first time (it's a static file read, not a DB row, so it doesn't fit StorageAdapter).
Collection view intentionally not touched this leg — it already omits DexRow's other
owned-state badges. See commit `bb8b281`.

## [Legends Arceus Ball Pool] — Leg 5 — 2026-09-03
Added Legends Arceus's six non-overlapping ball names (Feather/Wing/Jet/Leaden/Gigaton/
Origin Ball) to `POKE_BALLS`, plus a `ballPoolForGame()` lookup that OriginModal's
"Caught In" picker now filters through — only Legends Arceus has a defined pool this leg
(per the milestone's narrow-dataset scoping), every other game still falls through to the
full flat list. Also caught a real migration hazard: `caught_ball`'s CHECK constraint is
baked in at ALTER-time and SQLite can't widen a CHECK, so any install that already ran the
Leg 28 retrofit would reject the new ball names forever without a fix — added a
detect-and-rebuild retrofit to schema.ts mirroring the existing sid-4294 table-rebuild
pattern. See commit `02b3c9f`.

## [Per-Game Species-Availability Dataset] — Leg 4 — 2026-09-03
`scripts/fetch-species-availability.ts` + `data/pokemon/species-availability.json` +
`loadSpeciesAvailabilityData()`, keyed by PokeAPI regional-dex name (not by game) so
dex-sharing games like Gold/Silver/Crystal store one species list instead of three.
Colosseum/XD/GO confirmed live to have no usable PokeAPI dex data — documented, not
guessed. Held-item form-change gap written up in
`docs/investigations/held-item-form-change-gap.md` per the leg's scope. No IPC/renderer
wiring yet — Leg 6 is the first consumer. See commit `37f33b3`.

## [Storage Location FK + Met Location Field] — Leg 3 — 2026-09-03
Nullable `storageLocationId` FK (schema retrofit onto `collection_entries`, orphaned to
null on the referenced location's delete/import-replace rather than blocking it) plus
free-text `metLocation`, threaded through types/IPC/preload. `setEntryStorageLocation` is
a dedicated setter, kept off `CollectionEntryOriginInput` since current location and
origin are different axes; `metLocation` rides along with the origin fields in
OriginModal instead. Interim assignment picker is a plain `<select>` next to each row's
Origin button in DexRow, reading App.tsx's own `storageLocations` fetch — moves into the
redesigned per-location table at Leg 9. See commit `db448d6`.

## [Diamond Theming + In-App Diamond/Pearl Toggle] — 2026-09-03
Diamond palette pulled from Dialga (steel-blue plated body → --surface family, its pale
cyan diamond core gem → --accent, darker navy secondary plating → --accent2, the gem's
icy-white highlight → --text) at the same mid-luminance comfort band as Pearl, replacing
the old placeholder light-mode block that tokens.css's Leg 2 comment had flagged as
"nailed down later." Replaced the `prefers-color-scheme` media query with an explicit
`<html data-theme>` toggle (System/Diamond/Pearl), persisted to localStorage and applied
pre-first-paint — same `theme-store.tsx`/`ThemeModeToggle.tsx` architecture as
GW2-Squaded's own theme switcher. Toggle lives in the persistent header chrome next to
BackupControls/UpdateControls. `--gold`/`--danger` stayed close to Pearl's values by
design (shiny signal and severity color meant to read consistently across both themes).
See commit `41d831a`.

Revision (same day): the first pass approximated Dialga's colors from memory rather than
an actual reference, and it showed — --accent (plain blue) sat too close in hue to
--surface/--accent2 to read as its own color the way Pearl's rose-magenta pops against
its plum surface. Vanny supplied real sprite/box-art references; re-pulled --bg/--surface
off the steel-blue body and indigo box-art backdrop, and --accent/--accent-strong off
*shiny* Dialga's teal-cyan instead of normal Dialga's blue specifically to get that pop
without leaving the Dialga reference. See commit `c373932`.

## [Visual Design Pass] — Leg 2 — 2026-09-02
Full re-skin off a token-based CSS system: dark (default) and light palettes pulled from
Diamond/Pearl's Palkia/Dialga pairing per Vanny's direction; light only surfaces via
OS-level `prefers-color-scheme` (no in-app toggle — see TODO.md). global.css split into
tokens/base/buttons/layout/tables/modals.css to stay under the file-size convention.
App.tsx gained an `.app-shell`/`.app-header`/`.app-content` wrapper (markup-only, no
behavior change). See commit `afdbf9e`.

First-pass dark palette read as generic "AI dark mode" regardless of hue (invented
muted-everything tokens, tables floating with no card framing) — re-pulled --bg/
--surface/--accent/--accent2/--text directly off Palkia's sprite and the Pearl box art,
added a background glow, a diamond-glyph title accent, and real panel framing on every
section (Trainer Profiles, Storage Locations, Completion Stats blocks, Collection
groups, a new `.dex-table-panel` around DexTable). Light mode left untouched — dark
first, per Vanny's direction. See commit `b9d28ca`.

Second revision: the "dark theme" framing itself was wrong — --bg had been pushed to
near-black, which is uncomfortable on an emissive display regardless of hue (see
memory/comfortable-luminance-not-dark-vs-light.md), and its blue-over-red channel
balance read as Pokémon-Violet purple instead of Pearl rose-magenta. Recalibrated to a
mid-luminance warm plum against GW2-Squaded's own bg as reference, and corrected the
title glyph from a diamond to an orb (Palkia carries a pearl — the Lustrous Orb — not a
diamond; that shape is Dialga's, for whenever Diamond theming gets built). See commit
`8a14e57`.

Third revision: "washed out" (bg/surface too close in value, --muted too gray) and "flat,
no depth" (every surface a single flat fill, no implied light source) were two separate
problems. Widened palette contrast, and gave every panel/button/input the same
directional-gradient + inset-highlight + layered-shadow recipe plus a shared feTurbulence
--grain texture — depth without gloss/glass, per Vanny's constraint. See commit
`efc9490`.

## [Nav Restructuring: Expand Top Tabs] — Leg 1 — 2026-09-02
Trainer Profiles and Storage Locations became their own top-level tabs alongside Living
Dex/Collection; Backup/Update controls moved to persistent chrome above the tabs; the
Completion Stats panel folded into the Living Dex tab. Pure UI reorg in App.tsx, no schema
or logic changes. See commit `f8581ee`.

Legs 1-31 (Collection & Origin Tracking milestone) archived at
`docs/completed-archive/collection-origin-tracking.md`. Legs 1-16 (Project Scaffold +
Living Dex v1 milestones — a separate, earlier numbering that collides with but predates
this one) archived at `docs/completed-archive/project-scaffold.md` and
`docs/completed-archive/living-dex-v1.md`. See `MILESTONES.md` for the shipped-milestone
index.
