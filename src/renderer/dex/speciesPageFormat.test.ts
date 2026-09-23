import { describe, expect, it } from 'vitest'
import { formatCatchProbability, formatEvYield, formatGenderRatio, slugDisplayName } from './speciesPageFormat'

describe('formatEvYield', () => {
  it('restores conventional stat order and labels non-zero entries', () => {
    expect(formatEvYield({ speed: 2, hp: 1 })).toEqual([
      { stat: 'hp', label: 'HP', value: 1 },
      { stat: 'speed', label: 'Speed', value: 2 }
    ])
  })

  it('labels special-attack/defense with the Sp. abbreviation', () => {
    expect(formatEvYield({ 'special-attack': 3, 'special-defense': 1 })).toEqual([
      { stat: 'special-attack', label: 'Sp. Attack', value: 3 },
      { stat: 'special-defense', label: 'Sp. Defense', value: 1 }
    ])
  })

  it('omits stats absent from the map (zero-effort stats are omitted, not stored as 0)', () => {
    expect(formatEvYield({})).toEqual([])
  })
})

describe('formatGenderRatio', () => {
  it('reports genderless species', () => {
    expect(formatGenderRatio(-1)).toBe('Genderless')
  })

  it('reports always-male and always-female species', () => {
    expect(formatGenderRatio(0)).toBe('100% Male, 0% Female')
    expect(formatGenderRatio(8)).toBe('0% Male, 100% Female')
  })

  it('converts eighths-female into a percentage split', () => {
    expect(formatGenderRatio(1)).toBe('87.5% Male, 12.5% Female')
    expect(formatGenderRatio(4)).toBe('50% Male, 50% Female')
    expect(formatGenderRatio(7)).toBe('12.5% Male, 87.5% Female')
  })
})

describe('slugDisplayName', () => {
  it('renders a hyphenated PokeAPI slug as its display name', () => {
    expect(slugDisplayName('medium-fast')).toBe('Medium Fast')
    expect(slugDisplayName('static')).toBe('Static')
    expect(slugDisplayName('swift-swim')).toBe('Swift Swim')
  })
})

describe('formatCatchProbability', () => {
  it('renders a 0-1 probability as a one-decimal percentage', () => {
    expect(formatCatchProbability(1)).toBe('100.0%')
    expect(formatCatchProbability(0)).toBe('0.0%')
    expect(formatCatchProbability(0.4234)).toBe('42.3%')
  })
})
