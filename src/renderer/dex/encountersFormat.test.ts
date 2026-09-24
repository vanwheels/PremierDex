import { describe, expect, it } from 'vitest'
import type { EncounterData } from '@shared/types/encounters'
import { encounterLocationsForForm } from './encountersFormat'

const BASE_DATA: EncounterData = {
  encounters: {},
  locationAreas: ['kanto-route-1-area', 'kanto-route-2-area'],
  methods: ['walk', 'old-rod'],
  versions: ['red', 'blue', 'sword', 'the-isle-of-armor-sword']
}

describe('encounterLocationsForForm', () => {
  it('returns no data for a pokeapiId absent from the dataset', () => {
    expect(encounterLocationsForForm(BASE_DATA, 999)).toEqual([])
  })

  it('strips the -area suffix and formats a bare location/method/level/chance row', () => {
    const data: EncounterData = {
      ...BASE_DATA,
      encounters: {
        1: [
          {
            locationAreaIndex: 0,
            versionDetails: [
              {
                versionIndex: 0,
                maxChance: 100,
                encounterDetails: [{ minLevel: 3, maxLevel: 3, chance: 100, methodIndex: 0, conditionValues: [] }]
              }
            ]
          }
        ]
      }
    }
    expect(encounterLocationsForForm(data, 1)).toEqual([
      {
        location: 'Kanto Route 1',
        details: [{ gamesLabel: 'Red', method: 'Walk', levelRange: 'Lv. 3', chance: '100%', conditions: null }]
      }
    ])
  })

  it('renders a level range and a formatted condition list', () => {
    const data: EncounterData = {
      ...BASE_DATA,
      encounters: {
        1: [
          {
            locationAreaIndex: 0,
            versionDetails: [
              {
                versionIndex: 0,
                maxChance: 40,
                encounterDetails: [
                  { minLevel: 3, maxLevel: 5, chance: 40, methodIndex: 0, conditionValues: ['time-day'] }
                ]
              }
            ]
          }
        ]
      }
    }
    expect(encounterLocationsForForm(data, 1)).toEqual([
      {
        location: 'Kanto Route 1',
        details: [{ gamesLabel: 'Red', method: 'Walk', levelRange: 'Lv. 3-5', chance: '40%', conditions: 'Time Day' }]
      }
    ])
  })

  it('merges versions sharing an identical method/level/chance/condition combination into one games label', () => {
    const data: EncounterData = {
      ...BASE_DATA,
      encounters: {
        1: [
          {
            locationAreaIndex: 0,
            versionDetails: [
              {
                versionIndex: 0,
                maxChance: 100,
                encounterDetails: [{ minLevel: 3, maxLevel: 3, chance: 100, methodIndex: 0, conditionValues: [] }]
              },
              {
                versionIndex: 1,
                maxChance: 100,
                encounterDetails: [{ minLevel: 3, maxLevel: 3, chance: 100, methodIndex: 0, conditionValues: [] }]
              }
            ]
          }
        ]
      }
    }
    expect(encounterLocationsForForm(data, 1)).toEqual([
      {
        location: 'Kanto Route 1',
        details: [{ gamesLabel: 'Red/Blue', method: 'Walk', levelRange: 'Lv. 3', chance: '100%', conditions: null }]
      }
    ])
  })

  it('keeps distinct method/level/chance combinations as separate rows, sorted by chance descending', () => {
    const data: EncounterData = {
      ...BASE_DATA,
      encounters: {
        1: [
          {
            locationAreaIndex: 0,
            versionDetails: [
              {
                versionIndex: 0,
                maxChance: 100,
                encounterDetails: [
                  { minLevel: 3, maxLevel: 3, chance: 30, methodIndex: 0, conditionValues: [] },
                  { minLevel: 5, maxLevel: 5, chance: 70, methodIndex: 1, conditionValues: [] }
                ]
              }
            ]
          }
        ]
      }
    }
    expect(encounterLocationsForForm(data, 1)).toEqual([
      {
        location: 'Kanto Route 1',
        details: [
          { gamesLabel: 'Red', method: 'Old Rod', levelRange: 'Lv. 5', chance: '70%', conditions: null },
          { gamesLabel: 'Red', method: 'Walk', levelRange: 'Lv. 3', chance: '30%', conditions: null }
        ]
      }
    ])
  })

  it('labels Isle of Armor/Crown Tundra DLC encounters with a suffix distinct from the base game', () => {
    const data: EncounterData = {
      ...BASE_DATA,
      encounters: {
        1: [
          {
            locationAreaIndex: 0,
            versionDetails: [
              {
                versionIndex: 3, // the-isle-of-armor-sword
                maxChance: 50,
                encounterDetails: [{ minLevel: 10, maxLevel: 10, chance: 50, methodIndex: 0, conditionValues: [] }]
              }
            ]
          }
        ]
      }
    }
    expect(encounterLocationsForForm(data, 1)).toEqual([
      {
        location: 'Kanto Route 1',
        details: [
          { gamesLabel: 'Sword (Isle of Armor)', method: 'Walk', levelRange: 'Lv. 10', chance: '50%', conditions: null }
        ]
      }
    ])
  })

  it('sorts location areas alphabetically by display name', () => {
    const data: EncounterData = {
      ...BASE_DATA,
      encounters: {
        1: [
          {
            locationAreaIndex: 1,
            versionDetails: [
              {
                versionIndex: 0,
                maxChance: 100,
                encounterDetails: [{ minLevel: 3, maxLevel: 3, chance: 100, methodIndex: 0, conditionValues: [] }]
              }
            ]
          },
          {
            locationAreaIndex: 0,
            versionDetails: [
              {
                versionIndex: 0,
                maxChance: 100,
                encounterDetails: [{ minLevel: 3, maxLevel: 3, chance: 100, methodIndex: 0, conditionValues: [] }]
              }
            ]
          }
        ]
      }
    }
    expect(encounterLocationsForForm(data, 1).map((l) => l.location)).toEqual(['Kanto Route 1', 'Kanto Route 2'])
  })
})
