import type { DragEvent } from 'react'

/** Custom MIME (Leg 7 of the Box Arrangement milestone) rather than 'text/plain' — so a
 * stray drag from outside Box view (e.g. dragging selected table text) can't be misread
 * as an entry id drop. Every drag source in Box view (a filled DexBoxGrid cell, a
 * DexBoxTray item) carries the dragged CollectionEntry id(s), comma-joined (Leg 4 of the
 * Box View Polish milestone: multi-select drag carries every selected entry's id, in
 * selection order — a single-item drag is just the one-element case); every drop target
 * (a box cell, the tray itself) reads it back and decides what to do based on its own
 * current state — see DexBoxPane's handleDropOnSlot/DexBoxGrid's handleDropOnTray. */
const DRAG_ENTRY_MIME = 'application/x-premierdex-entry-id'

export function setDragEntryPayload(event: DragEvent, entryIds: number[]): void {
  event.dataTransfer.setData(DRAG_ENTRY_MIME, entryIds.join(','))
  event.dataTransfer.effectAllowed = 'move'
}

/** Null if the drop didn't carry our payload (e.g. a drag from outside Box view landed
 * here) or carried a malformed one. Otherwise the dragged entry id(s) in their original
 * drag-start order, always at least one. */
export function readDragEntryPayload(event: DragEvent): number[] | null {
  const raw = event.dataTransfer.getData(DRAG_ENTRY_MIME)
  if (!raw) return null
  const ids = raw.split(',').map(Number)
  if (ids.length === 0 || ids.some((id) => !Number.isInteger(id))) return null
  return ids
}
