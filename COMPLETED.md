# COMPLETED

Legs 1-10 plus an unnumbered Diamond/Pearl theming addendum (Nav Restructuring, Visual
Pass & Dex Table Redesign milestone) archived at
`docs/completed-archive/nav-visual-dex-table-redesign.md`. Legs 1-31 (Collection &
Origin Tracking milestone) archived at
`docs/completed-archive/collection-origin-tracking.md`. Legs 1-16 (Project Scaffold +
Living Dex v1 milestones — a separate, earlier numbering that collides with but predates
this one) archived at `docs/completed-archive/project-scaffold.md` and
`docs/completed-archive/living-dex-v1.md`. See `MILESTONES.md` for the shipped-milestone
index.

## [Table resize/tab-switch performance] — Leg 2 (2026-09-03)
Profiled both symptoms before touching anything: buildDexSections/filterDexSections/
sortDexSections were already correctly memoized in App.tsx, and there's no resize
listener anywhere in the codebase — so recomputation and debounce, two of the TODO
item's three candidate fixes, were ruled out. Tab-switch lag was a full unmount/remount
of ~1000+ DexRows on every switch into Living Dex (App.tsx's conditional `{view === 'dex'
&& ...}` render); fixed by keeping that view mounted and toggling `hidden` instead.
Resize lag was table-layout: auto forcing per-cell remeasurement across all rows on every
reflow tick; fixed with table-layout: fixed on .dex-table (per Vanny's call, ahead of
Leg 3's colgroup-based real widths rather than waiting for it). See commit `<pending>`.

## [Ball column shows text instead of the ball icon] — Leg 1 (2026-09-03)
Swapped DexRow.tsx's regular/shiny Ball cells to render `<BallIcon ball={...} />`
(conditioned on the entry being owned and having a `caughtBall` set), matching
CollectionRow's existing usage instead of the plain-text `caughtBallCell()` output.
`caughtBallCell()` itself is unchanged — still backs the `<td>` title attribute and its
own tests. See commit `4284893`.
