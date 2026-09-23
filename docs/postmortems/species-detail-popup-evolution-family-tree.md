# Post-mortem: Species detail popup + evolution family tree

**Shipped:** 2026-09-22. Legs 1-12 (Legs 1-4 first shipped same day, reopened after live
review, Legs 5-12 followed). Commits `87e694d`..`4dd9adc`.

## What shipped

- **Leg 1:** extended `fetch-evolution-chains.ts` to also write `evolution-edges.json`
  (human-readable per-edge method, regional/variety branches recovered from PokeAPI).
- **Leg 2:** `EvolutionTree.tsx` + pure `evolutionTree.ts` tree-assembly logic, piped
  `evolutionEdges` from main to renderer.
- **Leg 3:** the popup shell itself (sprite + name + "View Evolution Family" button) and
  its entry point — an ⓘ info button in DexTable/DexRow (List view) and
  DexBoxDetailPanel (Box view).
- **Leg 4:** fixed the tree only ever showing descendants — `sqlite-storage.ts` wasn't
  selecting `evolves_from_species_id` at all, so every `Species` reached the renderer with
  `evolvesFromSpeciesId: undefined`, which the root walk's `!== null` check misread as
  "has a parent."
- **Leg 5:** reworked the tree to a left-to-right layout, fixed name centering, Title
  Cased evolution-method text.
- *(Legs 1-4 shipped 2026-09-22, then reopened same day after Vanny reviewed the tree live
  and came back with layout feedback, a form-category bug, and a new feature request —
  Legs 5-12 below.)*
- **Leg 6:** fixed a cosmetic-variant form (Cosplay Pikachu, cap variants) inheriting its
  base form's evolution family instead of rendering standalone.
- **Leg 7:** hand-curated `forme-switch-groups.json` for the 14 species with
  non-evolutionary forme switches (Deoxys, Rotom, Giratina, Shaymin, Kyurem, Necrozma,
  Calyrex, Hoopa, the Forces of Nature trio + Enamorus, Ogerpon, Keldeo) — no PokeAPI
  endpoint models these.
- **Leg 8:** wired Leg 7's data into the popup — a second "View Alternate Formes" button
  and `FormeSwitchGroupView.tsx`.
- **Leg 9:** fixed Eevee's 8-way branch overflowing the tree's max-height (two-column
  split above a width threshold) and long multi-alternative evolution-method text running
  on (condensed to "N Methods" + a tooltip).
- **Leg 10:** scoping discussion only — split off a "Species database: full per-species
  pages" future milestone rather than growing the popup in place, and scoped Legs 11-12
  as small SpriteModal reuse work instead of deferring them to that future milestone.
- **Leg 11:** added `back`-sprite support to `sprites.ts`'s three URL builders, verified
  live against the CDN.
- **Leg 12:** wired the popup's sprite to open `SpriteModal` instead of a static `<img>`,
  and added `SpriteModal`'s male/female side-by-side layout (Serebii-style, for every
  caller) plus a Back checkbox.

## Verification performed

Every leg: `tsc --noEmit` clean, full test suite passing. UI-visible legs (3, 5, 6, 8, 9,
12) additionally verified by Vanny in the running app — Leg 9's two-column Eevee fix in
particular went through one live-caught correction (see Friction points) before landing.
Leg 1/7/10/11 were data/scoping legs verified against source data (PokeAPI, `forms.json`)
rather than in the UI.

## What went well

- **Leg 4's debugging stayed disciplined**: confirmed both the root-walk logic and the
  evolution data were correct against the real ~1025-species dataset *before* touching any
  code, which pointed straight at the actual cause (a missing column in a SQL SELECT)
  instead of a plausible-looking wrong fix in the tree logic itself.
- **Leg 10 kept scope honest**: when a much bigger idea (a full species database) came up
  mid-milestone, it went into its own future-milestone entry with a fully absorbed
  sub-item (catch rate calculator) rather than getting folded into this one's scope.
- **Leg 12 reused existing infrastructure instead of building popup-specific sprite UI**:
  every capability Vanny asked for (shiny toggle, per-generation tabs, gender side-by-side,
  back sprite) either already existed on `SpriteModal` or was added there once, benefiting
  every other caller (DexRow, CollectionRow) instead of just the popup.

## Friction points

- **The initial "shipped Legs 1-4" ship was premature** — live review by Vanny surfaced a
  layout bug (Eevee's branch), a data-correctness bug (cosmetic-variant forms), and a
  casing/wrapping issue, all requiring a reopen. Live verification in the running app
  earlier (before considering Legs 1-4 done) would likely have caught at least the
  cosmetic-variant bug (Leg 6) without a separate leg.
- **Leg 9's first two-column attempt used a shared CSS grid across both columns**, which
  Vanny caught live: rows on shared grid tracks made column 1's bubble sit beside column
  2's arrow on the same row, visually implying one evolved into the other. Reworked to two
  independent flex columns.
- **Leg 8 pushed `DexBoxGrid.tsx`/`DexBoxPane.tsx` to/over the file-size cap** threading
  `formeSwitchGroups` through — flagged rather than fixed, left as an Unscheduled TODO item
  for a dedicated file-size cleanup pass.

## Scope creep

None absorbed unprompted. The one real scope-expansion moment (Leg 10's species-database
idea) was explicitly split into its own future milestone rather than folded in.

## What changes for the next milestone

- Do a live-app check before calling a milestone (or a leg with UI surface) shipped, not
  just `tsc`/test-suite green — this milestone's premature Legs 1-4 ship would likely have
  caught at least one of its three reopen issues earlier.
- `DexBoxGrid.tsx`/`DexBoxPane.tsx` remain over/at the file-size cap (Leg 8) — still open
  in TODO.md's Unscheduled section, needs a dedicated cleanup pass.
- Generation-vii sprite URLs use `.png` instead of the CDN's actual `.gif` (surfaced by Leg
  11, pre-existing and unrelated to back-sprite support) — still open in TODO.md's
  Unscheduled section.
- No next milestone is picked yet. Future Milestones lists several candidates (Backup/
  Export Completeness, Remove "Unassigned" default, Species database, Encounter tables +
  location/game search UI, Full UI/UX pass) plus one gated on unmet conditions (Per-game
  form/gender/ball-combo legality) — Vanny's call, same as prior transitions.
