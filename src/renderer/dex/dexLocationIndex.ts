import type { EncounterData } from '@shared/types/encounters'
import type { Form, Species } from '@shared/types/pokemon'
import { gameRefForVersion, locationAreaLabel } from './encountersFormat'
import { formDisplayName, speciesDisplayName } from './formNames'

/**
 * Full UI/UX pass Leg 4: the Dex tab's Locations sub-tab data — the inverse of
 * encountersFormat.ts's per-form "Where to Find" grouping. encounters.json is keyed
 * pokeapiId -> location areas; this flips it to location area -> species/forms found
 * there, each with the games that have that encounter. Built once per data load (a full
 * pass over every encounter row), not per keystroke.
 */
export interface LocationSpeciesEntry {
  speciesId: number
  formName: string
  displayName: string
  /** Display-joined games (release order) with any encounter of this form here, e.g.
   * "Ruby/Sapphire/Emerald". */
  gamesLabel: string
}

export interface DexLocation {
  name: string
  species: LocationSpeciesEntry[]
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

export function buildDexLocations(encounterData: EncounterData, species: Species[], forms: Form[]): DexLocation[] {
  const speciesById = new Map(species.map((s) => [s.id, s]))
  const formByPokeapiId = formsByPokeapiId(forms)

  interface Working {
    entry: Omit<LocationSpeciesEntry, 'gamesLabel'>
    games: Map<string, string>
  }
  const locations = new Map<string, Map<number, Working>>()

  for (const [pokeapiIdKey, areas] of Object.entries(encounterData.encounters)) {
    const pokeapiId = Number(pokeapiIdKey)
    const form = formByPokeapiId.get(pokeapiId)
    const sp = form && speciesById.get(form.speciesId)
    if (!form || !sp) continue
    const displayName = formDisplayName(speciesDisplayName(sp.name), form)

    for (const area of areas) {
      const name = locationAreaLabel(encounterData.locationAreas[area.locationAreaIndex])
      let inLocation = locations.get(name)
      if (!inLocation) {
        inLocation = new Map()
        locations.set(name, inLocation)
      }
      let working = inLocation.get(pokeapiId)
      if (!working) {
        working = { entry: { speciesId: sp.id, formName: form.formName, displayName }, games: new Map() }
        inLocation.set(pokeapiId, working)
      }
      for (const versionDetail of area.versionDetails) {
        const game = gameRefForVersion(encounterData.versions[versionDetail.versionIndex])
        working.games.set(game.sortKey, game.label)
      }
    }
  }

  return [...locations.entries()]
    .map(([name, inLocation]) => ({
      name,
      species: [...inLocation.values()]
        .map(({ entry, games }) => ({
          ...entry,
          gamesLabel: [...games.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, label]) => label)
            .join('/')
        }))
        .sort((a, b) => a.speciesId - b.speciesId)
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Case-insensitive substring match on the location name. Blank query matches all. */
export function filterDexLocations(locations: DexLocation[], query: string): DexLocation[] {
  const needle = query.trim().toLowerCase()
  return needle ? locations.filter((l) => l.name.toLowerCase().includes(needle)) : locations
}
