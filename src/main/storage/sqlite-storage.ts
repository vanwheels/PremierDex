import Database from 'better-sqlite3'
import type { CollectionEntry, CollectionEntryOriginInput, Form, Species } from '@shared/types/pokemon'
import type { TrainerProfile, TrainerProfileInput } from '@shared/types/trainer-profile'
import type { StorageLocation, StorageLocationInput } from '@shared/types/storage-location'
import type { StorageBox } from '@shared/types/box'
import type { StorageAdapter } from '@shared/storage/storage-interface'
import { applySchema } from './schema'
import { runSeed } from './seed'
import { createBackupOperations } from './collection-backup'
import {
  toCollectionEntry,
  toForm,
  toSpecies,
  toStorageBox,
  toStorageLocation,
  toTrainerProfile,
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

  const listSpeciesStmt = db.prepare(
    'SELECT id, name, generation, collapsed_display_form_id FROM species ORDER BY id'
  )
  const getSpeciesStmt = db.prepare(
    'SELECT id, name, generation, collapsed_display_form_id FROM species WHERE id = ?'
  )
  const setCollapsedDisplayFormStmt = db.prepare(
    'UPDATE species SET collapsed_display_form_id = @formId WHERE id = @id'
  )
  const listFormsStmt = db.prepare('SELECT * FROM forms ORDER BY species_id, id')
  const listEntriesStmt = db.prepare('SELECT * FROM collection_entries ORDER BY form_id, gender, shiny')
  const setOwnedStmt = db.prepare('UPDATE collection_entries SET owned = @owned WHERE id = @id')
  const getEntryStmt = db.prepare('SELECT * FROM collection_entries WHERE id = ?')
  const setEntryOriginStmt = db.prepare(`
    UPDATE collection_entries
    SET trainer_profile_id = @trainerProfileId, origin_game = @originGame, ot_name = @otName,
      tid = @tid, sid = @sid, language = @language, nickname = @nickname, caught_ball = @caughtBall,
      met_location = @metLocation
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
  const insertBoxStmt = db.prepare(`
    INSERT INTO boxes (storage_location_id, box_number, name)
    VALUES (
      @storageLocationId,
      (SELECT COALESCE(MAX(box_number), 0) + 1 FROM boxes WHERE storage_location_id = @storageLocationId),
      NULL
    )
  `)
  const renameBoxStmt = db.prepare('UPDATE boxes SET name = @name WHERE id = @id')
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

    async setOwned(entryId: number, owned: boolean): Promise<CollectionEntry> {
      setOwnedStmt.run({ id: entryId, owned: owned ? 1 : 0 })
      return toCollectionEntry(getEntryStmt.get(entryId) as CollectionEntryRow)
    },

    async setEntryOrigin(entryId: number, input: CollectionEntryOriginInput): Promise<CollectionEntry> {
      setEntryOriginStmt.run({ id: entryId, ...input })
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
    }
  }
}
