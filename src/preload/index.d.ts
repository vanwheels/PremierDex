import type { StorageAdapter } from '@shared/storage/storage-interface'

declare global {
  interface Window {
    premierDex: StorageAdapter
  }
}
