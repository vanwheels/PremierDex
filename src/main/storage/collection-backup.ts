import type Database from 'better-sqlite3'
import type { CollectionEntry } from '@shared/types/pokemon'
import type { CollectionExport, CollectionImportResult } from '@shared/storage/collection-export'
import {
  toCollectionEntry,
  toForm,
  toSpecies,
  toStorageLocation,
  toTrainerProfile,
  type CollectionEntryRow,
  type FormRow,
  type SpeciesRow,
  type StorageLocationRow,
  type TrainerProfileRow
} from './row-mappers'

/**
 * exportCollection/importCollection, split out of sqlite-storage.ts (Leg 3 of the Box
 * Arrangement/Real Inventory Data Model milestone) per the "Split sqlite-storage.ts"
 * TODO item — this pair, plus its natural-key matching helpers, was the file's single
 * largest chunk and the one least entangled with the rest of createSqliteStorage's CRUD
 * surface. Prepares its own statements against the same `db` handle passed in rather
 * than sharing sqlite-storage.ts's — a little prepared-statement duplication for a clean
 * module boundary, not a functional difference (better-sqlite3 statements are cheap and
 * stateless per-call).
 */
export function createBackupOperations(db: Database.Database): {
  exportCollection(): Promise<CollectionExport>
  importCollection(data: CollectionExport): Promise<CollectionImportResult>
} {
  const listSpeciesStmt = db.prepare('SELECT id, name, generation, collapsed_display_form_id FROM species ORDER BY id')
  const listFormsStmt = db.prepare('SELECT * FROM forms ORDER BY species_id, id')
  const listEntriesStmt = db.prepare('SELECT * FROM collection_entries ORDER BY form_id, gender, shiny')
  const listTrainerProfilesStmt = db.prepare('SELECT * FROM trainer_profiles ORDER BY id')
  const listStorageLocationsStmt = db.prepare('SELECT * FROM storage_locations ORDER BY id')
  const listFormKeysStmt = db.prepare('SELECT id, species_id, form_name FROM forms')

  // Backup restore (Leg 13): Trainer Profiles/Storage Locations are pure user data with
  // no seed path to fall back on (unlike species/forms), so restoring them is a full
  // wipe-and-recreate that preserves each row's original id rather than a natural-key
  // match. A natural key can't work here the way it does for forms — TrainerProfile's
  // `label` exists specifically so two profiles can share the same game/otName/tid/sid
  // (e.g. two playthroughs of the same game) — and preserving ids is what keeps
  // collection_entries.trainer_profile_id and storage_locations.trainer_profile_id valid
  // post-restore with no remapping step.
  const clearAllEntryTrainerProfilesStmt = db.prepare('UPDATE collection_entries SET trainer_profile_id = NULL')
  // Same FK hazard as clearAllEntryTrainerProfilesStmt: storage_location_id has no ON
  // DELETE clause, so wiping storage_locations below would otherwise fail the FK check
  // against any entry still assigned to one.
  const clearAllEntryStorageLocationsStmt = db.prepare('UPDATE collection_entries SET storage_location_id = NULL')
  const deleteAllStorageLocationsStmt = db.prepare('DELETE FROM storage_locations')
  const deleteAllTrainerProfilesStmt = db.prepare('DELETE FROM trainer_profiles')
  const insertTrainerProfileWithIdStmt = db.prepare(`
    INSERT INTO trainer_profiles (id, game, ot_name, tid, sid, label, language)
    VALUES (@id, @game, @otName, @tid, @sid, @label, @language)
  `)
  const insertStorageLocationWithIdStmt = db.prepare(`
    INSERT INTO storage_locations (id, location_type, name, trainer_profile_id)
    VALUES (@id, @locationType, @name, @trainerProfileId)
  `)
  const restoreEntryStmt = db.prepare(`
    UPDATE collection_entries
    SET owned = @owned, trainer_profile_id = @trainerProfileId, origin_game = @originGame,
      ot_name = @otName, tid = @tid, sid = @sid, language = @language, nickname = @nickname,
      caught_ball = @caughtBall, storage_location_id = @storageLocationId, met_location = @metLocation,
      box_number = @boxNumber, box_slot = @boxSlot
    WHERE id = @id
  `)

  /** `${speciesId}::${formName}` — stable across reinstalls, unlike the AUTOINCREMENT
   * form id, which is what import matching keys on instead of raw ids. */
  function formNaturalKey(speciesId: number, formName: string): string {
    return `${speciesId}::${formName}`
  }

  function entryKey(formId: number, gender: CollectionEntry['gender'], shiny: 0 | 1): string {
    return `${formId}::${gender}::${shiny}`
  }

  return {
    async exportCollection(): Promise<CollectionExport> {
      return {
        version: 2,
        exportedAt: new Date().toISOString(),
        species: (listSpeciesStmt.all() as SpeciesRow[]).map(toSpecies),
        forms: (listFormsStmt.all() as FormRow[]).map(toForm),
        collectionEntries: (listEntriesStmt.all() as CollectionEntryRow[]).map(toCollectionEntry),
        trainerProfiles: (listTrainerProfilesStmt.all() as TrainerProfileRow[]).map(toTrainerProfile),
        storageLocations: (listStorageLocationsStmt.all() as StorageLocationRow[]).map(toStorageLocation)
      }
    },

    /** Restores collection state from a backup, full-replace: every current entry ends
     * up owned/origin-linked exactly as the backup says, including reset to
     * unowned/unlinked when the backup doesn't mention it at all. That's the expected
     * meaning of "import a backup". Trainer Profiles and Storage Locations get the same
     * full-replace treatment (Leg 13) — see the prepared statements above for why ids are
     * preserved rather than remapped. species/forms themselves are never touched here,
     * since runSeed already owns keeping those current on every startup. */
    async importCollection(data: CollectionExport): Promise<CollectionImportResult> {
      const importFormKeys = new Map<number, string>()
      for (const form of data.forms) {
        importFormKeys.set(form.id, formNaturalKey(form.speciesId, form.formName))
      }

      const currentFormIdByKey = new Map<string, number>()
      const currentForms = listFormKeysStmt.all() as Array<{
        id: number
        species_id: number
        form_name: string
      }>
      for (const form of currentForms) {
        currentFormIdByKey.set(formNaturalKey(form.species_id, form.form_name), form.id)
      }

      // Guards against a malformed/hand-edited backup whose entry points at a
      // trainerProfileId absent from its own trainerProfiles array — a well-formed
      // export can never disagree with itself here, since trainerProfiles is a full
      // dump of the same live table the entries' FK was read from.
      const importedTrainerProfileIds = new Set(data.trainerProfiles.map((profile) => profile.id))
      // Same guard, same reasoning, for storageLocationId against data.storageLocations.
      const importedStorageLocationIds = new Set(data.storageLocations.map((location) => location.id))

      interface WantedEntry {
        owned: boolean
        trainerProfileId: number | null
        originGame: string | null
        otName: string | null
        tid: number | null
        sid: number | null
        language: string | null
        nickname: string | null
        caughtBall: string | null
        storageLocationId: number | null
        metLocation: string | null
        boxNumber: number | null
        boxSlot: number | null
      }
      const wantedByKey = new Map<string, WantedEntry>()
      let matched = 0
      let skipped = 0
      for (const entry of data.collectionEntries) {
        const naturalKey = importFormKeys.get(entry.formId)
        const currentFormId = naturalKey !== undefined ? currentFormIdByKey.get(naturalKey) : undefined
        if (currentFormId === undefined) {
          skipped++
          continue
        }
        matched++
        // A box position only means anything alongside a location (see CollectionEntry's
        // doc comment): if the import's storageLocationId was dropped (null in the
        // backup, or invalidated by the guard above), box_number/box_slot must drop too —
        // restoreEntryStmt writes these columns directly and isn't routed through
        // setEntryBoxPosition's invariant check.
        const resolvedStorageLocationId =
          entry.storageLocationId !== null && importedStorageLocationIds.has(entry.storageLocationId)
            ? entry.storageLocationId
            : null
        wantedByKey.set(entryKey(currentFormId, entry.gender, entry.shiny ? 1 : 0), {
          owned: entry.owned,
          trainerProfileId:
            entry.trainerProfileId !== null && importedTrainerProfileIds.has(entry.trainerProfileId)
              ? entry.trainerProfileId
              : null,
          originGame: entry.originGame,
          otName: entry.otName,
          tid: entry.tid,
          sid: entry.sid,
          language: entry.language,
          nickname: entry.nickname,
          caughtBall: entry.caughtBall,
          storageLocationId: resolvedStorageLocationId,
          metLocation: entry.metLocation,
          boxNumber: resolvedStorageLocationId !== null ? entry.boxNumber : null,
          boxSlot: resolvedStorageLocationId !== null ? entry.boxSlot : null
        })
      }

      const applyImport = db.transaction(() => {
        // Order matters under foreign_keys = ON: clear collection_entries' FK to
        // trainer_profiles first, then delete storage_locations (child) before
        // trainer_profiles (parent) — otherwise either delete fails against a row still
        // referencing it. Reinsertion is parent-then-child for the same reason.
        clearAllEntryTrainerProfilesStmt.run()
        clearAllEntryStorageLocationsStmt.run()
        deleteAllStorageLocationsStmt.run()
        deleteAllTrainerProfilesStmt.run()
        for (const profile of data.trainerProfiles) {
          insertTrainerProfileWithIdStmt.run(profile)
        }
        for (const location of data.storageLocations) {
          insertStorageLocationWithIdStmt.run(location)
        }

        for (const row of listEntriesStmt.all() as CollectionEntryRow[]) {
          const wanted = wantedByKey.get(entryKey(row.form_id, row.gender, row.shiny))
          restoreEntryStmt.run({
            id: row.id,
            owned: wanted?.owned ? 1 : 0,
            trainerProfileId: wanted?.trainerProfileId ?? null,
            originGame: wanted?.originGame ?? null,
            otName: wanted?.otName ?? null,
            tid: wanted?.tid ?? null,
            sid: wanted?.sid ?? null,
            language: wanted?.language ?? null,
            nickname: wanted?.nickname ?? null,
            caughtBall: wanted?.caughtBall ?? null,
            storageLocationId: wanted?.storageLocationId ?? null,
            metLocation: wanted?.metLocation ?? null,
            boxNumber: wanted?.boxNumber ?? null,
            boxSlot: wanted?.boxSlot ?? null
          })
        }
      })
      applyImport()

      return { matched, skipped }
    }
  }
}
