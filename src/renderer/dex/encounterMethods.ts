import type { EncounterRow } from './encountersFormat'

/**
 * Method categories for the Dex Locations pane, which shows one table per category (Wild,
 * Surfing, Fishing, ...) instead of one long mixed list. PokeAPI has ~65 method slugs; the
 * common ones are mapped explicitly and anything unlisted (gifts, snags, statics, raids, NPC
 * trades, the "-special" overworld variants) falls into "Special" rather than silently
 * landing in Wild.
 */
export interface MethodCategory {
  key: string
  label: string
}

const WILD: MethodCategory = { key: 'wild', label: 'Wild' }
const SURFING: MethodCategory = { key: 'surfing', label: 'Surfing' }
const FISHING: MethodCategory = { key: 'fishing', label: 'Fishing' }
const HEADBUTT: MethodCategory = { key: 'headbutt', label: 'Headbutt Trees' }
const ROCK_SMASH: MethodCategory = { key: 'rock-smash', label: 'Rock Smash' }
const SPECIAL: MethodCategory = { key: 'special', label: 'Special' }

/** Table order. */
export const METHOD_CATEGORIES: MethodCategory[] = [WILD, SURFING, FISHING, HEADBUTT, ROCK_SMASH, SPECIAL]

const CATEGORY_BY_METHOD = new Map<string, MethodCategory>()
const assign = (category: MethodCategory, slugs: string[]): void => slugs.forEach((s) => CATEGORY_BY_METHOD.set(s, category))

assign(WILD, [
  'walk', 'dark-grass', 'grass-spots', 'red-flowers', 'yellow-flowers', 'purple-flowers', 'rough-terrain',
  'cave-spots', 'bridge-spots', 'horde', 'sos', 'overworld', 'overworld-dirt', 'overworld-flying',
  'roaming-grass', 'wanderer', 'ground-ambush', 'ceiling-ambush', 'sky-ambush', 'rustling-bush-ambush'
])
assign(SURFING, [
  'surf', 'surf-spots', 'overworld-water', 'wanderer-water', 'roaming-water', 'chase-water', 'seaweed',
  'bubbling-spots', 'sos-from-bubbling-spot'
])
assign(FISHING, ['old-rod', 'good-rod', 'super-rod', 'super-rod-spots', 'feebas-tile-fishing'])
assign(HEADBUTT, ['headbutt', 'headbutt-low', 'headbutt-normal', 'headbutt-high'])
assign(ROCK_SMASH, ['rock-smash'])

export function methodCategory(methodSlug: string): MethodCategory {
  return CATEGORY_BY_METHOD.get(methodSlug) ?? SPECIAL
}

export interface MethodTable<T> {
  category: MethodCategory
  /** Entries with at least one row in this category, in input order, rows narrowed to it. */
  entries: Array<T & { rows: EncounterRow[] }>
}

/** Splits species entries' rows into per-category tables, omitting empty categories. */
export function splitByMethodCategory<T extends { rows: EncounterRow[] }>(entries: T[]): Array<MethodTable<T>> {
  const tables: Array<MethodTable<T>> = []
  for (const category of METHOD_CATEGORIES) {
    const inCategory: Array<T & { rows: EncounterRow[] }> = []
    for (const entry of entries) {
      const rows = entry.rows.filter((r) => r.category === category.key)
      if (rows.length > 0) inCategory.push({ ...entry, rows })
    }
    if (inCategory.length > 0) tables.push({ category, entries: inCategory })
  }
  return tables
}
