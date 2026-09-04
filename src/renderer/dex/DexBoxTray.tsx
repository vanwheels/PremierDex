import { useState } from 'react'
import type { UnboxedEntry } from './types'
import { SpriteThumbnail } from './SpriteThumbnail'
import { readDragEntryPayload, setDragEntryPayload } from './dragEntryPayload'

// Vanny feedback 2026-09-03: a middle ground between the old 32px tray sprite and the
// 96px box-cell sprite (DexBoxGrid's CELL_SPRITE_SIZE) — the tray reads more like a
// scaled-down box now rather than a plain list.
const TRAY_SPRITE_SIZE = 64

interface DexBoxTrayProps {
  entries: UnboxedEntry[]
  onDropEntry: (entryId: number) => void
  /** Vanny feedback 2026-09-03: left-clicking a tray item places it into the current
   * box's first open slot, same entry id the drag payload already carries. */
  onClickEntry: (entryId: number) => void
}

/**
 * "Unboxed" panel (Leg 7 of the Box Arrangement milestone) — every entry in the selected
 * Storage Location with no box position yet, the drag source for placing an entry into an
 * empty DexBoxGrid cell. Also a drop target itself: dropping a currently-boxed cell here
 * is how "remove from box" works via drag-and-drop (see DexBoxGrid's handleDropOnTray).
 *
 * Each item wraps SpriteThumbnail in a plain draggable <div> rather than adding drag
 * props to SpriteThumbnail itself — that component is shared with DexRow/DexHybridGrid
 * and has no reason to know about Box view's drag-and-drop. SpriteThumbnail's own onClick
 * is wired to onClickEntry (Vanny feedback 2026-09-03) as a one-click shortcut for the
 * drag: place into the current box's first open slot.
 */
export function DexBoxTray({ entries, onDropEntry, onClickEntry }: DexBoxTrayProps): JSX.Element {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? entries.filter((item) => item.displayName.toLowerCase().includes(query.trim().toLowerCase()))
    : entries

  return (
    <div
      className="dex-box-tray"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const entryId = readDragEntryPayload(e)
        if (entryId !== null) onDropEntry(entryId)
      }}
    >
      <h3 className="dex-box-tray-heading">Unboxed ({entries.length})</h3>
      <input
        type="text"
        className="dex-box-tray-search"
        placeholder="Filter…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Filter unboxed entries"
      />
      <div className="dex-box-tray-list">
        {filtered.length === 0 && (
          <p className="dex-box-tray-empty">Nothing unboxed{query ? ' matching that filter' : ''}.</p>
        )}
        {filtered.map((item) => (
          <div
            key={item.entry.id}
            className="dex-box-tray-item"
            draggable
            onDragStart={(e) => setDragEntryPayload(e, item.entry.id)}
            title={item.displayName}
          >
            <SpriteThumbnail
              pokeapiId={item.pokeapiId}
              spriteFormSuffix={item.spriteFormSuffix}
              female={item.femaleSprite}
              shiny={item.entry.shiny}
              size={TRAY_SPRITE_SIZE}
              displayName={item.displayName}
              ariaLabel={item.displayName}
              className={item.entry.owned ? undefined : 'dex-hybrid-tile-unowned'}
              onClick={() => onClickEntry(item.entry.id)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
