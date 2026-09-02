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

## [Wire homeBoxable into the collectible dex view] — unscheduled
Leg 8 corrected `home_boxable` on the 17 forms Home doesn't yet accept (Dialga/Palkia/
Giratina Origin, Necrozma Dawn/Dusk, Calyrex Ice/Shadow Rider, Ogerpon's masks, Minior's
core colors), but the field has no UI consumer — `buildDexSections.ts` only filters on
`formCategory === 'non_boxable'`, not `homeBoxable`. Decide how these should render (own
section? greyed-out row within their species? excluded like non_boxable?) before wiring
a filter/badge.
Last touched: 2026-09-02. Re-check count: 0.

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
