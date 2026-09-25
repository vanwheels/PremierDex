import type { FormAbility, FormDetailEntry } from './types/species-details'

/** The subset of PokeAPI's `/pokemon/{id}` response that `parseFormDetails` reads. */
export interface PokeApiPokemonResponse {
  abilities: Array<{ ability: { name: string; url: string }; is_hidden: boolean; slot: number }>
  stats: Array<{ stat: { name: string }; base_stat: number; effort: number }>
  types: Array<{ slot: number; type: { name: string } }>
  past_types: Array<{ generation: { url: string }; types: Array<{ slot: number; type: { name: string } }> }>
  past_stats: Array<{
    generation: { url: string }
    stats: Array<{ base_stat: number; effort: number; stat: { name: string } }>
  }>
  past_abilities: Array<{
    generation: { url: string }
    abilities: Array<{ ability: { name: string; url: string } | null; is_hidden: boolean; slot: number }>
  }>
}

export interface AbilityRef {
  name: string
  url: string
}

/** PokeAPI resource URLs end in .../generation/{n}/ */
function generationFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/)
  if (!match) throw new Error(`Could not parse generation from PokeAPI url: ${url}`)
  return Number(match[1])
}

function bySlot<T extends { slot: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.slot - b.slot)
}

/**
 * Turns one `/pokemon/{id}` response into a FormDetailEntry plus every ability it references
 * (current and past) so the caller can fetch their descriptions for the `abilities` dedupe table.
 */
export function parseFormDetails(data: PokeApiPokemonResponse): { entry: FormDetailEntry; abilityRefs: AbilityRef[] } {
  const abilityRefs = new Map<string, string>()
  for (const a of data.abilities) abilityRefs.set(a.ability.name, a.ability.url)

  const evYield: Record<string, number> = {}
  const baseStats: Record<string, number> = {}
  for (const s of data.stats) {
    baseStats[s.stat.name] = s.base_stat
    if (s.effort > 0) evYield[s.stat.name] = s.effort
  }

  const entry: FormDetailEntry = {
    abilities: data.abilities.map((a) => ({ name: a.ability.name, isHidden: a.is_hidden, slot: a.slot })),
    evYield,
    types: bySlot(data.types.map((t) => ({ slot: t.slot, name: t.type.name }))).map((t) => t.name),
    baseStats
  }

  if (data.past_types.length > 0) {
    entry.pastTypes = data.past_types
      .map((p) => ({
        untilGeneration: generationFromUrl(p.generation.url),
        types: bySlot(p.types.map((t) => ({ slot: t.slot, name: t.type.name }))).map((t) => t.name)
      }))
      .sort((a, b) => a.untilGeneration - b.untilGeneration)
  }

  if (data.past_stats.length > 0) {
    entry.pastStats = data.past_stats
      .map((p) => {
        const past: NonNullable<FormDetailEntry['pastStats']>[number] = {
          untilGeneration: generationFromUrl(p.generation.url),
          stats: Object.fromEntries(p.stats.map((s) => [s.stat.name, s.base_stat]))
        }
        // Gen I's single `special` stat has no EV yield.
        const evStats = p.stats.filter((s) => s.stat.name !== 'special')
        if (evStats.length > 0) past.evYield = Object.fromEntries(evStats.map((s) => [s.stat.name, s.effort]))
        return past
      })
      .sort((a, b) => a.untilGeneration - b.untilGeneration)
  }

  if (data.past_abilities.length > 0) {
    entry.pastAbilities = data.past_abilities
      .map((p) => ({
        untilGeneration: generationFromUrl(p.generation.url),
        abilities: p.abilities.map((a) => {
          if (a.ability) abilityRefs.set(a.ability.name, a.ability.url)
          return { slot: a.slot, name: a.ability?.name ?? null, isHidden: a.is_hidden }
        })
      }))
      .sort((a, b) => a.untilGeneration - b.untilGeneration)
  }

  return { entry, abilityRefs: [...abilityRefs].map(([name, url]) => ({ name, url })) }
}

export interface FormAtGeneration {
  types: string[]
  /** Six modern stats, plus `special` (which supersedes special-attack/special-defense) for
   * Gen I. */
  baseStats: Record<string, number>
  /** Same shape as FormDetailEntry.evYield (zero-effort stats omitted). */
  evYield: Record<string, number>
  abilities: FormAbility[]
}

/**
 * The form's types, base stats and abilities as they were in `generation`. Past entries apply
 * to every generation up to and including their `untilGeneration`, so for a given generation
 * we take the entries with `untilGeneration >= generation` and layer them latest-first — the
 * entry closest to `generation` is the most specific and must win (Pikachu in Gen I gets
 * Gen V's Defense/Sp. Def diff AND Gen I's Special diff).
 */
export function resolveFormAtGeneration(form: FormDetailEntry, generation: number): FormAtGeneration {
  const applicable = <T extends { untilGeneration: number }>(entries: T[] | undefined): T[] =>
    (entries ?? []).filter((e) => e.untilGeneration >= generation).sort((a, b) => b.untilGeneration - a.untilGeneration)

  const types = applicable(form.pastTypes).at(-1)?.types ?? form.types

  const baseStats = { ...form.baseStats }
  const evYield = { ...form.evYield }
  for (const entry of applicable(form.pastStats)) {
    Object.assign(baseStats, entry.stats)
    for (const [name, effort] of Object.entries(entry.evYield ?? {})) {
      if (effort > 0) evYield[name] = effort
      else delete evYield[name]
    }
  }

  const slots = new Map(form.abilities.map((a) => [a.slot, a]))
  for (const entry of applicable(form.pastAbilities)) {
    for (const a of entry.abilities) {
      if (a.name === null) slots.delete(a.slot)
      else slots.set(a.slot, { name: a.name, isHidden: a.isHidden, slot: a.slot })
    }
  }

  return { types, baseStats, evYield, abilities: bySlot([...slots.values()]) }
}
