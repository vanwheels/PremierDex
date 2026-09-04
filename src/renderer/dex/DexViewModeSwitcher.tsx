import type { DexViewMode } from './useDexViewMode'

const OPTIONS: { mode: DexViewMode; label: string }[] = [
  { mode: 'list', label: 'List' },
  { mode: 'hybrid', label: 'Hybrid' }
]

interface DexViewModeSwitcherProps {
  viewMode: DexViewMode
  onChange: (mode: DexViewMode) => void
}

/**
 * View-mode radio group (Leg 7) — rendered alongside DexFilterBar rather than replacing
 * it, since every filter dimension applies identically across every view mode (confirmed
 * with Vanny; see TODO.md). Same plain-buttons-as-radio-group treatment as
 * ThemeModeToggle: `.active` reuses the shared border-color/color: var(--accent) look
 * rather than a bespoke segmented control.
 *
 * 'Hybrid' (Leg 8) is the HOME-derived sprite grid — see DexHybridGrid.
 */
export function DexViewModeSwitcher({ viewMode, onChange }: DexViewModeSwitcherProps): JSX.Element {
  return (
    <div className="dex-view-mode-row" role="radiogroup" aria-label="View mode">
      {OPTIONS.map(({ mode, label }) => (
        <button
          key={mode}
          type="button"
          role="radio"
          aria-checked={viewMode === mode}
          className={viewMode === mode ? 'dex-view-mode-option active' : 'dex-view-mode-option'}
          onClick={() => onChange(mode)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
