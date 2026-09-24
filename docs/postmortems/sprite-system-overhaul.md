# Post-mortem: Sprite system overhaul

**Shipped:** 2026-09-24. Legs 1-4. Commits `703edca`..`adfec83`.

## What shipped

- **Leg 1:** Design pass. PokeAPI is the only source, fetch-from-CDN stays, HOME renders for
  Gen 8/9, USUM gifs for Gen 7, `transparent/` for Gen 2. Reasoning in
  `docs/investigations/sprite-sources.md`.
- **Leg 2:** Per-generation source table (`spriteSources.ts`: folder, extension, has-shiny,
  has-back) replacing the one-game-per-generation map and its hardcoded `.png`. Fixed Gen 7's
  `.gif` 404s.
- **Leg 3:** Gen 1 hides the shiny slot, Gen 8/9 captioned as HOME art, modal hides
  unavailable Back/Shiny/Animated options. Follow-up moved Gen 1 to `transparent/`.
- **Leg 4:** Version chip row for Gen 1-4 and 6 via `spriteSourceFor`; pick kept per
  generation and carried into the enlarge modal.

## Verification performed

`tsc --noEmit`, `eslint` and `vitest run` after each leg. Vanny verified the running app at
close-out.

## What went well

- Leg 2 put every version Leg 4 needed into the table up front, so Leg 4 added no second
  mapping and only threaded one optional argument.
- Checking every CDN folder live in Leg 2 meant no missing-art surprises in Legs 3-4.

## What didn't / friction points

- Leg 3 needed a same-day follow-up (Gen 1 transparent art, disabled Shiny/Animated) that
  the design pass should have caught. A stray `sed` also clobbered an unrelated COMPLETED.md
  entry, restored in `3c88e41`.

## Scope creep observed

- None in the code. The modal deliberately got no chips of its own.

## What changes for the next milestone

- Deferred: side-by-side version layout, a better Gen 8/9 art source than HOME, per-folder
  female-art coverage check (missing files just show "unavailable").
- Use a scripted edit with a diff check, not `sed`, when editing COMPLETED.md.
