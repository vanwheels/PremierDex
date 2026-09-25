import { describe, expect, it } from 'vitest'
import { buildLearnsetData, parseLearnset, type PokeApiMoveEntry } from './learnsets'

function move(name: string, details: Array<[string, string, number]>): PokeApiMoveEntry {
  return {
    move: { name },
    version_group_details: details.map(([vg, method, level]) => ({
      version_group: { name: vg },
      move_learn_method: { name: method },
      level_learned_at: level
    }))
  }
}

describe('parseLearnset', () => {
  it('merges identical move/method/level entries across version groups', () => {
    const raw = parseLearnset([
      move('thunder-shock', [
        ['red-blue', 'level-up', 1],
        ['yellow', 'level-up', 1],
        ['gold-silver', 'level-up', 1]
      ])
    ])
    expect(raw).toEqual([['thunder-shock', 'level-up', 1, ['red-blue', 'yellow', 'gold-silver']]])
  })

  it('keeps separate entries when the level or method differs', () => {
    const raw = parseLearnset([
      move('surf', [
        ['red-blue', 'machine', 0],
        ['gold-silver', 'machine', 0],
        ['sword-shield', 'level-up', 30],
        ['scarlet-violet', 'level-up', 34]
      ])
    ])
    expect(raw).toEqual([
      ['surf', 'machine', 0, ['red-blue', 'gold-silver']],
      ['surf', 'level-up', 30, ['sword-shield']],
      ['surf', 'level-up', 34, ['scarlet-violet']]
    ])
  })

  it('drops Japan-only version groups and moves left with no details', () => {
    const raw = parseLearnset([move('pound', [['red-green-japan', 'level-up', 1], ['blue-japan', 'level-up', 1]])])
    expect(raw).toEqual([])
  })
})

describe('buildLearnsetData', () => {
  const meta = [
    { name: 'gold-silver', generation: 2, order: 3 },
    { name: 'red-blue', generation: 1, order: 1 }
  ]

  it('sorts tables and resolves names to indexes independent of input order', () => {
    const data = buildLearnsetData(
      {
        25: [
          ['surf', 'machine', 0, ['gold-silver', 'red-blue']],
          ['growl', 'level-up', 5, ['red-blue']],
          ['growl', 'egg', 0, ['gold-silver']]
        ]
      },
      meta
    )
    expect(data.moves).toEqual(['growl', 'surf'])
    expect(data.methods).toEqual(['egg', 'level-up', 'machine'])
    expect(data.versionGroups).toEqual([
      { name: 'red-blue', generation: 1 },
      { name: 'gold-silver', generation: 2 }
    ])
    // Sorted by move, then method, then level; version group indexes ascending.
    expect(data.learnsets[25]).toEqual([
      [0, 0, 0, [1]],
      [0, 1, 5, [0]],
      [1, 2, 0, [0, 1]]
    ])
  })

  it('throws on a version group missing from the metadata', () => {
    expect(() => buildLearnsetData({ 1: [['pound', 'level-up', 1, ['yellow']]] }, meta)).toThrow(/version group "yellow"/)
  })
})
