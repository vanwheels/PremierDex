import type Database from 'better-sqlite3'
import type { CollectionEntry, CollectionEntryOriginInput, Gender } from '@shared/types/pokemon'
import { toCollectionEntry, type CollectionEntryRow } from './row-mappers'

/**
 * setOwned/setEntryOrigin/setEntryStorageLocation/box-position/bulk-*, split out of
 * sqlite-storage.ts (Leg 3 of the Codebase File-Size Cleanup milestone) per the "Split
 * sqlite-storage.ts" TODO item — this group was the file's single largest chunk and the
 * one most cleanly its own concern (per-entry ownership/origin/location/box-position
 * writes), mirroring collection-backup.ts's own extraction. Prepares its own statements
 * against the same `db` handle passed in rather than sharing sqlite-storage.ts's — a
 * little prepared-statement duplication for a clean module boundary, not a functional
 * difference (better-sqlite3 statements are cheap and stateless per-call).
 * clearBoxPlaceholderStmt in particular is re-prepared here rather than shared: it's also
 * needed by sqlite-storage.ts's own clearBoxPlaceholder/clearAllBoxPlaceholders methods
 * and setBoxPlaceholder's occupancy guard, which stay behind since box placeholders
 * aren't part of this group.
 */
export function createCollectionEntryOperations(db: Database.Database): {
  setOwned(entryId: number, owned: boolean): Promise<CollectionEntry>
  setEntryOrigin(entryId: number, input: CollectionEntryOriginInput): Promise<CollectionEntry>
  setEntryStorageLocation(entryId: number, storageLocationId: number | null): Promise<CollectionEntry>
  setEntryBoxPosition(entryId: number, boxNumber: number | null, boxSlot: number | null): Promise<CollectionEntry>
  swapEntryBoxPositions(entryIdA: number, entryIdB: number): Promise<[CollectionEntry, CollectionEntry]>
  fillBoxSlots(entryIds: number[], boxNumber: number, startSlot: number): Promise<CollectionEntry[]>
  bulkSetEntryStorageLocation(entryIds: number[], storageLocationId: number | null): Promise<CollectionEntry[]>
  bulkSetEntryGender(entryIds: number[], gender: Gender): Promise<CollectionEntry[]>
  fillInPlaceholders(
    storageLocationId: number,
    placements: Array<{ entryId: number; boxNumber: number; boxSlot: number }>
  ): Promise<{ applied: CollectionEntry[]; skipped: Array<{ entryId: number; reason: string }> }>
  moveEntriesToLocation(
    storageLocationId: number,
    placements: Array<{ entryId: number; boxNumber: number; boxSlot: number }>
  ): Promise<CollectionEntry[]>
  restoreEntryBoxPositions(
    snapshots: Array<{ entryId: number; storageLocationId: number | null; boxNumber: number | null; boxSlot: number | null }>
  ): Promise<CollectionEntry[]>
} {
  const setOwnedStmt = db.prepare('UPDATE collection_entries SET owned = @owned WHERE id = @id')
  const getEntryStmt = db.prepare('SELECT * FROM collection_entries WHERE id = ?')
  // Gender correction ([Dex completeness tier migration] Leg 3's "Resolve Gender
  // Ambiguities" flow, plus the per-row gender toggle in DexRow) — a gender-diff form's
  // owned entry gets written under the collapsed 'male' key regardless of the
  // individual's real gender whenever splitByGender display is off (see
  // buildDexSections.ts's collapsed row), so this is how a user-confirmed correction
  // lands once a splitByGender tier needs to trust it. A plain per-row UPDATE, not tied
  // to any (form, gender, shiny) uniqueness — that constraint was dropped (Leg 2 of the
  // Box Arrangement milestone) precisely so duplicate individuals can each carry an
  // independently correct gender. Always sets gender_confirmed too: every call to this
  // statement is an explicit user decision about this entry's gender (whether via the
  // Resolve modal or the inline toggle), so it's the one place that flag ever flips —
  // genderResolution.ts's findAmbiguousGenderEntries is what actually reads it back to
  // stop re-flagging a reviewed entry.
  const setEntryGenderStmt = db.prepare(
    'UPDATE collection_entries SET gender = @gender, gender_confirmed = 1 WHERE id = @id'
  )
  const setEntryOriginStmt = db.prepare(`
    UPDATE collection_entries
    SET trainer_profile_id = @trainerProfileId, origin_game = @originGame, ot_name = @otName,
      tid = @tid, sid = @sid, language = @language, nickname = @nickname, caught_ball = @caughtBall,
      met_location = @metLocation, is_alpha = @isAlpha, capture_date = @captureDate,
      size_class = @sizeClass
    WHERE id = @id
  `)
  // Separate from setEntryOriginStmt above — storage location is its own axis (Leg 3),
  // never touched by an origin save. No CHECK to violate here (a plain nullable FK), so
  // an invalid id simply throws FOREIGN KEY constraint failed, same as any other FK write.
  // Also clears box_number/box_slot (Leg 3 of the Box Arrangement milestone): a box
  // position is only meaningful within the location it was set for, so moving an entry
  // to a different location (or back to unassigned) always vacates its old slot rather
  // than silently carrying a now-meaningless position along.
  const setEntryStorageLocationStmt = db.prepare(
    'UPDATE collection_entries SET storage_location_id = @storageLocationId, box_number = NULL, box_slot = NULL WHERE id = @id'
  )
  // setEntryStorageLocation above always clears box position; this is the only way to
  // set one. Requires the entry already have a storage_location_id — enforced in the
  // setEntryBoxPosition method below rather than a DB CHECK (see schema.ts's box_number/
  // box_slot comment). The (storage_location_id, box_number, box_slot) UNIQUE index
  // (schema.ts) throws if the target slot is already occupied by a different entry.
  const setEntryBoxPositionStmt = db.prepare(
    'UPDATE collection_entries SET box_number = @boxNumber, box_slot = @boxSlot WHERE id = @id'
  )
  // Box placeholders live in their own module (sqlite-storage.ts), but a real entry
  // landing on a slot fulfills whatever placeholder was "planning" it — see
  // sqlite-storage.ts's clearBoxPlaceholderStmt comment. Re-prepared here (rather than
  // shared) same as every other statement in this file — see the file-level doc comment.
  const clearBoxPlaceholderStmt = db.prepare(
    'DELETE FROM box_placeholders WHERE storage_location_id = @storageLocationId AND box_number = @boxNumber AND box_slot = @boxSlot'
  )
  // swapEntryBoxPositions (Leg 7 of the Box Arrangement milestone, DexBoxGrid's drag-a-
  // cell-onto-another-cell flow) — idx_entries_box_slot (schema.ts) is a plain, non-
  // deferrable UNIQUE index, so writing entry A straight into entry B's current slot
  // collides with B's own still-there row regardless of write order. Vacates A to NULL
  // first (NULL never collides, per that index's own comment), moves B into A's old
  // slot, then places A into B's old slot — all inside one transaction so a mid-swap
  // failure can't leave one entry unboxed.
  const swapEntryBoxPositionsTx = db.transaction((entryIdA: number, entryIdB: number) => {
    const a = getEntryStmt.get(entryIdA) as CollectionEntryRow | undefined
    const b = getEntryStmt.get(entryIdB) as CollectionEntryRow | undefined
    if (!a || !b) {
      throw new Error('Entry not found')
    }
    if (a.box_number === null || a.box_slot === null || b.box_number === null || b.box_slot === null) {
      throw new Error('Both entries must already have a box position to swap')
    }
    setEntryBoxPositionStmt.run({ id: a.id, boxNumber: null, boxSlot: null })
    setEntryBoxPositionStmt.run({ id: b.id, boxNumber: a.box_number, boxSlot: a.box_slot })
    setEntryBoxPositionStmt.run({ id: a.id, boxNumber: b.box_number, boxSlot: b.box_slot })
  })
  // fillBoxSlots (Leg 4 of the Box View Polish milestone, DexBoxPane's multi-select
  // drag-drop flow) — places a batch of entries into a contiguous run of slots, in call
  // order, in one atomic step. Same vacate-first workaround as swapEntryBoxPositionsTx
  // above: DexBoxPane only ever calls this once it's confirmed a target slot's existing
  // occupant (if any) is itself one of entryIds, so any of these entries might already sit
  // on one of the target slots, and idx_entries_box_slot's UNIQUE index isn't deferrable —
  // writing straight into an as-yet-still-occupied slot collides with that entry's own
  // pre-move row.
  const fillBoxSlotsTx = db.transaction((entryIds: number[], boxNumber: number, startSlot: number) => {
    const entries = entryIds.map((id) => {
      const entry = getEntryStmt.get(id) as CollectionEntryRow | undefined
      if (!entry) throw new Error('Entry not found')
      if (!entry.storage_location_id) {
        throw new Error('Cannot assign a box position to an entry with no storage location')
      }
      return entry
    })
    for (const entry of entries) {
      setEntryBoxPositionStmt.run({ id: entry.id, boxNumber: null, boxSlot: null })
    }
    entries.forEach((entry, i) => {
      const boxSlot = startSlot + i
      setEntryBoxPositionStmt.run({ id: entry.id, boxNumber, boxSlot })
      // Same "a real entry landing here fulfills the plan" clear as setEntryBoxPosition
      // below — see clearBoxPlaceholderStmt's own comment.
      clearBoxPlaceholderStmt.run({ storageLocationId: entry.storage_location_id, boxNumber, boxSlot })
    })
  })
  // Bulk move (Bulk move/duplicate entries between storage locations item) — same
  // per-row statement as setEntryStorageLocation above, looped in one transaction so a
  // multi-select in List view is one DB round trip instead of N. Same box-position clear
  // as the single-entry setter: the target may be a different location entirely, and a
  // box position is only ever meaningful within the location it was set for.
  const bulkSetEntryStorageLocationTx = db.transaction((entryIds: number[], storageLocationId: number | null) => {
    for (const id of entryIds) {
      if (!getEntryStmt.get(id)) throw new Error('Entry not found')
      setEntryStorageLocationStmt.run({ id, storageLocationId })
    }
  })
  // Bulk gender correction — same shape as bulkSetEntryStorageLocationTx above, one
  // transaction so a Resolve Gender Ambiguities save (potentially hundreds of entries)
  // is one DB round trip instead of N.
  const bulkSetEntryGenderTx = db.transaction((entryIds: number[], gender: Gender) => {
    for (const id of entryIds) {
      if (!getEntryStmt.get(id)) throw new Error('Entry not found')
      setEntryGenderStmt.run({ id, gender })
    }
  })
  // Fill In (Leg 7 of the Dex completeness tier migration) — moves an already-owned,
  // currently-unboxed entry straight into a placeholder's slot in one UPDATE, rather than
  // the setEntryStorageLocation-then-setEntryBoxPosition two-step a cross-location move
  // otherwise needs (that first step's box-position clear is a no-op here anyway, since
  // fillInPlaceholdersTx only ever targets an entry with box_number already NULL).
  const fillInPlaceholderEntryStmt = db.prepare(
    'UPDATE collection_entries SET storage_location_id = @storageLocationId, box_number = @boxNumber, box_slot = @boxSlot WHERE id = @id'
  )
  // Re-checks each placement against the current DB state before writing (skip, don't
  // throw, on a stale one — same tolerance as setBoxPlaceholdersTx below): the renderer
  // computed `placements` from its own last-fetched snapshot, and a concurrent change (rare
  // in this single-window app, but not impossible) could mean an entry named in it got
  // boxed, unowned, or deleted since. Clears the fulfilled placeholder same as
  // setEntryBoxPositionStmt/fillBoxSlotsTx's own callers do.
  // Returns the subset of placements actually written plus, for anything skipped, why —
  // added while diagnosing a Leg 7 bug report (an entry silently staying unboxed with no
  // console error): the caller needs a reason, not just a void/all-or-nothing signal, to
  // tell a stale-state skip apart from a real bug in what computeFillInPlacements picked.
  const fillInPlaceholdersTx = db.transaction(
    (storageLocationId: number, placements: Array<{ entryId: number; boxNumber: number; boxSlot: number }>) => {
      const applied: number[] = []
      const skipped: Array<{ entryId: number; reason: string }> = []
      for (const p of placements) {
        const entry = getEntryStmt.get(p.entryId) as CollectionEntryRow | undefined
        if (!entry) {
          skipped.push({ entryId: p.entryId, reason: 'not_found' })
          continue
        }
        if (!entry.owned) {
          skipped.push({ entryId: p.entryId, reason: 'not_owned' })
          continue
        }
        if (entry.box_number !== null) {
          skipped.push({
            entryId: p.entryId,
            reason: `already_boxed (storageLocationId=${entry.storage_location_id}, box=${entry.box_number}:${entry.box_slot})`
          })
          continue
        }
        fillInPlaceholderEntryStmt.run({ id: p.entryId, storageLocationId, boxNumber: p.boxNumber, boxSlot: p.boxSlot })
        clearBoxPlaceholderStmt.run({ storageLocationId, boxNumber: p.boxNumber, boxSlot: p.boxSlot })
        applied.push(p.entryId)
      }
      return { applied, skipped }
    }
  )
  // moveEntriesToLocation (Leg 1 of the Box View Move & Undo Operations milestone) —
  // cross-location drag-move / "Move to location…" picker. Reuses
  // fillInPlaceholderEntryStmt's single-UPDATE write (storage_location_id + box_number +
  // box_slot together) exactly as-is rather than the setEntryStorageLocation-then-
  // setEntryBoxPosition two-step a same-location move can get away with — that two-step
  // would trip setEntryBoxPosition's "entry must already have a storage location" guard
  // between the steps for an entry not yet at any location, plus rewrite the row twice.
  // `placements` (same shape as fillInPlaceholdersTx's own) rather than a
  // fillBoxSlots-style single startSlot: unlike a drag drop (always one contiguous run in
  // one box), the "Move to location…" picker can spread a selection across whatever
  // scattered slots are actually free at the destination, so the caller computes exact
  // per-entry positions rather than this method assuming contiguity. No vacate-first step
  // needed (unlike fillBoxSlotsTx/swapEntryBoxPositionsTx): idx_entries_box_slot's UNIQUE
  // index is keyed on (storage_location_id, box_number, box_slot), so a dragged entry's
  // own pre-move row — always at a *different* storage_location_id than the destination,
  // since this only ever moves entries into a location they don't already occupy — can
  // never collide with its own new row. Doesn't check the target slots are free of
  // non-`placements` occupants — same "caller's own rejection/placement-finding covers
  // that first" contract fillBoxSlots already carries.
  const moveEntriesToLocationTx = db.transaction(
    (storageLocationId: number, placements: Array<{ entryId: number; boxNumber: number; boxSlot: number }>) => {
      for (const p of placements) {
        if (!getEntryStmt.get(p.entryId)) throw new Error('Entry not found')
        fillInPlaceholderEntryStmt.run({ id: p.entryId, storageLocationId, boxNumber: p.boxNumber, boxSlot: p.boxSlot })
        clearBoxPlaceholderStmt.run({ storageLocationId, boxNumber: p.boxNumber, boxSlot: p.boxSlot })
      }
    }
  )
  // restoreEntryBoxPositions (Leg 3 of the Box View Move & Undo Operations milestone) —
  // undo for a batch move (fillBoxSlots/moveEntriesToLocation), writing each entry straight
  // back to its captured pre-move (storageLocationId, boxNumber, boxSlot). Reuses
  // fillInPlaceholderEntryStmt's single-UPDATE write like moveEntriesToLocationTx above,
  // just with a per-snapshot storageLocationId instead of one shared destination. Vacates
  // every listed entry first (same non-deferrable UNIQUE-index workaround as
  // fillBoxSlotsTx/swapEntryBoxPositionsTx): unlike moveEntriesToLocationTx's forward
  // direction (always landing at a *different* location than the source, so the UNIQUE
  // index can never self-collide), a restore can land two snapshots back into slots that
  // currently hold each other's rows — e.g. undoing a fillBoxSlots reshuffle that itself
  // needed vacate-first to apply.
  const restoreEntryBoxPositionsTx = db.transaction(
    (
      snapshots: Array<{ entryId: number; storageLocationId: number | null; boxNumber: number | null; boxSlot: number | null }>
    ) => {
      for (const s of snapshots) {
        if (!getEntryStmt.get(s.entryId)) throw new Error('Entry not found')
      }
      for (const s of snapshots) {
        setEntryBoxPositionStmt.run({ id: s.entryId, boxNumber: null, boxSlot: null })
      }
      for (const s of snapshots) {
        fillInPlaceholderEntryStmt.run({
          id: s.entryId,
          storageLocationId: s.storageLocationId,
          boxNumber: s.boxNumber,
          boxSlot: s.boxSlot
        })
        // Same "a real entry landing here fulfills the plan" clear as every other
        // position-writing method — see clearBoxPlaceholderStmt's own comment.
        if (s.storageLocationId !== null && s.boxNumber !== null && s.boxSlot !== null) {
          clearBoxPlaceholderStmt.run({ storageLocationId: s.storageLocationId, boxNumber: s.boxNumber, boxSlot: s.boxSlot })
        }
      }
    }
  )

  return {
    async setOwned(entryId: number, owned: boolean): Promise<CollectionEntry> {
      setOwnedStmt.run({ id: entryId, owned: owned ? 1 : 0 })
      return toCollectionEntry(getEntryStmt.get(entryId) as CollectionEntryRow)
    },

    async setEntryOrigin(entryId: number, input: CollectionEntryOriginInput): Promise<CollectionEntry> {
      // better-sqlite3 can't bind a JS boolean directly (only numbers/strings/bigints/
      // buffers/null) — same 1/0 conversion setOwned does above.
      setEntryOriginStmt.run({ id: entryId, ...input, isAlpha: input.isAlpha ? 1 : 0 })
      return toCollectionEntry(getEntryStmt.get(entryId) as CollectionEntryRow)
    },

    async setEntryStorageLocation(entryId: number, storageLocationId: number | null): Promise<CollectionEntry> {
      setEntryStorageLocationStmt.run({ id: entryId, storageLocationId })
      return toCollectionEntry(getEntryStmt.get(entryId) as CollectionEntryRow)
    },

    async setEntryBoxPosition(entryId: number, boxNumber: number | null, boxSlot: number | null): Promise<CollectionEntry> {
      if ((boxNumber === null) !== (boxSlot === null)) {
        throw new Error('boxNumber and boxSlot must be set or cleared together')
      }
      if (boxNumber !== null) {
        const entry = getEntryStmt.get(entryId) as CollectionEntryRow | undefined
        if (!entry?.storage_location_id) {
          throw new Error('Cannot assign a box position to an entry with no storage location')
        }
        // A real entry landing on a slot fulfills whatever placeholder was "planning" it —
        // see clearBoxPlaceholderStmt's own comment.
        clearBoxPlaceholderStmt.run({ storageLocationId: entry.storage_location_id, boxNumber, boxSlot })
      }
      setEntryBoxPositionStmt.run({ id: entryId, boxNumber, boxSlot })
      return toCollectionEntry(getEntryStmt.get(entryId) as CollectionEntryRow)
    },

    async swapEntryBoxPositions(entryIdA: number, entryIdB: number): Promise<[CollectionEntry, CollectionEntry]> {
      swapEntryBoxPositionsTx(entryIdA, entryIdB)
      return [
        toCollectionEntry(getEntryStmt.get(entryIdA) as CollectionEntryRow),
        toCollectionEntry(getEntryStmt.get(entryIdB) as CollectionEntryRow)
      ]
    },

    async fillBoxSlots(entryIds: number[], boxNumber: number, startSlot: number): Promise<CollectionEntry[]> {
      fillBoxSlotsTx(entryIds, boxNumber, startSlot)
      return entryIds.map((id) => toCollectionEntry(getEntryStmt.get(id) as CollectionEntryRow))
    },

    async bulkSetEntryStorageLocation(entryIds: number[], storageLocationId: number | null): Promise<CollectionEntry[]> {
      bulkSetEntryStorageLocationTx(entryIds, storageLocationId)
      return entryIds.map((id) => toCollectionEntry(getEntryStmt.get(id) as CollectionEntryRow))
    },

    async bulkSetEntryGender(entryIds: number[], gender: Gender): Promise<CollectionEntry[]> {
      bulkSetEntryGenderTx(entryIds, gender)
      return entryIds.map((id) => toCollectionEntry(getEntryStmt.get(id) as CollectionEntryRow))
    },

    async fillInPlaceholders(
      storageLocationId: number,
      placements: Array<{ entryId: number; boxNumber: number; boxSlot: number }>
    ): Promise<{ applied: CollectionEntry[]; skipped: Array<{ entryId: number; reason: string }> }> {
      const { applied, skipped } = fillInPlaceholdersTx(storageLocationId, placements)
      return {
        applied: applied.map((id) => toCollectionEntry(getEntryStmt.get(id) as CollectionEntryRow)),
        skipped
      }
    },

    async moveEntriesToLocation(
      storageLocationId: number,
      placements: Array<{ entryId: number; boxNumber: number; boxSlot: number }>
    ): Promise<CollectionEntry[]> {
      moveEntriesToLocationTx(storageLocationId, placements)
      return placements.map((p) => toCollectionEntry(getEntryStmt.get(p.entryId) as CollectionEntryRow))
    },

    async restoreEntryBoxPositions(
      snapshots: Array<{ entryId: number; storageLocationId: number | null; boxNumber: number | null; boxSlot: number | null }>
    ): Promise<CollectionEntry[]> {
      restoreEntryBoxPositionsTx(snapshots)
      return snapshots.map((s) => toCollectionEntry(getEntryStmt.get(s.entryId) as CollectionEntryRow))
    }
  }
}
