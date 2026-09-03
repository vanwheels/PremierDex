# COMPLETED

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
