# Sprite sources per generation

Investigated 2026-09-24 against `raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon`
(all checks live, using Pikachu #25). Decisions were made with Vanny in the Sprite system
overhaul design pass.

## Decisions

- **Stay on fetch-from-CDN.** Bundling sprites is a separate future discussion about app data
  management, not part of this milestone.
- **No scraping / hand-curated sources.** Serebii's per-game renders (SwSh, SV, USUM) are out:
  unknown provenance, irregular per-form URLs, no scraping. PokeAPI is the only source.
- **Gen 8 and 9 use `other/home` renders.** HOME is one generation-independent set (512x512,
  single model per form, has `shiny/`), so it can't show per-game differences between 7/8/9.
  The BDSP/SV box art (256x256, no shiny/back) is dropped. Label it as HOME art, not "Gen 8".
  Vanny may find a better source later.
- **Gen 7 keeps the USUM gifs** (77x60 animated, has shiny/back/back-shiny). They are `.gif`,
  not `.png` — the old `generationSpriteUrl` bug.
- **Gen 1 has no shiny art:** hide the shiny slot and center the main sprite.
- **Gen 2 uses the `transparent/` subfolder** (exists for gold/silver/crystal, incl. shiny/back).
- **Per-version toggle:** a chip row under the Gen I-IX strip, only for generations with more
  than one game. Toggle first; side-by-side layout is a possible later change.
- "Official 3D models" means HOME's static 3D-style renders. PokeAPI has no rotatable models.

## Per-generation sources

| Gen | Versions offered | Folder(s) under `versions/` | Notes |
|---|---|---|---|
| 1 | Red/Blue, Yellow | `generation-i/{red-blue,yellow}` (+`transparent/`) | No shiny. |
| 2 | Gold, Silver, Crystal | `generation-ii/{gold,silver,crystal}/transparent` | Shiny + back exist. |
| 3 | R/S, FR/LG, Emerald | `generation-iii/{ruby-sapphire,firered-leafgreen,emerald}` | Shiny + back exist. |
| 4 | D/P, Platinum, HG/SS | `generation-iv/{diamond-pearl,platinum,heartgold-soulsilver}` | Shiny, back, female exist. |
| 5 | B/W | `generation-v/black-white` | Single version; animated set is gen 5 only. |
| 6 | X/Y, OR/AS | `generation-vi/{x-y,omegaruby-alphasapphire}` | Shiny + back exist. |
| 7 | USUM | `generation-vii/ultra-sun-ultra-moon` | `.gif`, not `.png`. |
| 8, 9 | HOME | `other/home` | Shiny exists; no `back/`. |

Verified in Leg 2 (Pikachu #25): every folder in the table above resolves for front/back, and
shiny/back-shiny for all but Gen 1; `generation-i/yellow` has no `shiny/` either; `other/home` has
`shiny/` and `female/` but no `back/`; `generation-i/red-green` 404s (JP only, not offered).
Female coverage per folder is not checked — a missing female file 404s into the "unavailable" slot.
