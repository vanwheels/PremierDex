# COMPLETED

Legs 1-10 plus an unnumbered Diamond/Pearl theming addendum (Nav Restructuring, Visual
Pass & Dex Table Redesign milestone) archived at
`docs/completed-archive/nav-visual-dex-table-redesign.md`. Legs 1-31 (Collection &
Origin Tracking milestone) archived at
`docs/completed-archive/collection-origin-tracking.md`. Legs 1-16 (Project Scaffold +
Living Dex v1 milestones — a separate, earlier numbering that collides with but predates
this one) archived at `docs/completed-archive/project-scaffold.md` and
`docs/completed-archive/living-dex-v1.md`. See `MILESTONES.md` for the shipped-milestone
index.

## [Existing dex entries stuck in Unassigned instead of vanny's HOME dex] — Leg 6 (2026-09-03)
Confirmed with Vanny it wasn't a filter/import bug — old entries genuinely had
storage_location_id NULL in the DB. `createStorageLocation` now backfills every owned,
unassigned entry onto a location the moment it's the first one ever created (the 0->1
transition), so this can't recur for new installs; her own dev DB (739 entries,
storage_locations already existing) got a one-off manual UPDATE to location 1 ('vanny'
HOME) since the new hook only fires on that first-ever creation. Raised a "bulk move/
duplicate between locations" feature idea for later, added to TODO.md. See commit
`e440c20`.

## [Non-HOME locations show all 1025 species as depositable] — Leg 5 (2026-09-03)
Added `locationDepositability.ts`: a generation-cap dataset for ranch (Gen 4)/box (Gen
3)/bank (Gen 7), and a save_file check that reuses Legs 4/6's per-game
SpeciesAvailabilityData against the location's linked Trainer Profile game — home and the
Unassigned tab stay uncapped. `filterDepositableSections` wires this into App.tsx ahead of
the user's own DexFilters, mirroring filterDexSections' section-survival/cosmetic-promotion
shape. An already-owned row always passes regardless of the cap (grandfathered) rather than
hiding real data. Also fixed a staleness gap the fix surfaced: App's new `trainerProfiles`
copy needed refreshing on create too, not just update/delete. See commit `a4280f3`.

## [Completion tables should share a row on wide windows] — Leg 4 (2026-09-03)
Wrapped the three Completion Stats tables in a flex row (`.completion-stats-tables`,
`flex-wrap: wrap`) instead of the vertical stack, with each table growing to fill its
share of the row (`completion-stats-table` moved from `width: auto` to `width: 100%`).
App's `minWidth` (1024) matches GW2-Squaded's, so all three fit side by side rather than
just two. See commit `2b34849`.

## [Dex Table column widths don't use expanded horizontal space] — Leg 3 (2026-09-03)
Gave `.dex-table` a `<colgroup>` with percentage widths (Sprite 4%, # 3%, Name 17%, Gen
3%, Nickname 8%, Non-Shiny 8%, Non-Shiny Game 13.5%, Non-Shiny Ball 4%, Non-Shiny Loc.
7%, and the shiny side mirroring that), on top of Leg 2's table-layout: fixed — percentages
throughout rather than a px/% mix, so the split stays stable as the table's own width
changes. Also loosened `.dex-inline-origin-field`'s max-width from a fixed 6rem to 100%,
since that fixed cap was capping the Game cells' text well below their new (wider)
column regardless of the colgroup change. See commit `479bf07`.

## [Table resize/tab-switch performance] — Leg 2 (2026-09-03)
Profiled both symptoms before touching anything: buildDexSections/filterDexSections/
sortDexSections were already correctly memoized in App.tsx, and there's no resize
listener anywhere in the codebase — so recomputation and debounce, two of the TODO
item's three candidate fixes, were ruled out. Tab-switch lag was a full unmount/remount
of ~1000+ DexRows on every switch into Living Dex (App.tsx's conditional `{view === 'dex'
&& ...}` render); fixed by keeping that view mounted and toggling `hidden` instead.
Resize lag was table-layout: auto forcing per-cell remeasurement across all rows on every
reflow tick; fixed with table-layout: fixed on .dex-table (per Vanny's call, ahead of
Leg 3's colgroup-based real widths rather than waiting for it). See commit `943ab2c`.

## [Ball column shows text instead of the ball icon] — Leg 1 (2026-09-03)
Swapped DexRow.tsx's regular/shiny Ball cells to render `<BallIcon ball={...} />`
(conditioned on the entry being owned and having a `caughtBall` set), matching
CollectionRow's existing usage instead of the plain-text `caughtBallCell()` output.
`caughtBallCell()` itself is unchanged — still backs the `<td>` title attribute and its
own tests. See commit `4284893`.
