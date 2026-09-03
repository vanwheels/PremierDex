import { useThemeMode, type ThemeMode } from './theme-store'

const OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: 'System' },
  { mode: 'diamond', label: 'Diamond' },
  { mode: 'pearl', label: 'Pearl' }
]

/**
 * 3-way System/Diamond/Pearl control, in the persistent header chrome next to
 * BackupControls/UpdateControls (App.tsx). Plain `<button>`s reusing the same
 * "active" visual (border-color + color: var(--accent)) as every other selected-state
 * control in this app (`.app-view-tab.active`), rather than inventing a new
 * segmented-control look — same pattern as GW2-Squaded's own ThemeModeToggle.
 * `role="radiogroup"`/`aria-checked` give it the same keyboard/screen-reader semantics
 * as a native radio group.
 */
export function ThemeModeToggle(): JSX.Element {
  const { themeMode, setThemeMode } = useThemeMode()

  return (
    <div className="theme-mode-row" role="radiogroup" aria-label="Theme">
      {OPTIONS.map(({ mode, label }) => (
        <button
          key={mode}
          type="button"
          role="radio"
          aria-checked={themeMode === mode}
          className={themeMode === mode ? 'theme-mode-option active' : 'theme-mode-option'}
          onClick={() => setThemeMode(mode)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
