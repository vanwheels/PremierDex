import { describe, expect, it } from 'vitest'
import { buildMoveData, parseMove, type PokeApiMoveResponse } from './moves'

const en = (short_effect: string): { short_effect: string; language: { name: string } } => ({
  short_effect,
  language: { name: 'en' }
})

const CHANCE_TEXT = 'Has a $effect_chance% chance to paralyze the target.'

function response(overrides: Partial<PokeApiMoveResponse> = {}): PokeApiMoveResponse {
  return {
    name: 'thunderbolt',
    type: { name: 'electric' },
    damage_class: { name: 'special' },
    power: 90,
    accuracy: 100,
    pp: 15,
    effect_chance: 10,
    effect_entries: [{ short_effect: 'Français.', language: { name: 'fr' } }, en(CHANCE_TEXT)],
    past_values: [],
    ...overrides
  }
}

const noChange = { type: null, power: null, accuracy: null, pp: null, effect_chance: null, effect_entries: [] }

describe('parseMove', () => {
  it('reads the stats and substitutes $effect_chance into the English effect', () => {
    expect(parseMove(response())).toEqual({
      type: 'electric',
      damageClass: 'special',
      power: 90,
      accuracy: 100,
      pp: 15,
      effect: 'Has a 10% chance to paralyze the target.'
    })
  })

  it('keeps null power/accuracy for moves without them', () => {
    const entry = parseMove(
      response({ power: null, accuracy: null, effect_chance: null, effect_entries: [en('Raises the user Attack.')] })
    )
    expect(entry.power).toBeNull()
    expect(entry.accuracy).toBeNull()
    expect(entry.effect).toBe('Raises the user Attack.')
  })

  it('leaves effect null when PokeAPI has no English effect entry (newer moves)', () => {
    const entry = parseMove(response({ effect_chance: null, effect_entries: [] }))
    expect(entry.effect).toBeNull()
    expect(entry.pastValues).toBeUndefined()
  })

  it('keeps only the changed fields of a past value', () => {
    const entry = parseMove(response({ past_values: [{ ...noChange, power: 95, version_group: { name: 'x-y' } }] }))
    expect(entry.pastValues).toEqual([{ untilVersionGroup: 'x-y', power: 95 }])
  })

  it('keeps multiple past values in order, including type changes', () => {
    const entry = parseMove(
      response({
        past_values: [
          { ...noChange, accuracy: 95, power: 35, version_group: { name: 'black-white' } },
          { ...noChange, power: 50, type: { name: 'normal' }, version_group: { name: 'sun-moon' } }
        ]
      })
    )
    expect(entry.pastValues).toEqual([
      { untilVersionGroup: 'black-white', accuracy: 95, power: 35 },
      { untilVersionGroup: 'sun-moon', power: 50, type: 'normal' }
    ])
  })

  it('re-renders the current effect with a past effect chance when only the chance changed', () => {
    const entry = parseMove(
      response({
        effect_chance: 30,
        past_values: [{ ...noChange, effect_chance: 10, version_group: { name: 'gold-silver' } }]
      })
    )
    expect(entry.effect).toBe('Has a 30% chance to paralyze the target.')
    expect(entry.pastValues).toEqual([
      { untilVersionGroup: 'gold-silver', effect: 'Has a 10% chance to paralyze the target.' }
    ])
  })

  it('uses a past effect_entries wording when one is given', () => {
    const entry = parseMove(
      response({
        past_values: [{ ...noChange, effect_entries: [en('Old wording.')], version_group: { name: 'x-y' } }]
      })
    )
    expect(entry.pastValues).toEqual([{ untilVersionGroup: 'x-y', effect: 'Old wording.' }])
  })

  it('drops a past value that changed nothing we store', () => {
    const entry = parseMove(response({ past_values: [{ ...noChange, version_group: { name: 'x-y' } }] }))
    expect(entry.pastValues).toBeUndefined()
  })
})

describe('buildMoveData', () => {
  it('sorts moves by slug', () => {
    const e = parseMove(response())
    expect(Object.keys(buildMoveData({ zap: e, acid: e, mud: e }).moves)).toEqual(['acid', 'mud', 'zap'])
  })
})
