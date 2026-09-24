import { ORIGIN_GAMES } from '@shared/data/origin-games'
import type { EncounterData, EncounterDetail } from '@shared/types/encounters'
import { methodCategory } from './encounterMethods'
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
  /** The base game's generation (a DLC version uses its base game's); null for a version with
   * no ORIGIN_GAMES entry. */
  generation: number | null
}

export function gameRefForVersion(versionName: string): GameRef {
  const dlc = DLC_VERSIONS[versionName]
  const gameId = dlc?.gameId ?? versionName
  const gameIndex = ORIGIN_GAMES.findIndex((g) => g.id === gameId)
  const baseName = (gameIndex === -1 ? versionName : ORIGIN_GAMES[gameIndex].name).replace(/^Pokémon /, '')
  return {
    sortKey: gameIndex === -1 ? versionName : String(gameIndex).padStart(3, '0'),
    label: dlc ? `${baseName} (${dlc.dlcLabel})` : baseName,
    gameId,
    generation: gameIndex === -1 ? null : ORIGIN_GAMES[gameIndex].generation
  }
}

/** Display label for a PokeAPI location-area slug ("kanto-route-1-area" -> "Kanto Route 1"). */
export function locationAreaLabel(areaSlug: string): string {
  return slugDisplayName(areaSlug.replace(/-area$/, ''))
}

function levelLabel(minLevel: number, maxLevel: number): string {
  return minLevel === maxLevel ? `${minLevel}` : `${minLevel}-${maxLevel}`
}

const TIME_ORDER = ['time-morning', 'time-day', 'time-night']
/** Sentinel time key for details with no time-of-day condition. */
const ANY_TIME = 'any'

export interface EncounterRow {
  method: string
  /** Method category key (encounterMethods.ts), for the Dex Locations pane's per-category tables. */
  category: string
  /** Inline level breakdown, e.g. "Lv. 20 (30%), 21 (30%)" — same-level slots already summed. */
  levels: string
  /** Time-of-day and other conditions, or null when the row applies unconditionally. */
  conditions: string | null
}

interface LevelSlot {
  minLevel: number
  maxLevel: number
  chance: number
}

interface DetailGroup {
  method: string
  category: string
  otherConditions: string[]
  byTime: Map<string, Map<string, LevelSlot>>
}

function levelsLabel(slots: LevelSlot[]): string {
  const parts = slots.map((s) => `${levelLabel(s.minLevel, s.maxLevel)} (${s.chance}%)`)
  return `Lv. ${parts.join(', ')}`
}

/** Collapses PokeAPI's one-row-per-slot-per-time-of-day detail list: same method + non-time
 * conditions form one group, same-level slots sum their chance, and time-of-day values whose
 * level breakdowns match merge into one row (all three merging means time doesn't matter, so
 * the time label is dropped). Exported for the Dex Locations sub-tab's grouping needs. */
export function groupEncounterDetails(details: EncounterDetail[], methods: string[]): EncounterRow[] {
  const groups = new Map<string, DetailGroup>()
  for (const d of details) {
    const times = d.conditionValues.filter((c) => c.startsWith('time-'))
    const others = d.conditionValues.filter((c) => !c.startsWith('time-')).sort()
    const key = `${d.methodIndex}|${others.join(',')}`
    let group = groups.get(key)
    if (!group) {
      group = {
        method: slugDisplayName(methods[d.methodIndex]),
        category: methodCategory(methods[d.methodIndex]).key,
        otherConditions: others,
        byTime: new Map()
      }
      groups.set(key, group)
    }
    for (const time of times.length > 0 ? times : [ANY_TIME]) {
      let slots = group.byTime.get(time)
      if (!slots) {
        slots = new Map()
        group.byTime.set(time, slots)
      }
      const levelKey = levelLabel(d.minLevel, d.maxLevel)
      const slot = slots.get(levelKey)
      if (slot) slot.chance += d.chance
      else slots.set(levelKey, { minLevel: d.minLevel, maxLevel: d.maxLevel, chance: d.chance })
    }
  }

  const rows: Array<EncounterRow & { total: number }> = []
  for (const group of groups.values()) {
    const bySignature = new Map<string, { slots: LevelSlot[]; times: string[] }>()
    for (const [time, slotMap] of group.byTime) {
      const slots = [...slotMap.values()].sort((a, b) => a.minLevel - b.minLevel || a.maxLevel - b.maxLevel)
      const signature = levelsLabel(slots)
      const cluster = bySignature.get(signature)
      if (cluster) cluster.times.push(time)
      else bySignature.set(signature, { slots, times: [time] })
    }
    for (const [levels, { slots, times }] of bySignature) {
      const realTimes = TIME_ORDER.filter((t) => times.includes(t))
      const timeLabel =
        realTimes.length === 0 || realTimes.length === TIME_ORDER.length
          ? []
          : [realTimes.map((t) => slugDisplayName(t.replace(/^time-/, ''))).join(', ')]
      const conditions = [...timeLabel, ...group.otherConditions.map(slugDisplayName)].join(', ')
      rows.push({
        method: group.method,
        category: group.category,
        levels,
        conditions: conditions === '' ? null : conditions,
        total: slots.reduce((sum, s) => sum + s.chance, 0)
      })
    }
  }
  return rows
    .sort((a, b) => b.total - a.total || a.method.localeCompare(b.method) || (a.conditions ?? '').localeCompare(b.conditions ?? ''))
    .map(({ total: _total, ...row }) => row)
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
  /** Base game's generation, for the Gen I-IX toggle filter; null when unknown. */
  generation: number | null
  locations: EncounterLocationRows[]
}

/** Sections belonging to the Gen I-IX toggle's generation. A section whose game has no
 * ORIGIN_GAMES entry (unknown generation) is kept rather than silently dropped. */
export function filterSectionsByGeneration(sections: GameEncounterSection[], generation: number): GameEncounterSection[] {
  return sections.filter((s) => s.generation === null || s.generation === generation)
}

/** One-line collapsed-header summary, e.g. "Gold — 41 locations". */
export function sectionSummary(section: GameEncounterSection): string {
  const n = section.locations.length
  return `${section.label} — ${n} ${n === 1 ? 'location' : 'locations'}`
}

/** Encounter sections for one form's pokeapiId, one per game/DLC in release order; `[]` if
 * this form has no PokeAPI encounter data at all (an excluded game, or a form PokeAPI
 * records no wild encounters for). Same opt-in-field contract as safariFleeRatesForSpecies:
 * SpeciesPage hides the Where to Find field entirely when this returns []. Within a game,
 * locations sort alphabetically and rows by total chance descending. */
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
      const rows = groupEncounterDetails(versionDetail.encounterDetails, encounterData.methods)
      working.locations.push({ location, rows })
    }
  }

  return [...byVersion.values()]
    .sort((a, b) => a.ref.sortKey.localeCompare(b.ref.sortKey) || a.ref.label.localeCompare(b.ref.label))
    .map(({ ref, locations }) => ({
      gameId: ref.gameId,
      label: ref.label,
      generation: ref.generation,
      locations: locations.sort((a, b) => a.location.localeCompare(b.location))
    }))
}
