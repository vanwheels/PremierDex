import { capitalizeWords } from './formNames'

/** PokeAPI stat slugs, in the conventional display order, mapped to their display label. */
const STAT_DISPLAY_NAMES: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Attack',
  'special-defense': 'Sp. Defense',
  speed: 'Speed'
}

const STAT_ORDER = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']

export interface EvYieldEntry {
  stat: string
  label: string
  value: number
}

/** FormDetailEntry.evYield omits stats with zero effort rather than storing 0 (see
 * species-details.ts) — this restores conventional stat order and attaches a display
 * label, so SpeciesPage doesn't need to know PokeAPI's stat slugs. */
export function formatEvYield(evYield: Record<string, number>): EvYieldEntry[] {
  return STAT_ORDER.filter((stat) => evYield[stat]).map((stat) => ({
    stat,
    label: STAT_DISPLAY_NAMES[stat] ?? capitalizeWords(stat.replace(/-/g, ' ')),
    value: evYield[stat]
  }))
}

/** Converts PokeAPI's raw gender_rate encoding (-1 genderless, else eighths female) into a
 * display string. Every non-genderless value is a multiple of 12.5, which is exactly
 * representable in floating point, so no rounding/formatting is needed. */
export function formatGenderRatio(genderRate: number): string {
  if (genderRate === -1) return 'Genderless'
  const femalePercent = (genderRate / 8) * 100
  const malePercent = 100 - femalePercent
  return `${malePercent}% Male, ${femalePercent}% Female`
}

/** Renders a PokeAPI slug (growth rate name or ability name) as its display name — same
 * hyphen-to-space convention as formDisplayName's own forme-name rendering. */
export function slugDisplayName(slug: string): string {
  return capitalizeWords(slug.replace(/-/g, ' '))
}
