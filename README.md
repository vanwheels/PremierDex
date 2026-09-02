# PremierDex

A Pokémon collection and shiny-hunting tracker (desktop app), replacing a Google
Sheets–based Living Dex Organizer workflow with a proper mutable data model.

## Stack

Electron + React + TypeScript, SQLite (via `better-sqlite3`) for local storage.
Structured after [GW2-Squaded](../GW2-Squaded)'s electron-vite scaffold.

## Data sources

- [PokeAPI](https://pokeapi.co/) — live/automated backbone for species, forms, and
  sprites. `scripts/fetch-pokemon-species.ts` pulls the National Dex species list into
  `data/pokemon/species.json`, which is committed and loaded at runtime.
- Serebii and Bulbapedia — used manually for supplemental data later, never scraped;
  credited here once that data lands.

## Development

```
npm install
npm run fetch-pokemon-species   # (re)generate data/pokemon/species.json
npm run dev
```

`npm run typecheck`, `npm run lint`, and `npm test` (vitest) round out the checks.

## Packaging

Distribution is via GitHub Releases (no app stores, per a locked decision — see
`TODO.md`). Windows only for now.

```
npm run package:win           # build an NSIS installer locally, unsigned
npm run package:win:publish   # same, then upload to GitHub Releases (needs a GH_TOKEN)
```

In-app updates read from GitHub Releases via `electron-updater`
(`src/main/updater/auto-updater.ts`); only enabled in packaged Windows builds.

## Project docs

- `TODO.md` / `COMPLETED.md` — active and finished work, leg by leg.
- `MILESTONES.md` — shipped milestones, each linking to a post-mortem in
  `docs/postmortems/`.
- `docs/investigations/` — deep-dive research docs referenced from TODO items.
