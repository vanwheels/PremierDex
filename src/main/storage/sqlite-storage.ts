import Database from 'better-sqlite3'
import type { CollectionEntry, Form, Species } from '@shared/types/pokemon'
import type { TrainerProfile, TrainerProfileInput } from '@shared/types/trainer-profile'
import type { StorageAdapter } from '@shared/storage/storage-interface'
import type { CollectionExport, CollectionImportResult } from '@shared/storage/collection-export'
import { applySchema } from './schema'
import { runSeed } from './seed'

interface SpeciesRow {
  id: number
  name: string
  generation: number
}

interface FormRow {
  id: number
  species_id: number
  form_name: string
  form_category: Form['formCategory']
  home_boxable: 0 | 1
  shiny_locked: 0 | 1
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
}

interface TrainerProfileRow {
  id: number
  game: string
  ot_name: string
  tid: number
  sid: number
  label: string | null
}

function toForm(row: FormRow): Form {
  return {
    id: row.id,
    speciesId: row.species_id,
    formName: row.form_name,
    formCategory: row.form_category,
    homeBoxable: row.home_boxable === 1,
    shinyLocked: row.shiny_locked === 1,
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
    owned: row.owned === 1
  }
}

function toTrainerProfile(row: TrainerProfileRow): TrainerProfile {
  return {
    id: row.id,
    game: row.game,
    otName: row.ot_name,
    tid: row.tid,
    sid: row.sid,
    label: row.label
  }
}

export function createSqliteStorage(dbPath: string): StorageAdapter {
  const db = new Database(dbPath)
  applySchema(db)
  runSeed(db)

  const listSpeciesStmt = db.prepare('SELECT id, name, generation FROM species ORDER BY id')
  const listFormsStmt = db.prepare('SELECT * FROM forms ORDER BY species_id, id')
  const listEntriesStmt = db.prepare('SELECT * FROM collection_entries ORDER BY form_id, gender, shiny')
  const setOwnedStmt = db.prepare('UPDATE collection_entries SET owned = @owned WHERE id = @id')
  const getEntryStmt = db.prepare('SELECT * FROM collection_entries WHERE id = ?')
  const listFormKeysStmt = db.prepare('SELECT id, species_id, form_name FROM forms')
  const listTrainerProfilesStmt = db.prepare('SELECT * FROM trainer_profiles ORDER BY id')
  const getTrainerProfileStmt = db.prepare('SELECT * FROM trainer_profiles WHERE id = ?')
  const insertTrainerProfileStmt = db.prepare(`
    INSERT INTO trainer_profiles (game, ot_name, tid, sid, label)
    VALUES (@game, @otName, @tid, @sid, @label)
  `)
  const updateTrainerProfileStmt = db.prepare(`
    UPDATE trainer_profiles SET game = @game, ot_name = @otName, tid = @tid, sid = @sid, label = @label
    WHERE id = @id
  `)
  const deleteTrainerProfileStmt = db.prepare('DELETE FROM trainer_profiles WHERE id = ?')

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
      return listSpeciesStmt.all() as SpeciesRow[]
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

    async exportCollection(): Promise<CollectionExport> {
      return {
        version: 1,
        exportedAt: new Date().toISOString(),
        species: listSpeciesStmt.all() as SpeciesRow[],
        forms: (listFormsStmt.all() as FormRow[]).map(toForm),
        collectionEntries: (listEntriesStmt.all() as CollectionEntryRow[]).map(toCollectionEntry)
      }
    },

    /** Restores collection state from a backup, full-replace: every current entry ends
     * up owned exactly as the backup says, including reset to unowned when the backup
     * doesn't mention it at all. That's the expected meaning of "import a backup" —
     * species/forms themselves are never touched here, since runSeed already owns
     * keeping those current on every startup. */
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

      const wantedOwned = new Map<string, boolean>()
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
        wantedOwned.set(entryKey(currentFormId, entry.gender, entry.shiny ? 1 : 0), entry.owned)
      }

      const applyImport = db.transaction(() => {
        for (const row of listEntriesStmt.all() as CollectionEntryRow[]) {
          const owned = wantedOwned.get(entryKey(row.form_id, row.gender, row.shiny)) ?? false
          if ((row.owned === 1) !== owned) {
            setOwnedStmt.run({ id: row.id, owned: owned ? 1 : 0 })
          }
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
      deleteTrainerProfileStmt.run(id)
    }
  }
}
