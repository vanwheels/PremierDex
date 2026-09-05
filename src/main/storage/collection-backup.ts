import type Database from 'better-sqlite3'
import type { CollectionEntry } from '@shared/types/pokemon'
import type { CollectionExport, CollectionImportResult } from '@shared/storage/collection-export'
import { backfillBoxes } from './schema'
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
  const listSpeciesStmt = db.prepare(
    'SELECT id, name, generation, collapsed_display_form_id, is_final_evolution_stage FROM species ORDER BY id'
  )
  const listFormsStmt = db.prepare('SELECT * FROM forms ORDER BY species_id, id')
  // `, id` tiebreaker (Leg 5): matters now that a group can hold more than one row
  // (duplicates, post Leg 2) — entryKey below relies on both the export dump and the
  // restore loop enumerating a group in the same order (insertion/id order) to line up
  // duplicates with their counterpart across a reinstall.
  const listEntriesStmt = db.prepare('SELECT * FROM collection_entries ORDER BY form_id, gender, shiny, id')
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
      box_number = @boxNumber, box_slot = @boxSlot, gender_confirmed = @genderConfirmed
    WHERE id = @id
  `)

  /** `${speciesId}::${formName}` — stable across reinstalls, unlike the AUTOINCREMENT
   * form id, which is what import matching keys on instead of raw ids. */
  function formNaturalKey(speciesId: number, formName: string): string {
    return `${speciesId}::${formName}`
  }

  /** `${formId}::${gender}::${shiny}::${ordinal}` — the `formId`/`gender`/`shiny` group
   * alone stopped being unique once duplicate individuals became real (Leg 2): a group can
   * now hold more than one row, and nothing on the row itself distinguishes which
   * individual is which. `ordinal` is that row's 0-indexed position within its group under
   * `assignGroupOrdinal` below (first-inserted is #0, second is #1, ...) — the closest
   * thing to a stable per-individual identity duplicates have, given both the export dump
   * and the restore loop walk their rows in the same insertion (id) order. It's a
   * position-based match, not a true identity: importing a backup with more copies in a
   * group than the target database currently has rows for silently drops the extras (same
   * "nothing to write into" outcome as any other unmatched entry), and importing one with
   * fewer resets the target's extra copies to defaults, same as today's full-replace
   * behavior for any other row absent from the backup. Decided 2026-09-03 as Leg 5's
   * scope: revisit if Leg 7's duplicate-adding UI makes that gap reachable in practice. */
  function entryKey(formId: number, gender: CollectionEntry['gender'], shiny: 0 | 1, ordinal: number): string {
    return `${formId}::${gender}::${shiny}::${ordinal}`
  }

  /** Returns `formId`/`gender`/`shiny`'s next 0-indexed ordinal and advances `counters` for
   * it — see entryKey's doc comment above. Caller must enumerate rows in a consistent order
   * (id order, via listEntriesStmt's `ORDER BY ..., id`) for ordinals to line up across two
   * separate calls (e.g. once over `data.collectionEntries`, once over the live table). */
  function assignGroupOrdinal(
    counters: Map<string, number>,
    formId: number,
    gender: CollectionEntry['gender'],
    shiny: 0 | 1
  ): number {
    const groupKey = `${formId}::${gender}::${shiny}`
    const ordinal = counters.get(groupKey) ?? 0
    counters.set(groupKey, ordinal + 1)
    return ordinal
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
        genderConfirmed: boolean
      }
      const wantedByKey = new Map<string, WantedEntry>()
      const importOrdinalCounters = new Map<string, number>()
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
        // Ordinal within (currentFormId, gender, shiny) — see entryKey's doc comment.
        // data.collectionEntries is in export order (form_id, gender, shiny, id), so
        // walking it in order and grouping by the remapped currentFormId reproduces each
        // duplicate's original id-order position.
        const ordinal = assignGroupOrdinal(importOrdinalCounters, currentFormId, entry.gender, entry.shiny ? 1 : 0)
        // A box position only means anything alongside a location (see CollectionEntry's
        // doc comment): if the import's storageLocationId was dropped (null in the
        // backup, or invalidated by the guard above), box_number/box_slot must drop too —
        // restoreEntryStmt writes these columns directly and isn't routed through
        // setEntryBoxPosition's invariant check.
        const resolvedStorageLocationId =
          entry.storageLocationId !== null && importedStorageLocationIds.has(entry.storageLocationId)
            ? entry.storageLocationId
            : null
        wantedByKey.set(entryKey(currentFormId, entry.gender, entry.shiny ? 1 : 0, ordinal), {
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
          boxSlot: resolvedStorageLocationId !== null ? entry.boxSlot : null,
          // `?? false` guards a pre-genderConfirmed backup file (the field didn't exist
          // yet) rather than trusting CollectionExport's compile-time type, same defensive
          // stance parseCollectionExport already takes on the rest of a hand-edited or
          // stale backup's shape.
          genderConfirmed: entry.genderConfirmed ?? false
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

        const restoreOrdinalCounters = new Map<string, number>()
        for (const row of listEntriesStmt.all() as CollectionEntryRow[]) {
          // Same id-order walk as the import loop above, over the live table this time —
          // see entryKey's doc comment for why this lines up duplicates across the two.
          const ordinal = assignGroupOrdinal(restoreOrdinalCounters, row.form_id, row.gender, row.shiny)
          const wanted = wantedByKey.get(entryKey(row.form_id, row.gender, row.shiny, ordinal))
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
            boxSlot: wanted?.boxSlot ?? null,
            genderConfirmed: wanted?.genderConfirmed ? 1 : 0
          })
        }

        // deleteAllStorageLocationsStmt above cascade-deletes every `boxes` row
        // (schema.ts's ON DELETE CASCADE) — CollectionExport doesn't carry box names/
        // empty-box state yet (see TODO.md), so this rebuilds bare (unnamed) Box 1s plus
        // whatever box_number the just-restored entries above reference, same backfill
        // schema.ts runs on every startup. Runs after the restore loop, not before: it
        // reads collection_entries' box_number/storage_location_id, which only hold their
        // final restored values once that loop above has finished. Good enough to keep
        // Box view functional post-import; not a full round-trip of renamed/empty boxes.
        backfillBoxes(db)
      })
      applyImport()

      return { matched, skipped }
    }
  }
}
