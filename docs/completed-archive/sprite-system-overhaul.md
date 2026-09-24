# Completed: Sprite system overhaul

Archived from `COMPLETED.md` at the milestone boundary — see
`docs/postmortems/sprite-system-overhaul.md` and `MILESTONES.md`.

## [Sprite system overhaul, Leg 4] — 2026-09-24
Version chip row under the Gen I-IX strip for Gen 1-4 and 6, driven by Leg 2's source table
via `spriteSourceFor`. The pick is kept per generation on `SpeciesPage` and carried into the
enlarge modal; shiny/back availability follows the chosen game. Modal has no chips of its own.
See commit `adfec83`.

## [Sprite system overhaul, Leg 3] — 2026-09-24
Species strip hides the shiny slot for Gen 1 (flex row centers the lone sprite) and captions
Gen 8/9 as Pokémon HOME art (`generationArtNote`). The modal's Back toggle now hides when the
generation has no back art and Animated is off, instead of showing evergreen back art. Follow-up: Gen 1 now uses `transparent/` art, the modal's Shiny
is disabled in Gen 1, and Animated is disabled before Gen 5. See commits `8f3c4e7` and `5bc6184`.

## [Sprite system overhaul, Leg 2] — 2026-09-24
Replaced the `GENERATION_GAME` + hardcoded `.png` assumption with a per-generation source table
(`spriteSources.ts`: folder, extension, has-shiny/has-back; all versions Leg 4 will offer are
already in it). Fixes Gen 7's `.gif` 404s, moves Gen 2 to `transparent/`, and Gen 8/9 to `other/home`
(shiny exists, no `back/` — falls back to evergreen back art). See commit `9f37b9a`.

## [Sprite system overhaul, Leg 1] — 2026-09-24
Design pass: chose PokeAPI as the only source (no scraping), stay fetch-from-CDN, HOME renders
for Gen 8/9, USUM gifs for Gen 7, `transparent/` for Gen 2, hide Gen 1's shiny slot, and a
version chip row for multi-game generations. Full reasoning in
`docs/investigations/sprite-sources.md`. See commit `703edca`.
