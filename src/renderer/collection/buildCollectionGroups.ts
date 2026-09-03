import type { CollectionEntry, Form, Gender, Species } from '@shared/types/pokemon'
import { capitalizeWords, formDisplayName } from '../dex/formNames'
import { compareGames } from '../shared/gameSort'
import type { CollectionGroup, CollectionGroupBy, CollectionRowData } from './types'

const NO_ORIGIN_LABEL = 'No origin set'
const NO_OT_LABEL = 'No OT set'
const REGULAR_LABEL = 'Regular'
const SHINY_LABEL = 'Shiny'

function genderSuffix(gender: Gender): string {
  if (gender === 'male') return ' ♂'
  if (gender === 'female') return ' ♀'
  return ''
}

function buildRow(entry: CollectionEntry, species: Species, form: Form): CollectionRowData {
  const baseName = formDisplayName(capitalizeWords(species.name), form)
  return {
    key: String(entry.id),
    entry,
    dexNumber: species.id,
    displayName: `${baseName}${genderSuffix(entry.gender)}${entry.shiny ? ' ✨' : ''}`,
    pokeapiId: form.pokeapiId,
    spriteFormSuffix: form.spriteFormSuffix,
    firstAvailableGeneration: form.firstAvailableGeneration
  }
}

/** Which group an owned entry belongs to, per dimension. For 'shiny'/'originGame', key
 * and label are the same string (grouping strings there are already the exact display
 * text). For 'ot', the key is the unique TID+SID pair rather than the name — Vanny has
 * multiple OTs named "vanny" from different games/saves that are distinct trainers, and
 * a name-keyed group would wrongly merge them. otName is display-only there, so two
 * same-trainer entries with a differently-spelled otName (a fixed typo, say) still group
 * together under whichever name the first-seen entry carries. Entries missing a tid/sid
 * (no origin set, or an older entry predating Leg 14's language field) fall back to
 * grouping by name, same as before this leg. For 'dexNumber' (Leg 21), the group is the
 * species itself — every form of a species shares its national dex number, so forms fold
 * into one group the same way buildDexSections' species sections do; the key is the
 * numeric dex number (padded so string comparison would still work, though sorting below
 * compares it numerically) and the label carries both the number and the species name. */
function groupFor(entry: CollectionEntry, groupBy: CollectionGroupBy, species: Species): { key: string; label: string } {
  if (groupBy === 'shiny') {
    return entry.shiny ? { key: SHINY_LABEL, label: SHINY_LABEL } : { key: REGULAR_LABEL, label: REGULAR_LABEL }
  }
  if (groupBy === 'originGame') {
    const label = entry.originGame ?? NO_ORIGIN_LABEL
    return { key: label, label }
  }
  if (groupBy === 'dexNumber') {
    const key = String(species.id).padStart(4, '0')
    return { key, label: `#${species.id} ${capitalizeWords(species.name)}` }
  }
  const label = entry.otName ?? NO_OT_LABEL
  if (entry.tid !== null && entry.sid !== null) {
    return { key: `tid:${entry.tid}/sid:${entry.sid}`, label }
  }
  return { key: `name:${label}`, label }
}

/** Orders groups: 'shiny' is a fixed Regular-then-Shiny pair; 'originGame' reuses
 * compareGames' release-date order (same helper TrainerProfilesPanel/
 * StorageLocationsPanel already sort by), treating the synthetic "No origin set" bucket
 * as compareGames' null case so it always sorts last; 'ot' is alphabetical by label (the
 * key is a TID/SID pair or synthetic name string, not something sort order should follow)
 * with "No OT set" sorted last the same way; 'dexNumber' sorts numerically by the
 * zero-padded key groupFor produced. */
function compareGroupKeys(a: CollectionGroup, b: CollectionGroup, groupBy: CollectionGroupBy): number {
  if (groupBy === 'shiny') return a.key === REGULAR_LABEL ? -1 : b.key === REGULAR_LABEL ? 1 : 0
  if (groupBy === 'originGame') {
    return compareGames(a.key === NO_ORIGIN_LABEL ? null : a.key, b.key === NO_ORIGIN_LABEL ? null : b.key, 'game-release')
  }
  if (groupBy === 'dexNumber') return a.key.localeCompare(b.key)
  const aNone = a.label === NO_OT_LABEL
  const bNone = b.label === NO_OT_LABEL
  if (aNone !== bNone) return aNone ? 1 : -1
  return a.label.localeCompare(b.label)
}

/**
 * Reshapes the collection into groups by one dimension at a time (Leg 18) — a different
 * lens than buildDexSections.ts's species-first grid. Owned entries only: origin/OT/shiny
 * data is only ever meaningful for an owned CollectionEntry (see its doc comment in
 * shared/types/pokemon.ts), so an unowned entry has nothing to group by. Entries whose
 * form or species can't be resolved are skipped (shouldn't happen with a consistent DB,
 * but keeps this defensive the same way buildDexSections' Map lookups are).
 */
export function buildCollectionGroups(
  species: Species[],
  forms: Form[],
  entries: CollectionEntry[],
  groupBy: CollectionGroupBy
): CollectionGroup[] {
  const speciesById = new Map(species.map((s) => [s.id, s]))
  const formsById = new Map(forms.map((f) => [f.id, f]))

  const groups = new Map<string, CollectionGroup>()
  for (const entry of entries) {
    if (!entry.owned) continue
    const form = formsById.get(entry.formId)
    if (!form) continue
    const sp = speciesById.get(form.speciesId)
    if (!sp) continue

    const { key, label } = groupFor(entry, groupBy, sp)
    let group = groups.get(key)
    if (!group) {
      group = { key, label, rows: [] }
      groups.set(key, group)
    }
    group.rows.push(buildRow(entry, sp, form))
  }

  for (const group of groups.values()) {
    group.rows.sort((a, b) => a.dexNumber - b.dexNumber || a.displayName.localeCompare(b.displayName))
  }

  return [...groups.values()].sort((a, b) => compareGroupKeys(a, b, groupBy))
}
