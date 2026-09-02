# Post-mortem: Project Scaffold

**Shipped:** 2026-09-01. Commit `52b10de`.

## What shipped

- Electron + React + TypeScript app shell via electron-vite (main/preload/renderer/shared
  split), adapted from GW2-Squaded's structure and trimmed to v1's actual needs (no sync
  worker, no auto-updater, no packaging config).
- The locked relational schema — `species` → `forms` → `collection_entries`, real tables
  with FKs and CHECK constraints, not a JSON-blob store — in
  `src/main/storage/schema.ts`.
- An idempotent seed pipeline (`src/main/storage/seed.ts`) that loads a PokeAPI-fetched,
  committed `data/pokemon/species.json` (1025 rows, fetched via 9 requests against
  `/generation/{1..9}`) and inserts one placeholder `dex_distinct` form + 2
  `collection_entries` rows (regular/shiny) per species, entirely via `INSERT OR IGNORE`
  so re-seeding on every launch never touches existing owned/shiny state.
- Domain-specific storage/IPC/preload bridge (`window.premierDex`) and a proof-of-pipeline
  renderer screen confirming the whole path works end-to-end.
- Task-tracking scaffolding (`TODO.md`, `COMPLETED.md`, `MILESTONES.md`,
  `docs/postmortems/`, `docs/investigations/`) per the global CLAUDE.md conventions,
  structurally copied from ChoiceBuds.
- 4 vitest schema tests; clean `typecheck`/`lint`.

## Verification performed

`npm install` (native better-sqlite3 rebuild via `electron-builder install-app-deps`),
`typecheck`, `lint`, `fetch-pokemon-species` (1025/1025 unique IDs, 1–1025 contiguous),
a real `npm run build` + launch (not just `dev`) with the SQLite DB queried directly to
confirm exact row counts (1025 species / 1025 forms / 2050 entries), then a second
launch confirming those counts are unchanged (idempotent seeding, no duplicate rows),
and `npm test`.

## What went well

- GW2-Squaded's structure ported over almost mechanically for the tooling layer
  (electron.vite.config.ts, tsconfig split, eslint flat config, vitest config) — no
  surprises there.
- The `INSERT OR IGNORE` + unique-constraint approach to idempotent seeding worked
  exactly as designed on the first try; verified by direct DB query rather than trusting
  the UI, which caught nothing wrong but was worth doing given the seed logic is the
  part most likely to have an off-by-one or duplicate-row bug.

## Friction points

- **`npm install`'s Electron binary download stalled silently.** The postinstall script
  reported success, but `node_modules/electron/dist/` was empty and `path.txt` missing.
  `electron-vite preview` failed with an opaque `Error: Electron uninstall`. Fixed by
  manually re-running `node node_modules/electron/install.js`, which completed the
  download. Not a scaffold defect, but worth remembering as a first troubleshooting step
  if a fresh clone's `electron-vite dev`/`preview` fails the same way.
- **`ELECTRON_RUN_AS_NODE=1` was set in this shell's environment** (from the VSCode
  extension host this session runs in), which makes `electron.exe` run as plain Node —
  `require('electron')` then returns a path string instead of the Electron API, and
  `@electron-toolkit/utils` crashes reading `.app.isPackaged` off it. Worked around with
  `env -u ELECTRON_RUN_AS_NODE` for verification launches from this shell. This only
  affects launching Electron from *this* terminal; it won't affect the user's own
  terminal/IDE runs unless they're also in an environment that sets it.

## Scope creep

None — the plan explicitly excluded the real spreadsheet UI, form categorization data,
sprite display, export/import, and packaging, and none of those were touched. TODO.md
carries all five forward as their own legs.

## What changes for the next leg

- [Form categorization data pass] is next and is pure data work — no schema changes
  expected, since `forms.form_category`/`has_gender_difference`/`regional_group` already
  exist and just hold placeholder values today.
- Any future verification launch from a Claude Code session in this same VSCode-extension
  environment should default to `env -u ELECTRON_RUN_AS_NODE npm run <script>` rather than
  re-diagnosing the crash each time.
