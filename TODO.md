# TODO

## [App icon] — unscheduled
No custom icon exists yet (`build/icon.png` per electron-builder convention, matching
GW2-Squaded) — packaged builds currently ship with Electron's default icon. Needs
production-quality PokéBall-or-similar artwork before a real public release; not
blocking local/internal packaging.
Last touched: 2026-09-01. Re-check count: 0.

## [Wire homeBoxable into the collectible dex view] — unscheduled
Leg 8 corrected `home_boxable` on the 17 forms Home doesn't yet accept (Dialga/Palkia/
Giratina Origin, Necrozma Dawn/Dusk, Calyrex Ice/Shadow Rider, Ogerpon's masks, Minior's
core colors), but the field has no UI consumer — `buildDexSections.ts` only filters on
`formCategory === 'non_boxable'`, not `homeBoxable`. Decide how these should render (own
section? greyed-out row within their species? excluded like non_boxable?) before wiring
a filter/badge.
Last touched: 2026-09-02. Re-check count: 0.

