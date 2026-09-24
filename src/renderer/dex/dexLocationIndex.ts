import type { EncounterData, EncounterDetail } from '@shared/types/encounters'
import type { Form, Species } from '@shared/types/pokemon'
import { conditionTogglesFor, type ConditionToggle } from './encounterConditions'
import { gameRefForVersion, locationAreaLabel } from './encountersFormat'
import { formDisplayName, speciesDisplayName } from './formNames'

/**
 * The Dex tab's Locations sub-tab data (Encounter display rework Leg 3) — the inverse of
 * encountersFormat.ts's per-form "Where to Find" grouping. encounters.json is keyed
 * pokeapiId -> location areas -> versions; this flips it to game -> location -> species/forms,
 * keeping each entry's raw encounter details so the pane can re-group them under the time/
 * weather/etc. toggles. Built once per data load (a full pass over every encounter row), not
 * per keystroke.
 *
 * Each regional/alternate form is its own entry rather than folding to one per species like
 * the Pokémon list: encounters are per form, and "Alolan Rattata" vs "Rattata" is exactly what
 * someone looking at a location wants to tell apart.
 */
export interface LocationSpeciesEntry {
  speciesId: number
  formName: string
  displayName: string
  /** Every encounter detail for this form at this game's location, ungrouped. */
  details: EncounterDetail[]
}

export interface DexLocation {
  name: string
  species: LocationSpeciesEntry[]
  /** Condition toggles this location's encounters vary in (empty when none do). */
  toggles: ConditionToggle[]
}

export interface DexGame {
  /** Version-derived label, incl. the Isle of Armor/Crown Tundra suffix. */
  label: string
  gameId: string
  generation: number | null
  locations: DexLocation[]
}

/** pokeapiId -> the form the reference should attribute its encounters to. Cosmetic
 * sub-forms share their base form's pokeapiId, so they're skipped in favor of the row that
 * actually owns the id; Species/forms with no such row simply have no location entries. */
function formsByPokeapiId(forms: Form[]): Map<number, Form> {
  const byId = new Map<number, Form>()
  for (const form of forms) {
    if (form.formCategory === 'cosmetic_variant') continue
    if (!byId.has(form.pokeapiId)) byId.set(form.pokeapiId, form)
  }
  return byId
}

export function buildDexGames(encounterData: EncounterData, species: Species[], forms: Form[]): DexGame[] {
  const speciesById = new Map(species.map((s) => [s.id, s]))
  const formByPokeapiId = formsByPokeapiId(forms)

  interface Working {
    ref: ReturnType<typeof gameRefForVersion>
    locations: Map<string, Map<number, LocationSpeciesEntry>>
  }
  const byVersion = new Map<string, Working>()

  for (const [pokeapiIdKey, areas] of Object.entries(encounterData.encounters)) {
    const pokeapiId = Number(pokeapiIdKey)
    const form = formByPokeapiId.get(pokeapiId)
    const sp = form && speciesById.get(form.speciesId)
    if (!form || !sp) continue
    const displayName = formDisplayName(speciesDisplayName(sp.name), form)

    for (const area of areas) {
      const locationName = locationAreaLabel(encounterData.locationAreas[area.locationAreaIndex])
      for (const versionDetail of area.versionDetails) {
        const versionName = encounterData.versions[versionDetail.versionIndex]
        let game = byVersion.get(versionName)
        if (!game) {
          game = { ref: gameRefForVersion(versionName), locations: new Map() }
          byVersion.set(versionName, game)
        }
        let inLocation = game.locations.get(locationName)
        if (!inLocation) {
          inLocation = new Map()
          game.locations.set(locationName, inLocation)
        }
        const entry = inLocation.get(pokeapiId)
        if (entry) entry.details = entry.details.concat(versionDetail.encounterDetails)
        else
          inLocation.set(pokeapiId, {
            speciesId: sp.id,
            formName: form.formName,
            displayName,
            details: versionDetail.encounterDetails
          })
      }
    }
  }

  return [...byVersion.values()]
    .sort((a, b) => a.ref.sortKey.localeCompare(b.ref.sortKey) || a.ref.label.localeCompare(b.ref.label))
    .map(({ ref, locations }) => ({
      label: ref.label,
      gameId: ref.gameId,
      generation: ref.generation,
      locations: [...locations.entries()]
        .map(([name, inLocation]) => {
          const entries = [...inLocation.values()].sort((a, b) => a.speciesId - b.speciesId)
          return { name, species: entries, toggles: conditionTogglesFor(entries.flatMap((e) => e.details)) }
        })
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    }))
}

/** Case-insensitive substring match on the location name. Blank query matches all. */
export function filterDexLocations(locations: DexLocation[], query: string): DexLocation[] {
  const needle = query.trim().toLowerCase()
  return needle ? locations.filter((l) => l.name.toLowerCase().includes(needle)) : locations
}
