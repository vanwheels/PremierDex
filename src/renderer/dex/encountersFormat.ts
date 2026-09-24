import { ORIGIN_GAMES } from '@shared/data/origin-games'
import type { EncounterData } from '@shared/types/encounters'
import { slugDisplayName } from './speciesPageFormat'

/**
 * Formats the raw per-pokeapiId encounter data (encounters.ts) for display. Originally
 * (Leg 3 of the Encounter data + Where to Find milestone) SpeciesPage's Where to Find was one
 * row per location listing the games sharing each method/level/chance combination; Vanny's
 * 2026-09-24 feedback pass flipped it to Serebii's shape — one header section per game (with
 * that game's colour, see gameColors.ts), each listing its locations and their encounter rows.
 * The per-location grouping the Dex tab's Locations sub-tab needs is its own inversion in
 * dexLocationIndex.ts, which shares gameRefForVersion/locationAreaLabel below.
 *
 * Sword/Shield's Isle of Armor/Crown Tundra DLC areas report their own version names (see
 * encounters.ts's file header) with no ORIGIN_GAMES entry of their own — they get their own
 * section, resolved back to the base sword/shield id for ordering and colour, with a
 * "(Isle of Armor)"/"(Crown Tundra)" suffix on the label so a DLC-only encounter doesn't
 * render indistinguishably from the base game's.
 */

const DLC_VERSIONS: Record<string, { gameId: string; dlcLabel: string }> = {
  'the-isle-of-armor-sword': { gameId: 'sword', dlcLabel: 'Isle of Armor' },
  'the-isle-of-armor-shield': { gameId: 'shield', dlcLabel: 'Isle of Armor' },
  'the-crown-tundra-sword': { gameId: 'sword', dlcLabel: 'Crown Tundra' },
  'the-crown-tundra-shield': { gameId: 'shield', dlcLabel: 'Crown Tundra' }
}

export interface GameRef {
  /** Zero-padded ORIGIN_GAMES index (as a string, so it sorts with unmapped version names
   * below it) — originGameOrder() can't be reused directly, since it looks up by display
   * name and DLC-suffixed labels aren't in ORIGIN_GAMES. */
  sortKey: string
  label: string
  /** The base game's id (a DLC version resolves to its sword/shield id) — the key into
   * gameColors.ts. Falls back to the raw version name for a version with no ORIGIN_GAMES
   * entry. */
  gameId: string
}

export function gameRefForVersion(versionName: string): GameRef {
  const dlc = DLC_VERSIONS[versionName]
  const gameId = dlc?.gameId ?? versionName
  const gameIndex = ORIGIN_GAMES.findIndex((g) => g.id === gameId)
  const baseName = (gameIndex === -1 ? versionName : ORIGIN_GAMES[gameIndex].name).replace(/^Pokémon /, '')
  return {
    sortKey: gameIndex === -1 ? versionName : String(gameIndex).padStart(3, '0'),
    label: dlc ? `${baseName} (${dlc.dlcLabel})` : baseName,
    gameId
  }
}

/** Display label for a PokeAPI location-area slug ("kanto-route-1-area" -> "Kanto Route 1"). */
export function locationAreaLabel(areaSlug: string): string {
  return slugDisplayName(areaSlug.replace(/-area$/, ''))
}

function levelRangeLabel(minLevel: number, maxLevel: number): string {
  return minLevel === maxLevel ? `Lv. ${minLevel}` : `Lv. ${minLevel}-${maxLevel}`
}

function conditionsLabel(conditionValues: string[]): string | null {
  return conditionValues.length === 0 ? null : conditionValues.map(slugDisplayName).join(', ')
}

export interface EncounterRow {
  method: string
  levelRange: string
  chance: string
  conditions: string | null
}

export interface EncounterLocationRows {
  location: string
  rows: EncounterRow[]
}

export interface GameEncounterSection {
  /** Base game id, for colour lookup (gameColors.ts). */
  gameId: string
  /** Display label — includes the DLC suffix for an Isle of Armor/Crown Tundra section. */
  label: string
  locations: EncounterLocationRows[]
}

/** Encounter sections for one form's pokeapiId, one per game/DLC in release order; `[]` if
 * this form has no PokeAPI encounter data at all (an excluded game, or a form PokeAPI
 * records no wild encounters for). Same opt-in-field contract as safariFleeRatesForSpecies:
 * SpeciesPage hides the Where to Find field entirely when this returns []. Within a game,
 * locations sort alphabetically and rows by chance descending. */
export function encounterSectionsForForm(encounterData: EncounterData, pokeapiId: number): GameEncounterSection[] {
  const locationEntries = encounterData.encounters[pokeapiId]
  if (!locationEntries) return []

  interface Working {
    ref: GameRef
    locations: EncounterLocationRows[]
  }
  const byVersion = new Map<string, Working>()

  for (const locationEntry of locationEntries) {
    const location = locationAreaLabel(encounterData.locationAreas[locationEntry.locationAreaIndex])
    for (const versionDetail of locationEntry.versionDetails) {
      const versionName = encounterData.versions[versionDetail.versionIndex]
      let working = byVersion.get(versionName)
      if (!working) {
        working = { ref: gameRefForVersion(versionName), locations: [] }
        byVersion.set(versionName, working)
      }
      const rows: EncounterRow[] = [...versionDetail.encounterDetails]
        .sort((a, b) => b.chance - a.chance)
        .map((d) => ({
          method: slugDisplayName(encounterData.methods[d.methodIndex]),
          levelRange: levelRangeLabel(d.minLevel, d.maxLevel),
          chance: `${d.chance}%`,
          conditions: conditionsLabel(d.conditionValues)
        }))
      working.locations.push({ location, rows })
    }
  }

  return [...byVersion.values()]
    .sort((a, b) => a.ref.sortKey.localeCompare(b.ref.sortKey) || a.ref.label.localeCompare(b.ref.label))
    .map(({ ref, locations }) => ({
      gameId: ref.gameId,
      label: ref.label,
      locations: locations.sort((a, b) => a.location.localeCompare(b.location))
    }))
}
