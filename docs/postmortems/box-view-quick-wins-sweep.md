# Post-mortem: Box View Quick-Wins Sweep

**Shipped:** 2026-09-19. Legs 1-4. Commits `5f9b33b`..`2df47b2`.

## What shipped

- **Leg 1:** `duplicateStorageLocationTx` didn't clone `collection_entry_ribbons`/
  `collection_entry_marks` rows along with an entry, so Duplicating a Storage Location
  silently dropped every recorded Ribbon/Mark on the copies. Commit `5f9b33b`.
- **Leg 2:** two small, independently-scoped fixes bundled into one leg —
  DexBoxGridCell's placeholder-cell sprite was missing `size={CELL_SPRITE_SIZE}`, falling
  back to SpriteThumbnail's 32px row-icon default instead of matching real-entry cells
  (commit `a217f45`); and a "Jump to box" `<select>` was added to DexBoxPager next to
  Prev/Next, backed by the `boxes` array already threaded through DexBoxPane, so a
  specific box in a large location doesn't need paging through everything in between
  (commit `358c541`).
- **Leg 3:** Box view's selected-tile highlight had been zeroed out entirely
  (`border-color: transparent; background: none`) since a 2026-09-03 fix for an
  alarm-red border, from back when Box view was single-select-only. Leg 4 of Box View
  Polish's multi-select never got its own highlight fix, so selected tiles read as
  completely unhighlighted. First pass (`0393a76`) restored a toned-down sprite-tile
  highlight; Vanny caught that it still got lost against full-slot-sized empty/
  placeholder borders, so a follow-up (`9e32232`) moved the highlight to the full 108px
  cell and gave it its own hover state.
- **Leg 4 (this leg):** "Box view scroller lag" — AskUserQuestion narrowed a vague
  "scrolling through boxes feels laggy" report to Prev/Next paging specifically,
  first-visit-only per session. Root cause: every cell's sprite is a remote
  `raw.githubusercontent.com` fetch with no app-side caching, so a never-before-seen box
  pays for up to 30 cold network fetches before Chromium's HTTP cache takes over on
  repeat visits. Fix: DexBoxPane now prefetches the immediately adjacent box's sprites in
  the background whenever the displayed box changes, warming that same cache ahead of an
  actual Prev/Next click. Commit `2df47b2`.

## Verification performed

Leg 1: `vitest run` (full suite) + `tsc --noEmit` after the change; no dedicated test
added (a transaction-level clone fix, matched by the existing duplicate-location test
coverage pattern). Legs 2-3: manual verification in the running app (Vanny), per this
project's default for visual/UI changes. Leg 4: `tsc --noEmit` clean; added
`spritePrefetch.test.ts` covering the pure URL-collection logic (real-entry cells respect
their own shiny/female flags, placeholder cells always resolve to plain base-form art,
slot order preserved); full suite (430/430) passing after the change. Leg 4's actual lag
fix (prefetching) wasn't verified by running the packaged app — the mechanism is
inherently about network-cache timing under real network conditions, which manual
verification in-session (Vanny) is better positioned to judge than an automated check.

## What went well

- **AskUserQuestion caught a real ambiguity before code was written on Leg 4.** "Lag
  scrolling through boxes" could plausibly have meant the Unboxed tray's own scrollable
  list rather than Prev/Next paging — a wrong guess there would have meant fixing (or
  failing to fix) the wrong UI surface. Two short questions (where does it show up; is it
  first-visit-only or every time) pinned down both the location and the mechanism
  (network cache vs. render cost) before any investigation of the code.
- **Bundling two small, already-scoped fixes into one leg (Leg 2)** kept the milestone's
  leg count matched to its actual size — five items front-loaded into four legs — rather
  than manufacturing a leg per item regardless of size.

## Friction points

- **Leg 3's first pass wasn't sufficient** — restoring a highlight at the sprite-tile
  level (matching the pre-2026-09-03 style) didn't account for the full-slot-sized
  borders multi-select introduced around it, requiring a second round trip with Vanny to
  get right. The lesson: a "restore the old behavior" fix should be checked against
  whatever shipped *after* the behavior broke, not just against what it looked like
  before.

## Scope creep

None. Both investigation-first items (Multi-select highlight verification, Box view
scroller lag) stayed within their leg rather than needing to split back out to
Unscheduled — the explicit fallback the milestone's own scoping note called out as a
possibility.

## What changes for the next milestone

Nothing follow-on filed specifically from this sweep — all four legs closed cleanly with
no adjacent gaps surfaced. Next milestone not yet picked (see TODO.md).
