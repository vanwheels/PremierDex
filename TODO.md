# TODO

## [App icon] — unscheduled
No custom icon exists yet (`build/icon.png` per electron-builder convention, matching
GW2-Squaded) — packaged builds currently ship with Electron's default icon. Needs
production-quality PokéBall-or-similar artwork before a real public release; not
blocking local/internal packaging.
Last touched: 2026-09-01. Re-check count: 0.

## [Shiny-locked species/forms: schema + seed backfill] — unscheduled
Data audit leg done (`docs/investigations/shiny-locked-audit.md`) — confirmed exactly
which (species, form) rows are shiny-locked per Serebii/Bulbapedia, form-specific vs.
species-wide, and that all of Pikachu's event cap forms already exist as distinct
`forms.json` rows (no fetch-script gap there). This leg: add a `shinyLocked` field to
`Form` (schema.ts, seed.ts, `shared/types/pokemon.ts`, `fetch-pokemon-forms.ts`) —
different axis than `homeBoxable`, since the Pokemon itself is still ownable/boxable,
only its shiny variant isn't. Currently every form gets both a shiny and non-shiny
`collection_entries` row unconditionally, so locked forms show a falsely-checkable Shiny
box. Needs a seed.ts backfill for already-seeded local dbs, same pattern as the
`home_boxable` backfill from Leg 8. **Blocked on a decision from Vanny:** whether to
also include Zacian/Zamazenta (a new discovery this leg, outside the original Gen-9-
legendaries scope — see audit doc's "New discovery" section) or leave them for a
separate follow-up.
Last touched: 2026-09-02. Re-check count: 0.

## [Shiny-locked species/forms: UI wiring] — unscheduled
Follows the schema/backfill leg above. UI decision on how a locked shiny checkbox
should render (disabled/greyed like the regular checkbox already is when no entry
exists, vs. never seeding the shiny row at all) — mirrors the decision already made for
[[Wire homeBoxable into the collectible dex view]].
Last touched: 2026-09-02. Re-check count: 0.

