import Database from 'better-sqlite3'
import type { CollectionEntry, Form, Species } from '@shared/types/pokemon'
import type { StorageAdapter } from '@shared/storage/storage-interface'
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
  has_gender_difference: 0 | 1
  first_available_generation: number
  regional_group: string | null
}

interface CollectionEntryRow {
  id: number
  form_id: number
  gender: CollectionEntry['gender']
  shiny: 0 | 1
  owned: 0 | 1
}

function toForm(row: FormRow): Form {
  return {
    id: row.id,
    speciesId: row.species_id,
    formName: row.form_name,
    formCategory: row.form_category,
    homeBoxable: row.home_boxable === 1,
    hasGenderDifference: row.has_gender_difference === 1,
    firstAvailableGeneration: row.first_available_generation,
    regionalGroup: row.regional_group
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

export function createSqliteStorage(dbPath: string): StorageAdapter {
  const db = new Database(dbPath)
  applySchema(db)
  runSeed(db)

  const listSpeciesStmt = db.prepare('SELECT id, name, generation FROM species ORDER BY id')
  const listFormsStmt = db.prepare('SELECT * FROM forms ORDER BY species_id, id')
  const listEntriesStmt = db.prepare('SELECT * FROM collection_entries ORDER BY form_id, gender, shiny')
  const setOwnedStmt = db.prepare('UPDATE collection_entries SET owned = @owned WHERE id = @id')
  const getEntryStmt = db.prepare('SELECT * FROM collection_entries WHERE id = ?')

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
    }
  }
}
