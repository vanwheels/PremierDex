import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

/** 'system' follows the OS's `prefers-color-scheme`; 'pearl'/'diamond' are explicit
 * overrides. Named for the two in-app palettes (see tokens.css) rather than
 * light/dark — neither is a light theme, see that file's doc comment. */
export type ThemeMode = 'system' | 'pearl' | 'diamond'

const DEFAULT_MODE: ThemeMode = 'pearl'
const STORAGE_KEY = 'premierdex.themeMode'

function loadThemeMode(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === 'system' || raw === 'pearl' || raw === 'diamond' ? raw : DEFAULT_MODE
  } catch {
    return DEFAULT_MODE
  }
}

/** 'system' resolves via `prefers-color-scheme` (OS light → Diamond, OS dark → Pearl,
 * matching which palette sits closer to each end pre-toggle); otherwise the mode itself
 * is already resolved. */
function resolveTheme(mode: ThemeMode): 'pearl' | 'diamond' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'diamond' : 'pearl'
  }
  return mode
}

function applyTheme(mode: ThemeMode): void {
  document.documentElement.dataset.theme = resolveTheme(mode)
}

// Applied synchronously at module load — this module is imported (via App.tsx) before
// ReactDOM ever renders, so this runs before the first paint and avoids a
// Pearl<->Diamond flash for anyone whose saved/system theme isn't tokens.css's bare-
// `:root` default (Pearl).
applyTheme(loadThemeMode())

interface ThemeContextValue {
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/** Wraps the app (outermost provider in App.tsx) so ThemeModeToggle, wherever it's
 * rendered, can read/set the mode. Deliberately plain `localStorage`, not IPC-backed
 * SQLite — this is a per-install UI preference, not collection data. */
export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [themeMode, setThemeMode] = useState<ThemeMode>(loadThemeMode)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, themeMode)
    } catch {
      // Best-effort persistence — a private/restricted profile just re-resolves the
      // default next launch instead of failing the app.
    }
  }, [themeMode])

  // Re-applies on every themeMode change, and — only while in 'system' mode — also
  // reacts live to the OS preference changing while the app is open (no restart
  // needed).
  useEffect(() => {
    applyTheme(themeMode)
    if (themeMode !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = (): void => applyTheme('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [themeMode])

  return <ThemeContext.Provider value={{ themeMode, setThemeMode }}>{children}</ThemeContext.Provider>
}

export function useThemeMode(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeMode must be used within a ThemeProvider')
  return ctx
}
