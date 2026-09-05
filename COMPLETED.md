# COMPLETED

## [Dex completeness tier migration] — Leg 3 — 2026-09-04
Resolve Gender Ambiguities: the flow Leg 1's investigation doc deliberately left
undesigned. Scoped down from a generic tier-migration wizard to just this one action —
only the splitByGender axis ever needs a real data correction, the other two tiers are
already a live diff. See commit `77c8038`.

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

## [Dex completeness tier migration] — Leg 2
2026-09-04. Built Box Templates: an "Apply Template…" action in Box view stamps a tier's
`requiredUnits()` (new `boxTemplates.ts`) into empty box slots location-wide in dex order,
skipping anything already owned or already placeholder'd, creating new boxes as needed.
Widened `BoxPlaceholder`/`box_placeholders` from species-only to `(formId, gender, shiny)`
to represent that, with a schema rebuild block migrating any pre-existing install's rows.
Also promoted the tier concept out of Box view alone: `completionStats.ts` now exposes
`DexTier`/`TIER_CONFIGS`/`applyTierToOptions`/`matchingTier`, and `CompletionStatsPanel`
(shown above List/Hybrid/Box view alike) gained a tier picker that's a shortcut into the
same `includeCosmeticVariants`/`splitByGender` checkboxes, per Vanny's call mid-leg.
Manually-set placeholders (right-click an empty slot) keep their species-only UI but now
resolve to a concrete canonical form/gender under the hood, and any placeholder can be
clicked to see its specific requirement as text in the detail panel — sprite art stays
plain either way, per Vanny's call. See commit `3f59871`.
Note: schema.ts crossed the 500-line hard cap to 550 doing this (the table-widening rebuild
block this leg added). Deliberately not split in the same leg — see TODO.md's
[Split schema.ts] for why a hasty split here was a real correctness risk, not a shortcut.

## [Dex completeness tier migration] — Leg 4
2026-09-04. Closed as a decision, not an implementation — see Leg 1 above. Downgrading
from a complete tier to a regular one needs no migration: a collection satisfying a higher
tier automatically satisfies every lower one, since tiers only ever add required units
going up. Nothing to build.
