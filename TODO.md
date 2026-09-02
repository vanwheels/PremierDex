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
`forms.json` rows (no fetch-script gap there). Governing definition per Vanny: locked
means no legitimate shiny has ever existed by any means (in-game or a past
distribution), not "is it currently obtainable" — an expired event doesn't count as
locking, since collectors can still get preserved past distributions. That resolved
Zacian/Zamazenta as NOT locked despite their normal story gift being non-shiny (a real
shiny was distributed once); Koraidon/Miraidon and the rest of the Event-Only bucket
weren't specifically checked against that distribution test and are noted as
unconfirmed in the audit doc. This leg: add a `shinyLocked` field to `Form` (schema.ts,
seed.ts, `shared/types/pokemon.ts`, `fetch-pokemon-forms.ts`) — different axis than
`homeBoxable`, since the Pokemon itself is still ownable/boxable, only its shiny variant
isn't. Currently every form gets both a shiny and non-shiny `collection_entries` row
unconditionally, so locked forms show a falsely-checkable Shiny box. Needs a seed.ts
backfill for already-seeded local dbs, same pattern as the `home_boxable` backfill from
Leg 8.
Last touched: 2026-09-02. Re-check count: 0.

## [Shiny-locked species/forms: UI wiring] — unscheduled
Follows the schema/backfill leg above. UI decision on how a locked shiny checkbox
should render (disabled/greyed like the regular checkbox already is when no entry
exists, vs. never seeding the shiny row at all) — mirrors the decision already made for
[[Wire homeBoxable into the collectible dex view]].
Last touched: 2026-09-02. Re-check count: 0.

