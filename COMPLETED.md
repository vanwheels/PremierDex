# COMPLETED

## [Species detail popup + evolution family tree Leg 9: fix Eevee's 8-way branch layout and long method text] — 2026-09-22
Two fixes to `EvolutionTree.tsx`/`evolution-tree.css`, both scoped to display only (no data
model change). New `evolutionMethodLabel.ts`'s `condenseMethodLabel` collapses a
multi-alternative `" or "`-joined method string (Leafeon/Glaceon's per-game location
alternatives, the longest strings in the dataset) to a short "N Methods" label with the full
string moved to a native `title` tooltip — same pattern as `DexRow`'s
`dex-invalid-combo-badge` — instead of letting the run-on sentence wrap across many lines in
the fixed-width arrow column. Confirmed fine as-is by Vanny; full rework deferred to the
future "Full UI/UX pass" milestone. Separately, a branch above a new `WIDE_BRANCH_THRESHOLD`
(4; only Eevee's 8-evolution branch crosses it today) now splits its children into two
columns instead of one tall one, roughly halving that branch's height so it fits without
triggering `.evolution-tree`'s `max-height: 70vh` scroll. First attempt shared a CSS grid
across both columns, which Vanny caught live: with both columns' rows on shared grid tracks,
column 1's bubble sat right beside column 2's arrow on the same row (e.g. Vaporeon beside the
arrow into Umbreon), reading as if one evolved into the other. Reworked to two independent
flex columns with a border on the second — see `evolution-tree.css`'s own comment. Vanny
scoped the two-column fix to Eevee only for now; wants to see it live before deciding whether
it's worth applying to every branching family. See commit `<pending>`.

## [Species detail popup + evolution family tree Leg 8: wire forme-switch groups into the popup] — 2026-09-22
UI half of Leg 7: species detail popup's info view gets a second "View Alternate Formes"
button (next to "View Evolution Family"), shown only for the 14 species with a
`forme-switch-groups.json` entry. New `FormeSwitchGroupView.tsx` renders the group's formes
as a flat, equally-ranked row (not a tree — there's no parent/child direction between e.g.
Deoxys's Attack/Defense/Speed formes) labeled "Not an evolution — alternate forme," plus the
switch method and any per-game note; clicking a forme's sprite re-centers the popup on it the
same way EvolutionTree's bubbles do. `formeSwitchGroups` threaded from main
(`loadFormeSwitchGroupsData`) through IPC/preload/`useCollectionData` down to
`SpeciesDetailPopup`, mirroring `evolutionEdges`' existing plumbing exactly. Flagged, not
fixed: this pushed `DexBoxGrid.tsx`/`DexBoxPane.tsx` to/over the file-size cap — see
Unscheduled in TODO.md. See commit `12e2dac`.

## [Species detail popup + evolution family tree Leg 7: non-evolutionary forme-switch data] — 2026-09-22
No PokeAPI endpoint models forme changes like Deoxys/Rotom/Giratina/Shaymin/Kyurem/Necrozma/
Calyrex at all (its evolution-chain data only covers evolutions), so unlike every other
data/pokemon/*.json file this is hand-curated rather than fetched, the same treatment
pokemon-forms-data.ts already gives OVERRIDES/SHINY_LOCKED. New
`scripts/forme-switch-groups-data.ts` (source array, sourced against Bulbapedia/official
mechanics) + `scripts/build-forme-switch-groups.ts` (validates every speciesId+formName pair
against forms.json, writes `data/pokemon/forme-switch-groups.json`) cover 14 species: the 7
Vanny named plus Hoopa, the Forces of Nature trio + Enamorus, Ogerpon, and Keldeo — all
switchable via the same pattern (item-driven, boxable, reversible). Zygarde and every
battle-only/auto-reverting alternate state (Mega/Gmax, Ultra Necrozma, Zacian/Zamazenta
Crowned, Arceus's plates, etc.) were investigated and deliberately excluded — see the data
file's module doc comment for the reasoning. Data acquisition only, no runtime wiring — see
Leg 8. See commit `c9e9826`.

## [Species detail popup + evolution family tree Leg 6: fix cosmetic-variant forms showing the base form's family] — 2026-09-22
`buildEvolutionFamilyTree`'s root walk operated at the species level and ignored formName
entirely, so a cosmetic-variant Pikachu form (Cosplay, cap variants, etc.) inherited the base
Pikachu -> Raichu family instead of rendering as standalone. Threaded `formName`/`forms` into
`buildEvolutionFamilyTree`, which now short-circuits to a childless standalone node when the
current form's `formCategory` isn't `dex_distinct` (covers both `cosmetic_variant` and
`non_boxable`, e.g. Mega/Gmax) before doing the species-level root walk. See commit `5992a0d`.

## [Species detail popup + evolution family tree Leg 5: horizontal layout, name centering, method casing] — 2026-09-22
Reworked `EvolutionTree.tsx`/`evolution-tree.css` to a left-to-right layout (pure CSS
row/column axis flip — the existing node/children/branch JSX nesting already matched a
sideways genealogy-chart shape), fixed `.evolution-tree-name` not actually centering
(needed `width: 100%` to have something to wrap/center against inside its flex column),
Title Cased every evolution-method clause at the source in `evolution-method-format.ts`
and regenerated `data/pokemon/evolution-edges.json` from PokeAPI, and bumped bubble/sprite/
text sizing and spacing. See commit `210700f`.

## [Species detail popup + evolution family tree Leg 4: fix evolution family tree only showing descendants] — 2026-09-22
Root cause wasn't the root-walk logic or the evolution data (both confirmed correct against
the real ~1025-species dataset before touching any code) — `sqlite-storage.ts`'s
`listSpeciesStmt`/`getSpeciesStmt` never selected
`evolves_from_species_id`, so every `Species` reaching the renderer had
`evolvesFromSpeciesId: undefined`, which `findEvolutionFamilyRootSpeciesId`'s `!== null`
check treated as "has a parent," failed to resolve, and broke out of immediately — always
returning the current species as its own root. See commit `c5c8eb7`.

## [Species detail popup + evolution family tree Leg 3: popup shell + entry point] — 2026-09-22
Built the species detail popup (sprite + name + "View Evolution Family" button, toggling to
Leg 2's `EvolutionTree.tsx` with a Back button; clicking a tree bubble re-centers the popup
on that family member without leaving the tree view) and wired its entry point: a dedicated
ⓘ info button, always visible regardless of ownership, next to the Name cell in
DexTable/DexRow (List view) and next to the species name in DexBoxDetailPanel (Box view).
Verified by Vanny in the running app. See commit `bca697c`.

## [Species detail popup + evolution family tree Leg 2: evolution family tree component] — 2026-09-22
Built `EvolutionTree.tsx` (generation-stacked, flex-wrap layout so wide branches like
Eevee's 8 evolutions wrap onto multiple rows) plus the pure `evolutionTree.ts` tree-assembly
logic (walks `Species.evolvesFromSpeciesId` to the chain root, then `evolution-edges.json`
forward per (speciesId, formName) node so regional-form branches render as separate bubbles).
Piped `evolution-edges.json` from main to renderer the same way `species-availability.json`
already was (new `loadEvolutionEdges` IPC channel/bridge method, `useCollectionData`
exposes `evolutionEdges`). Standalone component only — no render path in the app yet, see
Leg 3. See commit `d55ea59`.

## [Species detail popup + evolution family tree Leg 1: evolution data pipeline] — 2026-09-22
Extended `fetch-evolution-chains.ts` to also write `data/pokemon/evolution-edges.json`
(human-readable method per edge, regional/variety branches like Raichu vs. Raichu-Alola
recovered from PokeAPI's `evolution_details`), verified against `forms.json`'s formName
convention until 0 of 541 edges mismatched. `species-evolution.json` stays byte-identical.
See commit `87e694d`.

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
