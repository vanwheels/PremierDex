import { describe, expect, it } from 'vitest'
import type { EncounterData, EncounterDetail } from '@shared/types/encounters'
import { encounterSectionsForForm } from './encountersFormat'

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
        locations: [
          { location: 'Kanto Route 1', rows: [{ method: 'Walk', levelRange: 'Lv. 3', chance: '100%', conditions: null }] }
        ]
      }
    ])
  })

  it('renders a level range and a formatted condition list', () => {
    const data = dataWith([[0, 0, [detail({ minLevel: 3, maxLevel: 5, chance: 40, conditionValues: ['time-day'] })]]])
    expect(encounterSectionsForForm(data, 1)[0].locations[0].rows).toEqual([
      { method: 'Walk', levelRange: 'Lv. 3-5', chance: '40%', conditions: 'Time Day' }
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
    expect(encounterSectionsForForm(data, 1)[0].locations[0].rows.map((r) => [r.method, r.chance])).toEqual([
      ['Old Rod', '70%'],
      ['Walk', '30%']
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
  })
})
