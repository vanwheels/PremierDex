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

Confirmed via direct inspection — these species have only their `base` form (and
sometimes `gmax`) in `forms.json`, nothing else:

- **Unown** — 0 of its 28 letter forms (A–Z, !, ?)
- **Vivillon** — 0 of its ~20 patterns
- **Flabébé** — 0 of its 5 color variants (red/yellow/orange/blue/white)
- **Floette** — has `base`/`eternal`/`mega` but 0 of its 5 color variants
- **Florges** — 0 of its 5 color variants
- **Furfrou** — 0 of its 9 trims
- **Alcremie** — has `base`/`gmax` but 0 of its 63 cream/sweet combinations
- **Poltchageist**, **Sinistcha** — 0 of their 2 forms each (Unremarkable/Masterpiece)

Root cause is likely that `fetch-pokemon-forms.ts` only walks `/pokemon-species`
`varieties` (separate `pokemon` entries), while these species express their variants as
multiple `pokemon-form` entries under a *single* `pokemon` variety instead (this is
exactly the shape that produced the `pikachu-original-cap` vs `pikachu-cosplay` cosmetic
forms already handled correctly — so the script has the machinery, it's likely just not
being reached for these species' variety). Needs checking against a live PokeAPI
response before assuming the exact fix.

## 4. Base-form display naming (separate, smaller issue)

The default variety of every species is stored as `formName: 'base'` by convention
(see rule 7 in [form-categorization.md](form-categorization.md)). That's fine as a
storage key, but several species' base form has an actual in-game name that isn't
"base" — confirmed: Deoxys ("Normal"), Wormadam ("Plant"). The user also expects
Oricorio ("Baile") and Squawkabilly ("Green") to need the same treatment, though both
of those already have all their non-base forms present and correctly categorized — this
is purely a display-label gap, not a missing-data one. Worth a sweep for any other
multi-form species with a named (not generic) base forme before building the fix.
