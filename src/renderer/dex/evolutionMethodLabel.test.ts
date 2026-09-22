import { describe, expect, it } from 'vitest'
import { condenseMethodLabel } from './evolutionMethodLabel'

describe('condenseMethodLabel', () => {
  it('passes a single-alternative method through unchanged', () => {
    expect(condenseMethodLabel('Level 16')).toEqual({ label: 'Level 16', full: null })
    expect(condenseMethodLabel('160 Friendship + During the Day + Level Up')).toEqual({
      label: '160 Friendship + During the Day + Level Up',
      full: null
    })
  })

  it('condenses a multi-alternative method to a count label and keeps the full string', () => {
    const method =
      'At Eterna Forest + Near a Special Rock + Level Up or At Pinwheel Forest + Near a Special Rock + Level Up or Leaf Stone'
    expect(condenseMethodLabel(method)).toEqual({ label: '3 Methods', full: method })
  })

  it('counts every " or "-joined alternative, not just two', () => {
    const method = 'A or B or C or D or E'
    expect(condenseMethodLabel(method)).toEqual({ label: '5 Methods', full: method })
  })
})
