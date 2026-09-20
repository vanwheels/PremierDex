# COMPLETED

## [Box view scroller lag] — 2026-09-19
Leg 4 of the Box View Quick-Wins Sweep (final leg — milestone shipped, see MILESTONES.md).
AskUserQuestion narrowed the report to Prev/Next paging specifically, and confirmed it's
first-visit-only per session (fast on repeat visits to the same box) — pointing at cold
network fetches for each cell's remote sprite (raw.githubusercontent.com, no app-side
caching) rather than a render/layout cost. Fix: DexBoxPane now prefetches the immediately
adjacent (index-1/index+1) box's sprites in the background whenever the displayed box
changes, warming Chromium's own HTTP cache ahead of an actual Prev/Next click. See commit
`2df47b2`.

## [Multi-select highlight verification] — 2026-09-19
Leg 3 of the Box View Quick-Wins Sweep. Root cause wasn't "too subtle" — Box view's
selected-tile style had been zeroed out entirely (`border-color: transparent; background:
none`) since a 2026-09-03 fix for an alarm-red border, back when Box view was still
single-select-only and the detail panel doubled as feedback. Leg 4 of Box View Polish's
multi-select never gets detail-panel feedback at all, so multi-selected tiles read as
completely unhighlighted rather than merely faint. First pass (commit `0393a76`) restored a
toned-down highlight at the sprite-tile level; Vanny caught that it still got lost against
the full-slot-sized empty/placeholder borders around it. Follow-up (commit `9e32232`) moved
the highlight to the full 108px cell, strengthened the color to lean into each theme's own
--accent hue (Pearl rose-magenta, Diamond shiny-Dialga teal) instead of a washed-out blend,
added a matching full-cell hover state (kept neutral gray, so it doesn't read as another
selection), and gave selected slots their own deeper-tint hover so hovering an
already-selected slot is still visibly distinct.

## [Jump directly to a Box] — 2026-09-19
Leg 2 of the Box View Quick-Wins Sweep. Added a "Jump to box" `<select>` to DexBoxPager,
next to Prev/Next, listing every box in the location by number/name — backed by the
`boxes` array DexBoxPane already threads through everywhere else, so no new fetch or
state was needed. Prev/Next stay as the fast path for adjacent boxes; the dropdown is for
jumping straight to a specific one. See commit `358c541`.

## [Placeholder sprites sized to match Box sprites] — 2026-09-19
Leg 2 of the Box View Quick-Wins Sweep. Root cause: DexBoxGridCell's placeholder-cell
`SpriteThumbnail` call never passed `size={CELL_SPRITE_SIZE}` (96) like the real-entry call
does, so it fell back to `SpriteThumbnail`'s own default (32, sized for DexRow's row icon).
See commit `a217f45`.

## [Ribbons & Marks not cloned by Storage Location Duplicate] — 2026-09-19
Leg 1 of the Box View Quick-Wins Sweep. See commit `5f9b33b`.

## [Duplicate Storage Location input-freeze bugfix] — 2026-09-04
Reported by Vanny: typing (though not backspace) and opening dropdown menus stopped working
for a stretch after clicking Duplicate on a large Storage Location. Root cause:
`duplicateStorageLocationTx` cloned entries with one `INSERT...SELECT` statement per
source row, run in a JS loop — at 1025+ entries that's 1025+ separate synchronous
better-sqlite3 calls back-to-back inside one transaction, blocking the main process for a
visible stretch, then `onLocationsChanged` (App's full `loadAll`) re-fetches every
species/form/entry/box/placeholder list against the now-doubled entry count on top of that.
Collapsed the loop into a single `INSERT...SELECT ... WHERE storage_location_id = @sourceId`
that clones the whole roster in one statement. Existing duplicate tests
(storage-location-storage.test.ts, bulk-entry-actions.test.ts) cover the resulting behavior
unchanged. See commit `4c36bb3`.

## [Storage Location "Duplicate" button] — 2026-09-04
Replaces the per-entry Duplicate path from [Bulk move/duplicate entries between storage
locations] below — Vanny called it out same-day as unworkable: picking entries one at a
time via checkbox to clone a whole location's 1025+-entry roster isn't a real workflow.
Duplicate now lives on the Storage Locations tab instead, one button per location
(StorageLocationRow) that clones the location itself (type/trainer link carried over,
" (Copy)" appended to the name) plus every entry currently sitting in it, in one atomic
transaction — `duplicateStorageLocation`, new IPC channel on `StorageLocationIpcChannel`.
Lands unassigned within the new location, same convention as before; box arrangement
(box_number/box_slot, box_placeholders) is deliberately not cloned — a real "start this
location fresh" flow needs a Clear-box button first, filed as a follow-up. List view's
checkbox/toolbar Move stays as-is (`bulkSetEntryStorageLocation`) — moving a handful of
specific entries after a trade is still a reasonable checkbox-driven flow; only Duplicate
needed the redesign. See TODO.md's [Bulk move: Box view support] for the still-open Move
follow-up.

## [Bulk move/duplicate entries between storage locations] — 2026-09-04
Built for List view only, per Vanny's call while scoping it: a checkbox beside each
Non-Shiny/Shiny Loc. cell (DexRow, same per-entry granularity as the existing picker
there) feeds a selection toolbar above the table (new DexBulkActionsBar) offering Move or
Duplicate to a chosen Storage Location. Move batches the existing per-entry setter
(`bulkSetEntryStorageLocation`); Duplicate (`duplicateEntries`) is the first UI path able
to create a real duplicate individual — clones every field except id/location/box
position into a brand-new row, landing unassigned within the target location same as a
move. Both land as one DB transaction. Confirmed with Vanny mid-scoping: List view only
ever surfaces one representative entry per form/gender/shiny slot (Box Arrangement Leg
4's design), so this can't reach or duplicate-reveal hidden duplicate individuals — Box
view support filed separately, see TODO.md's [Bulk move: Box view support] (renamed
2026-09-04 when the Duplicate half of that follow-up was resolved by [Storage Location
"Duplicate" button] above).

Legs 1-8 (Dex Completeness Tier Migration & Box Templates milestone) archived at
`docs/completed-archive/dex-completeness-tier-migration-box-templates.md`. Legs 1-5 (Box
View Polish & Multi-Box Editing milestone) archived at
`docs/completed-archive/box-view-polish-multi-box-editing.md`. Legs 1-10 plus an
unnumbered Diamond/Pearl theming addendum (Nav Restructuring, Visual Pass & Dex Table
Redesign milestone) archived at `docs/completed-archive/nav-visual-dex-table-redesign.md`.
Legs 1-31 (Collection & Origin Tracking milestone) archived at
`docs/completed-archive/collection-origin-tracking.md`. Legs 1-16 (Project Scaffold +
Living Dex v1 milestones — a separate, earlier numbering that collides with but predates
this one) archived at `docs/completed-archive/project-scaffold.md` and
`docs/completed-archive/living-dex-v1.md`. Legs 1-8 (User-Customizable Dex Layout Phase 1)
archived at `docs/completed-archive/user-customizable-dex-layout-phase-1.md`. Legs 1-7
(Box Arrangement / Real Inventory Data Model) archived at
`docs/completed-archive/box-arrangement-real-inventory-data-model.md`. Legs 1-2 (Deeper
Per-Game Validity & Curated Met Locations) archived at
`docs/completed-archive/deeper-per-game-validity-curated-met-locations.md`. Legs 1-5
(Ribbons/Alpha/Size/Capture-Date Tracking) archived at
`docs/completed-archive/ribbons-alpha-size-capture-date-tracking.md`. See `MILESTONES.md`
for the shipped-milestone index.
