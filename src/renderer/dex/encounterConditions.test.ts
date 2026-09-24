import { describe, expect, it } from 'vitest'
import type { EncounterDetail } from '@shared/types/encounters'
import { applyConditionSelection, conditionTogglesFor } from './encounterConditions'

const d = (conditionValues: string[], minLevel = 5): EncounterDetail => ({
  minLevel,
  maxLevel: minLevel,
  chance: 10,
  methodIndex: 0,
  conditionValues
})

describe('conditionTogglesFor', () => {
  it('returns nothing when no toggleable condition varies', () => {
    expect(conditionTogglesFor([d([]), d([])])).toEqual([])
    // A single value isn't a choice.
    expect(conditionTogglesFor([d(['swarm-no']), d([])])).toEqual([])
    // Long-tail conditions stay inline, never toggles.
    expect(conditionTogglesFor([d(['trade-abra']), d(['coins-500'])])).toEqual([])
  })

  it('orders time Morning/Day/Night and labels values without the category prefix', () => {
    const [time] = conditionTogglesFor([d(['time-night']), d(['time-morning']), d(['time-day'])])
    expect(time.key).toBe('time')
    expect(time.options).toEqual([
      { value: 'time-morning', label: 'Morning' },
      { value: 'time-day', label: 'Day' },
      { value: 'time-night', label: 'Night' }
    ])
  })

  it('offers several categories at once', () => {
    const toggles = conditionTogglesFor([
      d(['weather-fog']),
      d(['weather-normal']),
      d(['swarm-yes']),
      d(['swarm-no'])
    ])
    expect(toggles.map((t) => t.key)).toEqual(['weather', 'swarm'])
    expect(toggles[0].options.map((o) => o.label)).toEqual(['Normal', 'Fog'])
  })
})

describe('applyConditionSelection', () => {
  const details = [d(['time-day', 'swarm-no'], 3), d(['time-night', 'swarm-no'], 4), d([], 5)]

  it('returns the details untouched for an empty selection', () => {
    expect(applyConditionSelection(details, {})).toBe(details)
  })

  it('keeps unconditioned rows and matching ones, dropping the rest', () => {
    const out = applyConditionSelection(details, { time: 'time-day' })
    expect(out.map((x) => x.minLevel)).toEqual([3, 5])
  })

  it('strips the selected category from surviving conditions but keeps the others', () => {
    const out = applyConditionSelection(details, { time: 'time-day' })
    expect(out[0].conditionValues).toEqual(['swarm-no'])
  })
})
