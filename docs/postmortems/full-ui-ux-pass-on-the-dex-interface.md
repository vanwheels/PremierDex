# Post-mortem: Full UI/UX pass on the Dex interface

**Shipped:** 2026-09-24. Legs 1-4 plus a feedback pass and a Where to Find reformat.
Commits `fa2b6fc`..`5ae6c72`.

## What shipped

- **Leg 1:** top-level nav collapsed to Collection (the old Living Dex) and Dex; Storage
  Locations and Trainer Profiles became popups behind a location dropdown/pencil and a header
  button; completion stats rearranged into the sketched boxes; the group-by Collection view
  removed.
- **Leg 2:** `ThemeModeToggle` restyled as the sketched diamond/pearl icon box; a header
  Settings button/popup added (Export/Import moved into it) as the home for future settings.
- **Leg 3:** Species page reflowed into the sketched box layout with an inline Gen I-IX sprite
  strip.
- **Leg 4:** the Dex tab — a Pokémon reference list (Name / Dex # / Abilities, search, sort,
  generation headers) and a Locations sub-tab; the species page's Back button returns to the
  tab it was opened from.
- **Feedback pass:** Dex list is one row per species with a sprite; forms became a toggle strip
  on the species page; the Regional Dex box follows the selected generation.
- **Where to Find reformat:** one colour-coded header section per game with a location table
  under it, replacing per-location rows with joined game labels.

## Verification performed

`tsc --noEmit`, `eslint`, and `vitest run` (665/665 at close) after each change. Vanny verified
each leg and the feedback pass by running the app.

## What went well

- The hand-drawn sketches plus the scoping discussion gave a clear spec; Legs 1-3 needed no
  design rework.
- Keeping the Dex tab mounted-and-hidden (same pattern as Collection) preserved search/sort
  state across a species page round trip at no extra cost.
- Pure logic (list rows, location index, regional dex by generation, encounter sections) stayed
  in tested modules separate from the components.

## What didn't / friction points

- **Leg 1 couldn't start in a clean session** — the sketches lived only in the chat. Fixed by
  saving them to `docs/design/ui-ux-pass/`.
- **File-name case clash on Windows:** `DexSpeciesList.tsx` collided with `dexSpeciesList.ts`
  (TS1149/TS1261); the component became `DexPokemonList.tsx`.
- **Scale problems only showed with real data.** The Locations sub-tab and Where to Find passed
  their unit tests but were unusable for common species (Rattata: 1,722 encounter rows). The
  design assumed a handful of rows per species.

## Scope creep observed

- The Settings button (Leg 2) was added at Vanny's request, beyond the sketch.
- The feedback pass added a form toggle strip and generation-aware regional dex numbers, which
  Leg 3 hadn't scoped.
- Two large asks surfaced and were spun out rather than absorbed: the Sprite system overhaul and
  the Encounter display rework (both in `TODO.md`).

## What changes for the next milestone

- Prototype any list/table UI against the real worst-case data (the most common species, not a
  fixture) before building it.
- Save sketches/reference images into the repo at scoping time, not after a session fails.
- Deferred, not done: Types/base-stat columns and the Dex tab's Moves/Search sub-tabs (Species/
  Dex reference data layer), the Dex tab sprite-grid view, the Sprite system overhaul, and the
  Encounter display rework.
