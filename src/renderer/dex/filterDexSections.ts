import type { DexFilters, DexRowData, DexSection, FilterTriState } from './types'

function matchesTriState(state: FilterTriState, value: boolean): boolean {
  if (state === 'any') return true
  return state === 'yes' ? value : !value
}

/** Every entry-scoped text field a search query can match against, for one owned
 * individual (regular or shiny). Nulls are skipped rather than stringified so an unset
 * field never accidentally matches an empty query substring. */
function entryTextFields(entry: DexRowData['regular']): string[] {
  if (!entry) return []
  const fields = [entry.nickname, entry.otName, entry.originGame, entry.language]
  if (entry.tid !== null) fields.push(String(entry.tid))
  if (entry.sid !== null) fields.push(String(entry.sid))
  return fields.filter((f): f is string => f !== null)
}

/**
 * One free-text query matched against name, dex#, nickname, and origin settings (OT
 * name/origin game/language/TID/SID) of either owned entry — see DexFilters' doc comment
 * for why this is a single field rather than one box per dimension. Case-insensitive
 * substring match throughout, including the dex# (so "25" matches #25 and #250 alike,
 * consistent with how the name match works).
 */
function matchesQuery(row: DexRowData, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  if (row.displayName.toLowerCase().includes(needle)) return true
  if (String(row.dexNumber).includes(needle)) return true
  const entryFields = [...entryTextFields(row.regular), ...entryTextFields(row.shinyEntry)]
  return entryFields.some((f) => f.toLowerCase().includes(needle))
}

function rowMatches(row: DexRowData, filters: DexFilters): boolean {
  if (!matchesQuery(row, filters.query)) return false
  if (!matchesTriState(filters.owned, row.regular?.owned ?? false)) return false
  if (!matchesTriState(filters.shiny, row.shinyEntry?.owned ?? false)) return false
  if (!matchesTriState(filters.regional, row.regionalGroup !== null)) return false
  if (filters.generation !== 'any' && row.firstAvailableGeneration !== filters.generation) return false
  if (!matchesTriState(filters.homeBoxable, row.homeBoxable)) return false
  if (!matchesTriState(filters.shinyLocked, row.shinyLocked)) return false
  return true
}

/**
 * Narrows already-built sections down to the rows matching every active filter
 * dimension (each dimension is independently AND-ed together; 'any'/blank means that
 * dimension imposes no constraint). Runs after buildDexSections, over its view-shaped
 * output — filters never affect stored data.
 *
 * A section survives only if at least one of its rows or cosmeticRows still matches. If
 * none of the plain `rows` match but a cosmeticRow does (e.g. searching a cosmetic
 * variant's own name, like an Unown letter), that cosmetic row is promoted into `rows`
 * so it renders directly — otherwise it would be unreachable, since the collapse/expand
 * toggle that normally reveals cosmeticRows lives on rows[0], which just got filtered
 * out.
 */
export function filterDexSections(sections: DexSection[], filters: DexFilters): DexSection[] {
  const result: DexSection[] = []
  for (const section of sections) {
    const matchedRows = section.rows.filter((row) => rowMatches(row, filters))
    if (matchedRows.length > 0) {
      const matchedCosmetic = section.cosmeticRows.filter((row) => rowMatches(row, filters))
      result.push({ ...section, rows: matchedRows, cosmeticRows: matchedCosmetic })
      continue
    }
    const matchedCosmetic = section.cosmeticRows.filter((row) => rowMatches(row, filters))
    if (matchedCosmetic.length > 0) {
      result.push({ ...section, rows: matchedCosmetic, cosmeticRows: [] })
    }
  }
  return result
}
