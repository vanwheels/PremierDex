# COMPLETED

## [Size classification] — 2026-09-19
Leg 3 of the Ribbons/Alpha/Size/Capture-Date Tracking milestone. See commit `8e7a04f`.

## [Alpha + Capture Date] — 2026-09-19
Leg 2 of the Ribbons/Alpha/Size/Capture-Date Tracking milestone. See commit `ff73ea0`.

## [Scope Ribbons/Alpha/size/capture-date tracking] — 2026-09-19
Design-only leg: verified each of the four markers against Bulbapedia/Serebii and Vanny's
real collection rather than the original TODO framing's assumptions. Found two of the four
were scoped narrower than reality — Alpha isn't Legends-Arceus-only (Legends Z-A has it too,
693 owned entries), and the size-variance scalar predates PLA/Scarlet-Violet entirely
(introduced Let's Go Pikachu/Eevee, Gen VII, silently carried through Sword/Shield/BDSP
without ever being shown to the player). Also resolved the Marks-vs-Ribbons question the
TODO item posed: Marks are a separate parallel system (Sword/Shield onward, ~43 named marks)
rather than a Gen 9 replacement for Ribbons, and both need their own many-to-many join
table. Full write-up and the resulting 4-leg sequence (Alpha+Capture Date, Size
classification, Ribbons & Marks schema, Ribbons & Marks data curation) in
`docs/investigations/ribbons-alpha-size-capture-date.md`.

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
`docs/completed-archive/box-arrangement-real-inventory-data-model.md`. See `MILESTONES.md`
for the shipped-milestone index.
