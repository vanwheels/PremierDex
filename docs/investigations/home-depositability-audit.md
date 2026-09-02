# Home-depositability audit

Source: manual pass through the app by the user (2026-09-01), cross-referenced against
[Serebii's Pokemon Home depositable-species list](https://www.serebii.net/pokemonhome/depositablepokemon.shtml).
Findings below were verified against the current `data/pokemon/species.json` /
`forms.json` (1025 species, 1351 forms) before filing, not just taken on the user's word.

This splits into three distinct root causes, which is why it's filed as separate TODO
items rather than one: (1) entries that shouldn't exist in the dex at all, (2) forms that
exist and are correctly non-battle-only but that Home currently refuses to deposit
anyway — a signal the `non_boxable` category doesn't currently encode, and (3) forms
that are missing from the data entirely, which is a `fetch-pokemon-forms.ts` gap, not a
categorization gap.

## 1. Should not exist as dex entries

- **Totem Pokemon** — 12 rows confirmed present (`formName` containing `totem`):
  Raticate-Alola (`totem-alola`), Marowak-Alola (`totem`), Gumshoos, Vikavolt,
  Araquanid, Lurantis, Salazzle, Togedemaru, Kommo-o (all plain `totem`), and Mimikyu's
  `totem-disguised`/`totem-busted` pair. These are in-game boss encounters only — not
  catchable, so they shouldn't occupy a dex slot at all (not even `non_boxable`, which
  is for forms you can catch but can't box).
- **Let's Go starter Eevee/Pikachu** — `formName: 'starter'` on species 25 (Pikachu) and
  133 (Eevee), currently categorized `dex_distinct`. These can't be transferred out of
  Let's Go/into Home, so they shouldn't be tracked as a dex slot.
- **Koraidon/Miraidon ride modes** — Koraidon's `limited-build`/`sprinting-build`/
  `swimming-build`/`gliding-build` and Miraidon's `low-power-mode`/`drive-mode`/
  `aquatic-mode`/`glide-mode` are already `cosmetic_variant`, but per the user these
  aren't forms at all — they're an in-game S/V traversal feature, not something that
  persists as a distinct Pokemon state outside battle. Should be dropped, not just
  downgraded.

## 2. Exist in-game, not battle-only, but not currently Home-depositable

The `non_boxable` category was defined from PokeAPI's `is_battle_only` flag (see
[form-categorization.md](form-categorization.md)), which is a different question from
"can Pokemon Home currently accept this form." These are all real, obtainable, boxable
in the main games — Home just hasn't added support yet. Currently mis-stored as
`dex_distinct`:

- Dialga, Palkia, Giratina — `origin` forme (all 3 confirmed `dex_distinct`)
- Necrozma — `dawn` (Dawn Wings) and `dusk` (Dusk Mane); `ultra` is already correctly
  `non_boxable`
- Calyrex — `ice` (Ice Rider) and `shadow` (Shadow Rider)
- Ogerpon — all 3 mask forms (`wellspring-mask`, `hearthflame-mask`, `cornerstone-mask`)
- Minior — the 7 "core" color forms (`red`/`orange`/`yellow`/`green`/`blue`/`indigo`/
  `violet`) are `dex_distinct`; only the 6 `*-meteor` cosmetic variants + base are
  boxable in Home today. **Resolved (Leg 8):** checked live against PokeAPI's raw
  `pokemon-form` response for `minior-red` (id 10255) — `is_battle_only: false`,
  `form_name: "red"`. Not a heuristic bug: PokeAPI genuinely doesn't flag Minior's core
  forms as battle-only (unlike Home, which won't box them), so this is the same kind of
  Home-specific gap as the others, not a script bug.

**Resolved (Leg 8):** used the existing `home_boxable` schema/type field (already
present since Leg 4 — `schema.ts`, `sqlite-storage.ts`, `shared/types/pokemon.ts` — but
hardcoded to `1`/`true` on every row) rather than adding a new field. Populated it via a
17-entry `OVERRIDES` batch in `fetch-pokemon-forms.ts` (the 3 Origin formes, Necrozma's
2, Calyrex's 2, Ogerpon's 3 masks, Minior's 7 core colors), hand-patched into
`forms.json`, with a `seed.ts` backfill so already-seeded local databases pick up the
correction on next startup. `homeBoxable` is plumbed through storage/types but has no UI
consumer yet — filtering it into the collectible dex view is a separate follow-up, not
done in this leg (see TODO.md).

## 3. Missing from the data entirely (fetch script gap, not categorization)

**Resolved (Leg 9).** Confirmed via live PokeAPI checks that these species express their
variants as multiple `pokemon-form` entries under a *single* `pokemon` variety, not as
separate `varieties` the way `fetch-pokemon-forms.ts` otherwise assumes — e.g. Unown's
`/pokemon/201` has one variety but its `forms` array lists all 28 letters as separate
`pokemon-form` entries (`unown-a` through `unown-z`, `-exclamation`, `-question`), each
with its own `is_battle_only`/`form_name`/`version_group`/`types`. This is a different
shape from the `pikachu-original-cap` vs `pikachu-cosplay` case (separate varieties),
not the same machinery reused.

Also discovered live: these sub-forms' sprite files aren't keyed by the sub-form's own
PokeAPI id (e.g. Unown-B's `pokemon-form` id 10001 is unrelated to its sprite path) —
the CDN instead keys them `"{basePokemonId}-{form_name}.png"` (confirmed:
`unown-b` → `201-b.png`, `vivillon-icy-snow` → `666-icy-snow.png`). `sprites.ts`
previously assumed every form's sprite was keyed by a single standalone numeric id, so
this required a new nullable `spriteFormSuffix` field (`Form`/schema/seed/sprites.ts all
updated) rather than being just a fetch-script fix.

`fetch-pokemon-forms.ts`'s fix is generic — triggered by
`defaultPokemon.forms.length > 1`, not a hardcoded species list — so it corrected the
same gap for species beyond the 7 originally suspected. Full list (228 new form rows
across 27 species, re-fetched and verified 2026-09-02, zero pre-existing rows changed):

- **Unown** (27 new), **Vivillon**/**Scatterbug**/**Spewpa** (19 each — the pattern
  applies to both pre-evolutions too), **Flabébé**/**Floette**/**Florges** (4 each),
  **Furfrou** (9), **Alcremie** (62), **Poltchageist**/**Sinistcha** (1 each) — the
  originally-named cosmetic groups.
- **Arceus** (18 — its type-plate forms, correctly `dex_distinct` since they change its
  type) and **Silvally** (17 — its memory-type forms, same reasoning) — previously
  entirely missing from the dex despite being real, commonly-tracked variants.
- **Genesect** (4 Drives), **Deerling**/**Sawsbuck** (3 seasonal each), **Pichu**
  (spiky-eared), **Burmy**/**Mothim** (cloak forms), **Shellos**/**Gastrodon**
  (east/west sea), **Frillish**/**Jellicent**, **Pyroar**, **Sinistea**/**Polteageist** —
  1-4 new cosmetic forms each.
- **Cherrim** (Sunshine form) and **Xerneas** (Active Mode) — correctly `non_boxable`
  (both are battle-only stance changes, not persistent forms).

A first implementation pass had a real bug, caught before committing: the sub-form
heuristic compared every sub-form's types against the *default* sub-form's types to
decide `dex_distinct` vs `cosmetic_variant`, including the default sub-form itself —
trivially "matching itself" and downgrading it to `cosmetic_variant`, which would have
hidden every affected species' main dex row (Unown, Arceus, etc.) behind the
cosmetic-variant expand toggle with no visible primary row. Fixed by hardcoding the
`is_default` sub-form to `formName: 'base'` / `formCategory: 'dex_distinct'` unconditionally, same as every other species' base row, and verified afterward that all 1025
species have at least one non-`cosmetic_variant`/`non_boxable` anchor row.

## 4. Base-form display naming (separate, smaller issue)

The default variety of every species is stored as `formName: 'base'` by convention
(see rule 7 in [form-categorization.md](form-categorization.md)). That's fine as a
storage key, but several species' base form has an actual in-game name that isn't
"base" — confirmed: Deoxys ("Normal"), Wormadam ("Plant"). The user also expects
Oricorio ("Baile") and Squawkabilly ("Green") to need the same treatment, though both
of those already have all their non-base forms present and correctly categorized — this
is purely a display-label gap, not a missing-data one. Worth a sweep for any other
multi-form species with a named (not generic) base forme before building the fix.
