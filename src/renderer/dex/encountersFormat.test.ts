import { describe, expect, it } from 'vitest'
import type { EncounterData, EncounterDetail } from '@shared/types/encounters'
import {
  encounterSectionsForForm,
  filterSectionsByGeneration,
  sectionSummary,
  type GameEncounterSection
} from './encountersFormat'

const BASE_DATA: EncounterData = {
  encounters: {},
  locationAreas: ['kanto-route-1-area', 'kanto-route-2-area'],
  methods: ['walk', 'old-rod'],
  versions: ['red', 'blue', 'sword', 'the-isle-of-armor-sword']
}

const detail = (over: Partial<EncounterDetail> = {}): EncounterDetail => ({
  minLevel: 3,
  maxLevel: 3,
  chance: 100,
  methodIndex: 0,
  conditionValues: [],
  ...over
})

/** One species (pokeapiId 1) with the given [locationAreaIndex, versionIndex, details] rows. */
function dataWith(rows: Array<[number, number, EncounterDetail[]]>): EncounterData {
  return {
    ...BASE_DATA,
    encounters: {
      1: rows.map(([locationAreaIndex, versionIndex, encounterDetails]) => ({
        locationAreaIndex,
        versionDetails: [{ versionIndex, maxChance: 100, encounterDetails }]
      }))
    }
  }
}

describe('encounterSectionsForForm', () => {
  it('returns no data for a pokeapiId absent from the dataset', () => {
    expect(encounterSectionsForForm(BASE_DATA, 999)).toEqual([])
  })

  it('strips the -area suffix and formats a bare location/method/level/chance row', () => {
    expect(encounterSectionsForForm(dataWith([[0, 0, [detail()]]]), 1)).toEqual([
      {
        gameId: 'red',
        label: 'Red',
        generation: 1,
        locations: [
          { location: 'Kanto Route 1', rows: [{ method: 'Walk', levels: 'Lv. 3 (100%)', conditions: null }] }
        ]
      }
    ])
  })

  it('renders a level range and a formatted condition list', () => {
    const data = dataWith([[0, 0, [detail({ minLevel: 3, maxLevel: 5, chance: 40, conditionValues: ['time-day'] })]]])
    expect(encounterSectionsForForm(data, 1)[0].locations[0].rows).toEqual([
      { method: 'Walk', levels: 'Lv. 3-5 (40%)', conditions: 'Day' }
    ])
  })

  it('gives each game its own section, in release order, even when the data lists them out of order', () => {
    const data = dataWith([
      [0, 1, [detail()]],
      [0, 0, [detail()]]
    ])
    expect(encounterSectionsForForm(data, 1).map((s) => s.label)).toEqual(['Red', 'Blue'])
  })

  it('sorts a location\'s rows by chance descending', () => {
    const data = dataWith([[0, 0, [detail({ chance: 30 }), detail({ chance: 70, methodIndex: 1 })]]])
    expect(encounterSectionsForForm(data, 1)[0].locations[0].rows.map((r) => [r.method, r.levels])).toEqual([
      ['Old Rod', 'Lv. 3 (70%)'],
      ['Walk', 'Lv. 3 (30%)']
    ])
  })

  it('sorts a game\'s locations alphabetically by display name', () => {
    const data = dataWith([
      [1, 0, [detail()]],
      [0, 0, [detail()]]
    ])
    expect(encounterSectionsForForm(data, 1)[0].locations.map((l) => l.location)).toEqual(['Kanto Route 1', 'Kanto Route 2'])
  })

  it('puts Isle of Armor/Crown Tundra DLC encounters in their own suffixed section, coloured as the base game', () => {
    const data = dataWith([
      [0, 3, [detail({ chance: 50 })]],
      [0, 2, [detail()]]
    ])
    expect(encounterSectionsForForm(data, 1).map((s) => [s.label, s.gameId])).toEqual([
      ['Sword', 'sword'],
      ['Sword (Isle of Armor)', 'sword']
    ])
    expect(encounterSectionsForForm(data, 1).map((s) => s.generation)).toEqual([8, 8])
  })

  describe('generation filter and summary', () => {
    const section = (generation: number | null, locationCount: number): GameEncounterSection => ({
      gameId: 'x',
      label: 'X',
      generation,
      locations: Array.from({ length: locationCount }, (_, i) => ({ location: `L${i}`, rows: [] }))
    })

    it('keeps only sections from the selected generation, plus any with an unknown generation', () => {
      const sections = [section(1, 1), section(2, 1), section(null, 1)]
      expect(filterSectionsByGeneration(sections, 2).map((s) => s.generation)).toEqual([2, null])
    })

    it('summarises a section as a pluralised location count', () => {
      expect(sectionSummary({ ...section(1, 41), label: 'Gold' })).toBe('Gold — 41 locations')
      expect(sectionSummary({ ...section(1, 1), label: 'Red' })).toBe('Red — 1 location')
    })
  })

  const rowsFor = (details: EncounterDetail[]) => encounterSectionsForForm(dataWith([[0, 0, details]]), 1)[0].locations[0].rows

  it('merges same-level slots of one method by summing their chance', () => {
    const rows = rowsFor([detail({ minLevel: 20, maxLevel: 20, chance: 30 }), detail({ minLevel: 20, maxLevel: 20, chance: 10 })])
    expect(rows).toEqual([{ method: 'Walk', levels: 'Lv. 20 (40%)', conditions: null }])
  })

  it('lists different levels inline in ascending order', () => {
    const rows = rowsFor([detail({ minLevel: 21, maxLevel: 21, chance: 30 }), detail({ minLevel: 20, maxLevel: 20, chance: 30 })])
    expect(rows[0].levels).toBe('Lv. 20 (30%), 21 (30%)')
  })

  it('keeps different methods as separate rows', () => {
    expect(rowsFor([detail(), detail({ methodIndex: 1 })]).map((r) => r.method)).toEqual(['Old Rod', 'Walk'])
  })

  it('merges time-of-day rows whose breakdowns match, labelling the subset', () => {
    const rows = rowsFor([
      detail({ chance: 50, conditionValues: ['time-day'] }),
      detail({ chance: 50, conditionValues: ['time-night'] }),
      detail({ chance: 20, minLevel: 4, maxLevel: 4, conditionValues: ['time-morning'] })
    ])
    expect(rows).toEqual([
      { method: 'Walk', levels: 'Lv. 3 (50%)', conditions: 'Day, Night' },
      { method: 'Walk', levels: 'Lv. 4 (20%)', conditions: 'Morning' }
    ])
  })

  it('drops the time label when morning, day and night all match', () => {
    const rows = rowsFor(['time-morning', 'time-day', 'time-night'].map((t) => detail({ conditionValues: [t] })))
    expect(rows).toEqual([{ method: 'Walk', levels: 'Lv. 3 (100%)', conditions: null }])
  })

  it('keeps non-time conditions as their own groups', () => {
    const rows = rowsFor([detail({ chance: 60 }), detail({ chance: 40, conditionValues: ['radar-on'] })])
    expect(rows.map((r) => r.conditions)).toEqual([null, 'Radar On'])
  })
})
