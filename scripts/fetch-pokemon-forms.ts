/**
 * Fetches per-form data (varieties, categorization, gender differences, regional
 * grouping, first-available generation) for every species in data/pokemon/species.json
 * and writes data/pokemon/forms.json (committed static data, loaded at runtime by
 * src/main/storage/load-species-data.ts).
 *
 * Classification rules (see TODO.md's "Form categorization data pass" leg and
 * docs/investigations/form-categorization.md for the full rationale, verified against
 * live PokeAPI responses rather than assumed from memory):
 *   - non_boxable: pokemon-form.is_battle_only === true (Mega, Primal, Gigantamax, Zen
 *     Mode, Ash-Greninja, Eternamax, and similar auto-reverting forms).
 *   - dex_distinct: not battle-only, and either its form_name is an exact regional token
 *     (alola/galar/hisui/paldea) or its types/stats differ from the species' default
 *     variety (Rotom, Deoxys, Wormadam, Giratina, Basculin's ability differences don't
 *     count — only type/stat diffs do, but every real alternate forme also differs in at
 *     least one of those).
 *   - cosmetic_variant: not battle-only, types and stats identical to the default variety
 *     (Vivillon patterns, Pikachu cap/cosplay forms, Alcremie, Unown, Furfrou trims).
 *   - regional_group: set when form_name exactly equals alola/galar/hisui/paldea, OR when
 *     it's hyphen-prefixed by one of those tokens (paldea-combat-breed, galar-standard)
 *     AND the variety differs in types/stats from the default — i.e. it also qualifies as
 *     dex_distinct on its own. That second clause is what keeps pikachu-alola-cap (same
 *     prefix, but identical types/stats — a cosmetic cap, not a regional forme) correctly
 *     excluded without hardcoding a species exception list. See
 *     resolveRegionalGroup below.
 *   - has_gender_difference: sprites.front_female is set AND differs from
 *     sprites.front_default on that variety's own /pokemon/{name} response (per-form,
 *     not just per-species). Not just non-null: PokeAPI duplicates front_default into
 *     front_female for strictly single-gender species like Wormadam (always female)
 *     rather than leaving it null.
 *   - first_available_generation: the default variety reuses species.generation
 *     (already correct); non-default varieties look up pokemon-form.version_group.name
 *     in VERSION_GROUP_GENERATION below.
 *   - The default variety's form_name stays 'base', matching the Leg 1 seed convention.
 *     Non-default varieties store the variety's own pokemon slug with the species-name
 *     prefix stripped, NOT pokemon-form.form_name verbatim: form_name collides within a
 *     species that has multiple already-distinct base formes each with their own
 *     Gmax/Mega (Toxtricity Amped/Low Key, Urshifu Single/Rapid Strike, Tatsugiri
 *     Curly/Droopy/Stretchy all report form_name "gmax"/"mega" on every variant).
 *   - A small set of varieties are excluded entirely (no forms.json row at all), rather
 *     than categorized non_boxable: Totem Pokemon (in-game boss encounters, not
 *     catchable), Let's Go Pikachu/Eevee's `starter` form (can't transfer out of Let's
 *     Go into Home), and Koraidon/Miraidon's ride-mode varieties (an in-game S/V
 *     traversal feature, not a persistent Pokemon state). See `isExcludedVariety` below
 *     and docs/investigations/home-depositability-audit.md section 1.
 *   - homeBoxable defaults to true and is not derivable from any PokeAPI signal — Home's
 *     deposit support lags game releases, so it's a hand-maintained OVERRIDES fact, not
 *     part of the heuristic above. See docs/investigations/home-depositability-audit.md
 *     section 2 for the current false entries and their sourcing.
 *   - shinyLocked defaults to false and, like homeBoxable, is not derivable from any
 *     PokeAPI signal — it's a hand-maintained fact sourced against Serebii/Bulbapedia,
 *     applied via the separate SHINY_LOCKED set below (kept apart from OVERRIDES since
 *     it's a plain set of locked keys, not a field-override map). See
 *     docs/investigations/shiny-locked-audit.md for the definition (a species/form is
 *     locked only when no legitimate shiny has EVER existed by any means, not "is it
 *     currently obtainable") and the per-form sourcing.
 *   - A minority of species (Unown, Vivillon, Flabébé/Floette/Florges, Furfrou,
 *     Alcremie, Poltchageist/Sinistcha — confirmed live 2026-09-02) express their
 *     cosmetic sub-forms as multiple pokemon-form entries under one variety instead of
 *     as separate varieties (detected generically off defaultPokemon.forms.length > 1,
 *     not a hardcoded species list — see fetchDefaultVarietySubForms below). Their
 *     sub-forms' sprite files aren't keyed by the sub-form's own PokeAPI id (that id is
 *     unrelated to the sprite path); the CDN instead keys them
 *     "{basePokemonId}-{form_name}.png", so pokeapiId stays the shared base pokemon id
 *     across all of a species' sub-forms and the suffix is stored separately as
 *     spriteFormSuffix (null for every form that isn't one of these — see sprites.ts).
 *     See docs/investigations/home-depositability-audit.md section 3.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

interface SeedSpecies {
  id: number
  name: string
  generation: number
}

interface SeedForm {
  speciesId: number
  formName: string
  formCategory: 'dex_distinct' | 'cosmetic_variant' | 'non_boxable'
  /** Whether Pokemon Home currently accepts this form into a box — distinct from
   * formCategory, which is derived from PokeAPI's is_battle_only and doesn't capture
   * this. A form can be a real, catchable, non-battle-only dex_distinct forme (so it
   * belongs in the dex) that Home simply hasn't added deposit support for yet — Home's
   * support lags game releases and isn't encoded in PokeAPI at all, so this is always
   * `true` except where OVERRIDES says otherwise (see docs/investigations/
   * home-depositability-audit.md section 2 for the current list and sourcing). */
  homeBoxable: boolean
  hasGenderDifference: boolean
  firstAvailableGeneration: number
  regionalGroup: 'alolan' | 'galarian' | 'hisuian' | 'paldean' | null
  /** PokeAPI's own numeric pokemon id — the sprite CDN's file-naming key (see
   * src/renderer/dex/sprites.ts). Equal to species.id for the base form; an unrelated
   * id (10001+) for alternate varieties; shared across sibling sub-forms for species
   * covered by spriteFormSuffix below. */
  pokeapiId: number
  /** Non-null only for a cosmetic sub-form sharing its pokeapiId with siblings (Unown's
   * letters, Vivillon's patterns, etc.) — see the module doc comment and sprites.ts. */
  spriteFormSuffix: string | null
  /** True when no legitimate shiny of this species/form has ever existed by any means —
   * like homeBoxable, not derivable from any PokeAPI signal, so this is always `false`
   * except where SHINY_LOCKED below says otherwise. See
   * docs/investigations/shiny-locked-audit.md for the definition and per-form sourcing. */
  shinyLocked: boolean
}

interface PokeApiSpeciesResponse {
  varieties: Array<{ is_default: boolean; pokemon: { name: string; url: string } }>
}

interface PokeApiPokemonResponse {
  id: number
  types: Array<{ type: { name: string } }>
  stats: Array<{ base_stat: number }>
  sprites: { front_default: string | null; front_female: string | null }
  forms: Array<{ url: string }>
}

interface PokeApiFormResponse {
  form_name: string
  is_battle_only: boolean
  is_default: boolean
  version_group: { name: string }
  types: Array<{ type: { name: string } }>
  sprites: { front_default: string | null; front_female: string | null }
}

/** speciesId:formName -> field overrides, applied after the heuristic below. Also the
 * home-depositability escape hatch: PokeAPI has no signal at all for "does Home
 * currently accept this form," so every entry below sets homeBoxable: false by hand,
 * sourced against Serebii's depositable-species list (see
 * docs/investigations/home-depositability-audit.md section 2, verified 2026-09-01).
 * Minior's 7 core-color formes were checked live against PokeAPI's raw response before
 * being added here (is_battle_only is false for minior-red et al., confirming this is a
 * genuine Home-support gap rather than a bug in the is_battle_only heuristic). */
const OVERRIDES: Record<string, Partial<SeedForm>> = {
  '483:origin': { homeBoxable: false }, // Dialga
  '484:origin': { homeBoxable: false }, // Palkia
  '487:origin': { homeBoxable: false }, // Giratina
  '800:dusk': { homeBoxable: false }, // Necrozma Dusk Mane
  '800:dawn': { homeBoxable: false }, // Necrozma Dawn Wings
  '898:ice': { homeBoxable: false }, // Calyrex Ice Rider
  '898:shadow': { homeBoxable: false }, // Calyrex Shadow Rider
  '1017:wellspring-mask': { homeBoxable: false }, // Ogerpon
  '1017:hearthflame-mask': { homeBoxable: false },
  '1017:cornerstone-mask': { homeBoxable: false },
  '774:red': { homeBoxable: false }, // Minior core colors
  '774:orange': { homeBoxable: false },
  '774:yellow': { homeBoxable: false },
  '774:green': { homeBoxable: false },
  '774:blue': { homeBoxable: false },
  '774:indigo': { homeBoxable: false },
  '774:violet': { homeBoxable: false }
}

/** speciesId:formName -> shiny-locked, per docs/investigations/shiny-locked-audit.md's
 * confirmed table (2026-09-02, Serebii's shiny-locked page cross-referenced against
 * Bulbapedia). Zacian/Zamazenta are deliberately excluded despite Bulbapedia listing
 * their normal story gift as non-shiny: a legitimate shiny of both was distributed via a
 * past Mystery Gift/serial-code event, and per Vanny's policy call an event's real-world
 * expiration doesn't retroactively lock a species — preserved distribution files mean
 * collectors can still obtain one. Exported so the one-off forms.json migration script
 * (see git history around this leg) can reuse the same list rather than duplicating it. */
export const SHINY_LOCKED: ReadonlySet<string> = new Set([
  '25:original-cap', // Pikachu's event cap forms (not partner-cap, which IS shiny-obtainable in Let's Go)
  '25:hoenn-cap',
  '25:sinnoh-cap',
  '25:unova-cap',
  '25:kalos-cap',
  '25:alola-cap',
  '25:world-cap',
  '494:base', // Victini
  '658:ash', // Ash-Greninja (non_boxable, hidden from the dex view, but still a real fact)
  '666:poke-ball', // Vivillon's Poke Ball pattern only
  '720:base', // Hoopa (Confined and Unbound share the lock — one individual, forme change)
  '720:unbound',
  '801:base', // Magearna
  '801:original',
  '802:base', // Marshadow
  '809:gmax', // Melmetal's Gigantamax factor (non_boxable, hidden, base Melmetal is NOT locked)
  '893:base', // Zarude
  '893:dada',
  '670:eternal', // Floette's Eternal Flower only
  '789:base', // Cosmog
  '790:base', // Cosmoem
  '891:base', // Kubfu
  '892:base', // Urshifu Single Strike (Kubfu's evolution retains the lock either style)
  '892:rapid-strike', // Urshifu Rapid Strike
  '896:base', // Glastrier
  '897:base', // Spectrier
  '898:base', // Calyrex
  '898:ice', // Calyrex Ice Rider (fusion with locked Glastrier)
  '898:shadow', // Calyrex Shadow Rider (fusion with locked Spectrier)
  '901:bloodmoon', // Ursaluna's Bloodmoon form only — base Ursaluna is NOT locked
  '1007:base', // Koraidon
  '1008:base', // Miraidon
  '1009:base', // Walking Wake
  '1010:base', // Iron Leaves
  '1011:base', // Okidogi
  '1012:base', // Munkidori
  '1013:base', // Fezandipiti
  '1017:base', // Ogerpon (all 4 masks share the lock — one individual, held-item forme change)
  '1017:wellspring-mask',
  '1017:hearthflame-mask',
  '1017:cornerstone-mask',
  '1020:base', // Gouging Fire
  '1021:base', // Raging Bolt
  '1022:base', // Iron Boulder
  '1023:base', // Iron Crown
  '1024:base', // Terapagos
  '1025:base' // Pecharunt
])

/** Captured from PokeAPI's /version-group list + each entry's .generation during
 * planning — small and stable enough to hardcode rather than fetch per form. */
const VERSION_GROUP_GENERATION: Record<string, number> = {
  'red-blue': 1,
  yellow: 1,
  'red-green-japan': 1,
  'blue-japan': 1,
  'gold-silver': 2,
  crystal: 2,
  'ruby-sapphire': 3,
  emerald: 3,
  'firered-leafgreen': 3,
  colosseum: 3,
  xd: 3,
  'diamond-pearl': 4,
  platinum: 4,
  'heartgold-soulsilver': 4,
  'black-white': 5,
  'black-2-white-2': 5,
  'x-y': 6,
  'omega-ruby-alpha-sapphire': 6,
  'sun-moon': 7,
  'ultra-sun-ultra-moon': 7,
  'lets-go-pikachu-lets-go-eevee': 7,
  'sword-shield': 8,
  'the-isle-of-armor': 8,
  'the-crown-tundra': 8,
  'brilliant-diamond-shining-pearl': 8,
  'legends-arceus': 8,
  'scarlet-violet': 9,
  'the-teal-mask': 9,
  'the-indigo-disk': 9,
  'legends-za': 9,
  'mega-dimension': 9,
  champions: 9
}

const REGIONAL_GROUPS: Record<string, SeedForm['regionalGroup']> = {
  alola: 'alolan',
  galar: 'galarian',
  hisui: 'hisuian',
  paldea: 'paldean'
}

/**
 * form_name exactly matching a regional token (raichu-alola's form_name is plain "alola")
 * always counts, regardless of type/stat diff — see the module doc comment. A
 * hyphen-prefixed compound name (paldea-combat-breed, galar-standard) only counts when
 * the variety also differs in types/stats from the default, which is what distinguishes
 * those genuine regional formes from a same-stats cosmetic reuse of the prefix like
 * pikachu-alola-cap.
 */
function resolveRegionalGroup(formName: string, typesOrStatsDiffer: boolean): SeedForm['regionalGroup'] {
  const exact = REGIONAL_GROUPS[formName]
  if (exact) return exact
  if (!typesOrStatsDiffer) return null
  return REGIONAL_GROUPS[formName.split('-')[0]] ?? null
}

const CONCURRENCY = 10
const MAX_ATTEMPTS = 3

const KORAIDON_ID = 1007
const MIRAIDON_ID = 1008
const KORAIDON_RIDE_MODES = ['limited-build', 'sprinting-build', 'swimming-build', 'gliding-build']
const MIRAIDON_RIDE_MODES = ['low-power-mode', 'drive-mode', 'aquatic-mode', 'glide-mode']
const LETS_GO_STARTER_SPECIES = [25, 133] // Pikachu, Eevee

/**
 * Varieties that shouldn't occupy a dex slot at all — not "boxable but not yet
 * Home-depositable" (that's non_boxable), just not real, trackable dex entries. See
 * docs/investigations/home-depositability-audit.md section 1:
 *   - Totem Pokemon: in-game boss encounters only, never catchable.
 *   - Let's Go Pikachu/Eevee's `starter` form: can't transfer out of Let's Go into Home.
 *   - Koraidon/Miraidon ride modes: an in-game S/V traversal feature, not a form that
 *     persists as a distinct Pokemon state outside battle.
 */
function isExcludedVariety(speciesId: number, formName: string): boolean {
  if (formName === 'totem' || formName.startsWith('totem-')) return true
  if (LETS_GO_STARTER_SPECIES.includes(speciesId) && formName === 'starter') return true
  if (speciesId === KORAIDON_ID && KORAIDON_RIDE_MODES.includes(formName)) return true
  if (speciesId === MIRAIDON_ID && MIRAIDON_RIDE_MODES.includes(formName)) return true
  return false
}

async function fetchJson<T>(url: string): Promise<T> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`${url} failed: ${res.status} ${res.statusText}`)
      return (await res.json()) as T
    } catch (err) {
      lastErr = err
      if (attempt < MAX_ATTEMPTS) await new Promise((r) => setTimeout(r, 500 * attempt))
    }
  }
  throw lastErr
}

/** Runs `fn` over `items` with at most CONCURRENCY in flight at once. */
async function mapWithConcurrency<T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  async function worker(): Promise<void> {
    while (true) {
      const i = next++
      if (i >= items.length) return
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker))
  return results
}

/**
 * PokeAPI duplicates front_default into front_female for strictly single-gender species
 * (e.g. Wormadam, always female) rather than leaving it null — confirmed live: Wormadam's
 * front_female URL is byte-for-byte the same as its front_default. A distinct female
 * sprite means front_female is set AND differs from front_default, not just non-null.
 */
function hasDistinctFemaleSprite(pokemon: PokeApiPokemonResponse): boolean {
  return pokemon.sprites.front_female !== null && pokemon.sprites.front_female !== pokemon.sprites.front_default
}

/**
 * pokemon-form.form_name is NOT guaranteed unique within a species: a species with
 * multiple already-distinct base formes (e.g. Toxtricity's Amped/Low Key, Urshifu's
 * Single/Rapid Strike, Tatsugiri's Curly/Droopy/Stretchy) that each additionally have a
 * Gmax/Mega variant all get form_name "gmax"/"mega" on those variants — confirmed live,
 * e.g. both toxtricity-amped-gmax and toxtricity-low-key-gmax report form_name "gmax".
 * The variety's own pokemon slug IS guaranteed unique per species (that's how PokeAPI
 * enumerates varieties in the first place), so derive the stored form_name from that —
 * stripping the leading "<species-slug>-" — instead of trusting form_name verbatim.
 */
function formNameFromVariety(speciesSlug: string, varietyPokemonName: string): string {
  const prefix = `${speciesSlug}-`
  return varietyPokemonName.startsWith(prefix) ? varietyPokemonName.slice(prefix.length) : varietyPokemonName
}

function typeNames(types: Array<{ type: { name: string } }>): string[] {
  return types.map((t) => t.type.name).sort()
}

function sameTypesAndStats(a: PokeApiPokemonResponse, b: PokeApiPokemonResponse): boolean {
  const typesA = typeNames(a.types)
  const typesB = typeNames(b.types)
  if (typesA.length !== typesB.length || typesA.some((t, i) => t !== typesB[i])) return false
  if (a.stats.length !== b.stats.length) return false
  return a.stats.every((s, i) => s.base_stat === b.stats[i].base_stat)
}

/** Same as sameTypesAndStats but for a pokemon-form's own `types` (no `stats` field is
 * exposed at that granularity) — used for the cosmetic-sub-form path below, where every
 * known case is purely a palette swap, but the type check stays a real signal rather
 * than an assumption. */
function sameTypes(a: Array<{ type: { name: string } }>, b: Array<{ type: { name: string } }>): boolean {
  const typesA = typeNames(a)
  const typesB = typeNames(b)
  return typesA.length === typesB.length && typesA.every((t, i) => t === typesB[i])
}

async function fetchSpeciesForms(species: SeedSpecies): Promise<SeedForm[]> {
  const speciesData = await fetchJson<PokeApiSpeciesResponse>(
    `https://pokeapi.co/api/v2/pokemon-species/${species.id}`
  )

  const defaultVariety = speciesData.varieties.find((v) => v.is_default) ?? speciesData.varieties[0]
  const defaultPokemon = await fetchJson<PokeApiPokemonResponse>(defaultVariety.pokemon.url)

  const forms: SeedForm[] = []

  if (defaultPokemon.forms.length > 1) {
    forms.push(...(await fetchDefaultVarietySubForms(species, defaultPokemon)))
  } else {
    forms.push(
      applyOverride(species.id, 'base', {
        speciesId: species.id,
        formName: 'base',
        formCategory: 'dex_distinct',
        homeBoxable: true,
        hasGenderDifference: hasDistinctFemaleSprite(defaultPokemon),
        firstAvailableGeneration: species.generation,
        regionalGroup: null,
        pokeapiId: defaultPokemon.id,
        spriteFormSuffix: null,
        shinyLocked: false
      })
    )
  }

  const nonDefaultVarieties = speciesData.varieties.filter((v) => v !== defaultVariety)
  for (const variety of nonDefaultVarieties) {
    // formName is derivable from the variety's own pokemon slug (already in hand from
    // the species response) without fetching it — check exclusion first so excluded
    // varieties (totem, Let's Go starter, Koraidon/Miraidon ride modes) skip the two
    // PokeAPI calls below entirely rather than being fetched and then discarded.
    const formName = formNameFromVariety(species.name, variety.pokemon.name)
    if (isExcludedVariety(species.id, formName)) continue

    const pokemon = await fetchJson<PokeApiPokemonResponse>(variety.pokemon.url)
    const form = await fetchJson<PokeApiFormResponse>(pokemon.forms[0].url)

    const typesOrStatsDiffer = !sameTypesAndStats(pokemon, defaultPokemon)
    const regionalGroup = resolveRegionalGroup(form.form_name, typesOrStatsDiffer)
    const generation =
      VERSION_GROUP_GENERATION[form.version_group.name] ??
      (() => {
        throw new Error(
          `Unknown version_group "${form.version_group.name}" for ${variety.pokemon.name} — add it to VERSION_GROUP_GENERATION`
        )
      })()

    const formCategory: SeedForm['formCategory'] = form.is_battle_only
      ? 'non_boxable'
      : regionalGroup !== null || typesOrStatsDiffer
        ? 'dex_distinct'
        : 'cosmetic_variant'

    forms.push(
      applyOverride(species.id, formName, {
        speciesId: species.id,
        formName,
        formCategory,
        homeBoxable: true,
        hasGenderDifference: hasDistinctFemaleSprite(pokemon),
        firstAvailableGeneration: generation,
        regionalGroup,
        pokeapiId: pokemon.id,
        spriteFormSuffix: null,
        shinyLocked: false
      })
    )
  }

  return forms
}

/**
 * Expands a default variety's multiple pokemon-form entries into one SeedForm each —
 * see the module doc comment above for why a handful of species (Unown, Vivillon, etc.)
 * need this instead of the single 'base' row every other species gets. The is_default
 * sub-form (whichever letter/pattern/color PokeAPI marks default — not necessarily
 * forms[0]) becomes formName 'base' with no sprite suffix, matching the Leg 1 seed
 * convention; every sibling sub-form uses its own form_name for both.
 */
async function fetchDefaultVarietySubForms(
  species: SeedSpecies,
  defaultPokemon: PokeApiPokemonResponse
): Promise<SeedForm[]> {
  const subForms = await mapWithConcurrency(defaultPokemon.forms, (f) => fetchJson<PokeApiFormResponse>(f.url))

  return subForms.map((form) => {
    const hasGenderDifference =
      form.sprites.front_female !== null && form.sprites.front_female !== form.sprites.front_default

    // The is_default sub-form is this species' own base look (Unown-A, Vivillon-Meadow,
    // Alcremie's plain vanilla-strawberry, etc.) — always 'base'/dex_distinct/no
    // suffix, same as every other species' base row, never run through the
    // sibling-vs-base comparison below (which would otherwise compare it to itself and
    // trivially "match", wrongly demoting it to cosmetic_variant and hiding it behind
    // the cosmetic-variant expand toggle instead of showing it as the species' main row).
    if (form.is_default) {
      return applyOverride(species.id, 'base', {
        speciesId: species.id,
        formName: 'base',
        formCategory: 'dex_distinct',
        homeBoxable: true,
        hasGenderDifference,
        firstAvailableGeneration: species.generation,
        regionalGroup: null,
        pokeapiId: defaultPokemon.id,
        spriteFormSuffix: null,
        shinyLocked: false
      })
    }

    const typesOrStatsDiffer = !sameTypes(form.types, defaultPokemon.types)
    const regionalGroup = resolveRegionalGroup(form.form_name, typesOrStatsDiffer)
    const generation =
      VERSION_GROUP_GENERATION[form.version_group.name] ??
      (() => {
        throw new Error(
          `Unknown version_group "${form.version_group.name}" for ${species.name} sub-form ` +
            `"${form.form_name}" — add it to VERSION_GROUP_GENERATION`
        )
      })()

    const formCategory: SeedForm['formCategory'] = form.is_battle_only
      ? 'non_boxable'
      : regionalGroup !== null || typesOrStatsDiffer
        ? 'dex_distinct'
        : 'cosmetic_variant'

    return applyOverride(species.id, form.form_name, {
      speciesId: species.id,
      formName: form.form_name,
      formCategory,
      homeBoxable: true,
      hasGenderDifference,
      firstAvailableGeneration: generation,
      regionalGroup,
      pokeapiId: defaultPokemon.id,
      spriteFormSuffix: form.form_name,
      shinyLocked: false
    })
  })
}

function applyOverride(speciesId: number, formName: string, form: SeedForm): SeedForm {
  const key = `${speciesId}:${formName}`
  return { ...form, ...OVERRIDES[key], shinyLocked: SHINY_LOCKED.has(key) }
}

async function main(): Promise<void> {
  const scriptDir = dirname(fileURLToPath(import.meta.url))
  const dataDir = join(scriptDir, '..', 'data', 'pokemon')
  const species = JSON.parse(readFileSync(join(dataDir, 'species.json'), 'utf-8')) as SeedSpecies[]

  console.log(`Fetching forms for ${species.length} species (concurrency ${CONCURRENCY})...`)
  let done = 0
  const perSpeciesForms = await mapWithConcurrency(species, async (s) => {
    const forms = await fetchSpeciesForms(s)
    done++
    if (done % 100 === 0) console.log(`  ${done}/${species.length} species done`)
    return forms
  })

  const all = perSpeciesForms.flat()
  mkdirSync(dataDir, { recursive: true })
  const outPath = join(dataDir, 'forms.json')
  writeFileSync(outPath, JSON.stringify(all, null, 2) + '\n')

  console.log(`Wrote ${all.length} forms (${species.length} species) to ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
