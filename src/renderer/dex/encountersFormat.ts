import { ORIGIN_GAMES } from '@shared/data/origin-games'
import type { EncounterData } from '@shared/types/encounters'
import { slugDisplayName } from './speciesPageFormat'

/**
 * Leg 3 of the Encounter data + Where to Find milestone (see TODO.md): groups the raw
 * per-pokeapiId encounter data (encounters.ts) into per-location-area rows for
 * SpeciesPage's Where to Find field. Same "location (games): value" list shape as
 * safari-flee-rates.ts's Safari Zone Flee Rate field, one level deeper — a location area
 * can have several distinct method/level/chance combinations across its games, not one
 * scalar, so each location gets a nested list of those combinations instead of a single
 * value.
 *
 * Sword/Shield's Isle of Armor/Crown Tundra DLC areas report their own version names (see
 * encounters.ts's file header) with no ORIGIN_GAMES entry of their own — resolved back to
 * the base sword/shield id here for sorting, with a "(Isle of Armor)"/"(Crown Tundra)"
 * suffix on the display label so a DLC-only encounter doesn't render indistinguishably
 * from the base game's.
 */

const DLC_VERSIONS: Record<string, { gameId: string; dlcLabel: string }> = {
  'the-isle-of-armor-sword': { gameId: 'sword', dlcLabel: 'Isle of Armor' },
  'the-isle-of-armor-shield': { gameId: 'shield', dlcLabel: 'Isle of Armor' },
  'the-crown-tundra-sword': { gameId: 'sword', dlcLabel: 'Crown Tundra' },
  'the-crown-tundra-shield': { gameId: 'shield', dlcLabel: 'Crown Tundra' }
}

export interface EncounterDetailSummary {
  /** Display-joined game names sharing this exact method/level/chance/condition
   * combination, e.g. "Ruby/Sapphire". */
  gamesLabel: string
  method: string
  levelRange: string
  chance: string
  conditions: string | null
}

export interface EncounterLocationSummary {
  location: string
  details: EncounterDetailSummary[]
}

interface GameRef {
  /** Zero-padded ORIGIN_GAMES index (as a string, so it sorts with unmapped version names
   * below it) — originGameOrder() can't be reused directly, since it looks up by display
   * name and DLC-suffixed labels aren't in ORIGIN_GAMES. */
  sortKey: string
  label: string
}

function gameRefForVersion(versionName: string): GameRef {
  const dlc = DLC_VERSIONS[versionName]
  const gameId = dlc?.gameId ?? versionName
  const gameIndex = ORIGIN_GAMES.findIndex((g) => g.id === gameId)
  const baseName = (gameIndex === -1 ? versionName : ORIGIN_GAMES[gameIndex].name).replace(/^Pokémon /, '')
  return {
    sortKey: gameIndex === -1 ? versionName : String(gameIndex).padStart(3, '0'),
    label: dlc ? `${baseName} (${dlc.dlcLabel})` : baseName
  }
}

function levelRangeLabel(minLevel: number, maxLevel: number): string {
  return minLevel === maxLevel ? `Lv. ${minLevel}` : `Lv. ${minLevel}-${maxLevel}`
}

function conditionsLabel(conditionValues: string[]): string | null {
  return conditionValues.length === 0 ? null : conditionValues.map(slugDisplayName).join(', ')
}

interface GroupedDetail {
  /** sortKey -> display label, deduped across versions that share this exact combination
   * (e.g. Ruby/Sapphire almost always do). */
  games: Map<string, string>
  methodIndex: number
  minLevel: number
  maxLevel: number
  chance: number
  conditionValues: string[]
}

/** Encounter locations/details for one form's pokeapiId, `[]` if this form has no PokeAPI
 * encounter data at all (an excluded game, or a form PokeAPI records no wild encounters
 * for). Same opt-in-field contract as safariFleeRatesForSpecies: SpeciesPage hides the
 * Where to Find field entirely when this returns []. */
export function encounterLocationsForForm(encounterData: EncounterData, pokeapiId: number): EncounterLocationSummary[] {
  const locationEntries = encounterData.encounters[pokeapiId]
  if (!locationEntries) return []

  const summaries = locationEntries.map((locationEntry) => {
    const grouped = new Map<string, GroupedDetail>()
    for (const versionDetail of locationEntry.versionDetails) {
      const game = gameRefForVersion(encounterData.versions[versionDetail.versionIndex])
      for (const detail of versionDetail.encounterDetails) {
        const key = `${detail.methodIndex}|${detail.minLevel}|${detail.maxLevel}|${detail.chance}|${detail.conditionValues.join(',')}`
        const existing = grouped.get(key)
        if (existing) {
          existing.games.set(game.sortKey, game.label)
        } else {
          grouped.set(key, {
            games: new Map([[game.sortKey, game.label]]),
            methodIndex: detail.methodIndex,
            minLevel: detail.minLevel,
            maxLevel: detail.maxLevel,
            chance: detail.chance,
            conditionValues: detail.conditionValues
          })
        }
      }
    }

    const details: EncounterDetailSummary[] = [...grouped.values()]
      .sort((a, b) => b.chance - a.chance)
      .map((g) => ({
        gamesLabel: [...g.games.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, label]) => label)
          .join('/'),
        method: slugDisplayName(encounterData.methods[g.methodIndex]),
        levelRange: levelRangeLabel(g.minLevel, g.maxLevel),
        chance: `${g.chance}%`,
        conditions: conditionsLabel(g.conditionValues)
      }))

    return {
      location: slugDisplayName(encounterData.locationAreas[locationEntry.locationAreaIndex].replace(/-area$/, '')),
      details
    }
  })

  return summaries.sort((a, b) => a.location.localeCompare(b.location))
}
