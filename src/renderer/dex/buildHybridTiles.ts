import type { CollectionEntry } from '@shared/types/pokemon'
import type { DexRowData, DexSection } from './types'

/** One sprite tile in the Hybrid grid — always backed by a real CollectionEntry (owned or
 * not), since a slot with no entry at all (alwaysShiny forms have no regular individual,
 * shinyLocked forms have no shiny one) contributes no tile rather than an empty one. */
export interface DexHybridTile {
  key: string
  row: DexRowData
  shiny: boolean
  entry: CollectionEntry
}

function tileForSlot(row: DexRowData, shiny: boolean): DexHybridTile | null {
  const entry = shiny ? row.shinyEntry : row.regular
  if (!entry) return null
  return { key: `${row.key}-${shiny ? 'shiny' : 'regular'}`, row, shiny, entry }
}

/**
 * Flattens filtered/sorted DexSections (Leg 8) into the flat tile list the Hybrid grid
 * renders. Up to two tiles per row — regular-slot and shiny-slot, mirroring List view's
 * own two-column pairing — each rendered as a real sprite when its entry is owned, or a
 * greyed-out placeholder when it's merely within the active filter scope (i.e. the row
 * survived filterDexSections). A slot with no CollectionEntry at all — alwaysShiny forms
 * have no regular individual, shinyLocked forms have no shiny one, see DexRowData's doc
 * comment — contributes no tile, not even a placeholder.
 *
 * Only `section.rows`, never `cosmeticRows`, feed tiles: unlike List view, a sprite grid
 * has nowhere to put a per-species expand/collapse toggle, so Hybrid always shows the same
 * default-collapsed slice List view shows before a species is expanded — consistent with
 * Vanny's "the list, just sprites" framing for this view mode (see TODO.md). A cosmetic
 * row matched by a search query still appears: filterDexSections already promotes it into
 * `rows` in that case, so this function never needs its own cosmetic-row special case.
 */
export function buildHybridTiles(sections: DexSection[]): DexHybridTile[] {
  const tiles: DexHybridTile[] = []
  for (const section of sections) {
    for (const row of section.rows) {
      const regularTile = tileForSlot(row, false)
      if (regularTile) tiles.push(regularTile)
      const shinyTile = tileForSlot(row, true)
      if (shinyTile) tiles.push(shinyTile)
    }
  }
  return tiles
}
