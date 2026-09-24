import type { Form, Species } from '@shared/types/pokemon'
import type { SpeciesDetailsData } from '@shared/types/species-details'
import { formDisplayName, speciesDisplayName } from './formNames'
import { slugDisplayName } from './speciesPageFormat'

/**
 * Full UI/UX pass Leg 4: row model for the Dex tab's Pokémon list. Reference-only — no
 * ownership concept, so unlike buildDexSections this reads straight from species/forms/
 * speciesDetails and never touches collection entries.
 *
 * One row per species+form the reference should list: dex_distinct and non_boxable forms
 * (Megas etc. — the reference sketch lists them as their own rows) but not
 * cosmetic_variant sub-forms, which share a pokeapiId with their base form and carry no
 * distinct reference data.
 */
export interface DexListRow {
  speciesId: number
  formName: string
  displayName: string
  generation: number
  abilities: Array<{ name: string; isHidden: boolean }>
}

export type DexListSortKey = 'dex' | 'name' | 'abilities'
export type DexListSortDirection = 'asc' | 'desc'

export interface DexListSort {
  key: DexListSortKey
  direction: DexListSortDirection
}

export interface DexListGeneration {
  generation: number
  rows: DexListRow[]
}

export function buildDexListRows(species: Species[], forms: Form[], speciesDetails: SpeciesDetailsData): DexListRow[] {
  const speciesById = new Map(species.map((s) => [s.id, s]))
  const rows: DexListRow[] = []
  for (const form of forms) {
    if (form.formCategory === 'cosmetic_variant') continue
    const sp = speciesById.get(form.speciesId)
    if (!sp) continue
    rows.push({
      speciesId: sp.id,
      formName: form.formName,
      displayName: formDisplayName(speciesDisplayName(sp.name), form),
      generation: sp.generation,
      abilities: (speciesDetails.forms[form.pokeapiId]?.abilities ?? []).map((a) => ({
        name: slugDisplayName(a.name),
        isHidden: a.isHidden
      }))
    })
  }
  // Stable National Dex order (forms.json order within a species) — the default view and
  // the tiebreak every other sort key falls back to.
  return rows.sort((a, b) => a.speciesId - b.speciesId)
}

/** Case-insensitive substring match against name, National Dex # (so "25" matches #25 and
 * #250, same as filterDexSections), and any ability name. Blank query matches everything. */
export function filterDexListRows(rows: DexListRow[], query: string): DexListRow[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return rows
  return rows.filter(
    (row) =>
      row.displayName.toLowerCase().includes(needle) ||
      String(row.speciesId).includes(needle) ||
      row.abilities.some((a) => a.name.toLowerCase().includes(needle))
  )
}

function firstAbility(row: DexListRow): string {
  return row.abilities[0]?.name ?? ''
}

/** Sorts a copy. Ties (and the 'dex' key itself) resolve by National Dex # ascending, so a
 * descending sort never scrambles a species' own forms relative to each other — Array.sort
 * is stable, so form order within a species is kept from the input. */
export function sortDexListRows(rows: DexListRow[], sort: DexListSort): DexListRow[] {
  const sign = sort.direction === 'asc' ? 1 : -1
  const byDex = (a: DexListRow, b: DexListRow): number => a.speciesId - b.speciesId
  const compare = (a: DexListRow, b: DexListRow): number => {
    if (sort.key === 'dex') return sign * byDex(a, b)
    const primary =
      sort.key === 'name'
        ? a.displayName.localeCompare(b.displayName)
        : firstAbility(a).localeCompare(firstAbility(b))
    return primary !== 0 ? sign * primary : byDex(a, b)
  }
  return [...rows].sort(compare)
}

/** Generation section headers, as in the reference sketch. Only meaningful when rows are
 * in Dex order — the caller skips this for the other sort keys. Preserves row order,
 * opening a new group each time the generation changes. */
export function groupRowsByGeneration(rows: DexListRow[]): DexListGeneration[] {
  const groups: DexListGeneration[] = []
  for (const row of rows) {
    const last = groups[groups.length - 1]
    if (last && last.generation === row.generation) last.rows.push(row)
    else groups.push({ generation: row.generation, rows: [row] })
  }
  return groups
}
