import type { DragEvent } from 'react'

/** Custom MIME (Leg 7 of the Box Arrangement milestone) rather than 'text/plain' — so a
 * stray drag from outside Box view (e.g. dragging selected table text) can't be misread
 * as an entry id drop. Every drag source in Box view (a filled DexBoxGrid cell, a
 * DexBoxTray item) carries just the dragged CollectionEntry's id; every drop target (a
 * box cell, the tray itself) reads it back and decides what to do based on its own
 * current state — see DexBoxGrid's handleDropOnSlot/handleDropOnTray. */
const DRAG_ENTRY_MIME = 'application/x-premierdex-entry-id'

export function setDragEntryPayload(event: DragEvent, entryId: number): void {
  event.dataTransfer.setData(DRAG_ENTRY_MIME, String(entryId))
  event.dataTransfer.effectAllowed = 'move'
}

/** Null if the drop didn't carry our payload (e.g. a drag from outside Box view landed
 * here) or carried a malformed one. */
export function readDragEntryPayload(event: DragEvent): number | null {
  const raw = event.dataTransfer.getData(DRAG_ENTRY_MIME)
  if (!raw) return null
  const id = Number(raw)
  return Number.isInteger(id) ? id : null
}
