# Completed: Full UI/UX pass on the Dex interface

Archived from `COMPLETED.md` at the milestone boundary — see
`docs/postmortems/full-ui-ux-pass-on-the-dex-interface.md` and `MILESTONES.md`.

## [Full UI/UX pass on the Dex interface, Where to Find reformat] — 2026-09-24
Species page's Where to Find is now Serebii-style: one colour-coded header section per game
(release order, DLC sections separate) with a location/method/level/chance/conditions table
under it, replacing per-location rows with joined game labels. Milestone still open. See commit
`5ae6c72`.

## [Full UI/UX pass on the Dex interface, feedback pass on Legs 3-4] — 2026-09-24
Dex list is now one row per species with a sprite beside the name and italics-only hidden
abilities; forms moved to a toggle strip on the species page, and its Regional Dex box follows
the selected generation. Sprite complaints became the Sprite system overhaul milestone (see
TODO.md). Milestone still open. See commit `7d51e67`.

## [Full UI/UX pass on the Dex interface, Leg 4] — 2026-09-24
Dex tab now has a Pokémon sub-tab (search/sort by Name, Dex #, Abilities, with Generation
headers in Dex order) and a Locations sub-tab (location list -> species/games, inverted from
`encounters.json`). SpeciesPage's Back now returns to the tab it was opened from. Types/base
stats, Moves, and the sprite-grid mode deferred. Milestone left open pending Vanny's Leg 3
feedback. See commit `095a940`.

## [Full UI/UX pass on the Dex interface, Leg 3] — 2026-09-24
Species page reflowed into sketch-2's box layout with an inline Gen I-IX sprite strip (sprites
only; SpriteModal kept for Animated/Back/gender pair). Types and base stats not placed — no
data yet (Species/Dex reference data layer). See commit `4754bd0`.

## [Full UI/UX pass on the Dex interface, Leg 2] — 2026-09-24
`ThemeModeToggle` restyled from a 3-button text row into the sketched diamond/pearl icon box;
`theme-store` untouched. System mode has no icon, so it reads as neither icon pressed and
clicking the pressed icon returns to it. Also added a header Settings button/popup (Backup
section holds Export/Import), added at Vanny's request as the home for future settings. See
commits `1370792`, `c74e215`.

## [Full UI/UX pass on the Dex interface, Leg 1] — 2026-09-24
Top-level nav is now Collection (the old Living Dex) and Dex (placeholder until Leg 4); the
Storage Location tabs became a dropdown + edit pencil, Trainer Profiles/Storage Locations
open as popups, completion stats follow the sketched layout, and the group-by Collection view
was removed. Sketches saved to `docs/design/ui-ux-pass/` after a clean session couldn't start
the leg without them. See commit `fa2b6fc`.
