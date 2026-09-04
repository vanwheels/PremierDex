import type { CollectionEntry, Form, Gender, Species } from '@shared/types/pokemon'
import type { TrainerProfile } from '@shared/types/trainer-profile'
import type { StorageLocation } from '@shared/types/storage-location'
import type { BoxPlaceholder, StorageBox } from '@shared/types/box'

/**
 * Raw SQLite row shapes plus their conversion to the shared/types/pokemon.ts domain
 * types — split out of sqlite-storage.ts (Leg 3 of the Box Arrangement/Real Inventory
 * Data Model milestone, alongside the earmarked "Split sqlite-storage.ts" TODO item) so
 * both it and collection-backup.ts's export/import can depend on the same row<->domain
 * mapping without duplicating it.
 */

export interface SpeciesRow {
  id: number
  name: string
  generation: number
  collapsed_display_form_id: number | null
}

export interface FormRow {
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

export interface CollectionEntryRow {
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
  caught_ball: string | null
  storage_location_id: number | null
  met_location: string | null
  box_number: number | null
  box_slot: number | null
}

export interface TrainerProfileRow {
  id: number
  game: string
  ot_name: string
  tid: number | null
  sid: number | null
  label: string | null
  language: string | null
}

export interface StorageLocationRow {
  id: number
  location_type: StorageLocation['locationType']
  name: string
  trainer_profile_id: number | null
}

export interface BoxRow {
  id: number
  storage_location_id: number
  box_number: number
  name: string | null
}

export interface BoxPlaceholderRow {
  id: number
  storage_location_id: number
  box_number: number
  box_slot: number
  form_id: number
  gender: Gender
  shiny: number
}

export function toSpecies(row: SpeciesRow): Species {
  return {
    id: row.id,
    name: row.name,
    generation: row.generation,
    collapsedDisplayFormId: row.collapsed_display_form_id
  }
}

export function toForm(row: FormRow): Form {
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
    // before createSqliteStorage prepares the listForms statement.
    pokeapiId: row.pokeapi_id as number,
    spriteFormSuffix: row.sprite_form_suffix
  }
}

export function toCollectionEntry(row: CollectionEntryRow): CollectionEntry {
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
    nickname: row.nickname,
    caughtBall: row.caught_ball,
    storageLocationId: row.storage_location_id,
    metLocation: row.met_location,
    boxNumber: row.box_number,
    boxSlot: row.box_slot
  }
}

export function toTrainerProfile(row: TrainerProfileRow): TrainerProfile {
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

export function toStorageLocation(row: StorageLocationRow): StorageLocation {
  return {
    id: row.id,
    locationType: row.location_type,
    name: row.name,
    trainerProfileId: row.trainer_profile_id
  }
}

export function toStorageBox(row: BoxRow): StorageBox {
  return {
    id: row.id,
    storageLocationId: row.storage_location_id,
    boxNumber: row.box_number,
    name: row.name
  }
}

export function toBoxPlaceholder(row: BoxPlaceholderRow): BoxPlaceholder {
  return {
    id: row.id,
    storageLocationId: row.storage_location_id,
    boxNumber: row.box_number,
    boxSlot: row.box_slot,
    formId: row.form_id,
    gender: row.gender,
    shiny: row.shiny === 1
  }
}
