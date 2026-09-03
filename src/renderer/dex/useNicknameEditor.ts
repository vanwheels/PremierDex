import { useEffect, useState } from 'react'
import type { CollectionEntry, CollectionEntryOriginInput } from '@shared/types/pokemon'

export interface NicknameEditor {
  text: string
  setText: (text: string) => void
  commit: () => void
}

/**
 * Local nickname-input state for one CollectionEntry, shared by DexRow (which resolves
 * `entry` via activeNicknameEntry, since a Dex row pairs a regular + shiny slot) and
 * CollectionRow (Leg 18, which passes its one entry directly). Re-syncs when the edited
 * entry — or its stored nickname — changes out from under it: a toggle to/from owned
 * swaps which entry is active in DexRow, and an external update (another window, or
 * switching CollectionView's group-by) can change the stored value directly.
 *
 * commit() writes a full origin snapshot (see CollectionEntryOriginInput), carrying the
 * entry's other origin fields through unchanged so a nickname-only edit never blanks
 * them out.
 */
export function useNicknameEditor(
  entry: CollectionEntry | null,
  onSaveOrigin: (entryId: number, input: CollectionEntryOriginInput) => void
): NicknameEditor {
  const [text, setText] = useState(entry?.nickname ?? '')

  useEffect(() => {
    setText(entry?.nickname ?? '')
  }, [entry?.id, entry?.nickname])

  const commit = (): void => {
    if (!entry) return
    const trimmed = text.trim()
    if (trimmed === (entry.nickname ?? '')) return
    onSaveOrigin(entry.id, {
      trainerProfileId: entry.trainerProfileId,
      originGame: entry.originGame,
      otName: entry.otName,
      tid: entry.tid,
      sid: entry.sid,
      language: entry.language,
      nickname: trimmed || null,
      caughtBall: entry.caughtBall,
      metLocation: entry.metLocation
    })
  }

  return { text, setText, commit }
}
