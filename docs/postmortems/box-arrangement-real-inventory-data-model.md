# Post-mortem: Box Arrangement / Real Inventory Data Model

**Shipped:** 2026-09-03. Legs 1-7. Commits `52d46f2`..`dbd07c3`.

## What shipped

- **Split out of Phase 1** (Leg 1): `useCollectionData`/`LivingDexView` pulled out of
  App.tsx ahead of a third view-mode branch, no behavior change.
- **Real per-individual inventory model** (Legs 2-3): dropped `CollectionEntry`'s
  `UNIQUE(form_id, gender, shiny)` constraint (a table-rebuild migration) so duplicate
  owned copies of the same species/form are real tracked rows, not a visual trick; added
  `box_number`/`box_slot` to `collection_entries` as a numbered sub-unit of a Storage
  Location, with a `UNIQUE(storage_location_id, box_number, box_slot)` index enforcing one
  individual per slot.
- **Downstream fixes for the new per-individual model** (Legs 4-5): `indexEntriesByForm`'s
  per-slot picker fixed to prefer an owned entry over an unowned placeholder
  (first-owned-wins) now that both can coexist in the same slot; export/import's
  natural-key matching disambiguated with each row's 0-indexed position within its
  form/gender/shiny group, since that triple alone stopped being unique.
- **Box view UI** (Leg 6): a third Living Dex view mode — `buildBoxes` shapes a
  location-scoped entry list into real per-box 5x6 grids, `DexBoxGrid` paginates one box
  at a time (HOME's own Box view screen), read-only with a click-a-cell detail panel and
  Edit Origin action.
- **Box view editing** (Leg 7): drag-and-drop add/move/swap/remove, plus a right-click
  "Remove from box" menu as a non-drag alternative. New `DexBoxTray` panel lists a
  location's not-yet-boxed entries as the add source. New `swapEntryBoxPositions` storage
  method (a `db.transaction()`-wrapped vacate-then-place dance) for swapping two occupied
  slots, since the UNIQUE index isn't deferrable and a naive two-call sequence collides
  with itself. This was the last planned leg.

## Verification performed

Per leg: `npm run typecheck`, `npm run lint`, and `npm test` (vitest). At milestone close:
typecheck and lint clean, 303/303 tests passing across 34 files, working tree clean.
Vanny manually verified the drag-and-drop flows (add/move/swap/remove, right-click
removal) against her real collection before this milestone was marked Shipped.

## What went well

- **The uniqueness-constraint drop and box/slot model landed cleanly as separate legs**
  (2 then 3) before any UI depended on either — Leg 4/5's downstream-fix pass then had a
  stable, fully-migrated data model to audit against, rather than chasing a moving target.
- **Leg 6 caught its own scope correctly**: Box view's read-only grid shipped without
  editing, deliberately deferring drag-and-drop to its own leg rather than growing Leg 6
  past a reasonable size. That split made Leg 7 a clean, single-purpose leg (interaction
  wiring + the one real technical problem it surfaced) instead of a combined "build the
  grid and make it editable" leg.
- **The swap-transaction problem was caught by reasoning about the schema before writing
  UI code**, not discovered via a failing test after the fact — planning surfaced that
  `idx_entries_box_slot`'s UNIQUE index isn't deferrable before any drag-and-drop handler
  was written, so the fix (`swapEntryBoxPositions`) was designed alongside the feature
  instead of bolted on after a runtime constraint violation.
- **Two genuinely open UX questions (the "add" drag source, right-click menu scope) got
  resolved with Vanny before any component was built**, rather than guessed at and
  potentially rebuilt.

## Friction points

- **COMPLETED.md's archive step lagged a full milestone.** Phase 1's Legs 1-8 were still
  sitting un-archived in COMPLETED.md when this milestone closed, alongside this
  milestone's own Legs 1-7 — both got archived together at this boundary instead of Phase
  1 being archived at its own close. No functional impact, just a process step that got
  missed and had to be caught up.

## Scope creep

None absorbed unprompted. The two UX decisions this milestone's last leg needed (tray vs.
menu-only add flow, right-click menu contents) were raised as explicit questions rather
than assumed, and the swap-transaction fix stayed scoped to exactly what drag-and-drop
swap needed rather than generalizing the storage layer further than asked.

## What changes for the next milestone

- Archive COMPLETED.md right at each milestone's own close, not deferred to the next
  milestone's boundary — this one had to catch up two milestones' worth at once.
- No other loose threads: this was the "harder half" of the original User-Customizable
  Dex Layout ask (see Phase 1's post-mortem), and both halves are now shipped.
