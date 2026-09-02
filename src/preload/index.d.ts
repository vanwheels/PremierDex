import type { AppBridge } from './bridge'

declare global {
  interface Window {
    premierDex: AppBridge
  }
}
