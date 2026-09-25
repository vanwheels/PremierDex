import type { MoveData, MoveEntry, MovePastValue } from './types/moves'

interface PokeApiFlavorTextEntry {
  flavor_text: string
  language: { name: string }
}

interface PokeApiEffectEntry {
  short_effect: string
  language: { name: string }
}

/** The subset of PokeAPI's `/move/{name}` that `parseMove` reads. */
export interface PokeApiMoveResponse {
  name: string
  names: Array<{ name: string; language: { name: string } }>
  flavor_text_entries: PokeApiFlavorTextEntry[]
  type: { name: string }
  damage_class: { name: string }
  power: number | null
  accuracy: number | null
  pp: number | null
  effect_chance: number | null
  effect_entries: PokeApiEffectEntry[]
  past_values: Array<{
    type: { name: string } | null
    power: number | null
    accuracy: number | null
    pp: number | null
    effect_chance: number | null
    effect_entries: PokeApiEffectEntry[]
    version_group: { name: string }
  }>
}

function englishTemplate(entries: PokeApiEffectEntry[]): string | null {
  return entries.find((e) => e.language.name === 'en')?.short_effect ?? null
}

/** Newest English flavor text (PokeAPI lists entries oldest version group first), with the
 * in-game line breaks collapsed to spaces. Only used when a move has no `effect_entries`. */
function latestEnglishFlavorText(entries: PokeApiFlavorTextEntry[]): string | null {
  const en = entries.filter((e) => e.language.name === 'en')
  if (en.length === 0) return null
  return en[en.length - 1].flavor_text.replace(/\s+/g, ' ').trim()
}

/** PokeAPI effect text embeds the chance as `$effect_chance` (e.g. "Has a $effect_chance% chance to..."). */
function renderEffect(template: string, effectChance: number | null): string {
  if (!template.includes('$effect_chance')) return template
  if (effectChance === null) throw new Error(`Effect text "${template}" has $effect_chance but no effect_chance`)
  return template.replace(/\$effect_chance/g, String(effectChance))
}

export function parseMove(data: PokeApiMoveResponse): MoveEntry {
  const template = englishTemplate(data.effect_entries)
  const displayName = data.names.find((n) => n.language.name === 'en')?.name
  if (!displayName) throw new Error(`Move ${data.name} has no English name`)
  const entry: MoveEntry = {
    name: displayName,
    type: data.type.name,
    damageClass: data.damage_class.name,
    power: data.power,
    accuracy: data.accuracy,
    pp: data.pp,
    effect:
      template === null
        ? latestEnglishFlavorText(data.flavor_text_entries)
        : renderEffect(template, data.effect_chance)
  }
  const pastValues: MovePastValue[] = []
  for (const past of data.past_values) {
    const value: MovePastValue = { untilVersionGroup: past.version_group.name }
    if (past.type) value.type = past.type.name
    if (past.power !== null) value.power = past.power
    if (past.accuracy !== null) value.accuracy = past.accuracy
    if (past.pp !== null) value.pp = past.pp
    // A past effect can differ by wording (its own effect_entries) or only by chance (Bite:
    // 10% -> 30%, empty effect_entries), in which case the current template is re-rendered.
    const pastTemplate = englishTemplate(past.effect_entries) ?? (past.effect_chance !== null ? template : null)
    if (pastTemplate !== null) {
      const pastEffect = renderEffect(pastTemplate, past.effect_chance ?? data.effect_chance)
      if (pastEffect !== entry.effect) value.effect = pastEffect
    }
    if (Object.keys(value).length > 1) pastValues.push(value)
  }
  if (pastValues.length > 0) entry.pastValues = pastValues
  return entry
}

/** Sorted by slug so the output doesn't depend on the order concurrent fetches finished in. */
export function buildMoveData(entries: Record<string, MoveEntry>): MoveData {
  const moves: Record<string, MoveEntry> = {}
  for (const name of Object.keys(entries).sort()) moves[name] = entries[name]
  return { moves }
}
