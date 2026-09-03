import Database from 'better-sqlite3'
import type { CollectionEntry, CollectionEntryOriginInput, Form, Species } from '@shared/types/pokemon'
import type { TrainerProfile, TrainerProfileInput } from '@shared/types/trainer-profile'
import type { StorageLocation, StorageLocationInput } from '@shared/types/storage-location'
import type { StorageAdapter } from '@shared/storage/storage-interface'
import type { CollectionExport, CollectionImportResult } from '@shared/storage/collection-export'
import { applySchema } from './schema'
import { runSeed } from './seed'

interface SpeciesRow {
  id: number
  name: string
  generation: number
  collapsed_display_form_id: number | null
}

interface FormRow {
  id: number
  species_id: number
  form_name: string
  form_category: Form['formCategory']
  home_boxable: 0 | 1
  shiny_locked: 0 | 1
  always_shiny: 0 | 1
  has_gender_difference: 0 | 1
  first_available_generation: number
  regional_group: string | null
  pokeapi_id: number | null
  sprite_form_suffix: string | null
}

interface CollectionEntryRow {
  id: number
  form_id: number
  gender: CollectionEntry['gender']
  shiny: 0 | 1
  owned: 0 | 1
  trainer_profile_id: number | null
  origin_game: string | null
  ot_name: string | null
  tid: number | null
  sid: number | null
  language: string | null
  nickname: string | null
}

interface TrainerProfileRow {
  id: number
  game: string
  ot_name: string
  tid: number | null
  sid: number | null
  label: string | null
  language: string | null
}

interface StorageLocationRow {
  id: number
  location_type: StorageLocation['locationType']
  name: string
  trainer_profile_id: number | null
}

function toSpecies(row: SpeciesRow): Species {
  return {
    id: row.id,
    name: row.name,
    generation: row.generation,
    collapsedDisplayFormId: row.collapsed_display_form_id
  }
}

function toForm(row: FormRow): Form {
  return {
    id: row.id,
    speciesId: row.species_id,
    formName: row.form_name,
    formCategory: row.form_category,
    homeBoxable: row.home_boxable === 1,
    shinyLocked: row.shiny_locked === 1,
    alwaysShiny: row.always_shiny === 1,
    hasGenderDifference: row.has_gender_difference === 1,
    firstAvailableGeneration: row.first_available_generation,
    regionalGroup: row.regional_group,
    // Non-null by the time this runs: runSeed's backfill (seed.ts) always completes
    // before createSqliteStorage prepares the listForms statement below.
    pokeapiId: row.pokeapi_id as number,
    spriteFormSuffix: row.sprite_form_suffix
  }
}

function toCollectionEntry(row: CollectionEntryRow): CollectionEntry {
  return {
    id: row.id,
    formId: row.form_id,
    gender: row.gender,
    shiny: row.shiny === 1,
    owned: row.owned === 1,
    trainerProfileId: row.trainer_profile_id,
    originGame: row.origin_game,
    otName: row.ot_name,
    tid: row.tid,
    sid: row.sid,
    language: row.language,
    nickname: row.nickname
  }
}

function toTrainerProfile(row: TrainerProfileRow): TrainerProfile {
  return {
    id: row.id,
    game: row.game,
    otName: row.ot_name,
    tid: row.tid,
    sid: row.sid,
    label: row.label,
    language: row.language
  }
}

function toStorageLocation(row: StorageLocationRow): StorageLocation {
  return {
    id: row.id,
    locationType: row.location_type,
    name: row.name,
    trainerProfileId: row.trainer_profile_id
  }
}

export function createSqliteStorage(dbPath: string): StorageAdapter {
  const db = new Database(dbPath)
  applySchema(db)
  runSeed(db)

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
      tid = @tid, sid = @sid, language = @language, nickname = @nickname
    WHERE id = @id
  `)
  const orphanEntriesByTrainerProfileStmt = db.prepare(
    'UPDATE collection_entries SET trainer_profile_id = NULL WHERE trainer_profile_id = ?'
  )
  const listFormKeysStmt = db.prepare('SELECT id, species_id, form_name FROM forms')
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

  // Backup restore (Leg 13): Trainer Profiles/Storage Locations are pure user data with
  // no seed path to fall back on (unlike species/forms), so restoring them is a full
  // wipe-and-recreate that preserves each row's original id rather than a natural-key
  // match. A natural key can't work here the way it does for forms — TrainerProfile's
  // `label` exists specifically so two profiles can share the same game/otName/tid/sid
  // (e.g. two playthroughs of the same game) — and preserving ids is what keeps
  // collection_entries.trainer_profile_id and storage_locations.trainer_profile_id valid
  // post-restore with no remapping step. See importCollection below.
  const clearAllEntryTrainerProfilesStmt = db.prepare('UPDATE collection_entries SET trainer_profile_id = NULL')
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
      ot_name = @otName, tid = @tid, sid = @sid, language = @language, nickname = @nickname
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

      interface WantedEntry {
        owned: boolean
        trainerProfileId: number | null
        originGame: string | null
        otName: string | null
        tid: number | null
        sid: number | null
        language: string | null
        nickname: string | null
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
          nickname: entry.nickname
        })
      }

      const applyImport = db.transaction(() => {
        // Order matters under foreign_keys = ON: clear collection_entries' FK to
        // trainer_profiles first, then delete storage_locations (child) before
        // trainer_profiles (parent) — otherwise either delete fails against a row still
        // referencing it. Reinsertion is parent-then-child for the same reason.
        clearAllEntryTrainerProfilesStmt.run()
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
            nickname: wanted?.nickname ?? null
          })
        }
      })
      applyImport()

      return { matched, skipped }
    },

    async listTrainerProfiles(): Promise<TrainerProfile[]> {
      return (listTrainerProfilesStmt.all() as TrainerProfileRow[]).map(toTrainerProfile)
    },

    async createTrainerProfile(input: TrainerProfileInput): Promise<TrainerProfile> {
      const result = insertTrainerProfileStmt.run(input)
      return toTrainerProfile(getTrainerProfileStmt.get(result.lastInsertRowid) as TrainerProfileRow)
    },

    async updateTrainerProfile(id: number, input: TrainerProfileInput): Promise<TrainerProfile> {
      updateTrainerProfileStmt.run({ id, ...input })
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
      const result = insertStorageLocationStmt.run(input)
      return toStorageLocation(getStorageLocationStmt.get(result.lastInsertRowid) as StorageLocationRow)
    },

    async updateStorageLocation(id: number, input: StorageLocationInput): Promise<StorageLocation> {
      updateStorageLocationStmt.run({ id, ...input })
      return toStorageLocation(getStorageLocationStmt.get(id) as StorageLocationRow)
    },

    async deleteStorageLocation(id: number): Promise<void> {
      deleteStorageLocationStmt.run(id)
    }
  }
}
