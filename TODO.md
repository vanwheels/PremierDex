# TODO

## [App icon] — unscheduled
No custom icon exists yet (`build/icon.png` per electron-builder convention, matching
GW2-Squaded) — packaged builds currently ship with Electron's default icon. Needs
production-quality PokéBall-or-similar artwork before a real public release; not
blocking local/internal packaging.
Last touched: 2026-09-01. Re-check count: 0.

## [Trainer Profile model] — Leg 1
New entity: game + TID/SID + OT name, tied to a save. This is the origin identity a
Collection Entry will eventually reference — build and persist it standalone first
(CRUD, schema, basic UI for managing profiles) before wiring any entry data to it.
Last touched: 2026-09-02. Re-check count: 0.

## [Storage Location model] — Leg 2
Generalized storage-location concept distinct from Trainer Profile: HOME Account,
Pokémon Bank, Pokémon Box, My Pokémon Ranch, and in-save-file dexes. A Pokémon's
current location must be trackable independently of its origin (Trainer Profile), so
trades/transfers move location without touching origin. Depends on Leg 1 existing.
Last touched: 2026-09-02. Re-check count: 0.

## [Origin-game list] — Leg 3
Reference list of origin games for use in origin data entry: mainline titles,
transfer-eligible spinoffs (Colosseum, XD), and Pokémon GO as a selectable origin
(GO has no TID/SID — uses OT name/nickname instead, needs its own handling).
Last touched: 2026-09-02. Re-check count: 0.

## [Per-entry origin data + nicknames] — Leg 4
Wire OT/TID/origin game (Leg 3's list) and nickname onto each Collection Entry, sourced
from a linked Trainer Profile (Leg 1) but stored immutably on the entry itself so later
transfers/storage-location changes (Leg 2) never overwrite origin. Depends on Legs 1-3.
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
