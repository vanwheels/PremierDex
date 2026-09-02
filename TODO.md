# TODO

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
