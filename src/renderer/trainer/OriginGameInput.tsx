import { useEffect, useMemo, useRef, useState } from 'react'
import { ORIGIN_GAMES } from '@shared/data/origin-games'

interface OriginGameInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

/**
 * Game field for TrainerProfileForm. A plain text input with a filtered dropdown of
 * ORIGIN_GAMES — rolled by hand rather than a native `<input list>` + `<datalist>`
 * combo, because Chromium/Electron's built-in datalist popup doesn't reliably show a
 * scrollbar once the list overflows its fixed popup height, and it isn't stylable at
 * all (it's drawn outside the DOM). Still plain free text otherwise: typing something
 * not on the list is fine, it just won't match a suggestion.
 */
export function OriginGameInput({ value, onChange, disabled }: OriginGameInputProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const matches = useMemo(() => {
    const query = value.trim().toLowerCase()
    return query ? ORIGIN_GAMES.filter((g) => g.name.toLowerCase().includes(query)) : ORIGIN_GAMES
  }, [value])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="origin-game-input" ref={containerRef}>
      <input
        value={value}
        placeholder="Game"
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
      />
      {!disabled && open && matches.length > 0 && (
        <ul className="origin-game-options" role="listbox">
          {matches.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                // mousedown (not click) fires before the input's blur closes the list
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange(g.name)
                  setOpen(false)
                }}
              >
                {g.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
