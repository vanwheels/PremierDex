import type { CollectionEntry, Form, Species } from '../types/pokemon'

/**
 * The full local storage surface the app depends on. The renderer never talks to
 * SQLite directly — it only ever depends on this interface, reached via the
 * preload-exposed `window.premierDex` bridge (see src/preload/index.ts). Domain-specific
 * (not a generic blob Repository<T>) because Species/Form/CollectionEntry are real
 * relational reads, not opaque records.
 *
 * Methods are async even though better-sqlite3 itself is synchronous, so the interface
 * doesn't leak that implementation detail across the IPC boundary.
 */
export interface StorageAdapter {
  listSpecies(): Promise<Species[]>
  listForms(): Promise<Form[]>
  listCollectionEntries(): Promise<CollectionEntry[]>
  setOwned(entryId: number, owned: boolean): Promise<CollectionEntry>
}
