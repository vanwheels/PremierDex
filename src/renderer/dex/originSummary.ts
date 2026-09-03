import type { CollectionEntry } from '@shared/types/pokemon'

/** Origin summary shown as the Origin button's tooltip once set — OT/TID/SID/language/
 * game/caughtBall, the same fields OriginModal itself edits. Omits whichever of
 * TID/SID/language/caughtBall is null (unshown by that origin game, or just never set)
 * rather than printing "TID: —". Shared by DexRow and CollectionRow (Leg 18). */
export function originTitle(entry: CollectionEntry | null): string | undefined {
  if (!entry || !entry.otName) return undefined
  const parts = [`OT: ${entry.otName}`]
  if (entry.tid !== null) parts.push(`TID: ${entry.tid}`)
  if (entry.sid !== null) parts.push(`SID: ${entry.sid}`)
  if (entry.language) parts.push(entry.language)
  if (entry.originGame) parts.push(entry.originGame)
  if (entry.caughtBall) parts.push(entry.caughtBall)
  return parts.join(' · ')
}
