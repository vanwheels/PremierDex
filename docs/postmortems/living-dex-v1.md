# Post-mortem: Living Dex v1

**Shipped:** 2026-09-02. Legs 2-16 (Project Scaffold's Leg 1 is its own milestone).
Commits `45eecbf`..`c1ebbee`.

## What shipped

- **Real per-form data**, replacing Leg 1's placeholder: form_category/
  has_gender_difference/regional_group/first_available_generation for all 1025 species'
  1351 forms (Leg 2), plus 228 previously-missing sub-form rows for species PokeAPI packs
  as multiple `pokemon-form` entries under one variety — Unown, Vivillon, Arceus's 18
  plates, Silvally's 17 memories, and 20 more groups (Leg 9).
- **The spreadsheet-style Living Dex UI**: species-grouped rows, dex#/Owned/Shiny
  checkboxes, gender-split and regional toggles, cosmetic-variant expand (Leg 3); sprite
  thumbnails with a click-to-enlarge modal, a generation stepper, shiny and animated
  toggles, and a Showdown-vs-PokeAPI animated source choice at gen 5 (Legs 4, 11, 12).
- **Manual JSON export/import** as the full v1 backup path — natural-key matching,
  full-replace restore semantics, `window.confirm`-gated (Leg 5).
- **Packaging and distribution**: NSIS/x64 Windows builds published to GitHub Releases,
  with in-app auto-update via `electron-updater` (Leg 6).
- **Data-correctness passes**, each verified live against PokeAPI/Serebii/Bulbapedia
  rather than from memory: totem/Let's Go starter/Koraidon-Miraidon ride-mode exclusions
  (Leg 7); `home_boxable` corrections for 17 forms Home doesn't accept yet, wired into
  the UI as a badge (Legs 8, 13); base-form display naming for 54 species with a real
  `form_name` (Leg 10); `shinyLocked` for the 47 (species, form) pairs that can never
  legitimately be shiny, audited against Serebii/Bulbapedia and wired into the UI as a
  disabled checkbox + badge (Legs 14, 14 follow-up, 15, 16).

## Verification performed

Per leg: `npm run typecheck`, `npm test` (vitest — 49 tests by the end), and for
data-affecting legs, a live check against the real source before committing rather than
trusting the existing `forms.json`/memory — PokeAPI's raw `pokemon-form` responses
(Leg 8), the sprite CDN via GitHub API + direct HTTP HEAD checks (Leg 12), and
Serebii/Bulbapedia cross-referenced row-by-row against `species.json`/`forms.json` via
one-off scripts (Legs 9, 10, 14). Leg 6's packaging path was verified with a real
`npm run package:dir` local build + launch, not just `dev`.

## What went well

- **Live-check-first discipline paid off repeatedly.** Leg 9 caught a real bug before
  committing (a sub-form heuristic that wrongly demoted every affected species' base row
  by comparing it against itself) by verifying all 1025 species still had an anchor row
  after the fetch, not just trusting the new logic. Leg 12 found three real CDN bugs
  (wrong gen-6 folder name, wrong animated file extension, three generations with no
  shiny sprite folder at all) that a memory-only fix would have missed.
- **Established UI patterns got reused instead of re-litigated.** Leg 13's
  badge-plus-disable treatment for `homeBoxable` became the template Leg 16 applied to
  `shinyLocked` with no new design discussion needed. Leg 8's seed-backfill pattern (for
  already-seeded local dbs to pick up a data correction without touching
  `collection_entries`) was reused as-is in Leg 15.
- **Scope expansions were flagged, not silently absorbed.** Leg 9's generic trigger fixed
  20 species beyond the 7 originally named, Leg 10 covered 54 species instead of the 4
  first flagged, and Leg 14 surfaced Zacian/Zamazenta as shiny-locked though the original
  TODO only named Gen 9 legendaries — each was called out to Vanny as a scope decision
  in the moment rather than folded in without a flag.

## Friction points

- **A stale "not a git working directory" belief persisted across Legs 13-16.**
  `COMPLETED.md` entries for those legs said "no repo here, no commit hash" — but a real
  repo existed the whole time (5 commits, including Leg 13's, sat unpushed locally). This
  wasn't caught until this milestone wrap-up, which had to retroactively split the
  uncommitted Leg 15/16 working-tree changes into proper per-leg commits and correct
  Leg 13's inaccurate note. The environment's own git-repo signal was wrong for an
  extended stretch; a `git status` check at the start of a leg would have caught it much
  sooner than an end-of-milestone audit.
- **`data/pokemon/forms.json` grew to a single ~4700-line diff by the end** from repeated
  live re-fetches and one-off patch scripts across a dozen legs. Each individual change
  was reviewed at commit time, but the file itself is exempt from the usual 300/500-line
  file cap as static data, so nothing forced a periodic sanity pass on it as a whole.

## Scope creep

None beyond the flagged-and-approved expansions noted above (Legs 9, 10, 14) — each was
raised as an explicit decision before the wider scope was executed, not discovered after
the fact.

## What changes for the next milestone

- Verify git state with `git status` directly at the start of a leg rather than trusting
  the environment's reported "is a git repository" flag — it was wrong for multiple legs
  running and the cost of confirming is one command.
- The one remaining open TODO item — a custom app icon (`build/icon.png`) — is the last
  thing standing before a real public release; packaged builds currently ship Electron's
  default icon.
