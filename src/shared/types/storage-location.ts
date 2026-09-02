/**
 * A storage location a Pokémon currently resides in — HOME Account, Pokémon Bank,
 * Pokémon Box, My Pokémon Ranch, or the boxes inside a specific save file. Deliberately
 * separate from TrainerProfile (Leg 1): a Collection Entry's origin (which trainer
 * originally caught/received it) must stay fixed while its current location moves freely
 * across trades and transfers. See [Storage Location model] in TODO.md.
 *
 * None of the five location kinds expose a real, capturable identifier — confirmed
 * against Bulbapedia/Project Pokémon: Pokémon Bank, Pokémon Box, and My Pokémon Ranch
 * store nothing usable outside their own save data, and Pokémon HOME's only
 * account-level ID is a social friend code that identifies a person, not a storage slot.
 * So identity here is uniformly a user-provided name, not a type-specific ID field.
 */
export type StorageLocationType = 'home' | 'bank' | 'box' | 'ranch' | 'save_file'

export interface StorageLocationTypeInfo {
  id: StorageLocationType
  label: string
}

/** Fixed, exhaustive list — unlike origin-games.ts's open-ended game list, there are only
 * ever these five kinds of storage location. */
export const STORAGE_LOCATION_TYPES: StorageLocationTypeInfo[] = [
  { id: 'home', label: 'HOME Account' },
  { id: 'bank', label: 'Pokémon Bank' },
  { id: 'box', label: 'Pokémon Box' },
  { id: 'ranch', label: 'My Pokémon Ranch' },
  { id: 'save_file', label: 'Save File' }
]

export interface StorageLocation {
  id: number
  locationType: StorageLocationType
  name: string
  /** The trainer whose save file's boxes this is — required when locationType is
   * 'save_file', null for every other type. Enforced by a DB CHECK constraint, not just
   * convention. */
  trainerProfileId: number | null
}

/** Field set for create/update — everything but the assigned id. */
export interface StorageLocationInput {
  locationType: StorageLocationType
  name: string
  trainerProfileId: number | null
}
