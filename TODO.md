# TODO

## [App icon] — unscheduled
No custom icon exists yet (`build/icon.png` per electron-builder convention, matching
GW2-Squaded) — packaged builds currently ship with Electron's default icon. Needs
production-quality PokéBall-or-similar artwork before a real public release; not
blocking local/internal packaging.
Last touched: 2026-09-01. Re-check count: 0.

## [Animated Sprites toggle] — Leg 11
A third sprite display mode alongside the Leg 4 generation stepper: PokeAPI's sprite
CDN has a `versions/generation-v/black-white/animated/` folder (with its own `shiny/`
subfolder) holding animated gen-5 sprites — confirmed to exist during Leg 4's research,
but not wired up. Needs a toggle in `SpriteModal.tsx` to switch static/animated, scoped
to whichever generations actually have an animated folder (likely just gen 5).
Last touched: 2026-09-01. Re-check count: 0.

## [Dex/species exclusions: totem, Let's Go starters, Koraidon/Miraidon modes] — Leg 7
Drop 12 totem-form rows (Raticate-Alola, Marowak-Alola, Gumshoos, Vikavolt, Araquanid,
Lurantis, Salazzle, Togedemaru, Kommo-o, Mimikyu totem-disguised/busted — in-game bosses,
not catchable), Eevee/Pikachu's `starter` (Let's Go) forms, and Koraidon/Miraidon's
ride-mode cosmetic variants (in-game traversal feature, not a persistent form) — these
shouldn't occupy a dex slot at all. Full list: `docs/investigations/home-depositability-audit.md`.
Last touched: 2026-09-01. Re-check count: 0.

## [Home-depositability corrections for existing forms] — Leg 8
Dialga/Palkia/Giratina Origin, Necrozma Dawn Wings/Dusk Mane, Calyrex Ice/Shadow Rider,
Ogerpon's 3 masks, and Minior's 7 core color forms are real, non-battle-only forms
currently stored `dex_distinct` but not actually depositable in Pokemon Home yet.
`non_boxable` was defined from PokeAPI's `is_battle_only` flag, which doesn't capture
this — needs either a new field or an `OVERRIDES` batch; decide when scoping. Minior may
be an actual heuristic bug rather than a Home-specific gap — check PokeAPI's raw
response before assuming an override is needed. Detail:
`docs/investigations/home-depositability-audit.md`.
Last touched: 2026-09-01. Re-check count: 0.

## [Missing form data: Unown/Vivillon/Flabébé line/Furfrou/Alcremie/Poltchageist/Sinistcha] — Leg 9
`fetch-pokemon-forms.ts` only pulled the `base` (and sometimes `gmax`) form for these
species — 0 of Unown's 28 letters, Vivillon's ~20 patterns, Flabébé/Floette/Florges' 5
colors each, Furfrou's 9 trims, Alcremie's 63 combos, or Poltchageist/Sinistcha's 2
forms each, all of which are Home-depositable. Likely these express variants as multiple
`pokemon-form` entries under one PokeAPI `pokemon` variety rather than separate
varieties — confirm against a live response before fixing. Detail:
`docs/investigations/home-depositability-audit.md`.
Last touched: 2026-09-01. Re-check count: 0.

## [Base-form display naming] — Leg 10
Deoxys and Wormadam's default variety is stored as `formName: 'base'` (storage
convention), but their in-game name is "Normal"/"Plant" respectively — Oricorio
("Baile") and Squawkabilly ("Green") likely need the same display-label treatment even
though their non-base forms are already present and correctly categorized. Display-layer
fix, not a data-model change; sweep for other species with a named base forme first.
Detail: `docs/investigations/home-depositability-audit.md`.
Last touched: 2026-09-01. Re-check count: 0.
