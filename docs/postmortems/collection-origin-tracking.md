# Post-mortem: Collection & Origin Tracking

**Shipped:** 2026-09-02. Legs 1-31 (this milestone's own numbering, restarted after
Living Dex v1 — collides with but is distinct from that milestone's Legs 2-16).
Commits `2bd2543`..`3c456f4`.

## What shipped

- **Trainer Profile and Storage Location foundation**: standalone CRUD models for both
  (Legs 1-2), an origin-games dataset flagging which games show a Trainer ID/Secret ID
  (Leg 1, extended for Pokémon GO's 12-digit Trainer Code in Leg 8), a shared sort
  dropdown for both panels (Leg 12), and full backup export/import including both models
  (Leg 13, bumping `CollectionExport` to v2).
- **Per-entry origin data**: each Collection Entry can carry its own origin game/OT/TID/
  SID/language/nickname/caught-in Poké Ball, initially copied once from a Trainer Profile
  and independently editable after (Leg 4, extended with a language field in Leg 14 and
  ball tracking in Leg 28). Leg 31 reversed that one-time-copy design at Vanny's explicit
  call: linked entries now live-mirror their Trainer Profile's game/OT/TID/SID/language on
  every profile save, editable again only after unlinking.
- **A second top-level Collection view**, grouped by origin game, OT (keyed on TID/SID,
  not name, after Leg 20's fix), shiny status, or dex number (Legs 18, 20-21) — alongside
  search/filter and sortable columns added to the existing Living Dex grid (Legs 15-16).
- **A completion stats dashboard** (owned%/shiny%, by generation and regional group),
  made configurable via three independent toggles — cosmetic variants, gender split,
  regional-fold-in — after the initial hardcoded breakdown (Legs 17, 19).
- **Data-correctness passes**, each verified live rather than from memory: Paldea Tauros's
  regional-group sort bug (Leg 5), Spiky-Eared Pichu's HOME/always-shiny flags (Leg 6),
  Pokémon name capitalization and punctuation exceptions (Legs 7, 29), three species-forms
  data bugs including Arceus/Genesect held-item reclassification (Leg 22), missing
  female-form sprites across all 103 gender-diff forms (Leg 23), and Kyurem Black/White's
  Home-boxable flag (Leg 25).
- **UI polish**: a user-facing override for which form displays on a collapsed foldable
  species (Leg 27), the "Owned" → "Non-Shiny" label rename (Leg 26), and an `alwaysShiny`
  UI consumer mirroring the existing `shinyLocked` treatment (Leg 24).

## Verification performed

Per leg: `npm run typecheck` and `npm test` (vitest — grew from Living Dex v1's 49 tests
to 206 across 23 test files by the end). Data-affecting legs continued the live-check-
before-committing discipline: Leg 22 reconfirmed spurious sub-form data directly against
PokeAPI before excluding the affected species, and Leg 23 audited all 103
`hasGenderDifference` forms rather than trusting the handful originally flagged. A
FK-enforcement bug in two already-shipped `trainer_profiles` migrations (commit
`710391a`) was found by checking the real dev DB's row counts (23 profiles, thousands of
linked `collection_entries`) rather than assuming the migrations were safe, with a
regression test added reproducing the failure.

## What went well

- **Live-check-first discipline, carried forward from Living Dex v1, kept paying off.**
  Beyond the PokeAPI/dev-DB checks above, Leg 9's `pickCollapsedRow` and Leg 20's
  OT-grouping fix were both driven by re-verifying actual behavior (a checked-off cosmetic
  variant hidden behind an unchecked default; same-named trainers from different saves
  merging into one group) rather than trusting the existing logic's intent.
- **Established UI patterns got reused instead of re-litigated.** The badge-plus-disable
  treatment from Living Dex v1's `homeBoxable`/`shinyLocked` precedent applied directly to
  `alwaysShiny` (Leg 24) with no new design discussion. Leg 18's origin/OT/shiny grouping
  view extended cleanly to dex-number grouping (Leg 21) without restructuring.
- **Reversals of earlier decisions were explicit, Vanny-directed calls, not silent
  reinterpretation.** Leg 31 reverses Leg 4's one-time-copy design and Leg 29 reverses
  Leg 7's "no exceptions dictionary" call, both at Vanny's explicit request rather than a
  quiet change of mind mid-implementation.
- **Scope expansions were flagged, not silently absorbed.** Leg 22's fix generalized past
  the species originally named, and Leg 23's root cause turned out bigger than Leg 22's
  own framing (all 103 gender-diff forms, not the handful flagged) — both were called out
  as decisions in the moment.

## Friction points

- **Typecheck drift went unnoticed for three legs.** Leg 24 and Leg 27 each added a new
  required field to a shared type (`alwaysShiny`, `collapsedDisplayFormId`) without
  updating the test-fixture factories that construct those types. `npm test` stayed green
  throughout — vitest doesn't typecheck — so `npm run typecheck` sat broken from Leg 24
  until Leg 30 actually fixed it (Leg 28 only flagged it). Three legs closed on a passing
  test suite while typecheck was silently broken.
- **A latent FK-enforcement bug shipped inside two already-committed migrations** (the
  tid-NOT-NULL and sid-4294 `trainer_profiles` rebuilds, both Leg 1 follow-ups) and only
  surfaced later once it blocked further schema work, not at the time those migrations
  were written and tested.
- **COMPLETED.md stopped staying in strict newest-first order partway through** — Leg
  17's entry landed after Leg 6's instead of at the top — making the milestone harder to
  reconstruct by eye during this write-up; not a functional problem, just worth appending
  at the top going forward.

## Scope creep

None beyond the flagged-and-approved expansions noted above (Legs 22, 23) — each was
raised as an explicit decision before the wider scope was executed.

## What changes for the next milestone

- Run `npm run typecheck` before closing out a leg as a matter of course, not only when
  something feels type-suspicious — it would have caught Legs 24/27's factory drift
  immediately instead of three legs later.
- The next milestone is already scoped and ordered in TODO.md's "Future Milestones"
  section: menu/section restructuring → per-game validation + Storage Location sync
  (new `storageLocationId` FK, Met Location field, Legends Arceus ball pool, an Invalid
  Flag) → Living Dex Table redesign, deliberately in that order so the schema-dependent
  table redesign isn't built twice. Ribbons/Alpha/size/capture-date tracking and the Dex
  completeness tier migration remain queued behind that, not yet scoped.
- The custom app icon TODO item remains open and unscheduled, blocked on artwork from
  Vanny — unchanged since Living Dex v1's postmortem first flagged it.
