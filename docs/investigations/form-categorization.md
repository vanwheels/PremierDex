# Form categorization heuristic

Backing detail for the [Form categorization data pass] TODO item. PokeAPI doesn't
directly encode "counts as a separate living-dex slot," so the rules below were derived
and verified against live PokeAPI responses (not assumed from memory) before writing
`scripts/fetch-pokemon-forms.ts`.

## Signals checked live during planning

- **`pokemon-form.is_battle_only`** — confirmed `true` on `pikachu-gmax`'s form, `false`
  on `landorus-therian`'s and `raichu-alola`'s. This is the non_boxable signal: Mega,
  Primal, Gigantamax, Zen Mode, Ash-Greninja, Eternamax, and similar auto-reverting
  forms all set it.
- **Regional form_name is an exact match, not a substring.** `raichu-alola`'s
  `pokemon-form.form_name` is `"alola"`. But `pikachu-alola-cap`'s is `"alola-cap"` — a
  naive `.includes('alola')` check would misclassify every Pikachu cap form as a
  regional variant. The script matches `form_name` against
  `{alola, galar, hisui, paldea}` exactly.
- **Stat/type diffing separates real formes from palette variants.**
  - `raichu-alola`: types `[electric, psychic]` vs base raichu `[electric]`; stats
    `[60,85,50,95,85,110]` vs `[60,90,55,90,80,110]` — differs, so dex_distinct.
  - `pikachu-original-cap` and `pikachu-cosplay`: types `[electric]`, stats
    `[35,55,40,50,50,90]` — identical to base `pikachu` in both. Cosmetic_variant.
  - `pikachu-gmax`: also stat/type-identical to base, but caught by `is_battle_only`
    first and classified non_boxable regardless.
- **Gender difference is per-form, not per-species.** `sprites.front_female` is
  non-null on base `pikachu`, null on `pikachu-gmax`'s sprites object. Species-level
  `has_gender_differences` (on `/pokemon-species`) isn't used — it doesn't tell you
  *which* variety has the distinct sprite.
- **`front_female !== null` alone is not enough — caught on the first full run.** The
  first full fetch flagged Wormadam (`gender_rate: 8`, i.e. always female;
  `has_gender_differences: false` at the species level) as `has_gender_difference: true`
  for every cloak. Checked live: Wormadam's `front_female` URL is byte-for-byte the same
  as `front_default` — PokeAPI duplicates the default sprite into `front_female` for
  strictly single-gender species rather than leaving it null. Fixed by requiring
  `front_female !== null && front_female !== front_default` (`hasDistinctFemaleSprite`
  in the script). Re-ran the full fetch after the fix; Wormadam's forms correctly came
  back `has_gender_difference: false`.
- **`pokemon-form.form_name` collides within a species — caught on the first full run.**
  DB row counts came back 5 short of `forms.json`'s row count after seeding; `INSERT OR
  IGNORE` had silently deduped 5 `(species_id, form_name)` collisions. Root cause: a
  species with multiple already-distinct base formes that each *also* have a Gmax/Mega
  variant gets form_name `"gmax"`/`"mega"` on every one of those variants, not a
  qualified name — confirmed live for `toxtricity-amped-gmax` and
  `toxtricity-low-key-gmax` (both `form_name: "gmax"`), `urshifu-single-strike-gmax`/
  `urshifu-rapid-strike-gmax`, and all three `tatsugiri-*-mega` variants. Fixed by
  deriving the stored `form_name` from the variety's own PokeAPI pokemon slug (which
  *is* unique per species — that's how varieties are enumerated) with the
  `"<species-slug>-"` prefix stripped, instead of trusting `pokemon-form.form_name`
  verbatim (`formNameFromVariety` in the script). `pokemon-form.form_name` is still used
  for the regional-group exact-match check and the battle-only/version-group signals,
  which aren't affected by this collision.
- **version_group → generation** table (32 entries) was fetched once during planning
  from `/version-group?limit=50` + each entry's `.generation`, and hardcoded into the
  script as `VERSION_GROUP_GENERATION` rather than re-fetched per form at runtime.

## Rules (as implemented in `scripts/fetch-pokemon-forms.ts`)

1. `is_battle_only === true` → `non_boxable`.
2. Else, `form_name` is an exact regional token OR types/stats differ from the
   species' default variety → `dex_distinct`.
3. Else → `cosmetic_variant`.
4. `regional_group` is set whenever `form_name` exactly equals
   `alola`/`galar`/`hisui`/`paldea` (independent of category, though in practice every
   regional form is also dex_distinct).
5. `has_gender_difference` = that variety's own `sprites.front_female !== null`.
6. `first_available_generation`: default variety reuses `species.generation`;
   non-default varieties resolve via `VERSION_GROUP_GENERATION[version_group.name]`.
7. The default variety's `form_name` is always stored as `'base'` (matches the Leg 1
   seed convention) regardless of what PokeAPI's actual default-variety slug is.

## Design decision: Mega/Gmax forms get a row, not exclusion

ChoiceBuds' `useSpeciesRoster.ts` excludes Mega Evolution from its roster entirely
(item-driven, not a separate slot pick). PremierDex's schema already has a
`non_boxable` `form_category` value, which only makes sense if non-boxable forms are
meant to get rows (otherwise why enumerate the value at all) — so Mega/Gmax/battle-only
forms get a `forms` row with `form_category: 'non_boxable'` rather than being omitted.
A future UI leg can filter on that category to hide them from the ownable grid without
the data layer needing to know about UI concerns.

## User-confirmed choice

Presented three options (stat/type-diff heuristic; treat every non-battle-only variety
as dex_distinct; fully manual per-species curation) via AskUserQuestion during planning.
User picked the stat/type-diff heuristic. A small `OVERRIDES` map in the script is the
escape hatch for anything a post-generation spot-check finds wrong — it starts empty.

## Spot-check results

See COMPLETED.md for the date this leg shipped; the postmortem for that leg records
whether the spot-check (regional forms, Mega/Gmax, Rotom/Deoxys/Giratina/Wormadam/
Shaymin/Basculin/Zygarde/Necrozma, Pikachu caps/Vivillon) turned up anything the
heuristic got wrong and needed an override for.
