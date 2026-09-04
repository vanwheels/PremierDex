import { useState } from 'react'
import type { UnboxedEntry } from './types'
import { SpriteThumbnail } from './SpriteThumbnail'
import { readDragEntryPayload, setDragEntryPayload } from './dragEntryPayload'

const TRAY_SPRITE_SIZE = 32

interface DexBoxTrayProps {
  entries: UnboxedEntry[]
  onDropEntry: (entryId: number) => void
}

/**
 * "Unboxed" panel (Leg 7 of the Box Arrangement milestone) — every entry in the selected
 * Storage Location with no box position yet, the drag source for placing an entry into an
 * empty DexBoxGrid cell. Also a drop target itself: dropping a currently-boxed cell here
 * is how "remove from box" works via drag-and-drop (see DexBoxGrid's handleDropOnTray).
 *
 * Each item wraps SpriteThumbnail in a plain draggable <div> rather than adding drag
 * props to SpriteThumbnail itself — that component is shared with DexRow/DexHybridGrid
 * and has no reason to know about Box view's drag-and-drop. SpriteThumbnail's own
 * onClick stays a no-op here: items are drag-only this leg, there's no click action to
 * wire it to yet.
 */
export function DexBoxTray({ entries, onDropEntry }: DexBoxTrayProps): JSX.Element {
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
              onClick={() => {}}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
