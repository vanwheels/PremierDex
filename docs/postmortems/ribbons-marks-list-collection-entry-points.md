# Post-mortem: Ribbons & Marks: List/Collection View Entry Points

**Shipped:** 2026-09-20. Legs 1-2. Commits `d29fa77`..`2854951`.

## What shipped

- **Leg 1 (List view):** `DexRow`'s regular/shiny cells were already dense (checkbox +
  Origin button + gender select + badges, ×2 columns), leaving no room for a second inline
  button like Box/Hybrid's detail panels use. Resolved the layout call via AskUserQuestion
  in favor of a right-click context menu, reusing the existing generic `DexBoxContextMenu`
  component (already `{x, y, actions, onClose}`-shaped from Box view's Leg 5 generalization)
  rather than renaming or forking it. `DexTable` gained a `contextMenu` target state
  parallel to its existing `originTarget`, with "Edit Origin" and "Ribbons & Marks" as the
  two menu actions. Commit `d29fa77`.
- **Leg 2 (Collection view):** `CollectionRow`'s single Origin cell had headroom, so it got
  a straightforward second button next to "Origin" — a mechanical copy of the Box/Hybrid
  inline-button pattern, since the layout constraint that ruled that out for List view
  didn't apply here. `CollectionView` added a `ribbonsMarksTarget` state parallel to its
  existing `originTarget`. Commit `2854951`.

## Verification performed

`tsc --noEmit` clean, `eslint` clean on all four touched files, full `vitest` suite (457
tests) passing, and a production `electron-vite build` completing with no bundling errors.
No new automated tests were added — both legs are pure UI wiring (new callback props and
conditional modal renders) with no new business logic to unit-test; existing coverage
(DexRow/DexTable/CollectionRow/CollectionView render paths) already exercises the modified
files. Manual verification of the actual right-click/click interactions in the running app
was left to Vanny, per this project's default for visual/UI changes.

## What went well

- **The layout call this milestone was explicitly scoped around had a low-cost answer
  already sitting in the codebase** — `DexBoxContextMenu` was generalized to an arbitrary
  action list back in Box View Polish's Leg 5, so Leg 1 needed zero new UI-primitive work,
  just a new call site.
- **Both legs mirrored an existing state pattern exactly** (`originTarget`/`OriginModal`
  owned locally by the view component), so there was no new architectural decision to make
  once the List-view interaction pattern was settled — just parallel state and parallel
  wiring.

## Friction points

None. Both legs were small, mechanical once the AskUserQuestion decision landed, and passed
verification on the first pass.

## Scope creep

Considered renaming `DexBoxContextMenu` to something Box-agnostic now that List view reuses
it, but deferred — not required for either leg to work, and touches DexBoxPane/DexBoxGrid's
imports and a CSS class name for no functional gain. Left as a TODO-worthy idea only if a
future reuse makes the name actively misleading, not filed as its own item since it isn't
concretely motivated yet.

## What changes for the next milestone

Nothing follow-on filed specifically from this milestone. Next milestone not yet picked (see
TODO.md).
