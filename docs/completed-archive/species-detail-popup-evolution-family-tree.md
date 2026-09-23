# Completed: Species detail popup + evolution family tree

Archived from `COMPLETED.md` at the milestone boundary — see
`docs/postmortems/species-detail-popup-evolution-family-tree.md` and `MILESTONES.md`.

## [Species detail popup + evolution family tree Leg 12: SpriteModal in the popup + gender side-by-side + back toggle] — 2026-09-22
Wired `SpeciesDetailPopup`'s info view to open `SpriteModal` on sprite click instead of
rendering a static `<img>`, picking up the generation stepper and shiny/animated toggles for
free. Added the two `SpriteModal` capabilities Leg 10 scoped: a `hasGenderDifference` target
field drives a Serebii-style male/female side-by-side layout (not a toggle, confirmed with
Vanny) for every caller, not just the popup, and a plain Back checkbox applies to whichever
sprite(s) are on screen using Leg 11's back-sprite builders. Removed the old single-gender
`female` target field it supersedes — once side-by-side always shows both sprites for a
gender-diff form regardless of which split row was clicked, there was no per-target gender
left to pick — and threaded `hasGenderDifference` through `CollectionRowData` to match
`DexRowData`, which already had it. New `SpriteSlot` subcomponent, keyed by URL, tracks each
side's sprite load failure independently (gender-specific art can start later than the form
itself) and drops the several manual `setFailed(false)` resets the single-image version
needed. `tsc`/full test suite clean; manual verification left to Vanny per usual. See commit
`4dd9adc`. This closes out the milestone — see `MILESTONES.md`.

## [Species detail popup + evolution family tree Leg 11: back-sprite URL support] — 2026-09-22
Added a `back` param to `sprites.ts`'s three builders, verified live against the CDN before
writing any code (nesting order, which generations lack a `back/` folder entirely vs. just
inherit the existing shiny gap). Also surfaced a pre-existing, unrelated bug — generation-vii
serves `.gif` not `.png` — logged to TODO.md rather than fixed in this leg. See commit
`f3fc150`.

## [Species detail popup + evolution family tree Leg 10: scoping discussion] — 2026-09-22
Pure discussion leg, no code changes. Vanny raised wanting the app to eventually grow into a
curated mainline-games species database (movesets, base stats, catch rate, breeding/egg
groups) on top of the storage functionality — scoped as its own future milestone ("Species
database: full per-species pages" in TODO.md) rather than folded into this one, with the
existing species detail popup staying a lightweight entry point that will link out to it
rather than growing in place. That new entry absorbs the former "Catch rate + capture
probability calculator" future-milestone entry. Also discussed near-term sprite display gaps
(shiny toggle, per-generation tabs, male+female side-by-side, front/back) — found these
mostly map onto reusing the app's existing `SpriteModal` component rather than needing new
popup-specific work, so scoped as two small legs appended to this milestone (11 and 12) rather
than deferred to the future database milestone. See TODO.md for both.

## [Species detail popup + evolution family tree Leg 9: fix Eevee's 8-way branch layout and long method text] — 2026-09-22
Two fixes to `EvolutionTree.tsx`/`evolution-tree.css`, both scoped to display only (no data
model change). New `evolutionMethodLabel.ts`'s `condenseMethodLabel` collapses a
multi-alternative `" or "`-joined method string (Leafeon/Glaceon's per-game location
alternatives, the longest strings in the dataset) to a short "N Methods" label with the full
string moved to a native `title` tooltip — same pattern as `DexRow`'s
`dex-invalid-combo-badge` — instead of letting the run-on sentence wrap across many lines in
the fixed-width arrow column. Confirmed fine as-is by Vanny; full rework deferred to the
future "Full UI/UX pass" milestone. Separately, a branch above a new `WIDE_BRANCH_THRESHOLD`
(4; only Eevee's 8-evolution branch crosses it today) now splits its children into two
columns instead of one tall one, roughly halving that branch's height so it fits without
triggering `.evolution-tree`'s `max-height: 70vh` scroll. First attempt shared a CSS grid
across both columns, which Vanny caught live: with both columns' rows on shared grid tracks,
column 1's bubble sat right beside column 2's arrow on the same row (e.g. Vaporeon beside the
arrow into Umbreon), reading as if one evolved into the other. Reworked to two independent
flex columns with a border on the second — see `evolution-tree.css`'s own comment. Vanny
scoped the two-column fix to Eevee only for now; wants to see it live before deciding whether
it's worth applying to every branching family. See commits `bc6d6d0`, `cb41181`.

## [Species detail popup + evolution family tree Leg 8: wire forme-switch groups into the popup] — 2026-09-22
UI half of Leg 7: species detail popup's info view gets a second "View Alternate Formes"
button (next to "View Evolution Family"), shown only for the 14 species with a
`forme-switch-groups.json` entry. New `FormeSwitchGroupView.tsx` renders the group's formes
as a flat, equally-ranked row (not a tree — there's no parent/child direction between e.g.
Deoxys's Attack/Defense/Speed formes) labeled "Not an evolution — alternate forme," plus the
switch method and any per-game note; clicking a forme's sprite re-centers the popup on it the
same way EvolutionTree's bubbles do. `formeSwitchGroups` threaded from main
(`loadFormeSwitchGroupsData`) through IPC/preload/`useCollectionData` down to
`SpeciesDetailPopup`, mirroring `evolutionEdges`' existing plumbing exactly. Flagged, not
fixed: this pushed `DexBoxGrid.tsx`/`DexBoxPane.tsx` to/over the file-size cap — see
Unscheduled in TODO.md. See commit `12e2dac`.

## [Species detail popup + evolution family tree Leg 7: non-evolutionary forme-switch data] — 2026-09-22
No PokeAPI endpoint models forme changes like Deoxys/Rotom/Giratina/Shaymin/Kyurem/Necrozma/
Calyrex at all (its evolution-chain data only covers evolutions), so unlike every other
data/pokemon/*.json file this is hand-curated rather than fetched, the same treatment
pokemon-forms-data.ts already gives OVERRIDES/SHINY_LOCKED. New
`scripts/forme-switch-groups-data.ts` (source array, sourced against Bulbapedia/official
mechanics) + `scripts/build-forme-switch-groups.ts` (validates every speciesId+formName pair
against forms.json, writes `data/pokemon/forme-switch-groups.json`) cover 14 species: the 7
Vanny named plus Hoopa, the Forces of Nature trio + Enamorus, Ogerpon, and Keldeo — all
switchable via the same pattern (item-driven, boxable, reversible). Zygarde and every
battle-only/auto-reverting alternate state (Mega/Gmax, Ultra Necrozma, Zacian/Zamazenta
Crowned, Arceus's plates, etc.) were investigated and deliberately excluded — see the data
file's module doc comment for the reasoning. Data acquisition only, no runtime wiring — see
Leg 8. See commit `c9e9826`.

## [Species detail popup + evolution family tree Leg 6: fix cosmetic-variant forms showing the base form's family] — 2026-09-22
`buildEvolutionFamilyTree`'s root walk operated at the species level and ignored formName
entirely, so a cosmetic-variant Pikachu form (Cosplay, cap variants, etc.) inherited the base
Pikachu -> Raichu family instead of rendering as standalone. Threaded `formName`/`forms` into
`buildEvolutionFamilyTree`, which now short-circuits to a childless standalone node when the
current form's `formCategory` isn't `dex_distinct` (covers both `cosmetic_variant` and
`non_boxable`, e.g. Mega/Gmax) before doing the species-level root walk. See commit `5992a0d`.

## [Species detail popup + evolution family tree Leg 5: horizontal layout, name centering, method casing] — 2026-09-22
Reworked `EvolutionTree.tsx`/`evolution-tree.css` to a left-to-right layout (pure CSS
row/column axis flip — the existing node/children/branch JSX nesting already matched a
sideways genealogy-chart shape), fixed `.evolution-tree-name` not actually centering
(needed `width: 100%` to have something to wrap/center against inside its flex column),
Title Cased every evolution-method clause at the source in `evolution-method-format.ts`
and regenerated `data/pokemon/evolution-edges.json` from PokeAPI, and bumped bubble/sprite/
text sizing and spacing. See commit `210700f`.

## [Species detail popup + evolution family tree Leg 4: fix evolution family tree only showing descendants] — 2026-09-22
Root cause wasn't the root-walk logic or the evolution data (both confirmed correct against
the real ~1025-species dataset before touching any code) — `sqlite-storage.ts`'s
`listSpeciesStmt`/`getSpeciesStmt` never selected
`evolves_from_species_id`, so every `Species` reaching the renderer had
`evolvesFromSpeciesId: undefined`, which `findEvolutionFamilyRootSpeciesId`'s `!== null`
check treated as "has a parent," failed to resolve, and broke out of immediately — always
returning the current species as its own root. See commit `c5c8eb7`.

## [Species detail popup + evolution family tree Leg 3: popup shell + entry point] — 2026-09-22
Built the species detail popup (sprite + name + "View Evolution Family" button, toggling to
Leg 2's `EvolutionTree.tsx` with a Back button; clicking a tree bubble re-centers the popup
on that family member without leaving the tree view) and wired its entry point: a dedicated
ⓘ info button, always visible regardless of ownership, next to the Name cell in
DexTable/DexRow (List view) and next to the species name in DexBoxDetailPanel (Box view).
Verified by Vanny in the running app. See commit `bca697c`.

## [Species detail popup + evolution family tree Leg 2: evolution family tree component] — 2026-09-22
Built `EvolutionTree.tsx` (generation-stacked, flex-wrap layout so wide branches like
Eevee's 8 evolutions wrap onto multiple rows) plus the pure `evolutionTree.ts` tree-assembly
logic (walks `Species.evolvesFromSpeciesId` to the chain root, then `evolution-edges.json`
forward per (speciesId, formName) node so regional-form branches render as separate bubbles).
Piped `evolution-edges.json` from main to renderer the same way `species-availability.json`
already was (new `loadEvolutionEdges` IPC channel/bridge method, `useCollectionData`
exposes `evolutionEdges`). Standalone component only — no render path in the app yet, see
Leg 3. See commit `d55ea59`.

## [Species detail popup + evolution family tree Leg 1: evolution data pipeline] — 2026-09-22
Extended `fetch-evolution-chains.ts` to also write `data/pokemon/evolution-edges.json`
(human-readable method per edge, regional/variety branches like Raichu vs. Raichu-Alola
recovered from PokeAPI's `evolution_details`), verified against `forms.json`'s formName
convention until 0 of 541 edges mismatched. `species-evolution.json` stays byte-identical.
See commit `87e694d`.
