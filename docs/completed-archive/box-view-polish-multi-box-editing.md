# Completed: Box View Polish & Multi-Box Editing

Archived from `COMPLETED.md` at the milestone boundary — see
`docs/postmortems/box-view-polish-multi-box-editing.md` and `MILESTONES.md`.

## [Phantom placeholder Pokémon] — Leg 5 (2026-09-04)
New standalone `box_placeholders` table (species id per box slot, ON DELETE CASCADE) —
right-click an empty Box view slot for "Set placeholder…" (a species search modal), or an
existing placeholder for "Change species"/"Clear placeholder". Renders dimmed with an
accent-tinted dashed border, distinct from both an empty slot and an unowned-but-boxed
real entry. A real entry landing on a placeholder's slot (single drop, swap, or
multi-select fill) clears it automatically — `setEntryBoxPosition`/`fillBoxSlots` do this
at the DB layer, mirrored in `useCollectionData`'s local state. `Box.cells` is now a real |
placeholder | empty union throughout the Box view stack; `DexBoxPane`'s grid-cell rendering
split into a new `DexBoxGridCell` component to stay under this repo's file-size convention.
This was the last planned leg. See commit `d6dde17`.

## [Multi-select + multi-drag] — Leg 4 (2026-09-04)
DexBoxPane's cell selection reworked from a single slot to an ordered array: plain click
replaces it, ctrl-click toggles a slot in/out, shift-click selects the contiguous filled
range between the anchor and the click. dragEntryPayload.ts reworked to carry a
comma-joined list of entry ids instead of one, so dragging a selected cell carries the
whole selection in selection order. A single-id drop keeps the pre-existing swap/move
behavior; a multi-id drop fills slots contiguously from the drop target in selection
order, rejected outright (no partial fill) if the run spills past the box or any needed
slot is occupied by an entry outside the selection. New StorageAdapter.fillBoxSlots
method (vacate-then-place, same UNIQUE-index workaround as swapEntryBoxPositions)
threaded through IPC end to end. See commit `29be928`.

## [Adjacent second box] — Leg 3 (2026-09-04)
DexBoxGrid's pager/grid/detail-panel/drag-and-drop rendering split into a new DexBoxPane
component so a second one can mount side by side with the primary via an "Open Second
Box" toggle, each with independent navigation/selection state. Placement: a third column
next to the tray rather than displacing it (the simpler of the two layouts the leg note
flagged as an implementation-time call); `.dex-box-main` changed from flex:1 to
flex:0 0 auto so two open panes hug together instead of splitting leftover width. The
per-pane "is this entry already boxed" swap-vs-move gate was generalized from
pane-local cells to a location-wide `boxedEntryIds` set, so a cell dragged from one open
pane onto an occupied cell in the other correctly swaps instead of being silently
rejected. See commit `84660fd`.

## [Add / rename boxes] — Leg 2 (2026-09-04)
New `boxes` table (id/storage_location_id/box_number/name, ON DELETE CASCADE) is now the
real source of which boxes exist per location, replacing buildBoxes.ts's old
"Box 1 or has cells" derivation. DexBoxGrid gained a "+ Add Box" button and an inline
Rename control (split into DexBoxPager.tsx). See commit `d9a67aa`.

## [Box view quick polish] — Leg 1 (2026-09-03)
Unboxed tray widened and height-matched to the box grid (shared CSS vars, not a hardcoded
height), tray sprite bumped 32px -> 64px, shiny/caught-ball badges overlaid on filled
cells, left-click-to-auto-place from Unboxed, National Dex # + inline-editable nickname
added to the info panel, red tile-selected border dropped for Box view. See commit
`5fd5ab1`.
