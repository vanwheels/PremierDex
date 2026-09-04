import { useEffect, useState } from 'react'

/** Which layout the Living Dex renders as. Only 'list' exists so far — Leg 8 adds
 * 'hybrid' (the HOME-derived sprite grid) as a second value read by this same hook. */
export type DexViewMode = 'list'

const DEFAULT_VIEW_MODE: DexViewMode = 'list'
const STORAGE_KEY = 'premierdex.dexViewMode'

/** Exported for testing — the only real logic in this file, everything else is
 * localStorage/React plumbing mirroring theme-store's loadThemeMode. */
export function isDexViewMode(value: string | null): value is DexViewMode {
  return value === 'list'
}

function loadDexViewMode(): DexViewMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return isDexViewMode(raw) ? raw : DEFAULT_VIEW_MODE
  } catch {
    return DEFAULT_VIEW_MODE
  }
}

/**
 * Persisted Living Dex view-mode preference (Leg 7) — a per-install UI choice, not
 * collection data, so plain `localStorage` rather than IPC-backed SQLite, same reasoning
 * as theme-store's ThemeMode. Only App.tsx consumes this today, so it's a plain hook
 * rather than a Context/Provider like ThemeProvider.
 */
export function useDexViewMode(): [DexViewMode, (mode: DexViewMode) => void] {
  const [viewMode, setViewMode] = useState<DexViewMode>(loadDexViewMode)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, viewMode)
    } catch {
      // Best-effort persistence — a private/restricted profile just re-resolves the
      // default next launch instead of failing the app.
    }
  }, [viewMode])

  return [viewMode, setViewMode]
}
