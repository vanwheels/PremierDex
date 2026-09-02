/** IPC channel names shared between the main-process handlers and the preload bridge. */
export const PokemonIpcChannel = {
  listSpecies: 'pokemon:species:list',
  listForms: 'pokemon:forms:list',
  listCollectionEntries: 'pokemon:collectionEntries:list',
  setOwned: 'pokemon:collectionEntries:setOwned'
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
