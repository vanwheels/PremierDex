import Database from 'better-sqlite3'
import type { CollectionEntry, Form, Gender, Species } from '@shared/types/pokemon'
import type { TrainerProfile, TrainerProfileInput } from '@shared/types/trainer-profile'
import type { StorageLocation, StorageLocationInput } from '@shared/types/storage-location'
import type { BoxPlaceholder, StorageBox } from '@shared/types/box'
import type { StorageAdapter } from '@shared/storage/storage-interface'
import { applySchema } from './schema'
import { runSeed } from './seed'
import { createBackupOperations } from './collection-backup'
import { createCollectionEntryOperations } from './collection-entry-storage'
import {
  toBoxPlaceholder,
  toCollectionEntry,
  toForm,
  toSpecies,
  toStorageBox,
  toStorageLocation,
  toTrainerProfile,
  type BoxPlaceholderRow,
  type BoxRow,
  type CollectionEntryRow,
  type FormRow,
  type SpeciesRow,
  type StorageLocationRow,
  type TrainerProfileRow
} from './row-mappers'

export function createSqliteStorage(dbPath: string): StorageAdapter {
  const db = new Database(dbPath)
  applySchema(db)
  runSeed(db)
  const backupOperations = createBackupOperations(db)
  // setOwned/setEntryOrigin/setEntryStorageLocation/box-position/bulk-* live in
  // collection-entry-storage.ts (Leg 3 of the Codebase File-Size Cleanup milestone's
  // split, see its file-level doc comment) — thin delegation below keeps them on the
  // StorageAdapter surface without this file owning their implementation.
  const entryOperations = createCollectionEntryOperations(db)

  const listSpeciesStmt = db.prepare(
    'SELECT id, name, generation, collapsed_display_form_id, is_final_evolution_stage FROM species ORDER BY id'
  )
  const getSpeciesStmt = db.prepare(
    'SELECT id, name, generation, collapsed_display_form_id, is_final_evolution_stage FROM species WHERE id = ?'
  )
  const setCollapsedDisplayFormStmt = db.prepare(
    'UPDATE species SET collapsed_display_form_id = @formId WHERE id = @id'
  )
  const listFormsStmt = db.prepare('SELECT * FROM forms ORDER BY species_id, id')
  const listEntriesStmt = db.prepare('SELECT * FROM collection_entries ORDER BY form_id, gender, shiny')
  // Clones every entry currently in a source storage location into a target one in a
  // single statement — backs duplicateStorageLocationTx below (Storage Locations tab's
  // "Duplicate" button). Copies every field except id/storage_location_id/box_number/
  // box_slot (a straight column-for-column carry, deliberately not itemized field-by-field
  // so a future CollectionEntry column doesn't silently fail to carry over): each clone is
  // a full, independent individual sharing its source's origin/nickname/etc, landing
  // unassigned-within-location same as a bulk move. See schema.ts's dropped UNIQUE(form_id,
  // gender, shiny), which is what makes a second real copy of the same individual possible
  // at all. Originally one INSERT per source row run in a JS loop over 1025+ entry ids —
  // that many separate statement executions blocked the main process long enough to freeze
  // renderer input (typing/dropdowns) for a visible stretch; a single INSERT...SELECT lets
  // SQLite do the whole copy in one call.
  const insertDuplicateEntriesStmt = db.prepare(`
    INSERT INTO collection_entries
      (form_id, gender, shiny, owned, trainer_profile_id, origin_game, ot_name, tid, sid,
       language, nickname, caught_ball, storage_location_id, met_location, box_number, box_slot,
       is_alpha, capture_date, size_class)
    SELECT form_id, gender, shiny, owned, trainer_profile_id, origin_game, ot_name, tid, sid,
       language, nickname, caught_ball, @newLocationId, met_location, NULL, NULL,
       is_alpha, capture_date, size_class
    FROM collection_entries WHERE storage_location_id = @sourceId ORDER BY id
  `)
  // Ordered entry-id lists for a storage location — used by duplicateStorageLocationTx below
  // to line up insertDuplicateEntriesStmt's clones (an AUTOINCREMENT INSERT...SELECT ordered
  // by id assigns new ids in that same ascending order) with their sources, rather than
  // relying on RETURNING's output order, which SQLite documents as arbitrary.
  const listEntryIdsByStorageLocationStmt = db.prepare(
    'SELECT id FROM collection_entries WHERE storage_location_id = ? ORDER BY id'
  )
  // Ribbons/marks live in child tables keyed on entry_id, not a column
  // insertDuplicateEntriesStmt's column-for-column INSERT...SELECT can carry over — joined
  // against the source location here so duplicateStorageLocationTx can re-key each row onto
  // its clone's new entry id.
  const listRibbonsByStorageLocationStmt = db.prepare(`
    SELECT r.entry_id AS entryId, r.ribbon_name AS ribbonName
    FROM collection_entry_ribbons r JOIN collection_entries e ON e.id = r.entry_id
    WHERE e.storage_location_id = ?
  `)
  const listMarksByStorageLocationStmt = db.prepare(`
    SELECT m.entry_id AS entryId, m.mark_name AS markName
    FROM collection_entry_marks m JOIN collection_entries e ON e.id = m.entry_id
    WHERE e.storage_location_id = ?
  `)
  const orphanEntriesByTrainerProfileStmt = db.prepare(
    'UPDATE collection_entries SET trainer_profile_id = NULL WHERE trainer_profile_id = ?'
  )
  // Mirrors orphanEntriesByTrainerProfileStmt above: storage_location_id has no ON
  // DELETE clause (SQLite defaults to NO ACTION), so deleting a still-assigned location
  // needs this run first or the FK check blocks the delete.
  const orphanEntriesByStorageLocationStmt = db.prepare(
    'UPDATE collection_entries SET storage_location_id = NULL WHERE storage_location_id = ?'
  )
  const listTrainerProfilesStmt = db.prepare('SELECT * FROM trainer_profiles ORDER BY id')
  const getTrainerProfileStmt = db.prepare('SELECT * FROM trainer_profiles WHERE id = ?')
  const insertTrainerProfileStmt = db.prepare(`
    INSERT INTO trainer_profiles (game, ot_name, tid, sid, label, language)
    VALUES (@game, @otName, @tid, @sid, @label, @language)
  `)
  const updateTrainerProfileStmt = db.prepare(`
    UPDATE trainer_profiles SET game = @game, ot_name = @otName, tid = @tid, sid = @sid, label = @label,
      language = @language
    WHERE id = @id
  `)
  // Live sync (Leg 31 — reverses Leg 4's one-time-copy design): every entry still linked
  // to this profile mirrors its new game/OT/TID/SID/language on every save. nickname and
  // caught_ball are untouched — they're per-entry, never per-trainer (see CollectionEntry).
  const syncLinkedEntriesStmt = db.prepare(`
    UPDATE collection_entries
    SET origin_game = @game, ot_name = @otName, tid = @tid, sid = @sid, language = @language
    WHERE trainer_profile_id = @id
  `)
  const deleteTrainerProfileStmt = db.prepare('DELETE FROM trainer_profiles WHERE id = ?')
  const listStorageLocationsStmt = db.prepare('SELECT * FROM storage_locations ORDER BY id')
  const getStorageLocationStmt = db.prepare('SELECT * FROM storage_locations WHERE id = ?')
  const insertStorageLocationStmt = db.prepare(`
    INSERT INTO storage_locations (location_type, name, trainer_profile_id)
    VALUES (@locationType, @name, @trainerProfileId)
  `)
  const updateStorageLocationStmt = db.prepare(`
    UPDATE storage_locations SET location_type = @locationType, name = @name,
      trainer_profile_id = @trainerProfileId
    WHERE id = @id
  `)
  const deleteStorageLocationStmt = db.prepare('DELETE FROM storage_locations WHERE id = ?')
  const countStorageLocationsStmt = db.prepare('SELECT COUNT(*) AS count FROM storage_locations')
  // Boxes (Leg 2 of the Box View Polish & Multi-Box Editing milestone) — see schema.ts's
  // `boxes` table comment. insertBoxNumberOneStmt seeds a fresh location's Box 1 at create
  // time (INSERT OR IGNORE: harmless if backfillBoxes already covered it); insertBoxStmt is
  // "Add Box", computing the next box_number for that location inline rather than a
  // read-then-write round trip.
  const listBoxesStmt = db.prepare('SELECT * FROM boxes ORDER BY storage_location_id, box_number')
  const getBoxStmt = db.prepare('SELECT * FROM boxes WHERE id = ?')
  const insertBoxNumberOneStmt = db.prepare(
    'INSERT OR IGNORE INTO boxes (storage_location_id, box_number, name) VALUES (@storageLocationId, 1, NULL)'
  )
  // Duplicate a Storage Location — the Storage Locations tab's "Duplicate" button,
  // replacing the per-entry List-view duplicate that briefly shipped in commit 74c73c9:
  // checking off entries one at a time to clone a whole location's 1025+-entry roster was
  // unworkable. Clones the location's own type/trainer link (name gets " (Copy)"
  // appended; storage_locations carries no uniqueness constraint on name, so a repeat
  // duplicate just appends again rather than colliding) and every entry currently sitting
  // in it, each landing unassigned-within-the-new-location via insertDuplicateEntriesStmt
  // above — same convention as a bulk move — along with that entry's ribbons/marks (Leg 1 of
  // the Box View Quick-Wins Sweep; previously silently dropped, same gap shape as the
  // box-arrangement exclusion below). Deliberately does not clone box arrangement
  // (box_number/box_slot, box_placeholders) — see TODO.md's [Clear box] follow-up, which
  // will let a freshly duplicated location's box view be wiped back to empty instead.
  const duplicateStorageLocationTx = db.transaction((sourceId: number) => {
    const source = getStorageLocationStmt.get(sourceId) as StorageLocationRow | undefined
    if (!source) throw new Error('Storage location not found')
    const result = insertStorageLocationStmt.run({
      locationType: source.location_type,
      name: `${source.name} (Copy)`,
      trainerProfileId: source.trainer_profile_id
    })
    const newLocationId = result.lastInsertRowid as number
    insertBoxNumberOneStmt.run({ storageLocationId: newLocationId })
    // Snapshot ribbons/marks and the source's own id order before cloning entries — both
    // need the *old* entry ids while they still exist.
    const sourceRibbons = listRibbonsByStorageLocationStmt.all(sourceId) as Array<{
      entryId: number
      ribbonName: string
    }>
    const sourceMarks = listMarksByStorageLocationStmt.all(sourceId) as Array<{ entryId: number; markName: string }>
    const sourceIds = listEntryIdsByStorageLocationStmt.all(sourceId) as Array<{ id: number }>
    insertDuplicateEntriesStmt.run({ sourceId, newLocationId })
    if (sourceRibbons.length > 0 || sourceMarks.length > 0) {
      // sourceIds and the new location's ids, both taken in ascending order, line up 1:1 —
      // see listEntryIdsByStorageLocationStmt's own comment for why.
      const newIds = listEntryIdsByStorageLocationStmt.all(newLocationId) as Array<{ id: number }>
      const oldToNewId = new Map(sourceIds.map((row, i) => [row.id, newIds[i].id]))
      for (const { entryId, ribbonName } of sourceRibbons) {
        insertEntryRibbonStmt.run({ entryId: oldToNewId.get(entryId), ribbonName })
      }
      for (const { entryId, markName } of sourceMarks) {
        insertEntryMarkStmt.run({ entryId: oldToNewId.get(entryId), markName })
      }
    }
    return newLocationId
  })
  const insertBoxStmt = db.prepare(`
    INSERT INTO boxes (storage_location_id, box_number, name)
    VALUES (
      @storageLocationId,
      (SELECT COALESCE(MAX(box_number), 0) + 1 FROM boxes WHERE storage_location_id = @storageLocationId),
      NULL
    )
  `)
  const renameBoxStmt = db.prepare('UPDATE boxes SET name = @name WHERE id = @id')
  // Box placeholders (Leg 5 of the Box View Polish & Multi-Box Editing milestone) — see
  // schema.ts's `box_placeholders` table comment. entryAtSlotStmt backs setBoxPlaceholder's
  // occupancy guard (a slot already holding a real entry can't also get a placeholder);
  // clearBoxPlaceholderStmt backs the public clearBoxPlaceholder method below. It's also
  // re-prepared in collection-entry-storage.ts, whose box-position writers use it the same
  // way — placing a real entry into a slot always vacates whatever placeholder was
  // "planning" that same slot, since the plan is now fulfilled.
  const listBoxPlaceholdersStmt = db.prepare('SELECT * FROM box_placeholders ORDER BY storage_location_id, box_number, box_slot')
  const getBoxPlaceholderStmt = db.prepare(
    'SELECT * FROM box_placeholders WHERE storage_location_id = @storageLocationId AND box_number = @boxNumber AND box_slot = @boxSlot'
  )
  const entryAtSlotStmt = db.prepare(
    'SELECT id FROM collection_entries WHERE storage_location_id = @storageLocationId AND box_number = @boxNumber AND box_slot = @boxSlot'
  )
  const setBoxPlaceholderStmt = db.prepare(`
    INSERT INTO box_placeholders (storage_location_id, box_number, box_slot, form_id, gender, shiny)
    VALUES (@storageLocationId, @boxNumber, @boxSlot, @formId, @gender, @shiny)
    ON CONFLICT(storage_location_id, box_number, box_slot)
      DO UPDATE SET form_id = excluded.form_id, gender = excluded.gender, shiny = excluded.shiny
  `)
  // Bulk placeholder insert (Leg 2 of the Dex completeness tier migration) — applying a Box
  // Template can mean 1000+ rows (a Living Form tier's full required set), so this wraps the
  // same per-slot upsert/occupancy-guard as the single setBoxPlaceholder above in one
  // transaction rather than paying an IPC round trip per row. Same "never clobber a real
  // entry's slot" guard, just skipping the offending placement instead of throwing — a
  // template's own planner (boxTemplates.ts) already excludes occupied slots, so hitting
  // this in practice would mean stale renderer-side state, not a real conflict worth
  // aborting the whole batch over.
  const setBoxPlaceholdersTx = db.transaction(
    (
      storageLocationId: number,
      placements: Array<{ boxNumber: number; boxSlot: number; formId: number; gender: string; shiny: boolean }>
    ) => {
      for (const p of placements) {
        if (entryAtSlotStmt.get({ storageLocationId, boxNumber: p.boxNumber, boxSlot: p.boxSlot })) continue
        setBoxPlaceholderStmt.run({
          storageLocationId,
          boxNumber: p.boxNumber,
          boxSlot: p.boxSlot,
          formId: p.formId,
          gender: p.gender,
          shiny: p.shiny ? 1 : 0
        })
      }
    }
  )
  const clearBoxPlaceholderStmt = db.prepare(
    'DELETE FROM box_placeholders WHERE storage_location_id = @storageLocationId AND box_number = @boxNumber AND box_slot = @boxSlot'
  )
  // "Clear Placeholders" (Leg 6 of the Dex completeness tier migration) — wipes every
  // placeholder in a location regardless of slot, unlike clearBoxPlaceholderStmt above
  // which targets one. No occupancy guard needed: a real entry never has a
  // box_placeholders row of its own (setBoxPlaceholder/setBoxPlaceholdersTx both reject/
  // skip a slot a real entry already occupies), so this can never delete a real entry's
  // data.
  const clearAllBoxPlaceholdersStmt = db.prepare('DELETE FROM box_placeholders WHERE storage_location_id = @storageLocationId')
  // Ribbons & Marks (Leg 4 of the Ribbons/Alpha/Size/Capture-Date Tracking milestone) —
  // full replace-all per entry (delete then reinsert), same convention as setEntryOrigin's
  // snapshot write rather than a diff/patch. Two independent statement/transaction pairs,
  // mirroring how the tables themselves are separate, parallel systems (see schema.ts's
  // own comment) rather than one shared "tag" table.
  const listEntryRibbonsStmt = db.prepare(
    'SELECT ribbon_name FROM collection_entry_ribbons WHERE entry_id = ? ORDER BY ribbon_name'
  )
  const deleteEntryRibbonsStmt = db.prepare('DELETE FROM collection_entry_ribbons WHERE entry_id = ?')
  const insertEntryRibbonStmt = db.prepare(
    'INSERT INTO collection_entry_ribbons (entry_id, ribbon_name) VALUES (@entryId, @ribbonName)'
  )
  const setEntryRibbonsTx = db.transaction((entryId: number, ribbonNames: string[]) => {
    deleteEntryRibbonsStmt.run(entryId)
    for (const ribbonName of ribbonNames) insertEntryRibbonStmt.run({ entryId, ribbonName })
  })
  const listEntryMarksStmt = db.prepare('SELECT mark_name FROM collection_entry_marks WHERE entry_id = ? ORDER BY mark_name')
  const deleteEntryMarksStmt = db.prepare('DELETE FROM collection_entry_marks WHERE entry_id = ?')
  const insertEntryMarkStmt = db.prepare(
    'INSERT INTO collection_entry_marks (entry_id, mark_name) VALUES (@entryId, @markName)'
  )
  const setEntryMarksTx = db.transaction((entryId: number, markNames: string[]) => {
    deleteEntryMarksStmt.run(entryId)
    for (const markName of markNames) insertEntryMarkStmt.run({ entryId, markName })
  })
  // Leg 6: an app starts with zero storage locations, so the very first one ever created
  // (of any type — HOME is the common case, but nothing here assumes it) is where every
  // owned entry that's currently unassigned logically belongs: they were checked in before
  // the user had anywhere to file them. Scoped to that 0->1 transition only — once a
  // second location exists, an entry sitting at Unassigned is a deliberate state, not a
  // backlog, and must not get swept anywhere automatically.
  const backfillUnassignedOwnedEntriesStmt = db.prepare(
    'UPDATE collection_entries SET storage_location_id = ? WHERE owned = 1 AND storage_location_id IS NULL'
  )

  return {
    async listSpecies(): Promise<Species[]> {
      return (listSpeciesStmt.all() as SpeciesRow[]).map(toSpecies)
    },

    async setCollapsedDisplayForm(speciesId: number, formId: number | null): Promise<Species> {
      setCollapsedDisplayFormStmt.run({ id: speciesId, formId })
      return toSpecies(getSpeciesStmt.get(speciesId) as SpeciesRow)
    },

    async listForms(): Promise<Form[]> {
      return (listFormsStmt.all() as FormRow[]).map(toForm)
    },

    async listCollectionEntries(): Promise<CollectionEntry[]> {
      return (listEntriesStmt.all() as CollectionEntryRow[]).map(toCollectionEntry)
    },

    // setOwned/setEntryOrigin/setEntryStorageLocation/box-position/bulk-* live in
    // collection-entry-storage.ts — see entryOperations's own comment above.
    setOwned: entryOperations.setOwned,
    setEntryOrigin: entryOperations.setEntryOrigin,
    setEntryStorageLocation: entryOperations.setEntryStorageLocation,
    setEntryBoxPosition: entryOperations.setEntryBoxPosition,
    swapEntryBoxPositions: entryOperations.swapEntryBoxPositions,
    fillBoxSlots: entryOperations.fillBoxSlots,
    bulkSetEntryStorageLocation: entryOperations.bulkSetEntryStorageLocation,
    bulkSetEntryGender: entryOperations.bulkSetEntryGender,
    fillInPlaceholders: entryOperations.fillInPlaceholders,
    moveEntriesToLocation: entryOperations.moveEntriesToLocation,
    restoreEntryBoxPositions: entryOperations.restoreEntryBoxPositions,

    // exportCollection/importCollection live in collection-backup.ts (Leg 3 of the Box
    // Arrangement milestone's split, see its file-level doc comment) — thin delegation
    // here keeps them on the StorageAdapter surface without this file owning their
    // (much longer) implementation.
    exportCollection: backupOperations.exportCollection,
    importCollection: backupOperations.importCollection,

    async listTrainerProfiles(): Promise<TrainerProfile[]> {
      return (listTrainerProfilesStmt.all() as TrainerProfileRow[]).map(toTrainerProfile)
    },

    async createTrainerProfile(input: TrainerProfileInput): Promise<TrainerProfile> {
      const result = insertTrainerProfileStmt.run(input)
      return toTrainerProfile(getTrainerProfileStmt.get(result.lastInsertRowid) as TrainerProfileRow)
    },

    async updateTrainerProfile(id: number, input: TrainerProfileInput): Promise<TrainerProfile> {
      updateTrainerProfileStmt.run({ id, ...input })
      syncLinkedEntriesStmt.run({ id, game: input.game, otName: input.otName, tid: input.tid, sid: input.sid, language: input.language })
      return toTrainerProfile(getTrainerProfileStmt.get(id) as TrainerProfileRow)
    },

    async deleteTrainerProfile(id: number): Promise<void> {
      // Orphan first: trainer_profile_id has no ON DELETE clause (SQLite defaults to NO
      // ACTION), so deleting a still-referenced profile would otherwise fail the FK
      // check. The referencing entries' snapshot columns (game/otName/tid/sid/nickname)
      // are unaffected — only the provenance link is cleared.
      orphanEntriesByTrainerProfileStmt.run(id)
      deleteTrainerProfileStmt.run(id)
    },

    async listStorageLocations(): Promise<StorageLocation[]> {
      return (listStorageLocationsStmt.all() as StorageLocationRow[]).map(toStorageLocation)
    },

    async createStorageLocation(input: StorageLocationInput): Promise<StorageLocation> {
      const isFirstLocation = (countStorageLocationsStmt.get() as { count: number }).count === 0
      const result = insertStorageLocationStmt.run(input)
      insertBoxNumberOneStmt.run({ storageLocationId: result.lastInsertRowid })
      if (isFirstLocation) {
        backfillUnassignedOwnedEntriesStmt.run(result.lastInsertRowid)
      }
      return toStorageLocation(getStorageLocationStmt.get(result.lastInsertRowid) as StorageLocationRow)
    },

    async updateStorageLocation(id: number, input: StorageLocationInput): Promise<StorageLocation> {
      updateStorageLocationStmt.run({ id, ...input })
      return toStorageLocation(getStorageLocationStmt.get(id) as StorageLocationRow)
    },

    async duplicateStorageLocation(id: number): Promise<StorageLocation> {
      const newLocationId = duplicateStorageLocationTx(id)
      return toStorageLocation(getStorageLocationStmt.get(newLocationId) as StorageLocationRow)
    },

    async deleteStorageLocation(id: number): Promise<void> {
      // Orphan first, same reasoning as deleteTrainerProfile above: storage_location_id
      // has no ON DELETE clause, so deleting a still-assigned location would otherwise
      // fail the FK check. boxes needs no equivalent orphan step — its own FK is
      // ON DELETE CASCADE (schema.ts), so this delete removes that location's box rows
      // too.
      orphanEntriesByStorageLocationStmt.run(id)
      deleteStorageLocationStmt.run(id)
    },

    async listBoxes(): Promise<StorageBox[]> {
      return (listBoxesStmt.all() as BoxRow[]).map(toStorageBox)
    },

    async addBox(storageLocationId: number): Promise<StorageBox> {
      const result = insertBoxStmt.run({ storageLocationId })
      return toStorageBox(getBoxStmt.get(result.lastInsertRowid) as BoxRow)
    },

    async renameBox(boxId: number, name: string | null): Promise<StorageBox> {
      renameBoxStmt.run({ id: boxId, name })
      return toStorageBox(getBoxStmt.get(boxId) as BoxRow)
    },

    async listBoxPlaceholders(): Promise<BoxPlaceholder[]> {
      return (listBoxPlaceholdersStmt.all() as BoxPlaceholderRow[]).map(toBoxPlaceholder)
    },

    async setBoxPlaceholder(
      storageLocationId: number,
      boxNumber: number,
      boxSlot: number,
      formId: number,
      gender: Gender,
      shiny: boolean
    ): Promise<BoxPlaceholder> {
      if (entryAtSlotStmt.get({ storageLocationId, boxNumber, boxSlot })) {
        throw new Error('Cannot set a placeholder on a slot that already holds a real entry')
      }
      setBoxPlaceholderStmt.run({ storageLocationId, boxNumber, boxSlot, formId, gender, shiny: shiny ? 1 : 0 })
      return toBoxPlaceholder(getBoxPlaceholderStmt.get({ storageLocationId, boxNumber, boxSlot }) as BoxPlaceholderRow)
    },

    async setBoxPlaceholders(
      storageLocationId: number,
      placements: Array<{ boxNumber: number; boxSlot: number; formId: number; gender: Gender; shiny: boolean }>
    ): Promise<BoxPlaceholder[]> {
      setBoxPlaceholdersTx(storageLocationId, placements)
      return (
        listBoxPlaceholdersStmt.all() as BoxPlaceholderRow[]
      )
        .map(toBoxPlaceholder)
        .filter((p) => p.storageLocationId === storageLocationId)
    },

    async clearBoxPlaceholder(storageLocationId: number, boxNumber: number, boxSlot: number): Promise<void> {
      clearBoxPlaceholderStmt.run({ storageLocationId, boxNumber, boxSlot })
    },

    async clearAllBoxPlaceholders(storageLocationId: number): Promise<void> {
      clearAllBoxPlaceholdersStmt.run({ storageLocationId })
    },

    async listEntryRibbons(entryId: number): Promise<string[]> {
      return (listEntryRibbonsStmt.all(entryId) as Array<{ ribbon_name: string }>).map((r) => r.ribbon_name)
    },

    async setEntryRibbons(entryId: number, ribbonNames: string[]): Promise<string[]> {
      setEntryRibbonsTx(entryId, ribbonNames)
      return (listEntryRibbonsStmt.all(entryId) as Array<{ ribbon_name: string }>).map((r) => r.ribbon_name)
    },

    async listEntryMarks(entryId: number): Promise<string[]> {
      return (listEntryMarksStmt.all(entryId) as Array<{ mark_name: string }>).map((r) => r.mark_name)
    },

    async setEntryMarks(entryId: number, markNames: string[]): Promise<string[]> {
      setEntryMarksTx(entryId, markNames)
      return (listEntryMarksStmt.all(entryId) as Array<{ mark_name: string }>).map((r) => r.mark_name)
    }
  }
}
