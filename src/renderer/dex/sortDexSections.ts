import type { DexSection, DexSort, DexSortKey } from './types'

/** A section's dex#/name/generation are uniform across its own `rows` (buildRows always
 * seeds one form's dexNumber/generation per section), so the first row stands in for the
 * whole section. A grouped-mode regional-cluster section (speciesId null) has no single
 * generation of its own either — it likewise sorts on whichever species happened to land
 * in `rows[0]` first, per Vanny's call. */
function representativeRow(section: DexSection) {
  return section.rows[0]
}

function sortValue(section: DexSection, key: DexSortKey): number | string | boolean {
  const row = representativeRow(section)
  switch (key) {
    case 'dexNumber':
      return row.dexNumber
    case 'name':
      return section.heading.toLowerCase()
    case 'generation':
      return row.firstAvailableGeneration
    case 'owned':
      return section.rows.some((r) => r.regular?.owned ?? false)
    case 'shiny':
      return section.rows.some((r) => r.shinyEntry?.owned ?? false)
  }
}

/**
 * Orders already-built (and already-filtered) sections by one clickable column
 * (DexTable's header buttons — Leg 16). `sort: null` (the default) leaves the input
 * order untouched. Only reorders sections; a section's own row order (cosmetic variants,
 * gender splits) is never touched — see DEFAULT_DEX_SORT's doc comment.
 *
 * Array.prototype.sort is stable (guaranteed since ES2019), so equal keys keep their
 * relative natural-order position rather than needing an explicit tie-break.
 */
export function sortDexSections(sections: DexSection[], sort: DexSort | null): DexSection[] {
  if (!sort) return sections
  const factor = sort.direction === 'asc' ? 1 : -1
  return [...sections].sort((a, b) => {
    const va = sortValue(a, sort.key)
    const vb = sortValue(b, sort.key)
    if (va < vb) return -factor
    if (va > vb) return factor
    return 0
  })
}
