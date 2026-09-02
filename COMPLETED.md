# COMPLETED

## [Sprite display] — Leg 4
2026-09-01. PokeAPI sprite thumbnails in the grid with a click-to-enlarge modal and a
generation stepper (each form's firstAvailableGeneration through gen 9) plus a shiny
toggle. Required adding `pokeapiId` to the form data model — the sprite CDN keys files
on PokeAPI's numeric pokemon id, not on anything previously stored — so this leg also
re-ran the forms fetch against live PokeAPI. See commit `4963652`.

## [Spreadsheet-style Living Dex UI] — Leg 3
2026-09-01. Replaced the proof-of-pipeline table with the real grid: species-grouped
rows with dex #/Owned/Shiny checkbox columns, a gender-split toggle (off by default,
collapses to the male entry), a regional inline/grouped toggle, and a per-species
cosmetic-variant expand control. `src/renderer/dex/buildDexSections.ts` holds the pure
view-model logic (unit-tested); toggle state lives only in the renderer, never written
to storage. See commit `c6ae4d7`.

## [Form categorization data pass] — Leg 2
2026-09-01. Real per-form data (form_category/has_gender_difference/regional_group/
first_available_generation) for all 1025 species' 1351 forms, replacing the Leg 1
placeholder; `scripts/fetch-pokemon-forms.ts` derives it from live PokeAPI signals
rather than hand-curated trivia. See commit `45eecbf`. Full rationale and the two data
quirks the first full run surfaced (and fixed): `docs/investigations/form-categorization.md`.

## [Project Scaffold] — Leg 1
2026-09-01. Electron+React+TS+SQLite app shell (adapted from GW2-Squaded's electron-vite
structure), the Species/Form/CollectionEntry schema, an idempotent PokeAPI-backed seed
pipeline, and IPC/preload wiring proven end-to-end via a proof-of-pipeline renderer
screen. See commit `52b10de`. Full writeup: `docs/postmortems/project-scaffold.md`.
