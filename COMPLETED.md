# COMPLETED

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
