# COMPLETED

## [Where to Find section on SpeciesPage, Leg 3] — 2026-09-23
Final leg — milestone shipped, see MILESTONES.md. Added `encounterLocationsForForm`
(`encountersFormat.ts`), grouping `encounters.json`'s raw per-location/version/method rows
into a per-location list on `SpeciesPage`, deduping versions sharing an identical
method/level/chance/condition combination into one games label (same precedent as Leg 5 of
the Species database milestone's `safari-flee-rates.ts`). Isle of Armor/Crown Tundra DLC
version names resolve back to the base Sword/Shield id for sorting, with a distinguishing
suffix on the display label. See commit `83c7442`.

## [Encounter data storage/IPC wiring, Leg 2] — 2026-09-23
Wired `data/pokemon/encounters.json` into the renderer end-to-end, following the
`loadSpeciesDetails` pattern exactly: `loadEncounterData()` in `load-species-data.ts`, a
`loadEncounters` channel in `ipc-channels.ts`, the `pokemon-ipc.ts` handler, the
`AppBridge.loadEncounters` preload binding, and `useCollectionData`'s `encounterData` state
(loaded alongside the rest of `loadAll`). No consumer yet — Leg 3 wires it into SpeciesPage.
See commit `af1072f`.

## [Encounter data fetch script + types, Leg 1] — 2026-09-23
Added `EncounterData` (`src/shared/types/encounters.ts`), mirroring PokeAPI's
`/pokemon/{id}/encounters` shape and keyed by pokeapiId like `FormDetailEntry`, with dedup
tables for location-area/method/version names. `scripts/fetch-encounters.ts` fetches it for
all 1329 distinct form pokeapiIds, restricted to the 22 PokeAPI-covered version groups (Gen
1-7, Let's Go, Sword/Shield + Isle of Armor/Crown Tundra DLC, Colosseum/XD); wrote 927 forms'
worth of encounters (1432 location areas, 64 methods, 38 versions) to
`data/pokemon/encounters.json`. See commit `f1984cf`.

## [Codebase File-Size Cleanup Leg 6: split fetch-pokemon-forms.ts] — 2026-09-22
Final leg — milestone shipped, see MILESTONES.md. Split along the boundary scoped in
TODO.md: pulled OVERRIDES, SHINY_LOCKED, ALWAYS_SHINY, VERSION_GROUP_GENERATION,
REGIONAL_GROUPS, and the ride-mode/starter/spurious-multi-form/gender-pair-multi-form
species lists into a sibling `scripts/pokemon-forms-data.ts`, leaving the fetch/
classification logic (`fetchSpeciesForms`, `fetchDefaultVarietySubForms`,
`resolveRegionalGroup`, `isExcludedVariety`, etc.) behind. 656 lines -> 458
(fetch-pokemon-forms.ts) + 223 (pokemon-forms-data.ts). See commit `af9ea1d`.

## [Codebase File-Size Cleanup Leg 5: split met-locations.test.ts] — 2026-09-22
Split along the region/family boundary scoped in TODO.md: one test file per map family
(kanto/johto/hoenn/orre/sinnoh/unova/kalos/alola/galar/hisui/paldea/go), mirroring
met-locations.ts's own const groupings and matching how a region can span multiple
generations (e.g. `met-locations.kanto.test.ts` covers Gen 1, FireRed/LeafGreen, and
Let's Go alike). All 147 test cases carried over unchanged; largest resulting file is 189
lines. 1330 lines -> 12 files, none over 190 lines. See commits `6d5237b`, `bd71b30`.

## [Codebase File-Size Cleanup Leg 4: split useCollectionData.ts] — 2026-09-21
Split along the boundary scoped in TODO.md: the box-position/undo-stack slice
(setEntryBoxPosition/swapEntryBoxPositions/fillBoxSlots/moveEntriesToLocation/undo, their
apply/snapshot helpers, and the undo-stack state itself) moved into a new
`useBoxPositionUndo` hook, taking the shared `entriesRef`/`setEntries`/
`setBoxPlaceholdersState` as arguments and composed back in by `useCollectionData`.
501 lines -> 328 (useCollectionData.ts) + 241 (useBoxPositionUndo.ts). See commit
`0844735`.

## [Codebase File-Size Cleanup Leg 3: split sqlite-storage.ts] — 2026-09-21
Split along the boundary scoped in TODO.md: `collection-entry-storage.ts` now owns the
CollectionEntry-specific writers (setOwned/setEntryOrigin/setEntryStorageLocation/
box-position/bulk-*), mirroring collection-backup.ts's own extraction — its own prepared
statements against the same `db` handle, including a re-prepared `clearBoxPlaceholderStmt`
(also still needed by sqlite-storage.ts's own box-placeholder CRUD, which stays behind).
`sqlite-storage.ts` delegates to it the same thin way it already delegates to
`collection-backup.ts`. 743 lines -> 458 (sqlite-storage.ts) + 354 (collection-entry-storage.ts).
See commit `4d2c425`.

## [Codebase File-Size Cleanup Leg 2: split schema.ts/schema.test.ts] — 2026-09-21
Split along the CHECK-widen-rebuild/retrofit-ALTER boundary scoped in TODO.md:
`schema-rebuilds.ts` (table rebuilds), `schema-retrofits.ts` (plain ADD COLUMN retrofits),
and `schema-constants.ts` (shared closed-set SQL lists), with `schema.ts` orchestrating them
in the original call order so the sid-widen-before-later-retrofits ordering hazard is
preserved (now spelled out in comments instead of implicit in block sequencing).
`schema.test.ts`'s CHECK-widen rebuild tests moved to `schema-rebuilds.test.ts` along the
same boundary. See commit `7c9426f`.

## [Codebase File-Size Cleanup Leg 1: health check + sweep] — 2026-09-21
Confirmed Legs 2-5's recorded line counts all still match current state (no drift since
scoping). Swept `src`/`scripts`/`data` for untracked hard-cap (500+) violators and found two:
`schema.test.ts` (606 lines, folded into Leg 2 — its flat `it()` list groups naturally along
the same CHECK-widen-rebuild/retrofit-ALTER boundary Leg 2 is already splitting on) and
`scripts/fetch-pokemon-forms.ts` (656 lines, new Leg 6 — despite its docstring framing it as
data-adjacent, it's `.ts` logic, not data, so it doesn't qualify for the static-data
exemption `met-locations.ts`/`forms.json` get). Also found 11 files in the 300-499
"soft cap" band; per Vanny (2026-09-21), this milestone stays scoped to hard-cap violators
only, matching every file already tracked in Legs 2-5 — soft-cap files aren't split
candidates for now. Pure investigation/decision leg, no code diff.

## [Ribbons & Marks: List/Collection View Entry Points Leg 2: inline Collection view button] — 2026-09-20
Final leg — milestone shipped, see MILESTONES.md. `CollectionRow`'s single Origin cell had
room (unlike List view's cramped regular/shiny cells), so it got a straightforward second
button next to "Origin", mechanically matching the existing Box/Hybrid detail panel
pattern. `CollectionView` added a `ribbonsMarksTarget` state parallel to its existing
`originTarget`. See commit `2854951`.

## [Ribbons & Marks: List/Collection View Entry Points Leg 1: List view context menu] — 2026-09-20
DexRow's regular/shiny cells had no room for a second inline button (checkbox + Origin
button + gender select + badges, x2 columns) — resolved via AskUserQuestion in favor of a
right-click menu, reusing the existing generic `DexBoxContextMenu` component rather than a
mechanical copy of Box/Hybrid's inline-button wiring. `DexTable` now owns a `contextMenu`
target alongside its existing `originTarget`, with "Edit Origin" and "Ribbons & Marks" as
the two menu actions. See commit `d29fa77`.

## [Evolution-Chain Reachability Leg 2: wire the ancestor walk into checkEntryValidity] — 2026-09-20
Final leg — milestone shipped, see MILESTONES.md. `checkEntryValidity` now takes a
`speciesById` lookup and walks `evolvesFromSpeciesId` parent pointers so a species counts
as available when any ancestor is, threaded down through DexTable/DexBoxPane/DexHybridGrid
(each builds the lookup via useMemo) to DexRow/DexBoxDetailPanel/DexHybridDetailPanel.
Verified read-only against the real collection: all 8 named false positives clear, no new
ones introduced. See commit `a50d76a`.

## [Evolution-Chain Reachability Leg 1: record each species' evolution parent] — 2026-09-20
Widened `species-evolution.json`/`fetch-evolution-chains.ts` to record each species'
direct evolution parent (`evolvesFromSpeciesId`) alongside the existing
`isFinalEvolutionStage`, threaded through a new `evolves_from_species_id` species-table
column, row-mappers, the shared `Species` type, and seed.ts's backfill. Data acquisition
and schema only, no `checkEntryValidity` change — see commit `723278f`.

## [Box View Move & Undo Operations Leg 3: multi-drag/cross-location undo] — 2026-09-20
Final leg — milestone shipped, see MILESTONES.md. `fillBoxSlots` and `moveEntriesToLocation`
wrote directly to the DB with no undo capture, unlike Leg 2's single-move/swap undo. Added
`StorageAdapter.restoreEntryBoxPositions`, an atomic vacate-then-restore batch write (same
non-deferrable-UNIQUE-index workaround as `fillBoxSlots`/`swapEntryBoxPositions`
themselves), and a `'batch'` undo-stack entry (array of per-entry
storageLocationId/boxNumber/boxSlot snapshots) that both `fillBoxSlots` and
`moveEntriesToLocation` now push before writing. See commit `d6b5480`.

## [Box View Move & Undo Operations Leg 2: single-move/swap undo] — 2026-09-20
Added an undo stack to `useCollectionData`: `setEntryBoxPosition` captures the entry's
prior box position (via an `entriesRef` so the callback stays zero-dependency) before the
write, `swapEntryBoxPositions` records just the two swapped ids (a swap is its own
inverse), and `undo` replays the inverse through the same IPC calls. Wired to Ctrl+Z
(skipped while a text field has focus) and a visible Undo button in Box view's toolbar,
both gated on Box view actually being the visible tab/view-mode. See commit `ff561c4`.

## [Box View Move & Undo Operations Leg 1: cross-location move] — 2026-09-20
AskUserQuestion resolved the leg's open UX decision as "both": dragging a selection onto a
second pane pointed at a different Storage Location (new location dropdown next to "Open
Second Box"), plus a "Move to location…" context-menu picker for when the destination
isn't open in either pane. Added `StorageAdapter.moveEntriesToLocation` — a per-entry
placements list (not a single startSlot like `fillBoxSlots`) reusing
`fillInPlaceholderEntryStmt`'s single-UPDATE write, needing no vacate-first step since the
destination location always differs from the source. The picker path finds free
destination slots via a new `findAvailableSlots` helper (creating boxes as needed, same
shortfall-loop shape as Apply Template). See commit `ff771c2`.

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
`docs/completed-archive/ribbons-alpha-size-capture-date-tracking.md`. Legs 1-28 (Curated
Met Location dataset milestone) archived at
`docs/completed-archive/curated-met-location-dataset.md`. See `MILESTONES.md` for the
shipped-milestone index.
