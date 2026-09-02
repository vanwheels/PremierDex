# TODO

## [App icon] — unscheduled
No custom icon exists yet (`build/icon.png` per electron-builder convention, matching
GW2-Squaded) — packaged builds currently ship with Electron's default icon. Needs
production-quality PokéBall-or-similar artwork before a real public release; not
blocking local/internal packaging.
Last touched: 2026-09-01. Re-check count: 0.

## [Trainer Profile + Storage Location backup export/import] — unscheduled
Neither Trainer Profiles (Leg 1) nor Storage Locations (Leg 2) are included in the JSON
backup export/import flow (`collection-export.ts`) — a reinstall or a restore from
backup silently loses every profile/location the user created. Noticed while building
Leg 1, re-confirmed as the same gap while building Leg 2; deferred both times since each
leg's scope was CRUD + schema + basic UI only, and wiring it in touches the export
format/version. Now confirmed live: Leg 4 gave Collection Entries a `trainerProfileId`
FK, so a restore drops each entry's link back to its source profile (the copied
origin_game/ot_name/tid/sid/nickname snapshot itself is unaffected — only the
provenance FK dangles). Re-check count reset since this is new information, not a
repeat flag.
Last touched: 2026-09-02. Re-check count: 0.

## [Dex search/filter] — Leg 5
Search the Living Dex by name/dex#; filter by owned, shiny, regional form, generation,
and the existing badge flags (homeBoxable, shinyLocked). No dependency on the Trainer
Profile/origin work above — can be picked up independently if priorities shift.
Last touched: 2026-09-02. Re-check count: 0.

## [Dex sort] — Leg 6
Sortable columns on the Living Dex grid (dex#, name, generation, owned/shiny status).
Independent of the origin-tracking chain.
Last touched: 2026-09-02. Re-check count: 0.

## [Completion stats dashboard] — Leg 7
Owned%/shiny% completion stats, broken down by generation and regional group. Natural
follow-on to search/filter/sort (Legs 5-6) reusing the same query surface, but not
strictly blocked on them.
Last touched: 2026-09-02. Re-check count: 0.
