import type { DexOptions } from './types'

interface DexToolbarProps {
  options: DexOptions
  onChange: (options: DexOptions) => void
}

/** Presentation-only view toggles — never persisted, never written back to storage. */
export function DexToolbar({ options, onChange }: DexToolbarProps): JSX.Element {
  return (
    <div className="dex-toolbar">
      <label>
        <input
          type="checkbox"
          checked={options.splitGenderRows}
          onChange={(e) => onChange({ ...options, splitGenderRows: e.target.checked })}
        />
        Show gender variants as separate rows
      </label>
      <label>
        Regional forms:{' '}
        <select
          value={options.regionalMode}
          onChange={(e) => onChange({ ...options, regionalMode: e.target.value as DexOptions['regionalMode'] })}
        >
          <option value="inline">Inline</option>
          <option value="grouped">Grouped</option>
        </select>
      </label>
    </div>
  )
}
