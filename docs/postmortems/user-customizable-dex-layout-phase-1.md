# Post-mortem: User-Customizable Dex Layout (Phase 1: View Modes)

**Shipped:** 2026-09-03. Legs 1-8. Commits `4284893`..`07b6a6c`.

## What shipped

- **Foundation fixes** (Legs 1-6), folded in as real-usage bugs surfaced right after the
  Nav/Visual/Dex-Table-Redesign milestone shipped, ahead of the view-mode work that would
  build on the same Dex Table/Completion Stats surface:
  - Leg 1: Ball columns render the actual `BallIcon` instead of ball-name text.
  - Leg 2: stopped remounting ~1000+ DexRows on every tab switch (`hidden` toggle instead
    of unmount), and fixed `table-layout: auto` forcing per-cell remeasurement on resize.
  - Leg 3: real proportional column widths via `<colgroup>` percentages, replacing a px/%
    mix that didn't use expanded horizontal space.
  - Leg 4: Completion Stats' three tables share one flex row on wide windows instead of
    stacking vertically.
  - Leg 5: non-HOME storage locations (ranch/box/bank) now cap depositable species by a
    generation dataset plus the location's linked Trainer Profile game, instead of
    listing all 1025 species as depositable.
  - Leg 6: `createStorageLocation` backfills every owned, unassigned entry onto a
    location on its first-ever creation (the 0->1 transition), fixing pre-existing
    entries stuck in Unassigned; Vanny's own dev DB got a one-off manual backfill.
- **List view mode** (Leg 7): `useDexViewMode` (localStorage-backed) plus
  `DexViewModeSwitcher`, with DexTable staying mounted-and-hidden behind the active mode
  to preserve Leg 2's remount-cost fix.
- **Hybrid view mode** (Leg 8): `buildHybridTiles` flattens filtered/sorted Dex sections
  into up to two sprite tiles per row (regular/shiny), skipping `cosmeticRows` since a
  sprite grid has no expand/collapse affordance. `DexHybridGrid` renders the tile grid
  plus a bottom-pinned read-only detail panel with an Edit Origin action reusing the
  existing `OriginModal`. This was the last planned leg of Phase 1.

## Verification performed

Per leg: `npm run typecheck` and `npm test` (vitest). At milestone close: typecheck clean,
270/270 tests passing across 30 files, working tree clean. Vanny manually verified List
and Hybrid view modes against her real collection before this milestone was marked
Shipped.

## What went well

- **The original ask got split before any wasted work happened.** Vanny's "let me pick a
  persisted display layout" turned out to bundle two very different pieces once she
  described the target: three view modes (List/Box/Hybrid) plus arbitrary box
  arrangement with duplicate owned copies and unowned placeholder slots. The second piece
  needs `CollectionEntry`'s `UNIQUE(form_id, gender, shiny)` constraint dropped and a real
  box/slot data model — too large to design inline. Splitting it into this milestone
  (List + Hybrid, read-only) and a future one (Box Arrangement / Real Inventory Data
  Model) happened at leg-planning time, before either was scoped into a leg.
- **Box view got caught and pulled before it was built, not after.** Vanny pointed out a
  real box can hold several regular and shiny copies of one species mixed together (e.g.
  assorted shiny/non-shiny Woopers) — a "Box view" that's supposed to look like a real box
  is a claim about real per-individual contents, which today's single-regular/
  single-shiny-per-species schema can't represent at all. Catching this before Leg 8
  avoided shipping a view that calls itself a box but can never show real box contents.
  Hybrid stayed in scope since it was only ever described as "the list, just sprites" —
  no such claim to violate.
- **Leg 2's mount-cost fix kept paying off.** Leg 7's view-mode switcher and Leg 8's
  Hybrid grid both reused the same "stay mounted, toggle `hidden`" pattern rather than
  re-solving the remount-cost problem per view mode.

## Friction points

- **Six of eight legs were pre-existing bug fixes, not new milestone scope.** The
  Nav/Visual/Dex-Table-Redesign post-mortem already flagged that typecheck/vitest don't
  catch real-data or real-window-size gaps; this milestone spent Legs 1-6 paying down
  exactly that debt before Legs 7-8 could start on the actual "View Modes" work the
  milestone is named for.
- **App.tsx crossed its 300-line soft cap at Leg 8** (303 lines) — a second `hidden`
  view-mode branch (DexHybridGrid) alongside DexTable's existing one, with a future Box
  view mode implying a third. Logged as an unscheduled TODO item rather than split
  mid-leg; no concrete split candidate identified yet.
- **schema.ts and sqlite-storage.ts are both over or near the 300-line soft cap** (341
  and 457 lines) from unrelated retrofit/FK work landing during this milestone's
  timeframe. Deliberately kept out of scope as orthogonal code health rather than pulled
  into a leg.

## Scope creep

None absorbed unprompted. Two scope changes happened, both caught and resolved at
leg-planning time rather than mid-leg: the Box Arrangement / Real Inventory Data Model
split (see "What went well"), and Box view mode's later move from a planned Phase 1 leg
into that same future milestone once its real-per-individual-contents requirement became
clear.

## What changes for the next milestone

- Keep treating "real usage surfaces a gap typecheck/vitest can't catch" as an expected
  cost of shipping against synthetic test data, per the prior milestone's postmortem — it
  held again here (Legs 1-6 exist because of it) rather than being a one-off.
- Split App.tsx before it grows past a third view-mode branch — Box view mode (next
  planned in the Box Arrangement milestone) would add exactly that branch.
- The Box Arrangement / Real Inventory Data Model milestone depends on this one's Hybrid
  grid component as a starting point for Box view's tile rendering — confirm that
  dependency still holds when that milestone is scoped, since Hybrid's implementation is
  now the reference, not just the design intent.
