import { useThemeMode, type ThemeMode } from './theme-store'

type ExplicitMode = Exclude<ThemeMode, 'system'>

/** Fixed per-icon hues (blue diamond / purple pearl, per the sketch), deliberately not
 * `var(--accent)` — the icon has to identify which palette it selects, not recolor itself
 * to whichever palette is currently active. */
const OPTIONS: { mode: ExplicitMode; label: string; color: string; shape: JSX.Element }[] = [
  {
    mode: 'diamond',
    label: 'Diamond',
    color: '#5fa0e0',
    shape: <path d="M8 1.5 14.5 8 8 14.5 1.5 8Z" />
  },
  {
    mode: 'pearl',
    label: 'Pearl',
    color: '#b57fd0',
    shape: <circle cx="8" cy="8" r="6" />
  }
]

/**
 * Diamond/Pearl icon control in the persistent header chrome (App.tsx), per the Full UI/UX
 * pass's sketch — one bordered box holding two icon buttons instead of the old 3-button
 * text row. Same `theme-store` underneath, so 'system' still exists: it has no icon of its
 * own, so it shows as neither button pressed, and clicking the already-pressed icon again
 * releases back to it (spelled out in the tooltip). `role="radiogroup"`/`aria-checked`
 * keep the native-radio-group semantics the old control had.
 */
export function ThemeModeToggle(): JSX.Element {
  const { themeMode, setThemeMode } = useThemeMode()

  return (
    <div className="theme-toggle" role="radiogroup" aria-label="Theme">
      {OPTIONS.map(({ mode, label, color, shape }) => {
        const checked = themeMode === mode
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={label}
            title={checked ? `${label} (click again to follow the system theme)` : label}
            className={checked ? 'theme-toggle-option active' : 'theme-toggle-option'}
            onClick={() => setThemeMode(checked ? 'system' : mode)}
          >
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill={color} stroke="currentColor" strokeWidth="1">
              {shape}
            </svg>
          </button>
        )
      })}
    </div>
  )
}
