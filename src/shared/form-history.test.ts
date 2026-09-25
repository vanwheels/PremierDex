import { describe, expect, it } from 'vitest'
import { parseFormDetails, resolveFormAtGeneration, type PokeApiPokemonResponse } from './form-history'

const gen = (n: number) => ({ url: `https://pokeapi.co/api/v2/generation/${n}/` })
const ability = (name: string) => ({ name, url: `https://pokeapi.co/api/v2/ability/${name}/` })
const stat = (name: string, base_stat: number, effort = 0) => ({ stat: { name }, base_stat, effort })
const type = (slot: number, name: string) => ({ slot, type: { name } })

const NO_PAST = { past_types: [], past_stats: [], past_abilities: [] }

// Trimmed from live /pokemon/35 (Clefairy), 2026-09-25.
const clefairy: PokeApiPokemonResponse = {
  abilities: [
    { ability: ability('cute-charm'), is_hidden: false, slot: 1 },
    { ability: ability('magic-guard'), is_hidden: false, slot: 2 },
    { ability: ability('friend-guard'), is_hidden: true, slot: 3 }
  ],
  stats: [stat('hp', 70), stat('attack', 45), stat('defense', 48), stat('special-attack', 60, 0), stat('special-defense', 65, 1), stat('speed', 35)],
  types: [type(1, 'fairy')],
  past_types: [{ generation: gen(5), types: [type(1, 'normal')] }],
  past_stats: [{ generation: gen(1), stats: [{ base_stat: 60, effort: 0, stat: { name: 'special' } }] }],
  past_abilities: [
    { generation: gen(3), abilities: [{ ability: null, is_hidden: false, slot: 2 }] },
    { generation: gen(4), abilities: [{ ability: null, is_hidden: true, slot: 3 }] }
  ]
}

// Trimmed from live /pokemon/25 (Pikachu): two past_stats eras, no past_types.
const pikachu: PokeApiPokemonResponse = {
  abilities: [{ ability: ability('static'), is_hidden: false, slot: 1 }],
  stats: [stat('hp', 35), stat('attack', 55), stat('defense', 40), stat('special-attack', 50), stat('special-defense', 50), stat('speed', 90, 2)],
  types: [type(1, 'electric')],
  past_types: [],
  past_stats: [
    {
      generation: gen(5),
      stats: [
        { base_stat: 30, effort: 0, stat: { name: 'defense' } },
        { base_stat: 40, effort: 0, stat: { name: 'special-defense' } }
      ]
    },
    { generation: gen(1), stats: [{ base_stat: 50, effort: 0, stat: { name: 'special' } }] }
  ],
  past_abilities: []
}

describe('parseFormDetails', () => {
  it('captures current types, base stats and ev yield', () => {
    const { entry } = parseFormDetails(pikachu)
    expect(entry.types).toEqual(['electric'])
    expect(entry.baseStats).toEqual({
      hp: 35,
      attack: 55,
      defense: 40,
      'special-attack': 50,
      'special-defense': 50,
      speed: 90
    })
    expect(entry.evYield).toEqual({ speed: 2 })
  })

  it('orders types by slot regardless of response order', () => {
    const { entry } = parseFormDetails({ ...pikachu, types: [type(2, 'flying'), type(1, 'fire')] })
    expect(entry.types).toEqual(['fire', 'flying'])
  })

  it('parses generation numbers from urls and sorts past entries ascending', () => {
    const { entry } = parseFormDetails(pikachu)
    expect(entry.pastStats?.map((p) => p.untilGeneration)).toEqual([1, 5])
    expect(entry.pastStats?.[0].stats).toEqual({ special: 50 })
  })

  it('keeps per-era EV yield (zeros included) but none for Gen I special', () => {
    const { entry } = parseFormDetails(pikachu)
    expect(entry.pastStats?.[0]).not.toHaveProperty('evYield')
    expect(entry.pastStats?.[1].evYield).toEqual({ defense: 0, 'special-defense': 0 })
  })

  it('omits past fields entirely when the form has none', () => {
    const { entry } = parseFormDetails({ ...pikachu, ...NO_PAST })
    expect(entry).not.toHaveProperty('pastTypes')
    expect(entry).not.toHaveProperty('pastStats')
    expect(entry).not.toHaveProperty('pastAbilities')
  })

  it('keeps null past abilities as name: null and stores current ability slots', () => {
    const { entry } = parseFormDetails(clefairy)
    expect(entry.abilities.map((a) => a.slot)).toEqual([1, 2, 3])
    expect(entry.pastAbilities?.[0]).toEqual({
      untilGeneration: 3,
      abilities: [{ slot: 2, name: null, isHidden: false }]
    })
  })

  it('returns ability refs for current and past abilities without duplicates', () => {
    const withPastNamed: PokeApiPokemonResponse = {
      ...clefairy,
      past_abilities: [
        { generation: gen(4), abilities: [{ ability: ability('cute-charm'), is_hidden: false, slot: 2 }] }
      ]
    }
    const names = parseFormDetails(withPastNamed).abilityRefs.map((r) => r.name)
    expect(names.sort()).toEqual(['cute-charm', 'friend-guard', 'magic-guard'])
  })

  it('includes past-only abilities in the refs', () => {
    const past: PokeApiPokemonResponse = {
      ...pikachu,
      past_abilities: [{ generation: gen(4), abilities: [{ ability: ability('lightning-rod'), is_hidden: true, slot: 3 }] }]
    }
    expect(parseFormDetails(past).abilityRefs.map((r) => r.name).sort()).toEqual(['lightning-rod', 'static'])
  })
})

describe('resolveFormAtGeneration', () => {
  const clefairyEntry = parseFormDetails(clefairy).entry
  const pikachuEntry = parseFormDetails(pikachu).entry

  it('returns current values for generations after every past entry', () => {
    const r = resolveFormAtGeneration(clefairyEntry, 9)
    expect(r.types).toEqual(['fairy'])
    expect(r.baseStats).toEqual(clefairyEntry.baseStats)
    expect(r.abilities.map((a) => a.name)).toEqual(['cute-charm', 'magic-guard', 'friend-guard'])
  })

  it('treats untilGeneration as inclusive: Normal through Gen V, Fairy from Gen VI', () => {
    expect(resolveFormAtGeneration(clefairyEntry, 5).types).toEqual(['normal'])
    expect(resolveFormAtGeneration(clefairyEntry, 6).types).toEqual(['fairy'])
    expect(resolveFormAtGeneration(clefairyEntry, 1).types).toEqual(['normal'])
  })

  it('layers stat diffs from every era that still applies (Pikachu in Gen I)', () => {
    const gen1 = resolveFormAtGeneration(pikachuEntry, 1)
    expect(gen1.baseStats.defense).toBe(30)
    expect(gen1.baseStats['special-defense']).toBe(40)
    expect(gen1.baseStats.special).toBe(50)
    expect(gen1.baseStats.hp).toBe(35)
  })

  it('applies only the later era once the earlier one has ended', () => {
    const gen3 = resolveFormAtGeneration(pikachuEntry, 3)
    expect(gen3.baseStats.defense).toBe(30)
    expect(gen3.baseStats).not.toHaveProperty('special')
    const gen6 = resolveFormAtGeneration(pikachuEntry, 6)
    expect(gen6.baseStats.defense).toBe(40)
  })

  it('layers past EV yield: a listed 0 removes the stat, a listed value replaces it', () => {
    // Raichu-style: Speed yield 0 through Gen V, 3 from Gen VI on.
    const raichu = parseFormDetails({
      ...pikachu,
      stats: [stat('hp', 60), stat('attack', 90), stat('defense', 55), stat('special-attack', 90), stat('special-defense', 80), stat('speed', 110, 3)],
      past_stats: [{ generation: gen(5), stats: [{ base_stat: 110, effort: 0, stat: { name: 'speed' } }] }]
    }).entry
    expect(resolveFormAtGeneration(raichu, 5).evYield).toEqual({})
    expect(resolveFormAtGeneration(raichu, 6).evYield).toEqual({ speed: 3 })
    const changed = { ...raichu, pastStats: [{ untilGeneration: 3, stats: { speed: 110 }, evYield: { speed: 2 } }] }
    expect(resolveFormAtGeneration(changed, 3).evYield).toEqual({ speed: 2 })
  })

  it('removes ability slots that did not exist yet', () => {
    // Gen III: no slot 2 (through Gen III) and no hidden slot (through Gen IV).
    expect(resolveFormAtGeneration(clefairyEntry, 3).abilities.map((a) => a.name)).toEqual(['cute-charm'])
    // Gen IV: slot 2 exists, still no hidden ability.
    expect(resolveFormAtGeneration(clefairyEntry, 4).abilities.map((a) => a.name)).toEqual(['cute-charm', 'magic-guard'])
    expect(resolveFormAtGeneration(clefairyEntry, 5).abilities.map((a) => a.name)).toEqual([
      'cute-charm',
      'magic-guard',
      'friend-guard'
    ])
  })

  it('replaces (not just removes) a slot when the past ability had a different name', () => {
    const entry = parseFormDetails({
      ...pikachu,
      past_abilities: [{ generation: gen(4), abilities: [{ ability: ability('lightning-rod'), is_hidden: false, slot: 1 }] }]
    }).entry
    expect(resolveFormAtGeneration(entry, 4).abilities.map((a) => a.name)).toEqual(['lightning-rod'])
    expect(resolveFormAtGeneration(entry, 5).abilities.map((a) => a.name)).toEqual(['static'])
  })

  it('does not mutate the input entry', () => {
    const before = JSON.stringify(clefairyEntry)
    resolveFormAtGeneration(clefairyEntry, 1)
    expect(JSON.stringify(clefairyEntry)).toBe(before)
  })
})
