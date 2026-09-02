# TODO

## [Form categorization data pass] — Leg 2
Every form is currently seeded as a placeholder ('base', `dex_distinct`,
`has_gender_difference: false`, no `regional_group`) by `src/main/storage/seed.ts`. This
leg replaces that with real per-species form data: which forms are `dex_distinct` vs
`cosmetic_variant` vs `non_boxable`, gender differences, regional grouping, and
first-available generation, for all 1025 species. Cross-check: ChoiceBuds
(`src/renderer/hooks/useSpeciesRoster.ts`) explicitly excludes Mega Evolution from its
roster as item-driven rather than a separate slot — Mega forms likely want
`non_boxable` or exclusion here too, not `dex_distinct`.
Last touched: 2026-09-01. Re-check count: 0.

## [Spreadsheet-style Living Dex UI] — Leg 3
Replace the scaffold's proof-of-pipeline table (`src/renderer/App.tsx`) with the real
v1 spreadsheet-style grid: display toggles for gender variants as separate rows (off by
default), regional forms inline-vs-grouped, and boxable cosmetic variants shown/hidden
per species. Toggles are presentation-only, never baked into stored data.
Last touched: 2026-09-01. Re-check count: 0.

## [Sprite display] — Leg 4
PokeAPI sprites with a generation-accurate toggle and click-to-enlarge. Needs
`src/renderer/index.html`'s CSP `img-src`/`connect-src` widened to PokeAPI's sprite host
(raw.githubusercontent.com) — currently scoped to `'self'` only.
Last touched: 2026-09-01. Re-check count: 0.

## [Manual export/import (JSON)] — Leg 5
Required-for-v1 backup mechanism: export the full collection (species/forms/collection
entries) to JSON and reimport it. No sync backend in v1 — this is the only backup path.
Last touched: 2026-09-01. Re-check count: 0.

## [Packaging/distribution] — Leg 6
electron-builder.yml + GitHub Releases distribution (per the locked decision to avoid
app stores for IP-risk reasons). Explicitly out of scope for the scaffold session;
`better-sqlite3`'s native rebuild already runs via `postinstall: electron-builder
install-app-deps`, but no packaging config exists yet.
Last touched: 2026-09-01. Re-check count: 0.
