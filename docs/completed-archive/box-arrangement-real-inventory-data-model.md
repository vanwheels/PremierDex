# Completed: Box Arrangement / Real Inventory Data Model

Archived from `COMPLETED.md` at the milestone boundary — see
`docs/postmortems/box-arrangement-real-inventory-data-model.md` and `MILESTONES.md`.

## [Box view editing: drag-and-drop add/remove/swap] — Leg 7 (2026-09-03)
Made Leg 6's read-only grid editable, drag-and-drop as the whole interaction model
(decided ahead of this leg): a filled cell dragged onto another cell swaps them if
filled, or moves if empty; a new `DexBoxTray` panel lists the selected location's
not-yet-boxed entries (owned and unowned placeholders alike) as a drag source, dropped
onto an empty cell to add; dropping a filled cell onto the tray removes it. A right-click
menu (`DexBoxContextMenu`) exists only as a non-drag alternative for removal (Vanny's
call: drag-and-drop already covers add/move/swap). Swapping needed a real storage-layer
fix, not just UI wiring: `idx_entries_box_slot`'s UNIQUE index isn't deferrable, so
writing entry A straight into entry B's current slot collides with B's own still-there
row regardless of write order — new `swapEntryBoxPositions` wraps a vacate-then-place
dance (clear A, move B into A's old slot, move A into B's old slot) in one
`db.transaction()`. Every drag source/target shares one payload convention
(`dragEntryPayload.ts`: just the dragged entry's id, under a custom MIME type) so the drop
handler can tell "move within this box" from "add from the tray" by checking whether the
dragged id is currently one of this box's own cells. This was the last planned leg of the
Box Arrangement / Real Inventory Data Model milestone; marked Shipped in MILESTONES.md —
see the [post-mortem](docs/postmortems/box-arrangement-real-inventory-data-model.md). See
commit `dbd07c3`.

## [Box view UI: grid + pagination] — Leg 6 (2026-09-03)
Added a third Living Dex view mode: `buildBoxes` shapes a location-scoped entry list into
real per-box 5x6 grids keyed on Leg 3's `boxNumber`/`boxSlot`, mirroring
`buildCollectionGroups`' per-entry pattern rather than `buildDexSections`' per-form-slot
one. `DexBoxGrid` paginates one box at a time (HOME's own Box view screen, unlike
Hybrid's continuous flow) and reuses hybrid-grid.css's tile/detail-panel classes instead
of duplicating them; `DexBoxDetailPanel` mirrors `DexHybridDetailPanel` for a
click-a-cell read-only panel with an Edit Origin action (Vanny's call to include it this
leg rather than deferring to Leg 7). Box view deliberately ignores DexFilters/DexOptions
— it shows a box's literal physical contents, scoped only by the selected Storage
Location tab — and shows an explanatory empty state on the Unassigned tab, which can
never hold a box (`setEntryBoxPosition` requires a real location). Box 1 always appears
in the pager even with zero placed entries (Vanny's call), since nothing sets a box
position until Leg 7's editing UI ships; every other box number only appears once it
actually holds an entry, rather than padding out every integer in between. Post-
implementation subagent review found no correctness bugs; one test-coverage gap it
flagged (two entries in the same box at different slots) was added. See commit
`b5316ea`.

## [Export/import natural-key rework] — Leg 5 (2026-09-03)
formId/gender/shiny alone stopped being unique once duplicate individuals became real
(Leg 2); import matching now breaks the tie with each row's 0-indexed position within its
group (id-order walk, both on the export dump and the live table at restore time), added
as a 4th key segment in collection-backup.ts's entryKey. Scoped to match-only per Vanny's
call: a backup with more copies in a group than the target DB has rows for drops the
extras rather than inserting new rows — real duplicates can't be created anywhere in the
app yet (Leg 7), so this is forward-proofing, not a reachable bug today. See commit
`94cbe64`.

## [Fix downstream logic assuming one entry per species] — Leg 4 (2026-09-03)
Audited completionStats.ts, filterDexSections.ts, invalidCombo.ts, and
autoAssignLocation.ts against the per-individual model from Legs 2-3. invalidCombo.ts and
autoAssignLocation.ts already operate strictly per-entry-id and needed no changes; the
real bug lived one layer up, in buildDexSections.ts's shared `indexEntriesByForm` (which
completionStats.ts also consumes directly): its per-slot picker kept whichever entry came
last during iteration, which was safe before Leg 2 (the DB guaranteed exactly one row per
form/gender/shiny) but wrong now that a duplicate owned individual can coexist with the
unowned seed placeholder in the same slot — last-wins could pick the placeholder and
under-report that unit as unowned in completion stats, search, and filters. Fixed by
making the picker prefer an owned entry over an unowned one (first-owned-wins,
deterministic); List/Hybrid view still only surfaces one representative entry per slot by
design — enumerating every duplicate individually stays Box view's job (Leg 6-7). See
commit `29563a2`.

## [Storage Locations get box sub-units] — Leg 3 (2026-09-03)
Data layer only, no Box view UI. Added nullable `box_number`/`box_slot` to
collection_entries (self-referential CHECKs, so a plain ALTER retrofit — no rebuild
needed) plus a `UNIQUE(storage_location_id, box_number, box_slot)` index (safe to create
unconditionally: SQLite treats every NULL as distinct for uniqueness, so unboxed rows
never collide). New `setEntryBoxPosition` requires the entry already have a storage
location and rejects setting boxNumber/boxSlot independently — enforced in
sqlite-storage.ts rather than a cross-column DB CHECK, which ALTER TABLE ADD COLUMN can't
express. `setEntryStorageLocation` now also clears box position, since a slot is only
meaningful within the location it was set for. Wired through export/import too (dropping
box position if the resolved storageLocationId comes back null). Pushed sqlite-storage.ts
to 514 lines (over the 500 hard cap), so folded in the already-earmarked "Split
sqlite-storage.ts" TODO item: exportCollection/importCollection and their natural-key
matching helpers moved to new `collection-backup.ts`, and the five Row
interfaces/toXxx mappers moved to new `row-mappers.ts` (shared by both, avoiding a
circular import) — sqlite-storage.ts back to 222 lines. See commit `8f19842`.

## [Drop CollectionEntry's owned-copy uniqueness constraint] — Leg 2 (2026-09-03)
Schema/migration only, no UI changes. Dropped collection_entries' `UNIQUE(form_id,
gender, shiny)` via a table-rebuild migration (same hazard class as schema.ts's
CHECK-widen rebuilds), gated on detecting the constraint in the stored CREATE TABLE SQL.
seed.ts's placeholder insert switched from `INSERT OR IGNORE` (which relied on that
constraint to dedupe) to an explicit `NOT EXISTS` guard. No "owned" boolean-to-count
schema change was needed: `setOwned` already operates per-row-id and Collection view
already renders one row per CollectionEntry id, so duplicates already display correctly
once the constraint stops blocking them. See commit `7f5f1cd`.

## [Split App.tsx ahead of a third view-mode branch] — Leg 1 (2026-09-03)
Pure refactor, no behavior change. Pulled App.tsx apart into `useCollectionData` (all
fetched data — species/forms/entries/storage locations/trainer profiles/species
availability — plus the CRUD operations that mutate it, shared across all four top-level
views) and `dex/LivingDexView.tsx` (the Living Dex tab's own state — view-mode, filters/
sort, selected location tab — plus its derived memos and the List/Hybrid `hidden`-toggle
markup); App.tsx itself is left as shell: view-tab nav and per-view mount/hide wiring.
303 -> 103/140/170 lines across the three files. Leg 6's Box view branch lands inside
LivingDexView rather than pushing App back over cap. See commit `52d46f2`.
