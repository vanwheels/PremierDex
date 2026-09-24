import type { EncounterDetail } from '@shared/types/encounters'
import { slugDisplayName } from './speciesPageFormat'

/**
 * Condition categories the Dex Locations pane offers as toggles (Encounter display rework
 * Leg 3): the ones where PokeAPI splits the same slot into a small set of mutually exclusive
 * variants (time of day, swarm on/off, radar on/off, GBA dual-slot cartridge, season,
 * weather). The long tail — trades, coins, Safari blocks, story progress — has one-off values
 * per encounter and stays inline in the Conditions column.
 */
interface ConditionCategory {
  key: string
  label: string
  matches: (value: string) => boolean
  /** Display order for known values; unlisted values sort alphabetically after them. */
  order: string[]
}

const TIME_VALUES = ['time-morning', 'time-day', 'time-night']
const prefix = (p: string) => (value: string) => value.startsWith(p)

const CATEGORIES: ConditionCategory[] = [
  { key: 'time', label: 'Time', matches: (v) => TIME_VALUES.includes(v), order: TIME_VALUES },
  { key: 'season', label: 'Season', matches: prefix('season-'), order: ['season-spring', 'season-summer', 'season-autumn', 'season-winter'] },
  { key: 'weather', label: 'Weather', matches: prefix('weather-'), order: ['weather-normal'] },
  { key: 'swarm', label: 'Swarm', matches: prefix('swarm-'), order: ['swarm-no', 'swarm-yes'] },
  { key: 'radar', label: 'PokéRadar', matches: prefix('radar-'), order: ['radar-off', 'radar-on'] },
  { key: 'slot2', label: 'GBA slot', matches: prefix('slot2-'), order: ['slot2-none'] }
]

export interface ConditionToggle {
  key: string
  label: string
  options: Array<{ value: string; label: string }>
}

/** category key -> chosen condition value; a category absent from the map is "All". */
export type ConditionSelection = Record<string, string>

const optionOrder = (category: ConditionCategory, value: string): number => {
  const i = category.order.indexOf(value)
  return i === -1 ? category.order.length : i
}

/** Toggles for a set of details: a category only appears when the details actually vary in it
 * (2+ distinct values), so a location with no time-conditioned encounters shows no time toggle. */
export function conditionTogglesFor(details: EncounterDetail[]): ConditionToggle[] {
  const seen = new Map<string, Set<string>>()
  for (const d of details) {
    for (const value of d.conditionValues) {
      const category = CATEGORIES.find((c) => c.matches(value))
      if (!category) continue
      let values = seen.get(category.key)
      if (!values) {
        values = new Set()
        seen.set(category.key, values)
      }
      values.add(value)
    }
  }
  const toggles: ConditionToggle[] = []
  for (const category of CATEGORIES) {
    const values = seen.get(category.key)
    if (!values || values.size < 2) continue
    const sorted = [...values].sort((a, b) => optionOrder(category, a) - optionOrder(category, b) || a.localeCompare(b))
    toggles.push({
      key: category.key,
      label: category.label,
      options: sorted.map((value) => ({ value, label: slugDisplayName(value.slice(value.indexOf('-') + 1)) }))
    })
  }
  return toggles
}

/** Keeps the details that apply under the selection: for each selected category a detail must
 * either be unconditioned in it or carry the chosen value. The selected values are stripped
 * from the survivors' conditions, so the Conditions column doesn't repeat what the toggle says. */
export function applyConditionSelection(details: EncounterDetail[], selection: ConditionSelection): EncounterDetail[] {
  const chosen = CATEGORIES.filter((c) => selection[c.key] !== undefined)
  if (chosen.length === 0) return details
  const out: EncounterDetail[] = []
  for (const d of details) {
    let keep = true
    for (const category of chosen) {
      const inCategory = d.conditionValues.filter(category.matches)
      if (inCategory.length > 0 && !inCategory.includes(selection[category.key])) {
        keep = false
        break
      }
    }
    if (!keep) continue
    out.push({ ...d, conditionValues: d.conditionValues.filter((v) => !chosen.some((c) => c.matches(v))) })
  }
  return out
}
