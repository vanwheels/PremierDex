/**
 * Turns one PokeAPI evolution_details entry into a short human-readable method string (e.g.
 * "Level 16", "Thunder Stone", "220 friendship + level up") for fetch-evolution-chains.ts's
 * evolution-edges.json output.
 *
 * Built against every (trigger, condition-fields) combination actually seen across all 540
 * live evolution chains (surveyed 2026-09-22), not assumed from memory or PokeAPI's docs —
 * see docs/investigations/evolution-method-strings.md for the survey and the phrasing
 * decisions below. Two systematic rules drive most of the output, rather than one hand-tuned
 * sentence per species:
 *   - A trigger gets a headline (`Level {n}` for level-up's min_level, an item's own name for
 *     use-item, `Trade` for trade, etc.), and every other condition field present
 *     (friendship, held item, location, known move, time of day, ...) becomes a `+`-joined
 *     clause appended after it. A level-up evolution with no min_level (pure-friendship
 *     evolutions like Golbat -> Crobat) has no headline, so the trailing literal `level up`
 *     clause takes its place instead — "220 friendship + level up".
 *   - `gender` is the one condition that reads as a qualifier rather than a requirement
 *     clause, so it's appended as a trailing "(male)"/"(female)" instead of another `+`
 *     clause (e.g. "Dawn Stone (male)" for Kirlia -> Gallade, not "Dawn Stone + male").
 * A field this project's live chains never populate (e.g. `min_move_count` without
 * `used_move`) isn't handled — this isn't meant to cover PokeAPI's full schema, only what's
 * actually reachable from /evolution-chain today.
 */

export interface PokeApiEvolutionDetail {
  trigger: { name: string } | null
  item: { name: string } | null
  held_item: { name: string } | null
  min_level: number | null
  min_happiness: number | null
  min_beauty: number | null
  min_affection: number | null
  min_steps: number | null
  min_move_count: number | null
  min_damage_taken: number | null
  gender: number | null
  time_of_day: string
  known_move: { name: string } | null
  known_move_type: { name: string } | null
  location: { name: string } | null
  party_species: { name: string } | null
  party_type: { name: string } | null
  trade_species: { name: string } | null
  used_move: { name: string } | null
  relative_physical_stats: number | null
  near_special_rock: boolean
  needs_overworld_rain: boolean
  needs_multiplayer: boolean
  turn_upside_down: boolean
  condition_expression: { percentage_chance: number } | null
  required_pokemon_form: { name: string; url: string } | null
  evolved_pokemon_form: { name: string; url: string } | null
}

/** A handful of PokeAPI slugs whose mechanical title-case doesn't match the real in-game
 * name (an apostrophe, or a fixed hyphenation) — everything else title-cases cleanly. */
const NAME_OVERRIDES: Record<string, string> = {
  'kings-rock': "King's Rock",
  'up-grade': 'Up-Grade'
}

const MINOR_WORDS = new Set(['of', 'the', 'a'])

/** Converts a PokeAPI slug (item/move/location/species/type name) to its display form —
 * title-cased word by word, except minor words like "of" that stay lowercase mid-phrase
 * (`scroll-of-darkness` -> "Scroll of Darkness"), with NAME_OVERRIDES taking priority. */
function formatName(slug: string): string {
  if (NAME_OVERRIDES[slug]) return NAME_OVERRIDES[slug]
  return slug
    .split('-')
    .map((word, i) => (i > 0 && MINOR_WORDS.has(word) ? word : word[0].toUpperCase() + word.slice(1)))
    .join(' ')
}

const TIME_OF_DAY_PHRASE: Record<string, string> = {
  day: 'during the day',
  night: 'at night',
  dusk: 'at dusk',
  'full-moon': 'during a full moon'
}

const RELATIVE_STATS_PHRASE: Record<string, string> = {
  '1': 'Attack > Defense',
  '0': 'Attack = Defense',
  '-1': 'Attack < Defense'
}

const GENDER_SUFFIX: Record<string, string> = { '1': 'female', '2': 'male' }

/** Trigger names with a fixed, species-specific mechanic that no combination of the generic
 * condition fields captures — PokeAPI doesn't model these any further, so the phrase is
 * hand-written per trigger rather than derived. */
const CANNED_TRIGGER_PHRASE: Record<string, string> = {
  shed: 'Empty party slot + spare Poké Ball',
  spin: 'Spin while holding a Sweet',
  'tower-of-darkness': 'Tower of Darkness (Sword only)',
  'tower-of-waters': 'Tower of Waters (Shield only)',
  'three-critical-hits': 'Land 3 critical hits in one battle',
  'three-defeated-bisharp': "Defeat 3 Bisharp holding Leader's Crest",
  'meltan-candies': 'Feed 400 Meltan Candy',
  'gimmighoul-coins': 'Collect 999 Gimmighoul Coins'
}

/** Every condition field except gender (handled separately as a trailing qualifier) and the
 * fields consumed elsewhere (min_level/item/used_move/min_move_count/min_damage_taken, which
 * become a trigger's headline, and required/evolved_pokemon_form, which only affect edge
 * bucketing) — in the order they read best joined with " + ". */
function genericConditions(d: PokeApiEvolutionDetail): string[] {
  const parts: string[] = []
  if (d.min_happiness != null) parts.push(`${d.min_happiness} friendship`)
  if (d.min_affection != null) parts.push(`${d.min_affection} affection`)
  if (d.min_beauty != null) parts.push(`${d.min_beauty} beauty`)
  if (d.time_of_day) parts.push(TIME_OF_DAY_PHRASE[d.time_of_day] ?? d.time_of_day)
  if (d.known_move) parts.push(`knows ${formatName(d.known_move.name)}`)
  if (d.known_move_type) parts.push(`knows a ${formatName(d.known_move_type.name)} move`)
  if (d.location) parts.push(`at ${formatName(d.location.name)}`)
  if (d.held_item) parts.push(`holding ${formatName(d.held_item.name)}`)
  if (d.trade_species) parts.push(`for ${formatName(d.trade_species.name)}`)
  if (d.relative_physical_stats != null) {
    parts.push(RELATIVE_STATS_PHRASE[String(d.relative_physical_stats)] ?? `stat ratio ${d.relative_physical_stats}`)
  }
  if (d.party_species) parts.push(`with ${formatName(d.party_species.name)} in the party`)
  if (d.party_type) parts.push(`with a ${formatName(d.party_type.name)}-type Pokémon in the party`)
  if (d.near_special_rock) parts.push('near a special rock')
  if (d.needs_overworld_rain) parts.push('while raining')
  if (d.turn_upside_down) parts.push('with the console turned upside down')
  if (d.needs_multiplayer) parts.push('in multiplayer')
  if (d.min_steps != null) parts.push(`${d.min_steps} steps walked`)
  if (d.condition_expression) parts.push(`${d.condition_expression.percentage_chance}% chance`)
  return parts
}

/** Formats one evolution_details entry into its headline (the trigger-driven lead clause)
 * plus the generic conditions, trigger by trigger. */
function formatBody(d: PokeApiEvolutionDetail): string {
  const trigger = d.trigger?.name ?? 'other'
  const conditions = genericConditions(d)

  switch (trigger) {
    case 'level-up':
    case 'in-battle-level-up':
      if (d.min_level != null) return [`Level ${d.min_level}`, ...conditions].join(' + ')
      if (conditions.length > 0) return [...conditions, 'level up'].join(' + ')
      return 'Level up'
    case 'use-item':
      return [formatName(d.item?.name ?? 'item'), ...conditions].join(' + ')
    case 'trade':
      return ['Trade', ...conditions].join(' + ')
    case 'take-damage':
      return [`Take ${d.min_damage_taken ?? '?'} damage`, ...conditions].join(' + ')
    case 'recoil-damage':
      return [`Take ${d.min_damage_taken ?? '?'} recoil damage`, ...conditions].join(' + ')
    case 'use-move':
    case 'agile-style-move':
    case 'strong-style-move': {
      const move = formatName(d.used_move?.name ?? 'move')
      const style = trigger === 'agile-style-move' ? ' as an Agile Style move' : trigger === 'strong-style-move' ? ' as a Strong Style move' : ''
      return [`Use ${move}${style} ${d.min_move_count ?? '?'} times`, ...conditions].join(' + ')
    }
    default:
      if (CANNED_TRIGGER_PHRASE[trigger]) return [CANNED_TRIGGER_PHRASE[trigger], ...conditions].join(' + ')
      return [formatName(trigger), ...conditions].join(' + ')
  }
}

/** Formats one evolution_details entry into its full display string, including the trailing
 * gender qualifier (`Dawn Stone (male)`) when the entry is gender-gated. */
export function formatEvolutionMethod(d: PokeApiEvolutionDetail): string {
  const body = formatBody(d)
  const genderSuffix = d.gender != null ? GENDER_SUFFIX[String(d.gender)] : null
  return genderSuffix ? `${body} (${genderSuffix})` : body
}
