# Post-mortem: Box View Polish & Multi-Box Editing

**Shipped:** 2026-09-04. Legs 1-5. Commits `5fd5ab1`..`d6dde17`.

## What shipped

- **Box view quick polish** (Leg 1): tray widened/height-matched to the box grid, sprite
  bumped 32px -> 64px, shiny/caught-ball badges overlaid on filled cells,
  left-click-to-auto-place from Unboxed, National Dex # + inline-editable nickname in the
  info panel.
- **Add / rename boxes** (Leg 2): a real `boxes` table (id/storage_location_id/box_number/
  name) replaced buildBoxes.ts's old "Box 1 or has cells" derivation as the source of which
  boxes exist per location — a box's existence stopped being implicit.
- **Adjacent second box** (Leg 3): DexBoxGrid's pager/grid/detail-panel/drag-and-drop
  rendering split into DexBoxPane so a second one can mount side by side with the primary,
  each with independent navigation/selection state, sharing one `boxedEntryIds` set so a
  cross-pane drag correctly swaps rather than being treated as coming from outside.
- **Multi-select + multi-drag** (Leg 4): cell selection reworked from a single slot to an
  ordered array (plain/ctrl/shift-click), a multi-id drag payload, and a new
  `fillBoxSlots` storage method that fills slots contiguously in selection order,
  rejected outright (no partial fill) on any conflict.
- **Phantom placeholder Pokémon** (Leg 5): a standalone `box_placeholders` table (species
  id per box slot) for "I intend to put something here" — right-click an empty slot or an
  existing placeholder to set/change/clear it. A real entry landing on a placeholder's slot
  clears it automatically. This was the last planned leg.

## Verification performed

Per leg: `npm run typecheck`, `npm run lint`, and `npm test` (vitest). At milestone close:
typecheck and lint clean, 325/325 tests passing across 36 files, working tree clean before
each commit. Vanny manually verified the drag-and-drop and dual-pane flows against her real
collection at prior legs' close; Leg 5's placeholder flow is pending her own manual pass in
the running app.

## What went well

- **Four open design questions were resolved with Vanny via AskUserQuestion up front**,
  before Leg 5 implementation began (adjacent-box interactivity, placeholder persistence,
  multi-drag fill semantics, box add/rename schema scope — see this milestone's TODO.md
  intro) — none of Leg 5 needed a mid-implementation check-in as a result.
- **Leg 3's `boxedEntryIds` generalization anticipated Leg 4's multi-select need**: making
  the "is this entry already boxed" gate location-wide instead of pane-local one leg early
  meant Leg 4's multi-drag logic didn't have to touch that invariant at all.
- **Leg 5's DB-layer auto-clear** (a real entry landing on a placeholder's slot deletes the
  placeholder, both in `setEntryBoxPosition`/`fillBoxSlots` and mirrored in
  `useCollectionData`'s local state) wasn't explicitly spelled out in the leg's own TODO
  wording, but followed directly from the placeholder/real-entry invariant the schema
  itself needs (at most one of the two per slot) — implemented as part of satisfying that
  invariant rather than as an added feature, so not treated as scope creep.

## Friction points

- **DexBoxPane grew past this repo's ~300-line file-size soft cap across Legs 3-5**
  (rendering pulled in from DexBoxGrid at Leg 3, multi-select state at Leg 4, placeholder
  context-menu/modal wiring at Leg 5) before finally needing a split — its grid-cell
  rendering pulled out into a new DexBoxGridCell component at Leg 5. Splitting one leg
  earlier, once Leg 4 pushed it past 300 lines, would have kept each leg's diff smaller.
- **schema.ts crossed its own proactive-split threshold during this milestone.** Leg 2's
  `boxes` table and Leg 5's `box_placeholders` table both landed there (the natural place
  for a new table), pushing it from 421 to 492 lines — past the "~480 lines, pick up
  proactively" line Vanny set for the standalone `[Split schema.ts]` TODO item. Still
  unscheduled as of this milestone's close (see TODO.md) — flagged, not actioned, since
  the split itself is orthogonal code health rather than something this milestone's own
  legs needed.

## Scope creep

None absorbed unprompted. Leg 5's placeholder-auto-clear behavior (see "What went well"
above) is the one implementation call made without an explicit ask, but it's a schema
invariant, not a new user-facing feature — the box_placeholders/collection_entries
mutual-exclusion the table comment already documents. The `[Box names/empty boxes missing
from JSON backup export/import]` TODO item was extended to also name box_placeholders
(same underlying gap: neither table is in `CollectionExport`) rather than opening a
parallel item or fixing it inline this leg.

## What changes for the next milestone

- Pick up `[Split schema.ts]` before, or as part of, the next leg that adds another table
  to it — it's now past the threshold that was supposed to trigger that proactively.
- Watch DexBoxPane's line count if a future Box view leg adds more state to it — it landed
  this milestone's close at 330 lines (post-split), already back near the soft cap.
- No other loose threads: this was the full planned leg sequence for this milestone.
