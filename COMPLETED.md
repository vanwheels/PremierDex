# COMPLETED

Legs 1-5 (Box View Polish & Multi-Box Editing milestone) archived at
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
`docs/completed-archive/box-arrangement-real-inventory-data-model.md`. See `MILESTONES.md`
for the shipped-milestone index.

## [Dex completeness tier migration] — Leg 1
2026-09-04. Design-only. Decoded Vanny's reference (Austin John's HOME Living Dex
Organizer spreadsheet) into a 3-axis tier system — `includeCosmeticVariants` and
`splitByGender` already exist in `completionStats.ts`; a third axis (excluding
pre-evolutions) needs evolution-chain data that doesn't exist in the schema at all, split
out as Leg 5. Also resolved Leg 4 (downgrade) as a non-operation: every tier's required
set is a strict subset of the tier above it, so "downgrading" is just viewing completion
against a coarser tier, no data changes needed. Full writeup, the decoded tier table, and
the `requiredUnits()` shape Legs 2/3 consume: `docs/investigations/dex-completeness-tiers.md`.

## [Dex completeness tier migration] — Leg 4
2026-09-04. Closed as a decision, not an implementation — see Leg 1 above. Downgrading
from a complete tier to a regular one needs no migration: a collection satisfying a higher
tier automatically satisfies every lower one, since tiers only ever add required units
going up. Nothing to build.
