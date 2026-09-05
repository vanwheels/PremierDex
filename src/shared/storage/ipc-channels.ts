/** IPC channel names shared between the main-process handlers and the preload bridge. */
export const PokemonIpcChannel = {
  listSpecies: 'pokemon:species:list',
  listForms: 'pokemon:forms:list',
  listCollectionEntries: 'pokemon:collectionEntries:list',
  setOwned: 'pokemon:collectionEntries:setOwned',
  setEntryOrigin: 'pokemon:collectionEntries:setOrigin',
  setEntryStorageLocation: 'pokemon:collectionEntries:setStorageLocation',
  setEntryBoxPosition: 'pokemon:collectionEntries:setBoxPosition',
  swapEntryBoxPositions: 'pokemon:collectionEntries:swapBoxPositions',
  fillBoxSlots: 'pokemon:collectionEntries:fillBoxSlots',
  /** Bulk move (List view multi-select) — see StorageAdapter.bulkSetEntryStorageLocation's
   * own doc comment. */
  bulkSetEntryStorageLocation: 'pokemon:collectionEntries:bulkSetStorageLocation',
  /** [Dex completeness tier migration] Leg 3's "Resolve Gender Ambiguities" flow — see
   * StorageAdapter.bulkSetEntryGender's own doc comment. */
  bulkSetEntryGender: 'pokemon:collectionEntries:bulkSetGender',
  setCollapsedDisplayForm: 'pokemon:species:setCollapsedDisplayForm',
  /** Leg 6: static per-game species-availability data (see load-species-data.ts),
   * not a StorageAdapter/DB method — there's no collection_entries-shaped row to read,
   * just the fetch-species-availability.ts-written JSON file. */
  loadSpeciesAvailability: 'pokemon:speciesAvailability:load'
} as const

/** File-dialog-backed backup flow (see main/ipc/backup-ipc.ts) — separate from
 * PokemonIpcChannel because these wrap a native save/open dialog plus disk I/O, not a
 * plain StorageAdapter read/write. */
export const BackupIpcChannel = {
  exportToFile: 'pokemon:collection:exportToFile',
  importFromFile: 'pokemon:collection:importFromFile'
} as const

/** Trainer Profile CRUD (see main/ipc/trainer-profile-ipc.ts) — standalone from
 * PokemonIpcChannel's species/form/entry surface, see [Trainer Profile model] in
 * TODO.md. */
export const TrainerProfileIpcChannel = {
  list: 'trainerProfile:list',
  create: 'trainerProfile:create',
  update: 'trainerProfile:update',
  delete: 'trainerProfile:delete'
} as const

/** Storage Location CRUD (see main/ipc/storage-location-ipc.ts) — see [Storage Location
 * model] in TODO.md. */
export const StorageLocationIpcChannel = {
  list: 'storageLocation:list',
  create: 'storageLocation:create',
  update: 'storageLocation:update',
  /** "Duplicate" button (Storage Locations tab) — see StorageAdapter.duplicateStorageLocation's
   * own doc comment. */
  duplicate: 'storageLocation:duplicate',
  delete: 'storageLocation:delete'
} as const

/** Box CRUD, minus delete — not asked for this leg (see main/ipc/box-ipc.ts). See
 * [Add / rename boxes] in TODO.md. */
export const BoxIpcChannel = {
  list: 'box:list',
  add: 'box:add',
  rename: 'box:rename'
} as const

/** "Planned" placeholder CRUD, minus a standalone update — set doubles as both create and
 * change-species (see main/ipc/box-placeholder-ipc.ts). See [Phantom placeholder Pokémon]
 * in TODO.md. */
export const BoxPlaceholderIpcChannel = {
  list: 'boxPlaceholder:list',
  set: 'boxPlaceholder:set',
  /** Bulk apply (Leg 2 of the Dex completeness tier migration) — see
   * StorageAdapter.setBoxPlaceholders' own doc comment. */
  batchSet: 'boxPlaceholder:batchSet',
  clear: 'boxPlaceholder:clear',
  /** "Clear Placeholders" (Leg 6 of the Dex completeness tier migration) — see
   * StorageAdapter.clearAllBoxPlaceholders' own doc comment. */
  clearAll: 'boxPlaceholder:clearAll'
} as const
