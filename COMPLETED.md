# COMPLETED

## Box View Polish & Multi-Box Editing

### [Adjacent second box] — Leg 3 — 2026-09-04
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

### [Add / rename boxes] — Leg 2 — 2026-09-04
New `boxes` table (id/storage_location_id/box_number/name, ON DELETE CASCADE) is now the
real source of which boxes exist per location, replacing buildBoxes.ts's old
"Box 1 or has cells" derivation. DexBoxGrid gained a "+ Add Box" button and an inline
Rename control (split into DexBoxPager.tsx). See commit `d9a67aa`.

### [Box view quick polish] — Leg 1 — 2026-09-03
Unboxed tray widened and height-matched to the box grid (shared CSS vars, not a hardcoded
height), tray sprite bumped 32px -> 64px, shiny/caught-ball badges overlaid on filled
cells, left-click-to-auto-place from Unboxed, National Dex # + inline-editable nickname
added to the info panel, red tile-selected border dropped for Box view. See commit
`5fd5ab1`.

Legs 1-10 plus an unnumbered Diamond/Pearl theming addendum (Nav Restructuring, Visual
Pass & Dex Table Redesign milestone) archived at
`docs/completed-archive/nav-visual-dex-table-redesign.md`. Legs 1-31 (Collection &
Origin Tracking milestone) archived at
`docs/completed-archive/collection-origin-tracking.md`. Legs 1-16 (Project Scaffold +
Living Dex v1 milestones — a separate, earlier numbering that collides with but predates
this one) archived at `docs/completed-archive/project-scaffold.md` and
`docs/completed-archive/living-dex-v1.md`. Legs 1-8 (User-Customizable Dex Layout Phase 1)
archived at `docs/completed-archive/user-customizable-dex-layout-phase-1.md`. Legs 1-7
(Box Arrangement / Real Inventory Data Model) archived at
`docs/completed-archive/box-arrangement-real-inventory-data-model.md`. See `MILESTONES.md`
for the shipped-milestone index.
