# Shiny-locked species/forms audit

Source: [Serebii's shiny-locked page](https://www.serebii.net/games/shiny.shtml), cross-
referenced against the current `data/pokemon/species.json` / `forms.json` (1025 species,
1557 forms) via a one-off Node script, not taken on the page's word alone. Data-audit
leg only — no schema/seed/UI changes made here (see TODO.md for the follow-up legs).

## Method and a caveat on the source

Serebii's page has (at least) two different kinds of shiny-lock information: a plain
textual list ("Event-Only" and "Coded to Not Appear Shiny" sections — reliable, reads as
literal prose) and a per-game table of gift/wild Pokemon locations where lock status is
conveyed by an icon next to each row. `WebFetch` renders the page to markdown before an
LLM reads it, so icon-only signals don't survive — a query against the icon table
produced an inconsistent, likely-hallucinated answer on a second pass (claiming Zacian/
Zamazenta/Koraidon/Miraidon were "all listed as shiny-locked" with no textual basis
quoted). Findings below rely only on the textual list, plus one independent
cross-check against Bulbapedia's Shiny Pokémon article for the ambiguous cases. Anything
not resolved that way is filed as an open question rather than guessed.

## Confirmed shiny-locked, mapped to current form rows

Only `dex_distinct` and `cosmetic_variant` forms matter for the dex-view shiny checkbox
— `buildDexSections.ts` skips `non_boxable` rows entirely (`if (form.formCategory ===
'non_boxable') continue`), so a lock on a `non_boxable` form is currently invisible
regardless. Noted anyway for completeness since `seed.ts` still creates a
`collection_entries` row for every form regardless of category.

| Species | Locked form(s) | Category | Notes |
|---|---|---|---|
| Pikachu | `original-cap`, `hoenn-cap`, `sinnoh-cap`, `unova-cap`, `kalos-cap`, `alola-cap`, `world-cap` | cosmetic_variant | All 7 already exist as distinct rows — the TODO's open question ("aren't even in forms.json as distinct forms yet") resolves to **no gap**. `partner-cap` is genuinely different: it's the player's own Let's Go Pikachu transferred in, which *can* be shiny in Let's Go itself, so it's correctly excluded from Serebii's list — do not lock it. |
| Victini | `base` | dex_distinct | |
| Greninish (Ash-Greninja) | `ash` | non_boxable | Already hidden from the dex view; moot for the UI leg. |
| Vivillon | `poke-ball` | cosmetic_variant | Form-specific only — every other Vivillon pattern is normally shiny-obtainable. Do not lock `base` or the other 17 patterns. |
| Hoopa | `base`, `unbound` | dex_distinct | Serebii lists only "Hoopa"; Unbound is a battle-item forme change on the same individual, not an independently-caught Pokemon, so the lock necessarily covers both of our rows. |
| Magearna | `base`, `original` | dex_distinct / cosmetic_variant | Serebii lists both "Magearna" and "Magearna (Original Color)" explicitly. `mega`/`original-mega` are `non_boxable` (hidden, moot). |
| Marshadow | `base` | dex_distinct | |
| Melmetal | `gmax` | non_boxable | Base Melmetal (from Meltan evolution) is **not** locked — only the Mystery-Gift-distributed Gigantamax factor is. Already hidden from the dex view; moot for the UI leg, and important not to accidentally lock `base` when this is implemented. |
| Zarude | `base`, `dada` | dex_distinct / cosmetic_variant | Serebii lists both "Zarude" and "Zarude (Dada)". |
| Floette | `eternal` | dex_distinct | Form-specific only — `base`/`yellow`/`orange`/`blue`/`white` are normally shiny-obtainable. `mega` is `non_boxable` (hidden, moot). |
| Cosmog | `base` | dex_distinct | |
| Cosmoem | `base` | dex_distinct | |
| Kubfu | `base` | dex_distinct | |
| Urshifu | `base` (Single Strike), `rapid-strike` | dex_distinct | Both styles locked (Kubfu's evolution retains the lock regardless of style). Gmax forms are `non_boxable` (hidden, moot). |
| Glastrier | `base` | dex_distinct | |
| Spectrier | `base` | dex_distinct | |
| Calyrex | `base`, `ice`, `shadow` | dex_distinct | Ice/Shadow Rider are fusions of locked Pokemon (Calyrex+Glastrier/Spectrier), so the lock necessarily covers all three rows. |
| Ursaluna | `bloodmoon` | dex_distinct | Form-specific only — base Ursaluna (from Ursaring/Teddiursa) is **not** locked. |
| Walking Wake | `base` | dex_distinct | |
| Iron Leaves | `base` | dex_distinct | |
| Okidogi | `base` | dex_distinct | |
| Munkidori | `base` | dex_distinct | |
| Fezandipiti | `base` | dex_distinct | |
| Ogerpon | `base`, `wellspring-mask`, `hearthflame-mask`, `cornerstone-mask` | dex_distinct | All 4 rows — Serebii lists the species without breaking out masks, but masks are a held-item forme change on one individual, same reasoning as Hoopa/Calyrex above. |
| Gouging Fire | `base` | dex_distinct | |
| Raging Bolt | `base` | dex_distinct | |
| Iron Boulder | `base` | dex_distinct | |
| Iron Crown | `base` | dex_distinct | |
| Terapagos | `base` | dex_distinct | `terastal`/`stellar` are `non_boxable` (hidden, moot) — same reasoning would lock them too if that ever changes. |
| Pecharunt | `base` | dex_distinct | |
| Koraidon | `base` | dex_distinct | Not in Serebii's plain-text lists, but confirmed shiny-locked by cross-check (see below) — the TODO's "rest of the Gen 9 legendaries" phrasing already anticipated this. |
| Miraidon | `base` | dex_distinct | Same as Koraidon. |

## New discovery beyond the TODO's original list: Zacian/Zamazenta

Bulbapedia's Shiny Pokémon article explicitly names **Zacian and Zamazenta** alongside
Eternatus, the Galarian legendary birds, Keldeo, Glastrier, Spectrier, and Calyrex as
prevented from being shiny on their (only, non-repeatable) in-game encounter. This
wasn't in the TODO's original enumeration and isn't a Gen 9 legendary, so it's outside
this leg's assumed scope — flagging rather than silently rolling it in. The general
pattern, for what it's worth: traditional "box art" legendaries obtained via a normal
battle encounter (Groudon/Kyogre/Rayquaza, Dialga/Palkia/Giratina, Reshiram/Zekrom,
Xerneas/Yveltal, Solgaleo/Lunala, etc.) are *not* locked — shiny-hunting them via
soft-reset is a long-documented, working strategy. Zacian/Zamazenta and Koraidon/
Miraidon broke that pattern by being handed over in a scripted cutscene with no
catch/encounter to soft-reset, which is consistent with why only those four turned up
as locked outside the traditional mythical/ultra-beast/paradox categories already named.
**Open question for Vanny:** should this audit (and the eventual `shinyLocked` field)
extend to Zacian/Zamazenta now, or stay scoped to the TODO's original list and pick up
Zacian/Zamazenta as a separate follow-up? Left undecided rather than assumed.

## Explicitly checked and NOT locked (don't flag these)

- Pikachu: `partner-cap`, `rock-star`/`belle`/`pop-star`/`phd`/`libre`/`cosplay` (Cosplay
  Pikachu, ORAS in-game encounter), `gmax` (Sword/Shield wild Max Raid encounter) —
  none are event-exclusive-only distributions.
- Vivillon: all 18 non-`poke-ball` patterns.
- Magearna/Zarude/Floette: every sibling form not named in the table above.
- Ursaluna: `base`.
- Melmetal: `base`.
- Greninja: `base`, `battle-bond` (both normal in-game forms; only `ash` is locked).

## Not independently re-verified

Everything above rests on Serebii's page as of 2026-09-02 plus the one Bulbapedia
cross-check — genuinely obscure edge cases (e.g. whether a species-wide lock like
Hoopa's or Calyrex's is actually enforced identically for every one of that species'
forme rows in-game, versus just the base) are inferred from how forme-changing works
generally (same individual, not a separate catch), not confirmed row-by-row against a
primary source per form. If a form-specific correction ever surfaces, treat this doc as
the place to record it, not `forms.json` directly.
