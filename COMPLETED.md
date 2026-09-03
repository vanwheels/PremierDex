# COMPLETED

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
