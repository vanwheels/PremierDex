import type { LearnsetData, LearnsetEntry, LearnsetVersionGroup } from './types/learnsets'

/** The subset of PokeAPI's `/pokemon/{id}` `moves[]` that `parseLearnset` reads. */
export interface PokeApiMoveEntry {
  move: { name: string }
  version_group_details: Array<{
    level_learned_at: number
    version_group: { name: string }
    move_learn_method: { name: string }
  }>
}

/** Japan-only version groups that duplicate red-blue; dropped, same posture as fetch-encounters. */
export const EXCLUDED_VERSION_GROUPS = new Set(['red-green-japan', 'blue-japan'])

/** A learnset entry before names are resolved to indexes: `[move, method, level, versionGroups]`. */
export type RawLearnsetEntry = [string, string, number, string[]]

/** Merges one form's `moves[]` into entries that are identical across version groups. */
export function parseLearnset(moves: PokeApiMoveEntry[]): RawLearnsetEntry[] {
  const merged = new Map<string, RawLearnsetEntry>()
  for (const m of moves) {
    for (const d of m.version_group_details) {
      const versionGroup = d.version_group.name
      if (EXCLUDED_VERSION_GROUPS.has(versionGroup)) continue
      const method = d.move_learn_method.name
      // Level is only meaningful for level-up; PokeAPI reports 0 for the rest anyway.
      const level = d.level_learned_at
      const key = `${m.move.name}|${method}|${level}`
      const existing = merged.get(key)
      if (existing) existing[3].push(versionGroup)
      else merged.set(key, [m.move.name, method, level, [versionGroup]])
    }
  }
  return [...merged.values()]
}

/**
 * Builds the final deduped `LearnsetData` from every form's raw entries. Tables are sorted
 * (moves/methods alphabetically, version groups by PokeAPI order) so the output doesn't depend
 * on the order concurrent fetches finished in.
 */
export function buildLearnsetData(
  rawByForm: Record<number, RawLearnsetEntry[]>,
  versionGroupMeta: Array<LearnsetVersionGroup & { order: number }>
): LearnsetData {
  const moveNames = new Set<string>()
  const methodNames = new Set<string>()
  for (const entries of Object.values(rawByForm)) {
    for (const [move, method] of entries) {
      moveNames.add(move)
      methodNames.add(method)
    }
  }
  const moves = [...moveNames].sort()
  const methods = [...methodNames].sort()
  const sortedGroups = [...versionGroupMeta].sort((a, b) => a.order - b.order)
  const versionGroups = sortedGroups.map(({ name, generation }) => ({ name, generation }))

  const moveIndex = new Map(moves.map((n, i) => [n, i]))
  const methodIndex = new Map(methods.map((n, i) => [n, i]))
  const groupIndex = new Map(versionGroups.map((g, i) => [g.name, i]))
  const lookup = (map: Map<string, number>, name: string, what: string): number => {
    const i = map.get(name)
    if (i === undefined) throw new Error(`Unknown ${what} "${name}" in learnset`)
    return i
  }

  const learnsets: Record<number, LearnsetEntry[]> = {}
  for (const [id, entries] of Object.entries(rawByForm)) {
    learnsets[Number(id)] = entries
      .map(
        ([move, method, level, groups]): LearnsetEntry => [
          lookup(moveIndex, move, 'move'),
          lookup(methodIndex, method, 'method'),
          level,
          groups.map((g) => lookup(groupIndex, g, 'version group')).sort((a, b) => a - b)
        ]
      )
      .sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2])
  }
  return { moves, methods, versionGroups, learnsets }
}
