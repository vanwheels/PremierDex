# Post-mortem: Box View Move & Undo Operations

**Shipped:** 2026-09-20. Legs 1-3. Commits `ff771c2`..`d6b5480`.

## What shipped

- **Leg 1:** Cross-location move. AskUserQuestion resolved the leg's open UX decision as
  "both": dragging a selection onto a second pane pointed at a different Storage Location
  (a location dropdown next to "Open Second Box"), plus a "Move to location…" context-menu
  picker for when the destination isn't open in either pane. Added
  `StorageAdapter.moveEntriesToLocation` — a per-entry placements list reusing
  `fillInPlaceholderEntryStmt`'s single-UPDATE write. Commit `ff771c2`.
- **Leg 2:** Single-move/swap undo. Added an undo stack to `useCollectionData`:
  `setEntryBoxPosition` captures the entry's prior box position before the write,
  `swapEntryBoxPositions` records just the two swapped ids (a swap is its own inverse), and
  `undo` replays the inverse through the same IPC calls. Wired to Ctrl+Z and a visible Undo
  button, both gated on Box view actually being the visible tab/view-mode. Commit `ff561c4`.
- **Leg 3 (this leg):** Multi-drag/cross-location undo. `fillBoxSlots` and
  `moveEntriesToLocation` wrote directly to the DB with no undo capture. Added
  `StorageAdapter.restoreEntryBoxPositions` — an atomic vacate-then-restore batch write,
  same non-deferrable-UNIQUE-index workaround as `fillBoxSlots`/`swapEntryBoxPositions`
  themselves — and a `'batch'` undo-stack entry (array of per-entry
  storageLocationId/boxNumber/boxSlot snapshots) that both `fillBoxSlots` and
  `moveEntriesToLocation` now push before writing. Commit `d6b5480`.

## Verification performed

Leg 1: manual verification in the running app (Vanny), per this project's default for
visual/UI changes. Leg 2: same, plus the existing full suite passing. Leg 3: `tsc --noEmit`
clean on both tsconfigs, `eslint .` clean, and three new `restoreEntryBoxPositions` tests
added to `entry-box-position.test.ts` (plain restore, restore-to-unboxed, and the
vacate-first collision case — two snapshots swapping back into each other's current slots)
— full suite 439/439 passing. No renderer-level test for the undo-stack wiring itself
(`useCollectionData` has no test harness in this project — see its own file, no
`@testing-library/react` in package.json); left to Vanny's manual Ctrl+Z verification in the
running app, same convention as Legs 1-2's own UI verification.

## What went well

- **Leg 1's AskUserQuestion resolved a real ambiguity** ("drag onto a second pane" vs. "a
  dedicated picker") into "both" rather than picking one speculatively — both turned out to
  be genuinely useful for different situations (destination already open vs. not).
- **The vacate-first workaround pattern reused cleanly across three legs.** Leg 1 (well,
  its precedent `fillBoxSlots`/`swapEntryBoxPositions`) established the non-deferrable
  UNIQUE-index problem and its fix; Leg 3's `restoreEntryBoxPositions` is the same shape
  applied to undo, and the batch-swap test in Leg 3 exercises exactly the collision case the
  earlier fix was designed around.

## Friction points

None significant. The milestone scoped cleanly into three legs matching its own natural
boundaries (move mechanics, single-op undo, batch-op undo) with no rework needed across
legs.

## Scope creep

None during implementation. One adjacent note surfaced at Leg 3's close: `useCollectionData.ts`
crossed the 500-line hard cap (now 501 lines) adding the batch-undo plumbing — flagged in
TODO.md's Codebase File-Size Cleanup future milestone rather than split unprompted in this
leg.

## What changes for the next milestone

Next milestone not yet picked (see TODO.md). `useCollectionData.ts` now joins
`schema.ts`/`sqlite-storage.ts` on the Codebase File-Size Cleanup future milestone's list —
worth folding in if that milestone gets scoped next.
