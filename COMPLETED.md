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

## [Ball column shows text instead of the ball icon] — Leg 1 (2026-09-03)
Swapped DexRow.tsx's regular/shiny Ball cells to render `<BallIcon ball={...} />`
(conditioned on the entry being owned and having a `caughtBall` set), matching
CollectionRow's existing usage instead of the plain-text `caughtBallCell()` output.
`caughtBallCell()` itself is unchanged — still backs the `<td>` title attribute and its
own tests. See commit `4284893`.
