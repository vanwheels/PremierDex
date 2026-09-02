# TODO

## [App icon] — unscheduled
No custom icon exists yet (`build/icon.png` per electron-builder convention, matching
GW2-Squaded) — packaged builds currently ship with Electron's default icon. Needs
production-quality PokéBall-or-similar artwork before a real public release; not
blocking local/internal packaging.
Last touched: 2026-09-01. Re-check count: 0.

## [Trainer Profile backup export/import] — unscheduled
Trainer Profiles (Leg 1) aren't included in the JSON backup export/import flow
(`collection-export.ts`) — a reinstall or a restore from backup silently loses every
profile the user created. Noticed while building Leg 1; deferred since Leg 1's scope was
CRUD + schema + basic UI only, and wiring it in touches the export format/version. Worth
doing before Leg 4 makes Trainer Profiles load-bearing for Collection Entry origin data.
Last touched: 2026-09-02. Re-check count: 0.

## [Storage Location model] — Leg 2
Generalized storage-location concept distinct from Trainer Profile: HOME Account,
Pokémon Bank, Pokémon Box, My Pokémon Ranch, and in-save-file dexes. A Pokémon's
current location must be trackable independently of its origin (Trainer Profile), so
trades/transfers move location without touching origin. Depends on Leg 1 existing.
Catch: unlike Trainer Profile, storage locations don't uniformly have TID/SID — HOME
has its own UID (separate identifier space, needs verifying how it's structured), while
Bank/Ranch/Box are believed to carry no persistent identifier at all beyond whatever's
implicit in the save file, so identity there is probably just user-provided naming.
Needs confirming before the schema is locked in.
Last touched: 2026-09-02. Re-check count: 0.

## [Per-entry origin data + nicknames] — Leg 4
Wire OT/TID/origin game (origin-game list, pulled forward into Leg 1 — see COMPLETED) and
nickname onto each Collection Entry, sourced from a linked Trainer Profile (Leg 1) but
stored immutably on the entry itself so later transfers/storage-location changes (Leg 2)
never overwrite origin. Depends on Legs 1-2.
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
