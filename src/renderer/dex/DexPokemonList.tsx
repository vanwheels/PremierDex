import { useMemo, useState } from 'react'
import type { Form, Species } from '@shared/types/pokemon'
import type { SpeciesDetailsData } from '@shared/types/species-details'
import {
  buildDexListRows,
  filterDexListRows,
  groupRowsByGeneration,
  sortDexListRows,
  type DexListSort,
  type DexListSortKey
} from './dexSpeciesList'
import { SpriteThumbnail } from './SpriteThumbnail'
import type { SpeciesDetailTarget } from './SpeciesDetailPopup'

interface DexPokemonListProps {
  species: Species[]
  forms: Form[]
  speciesDetails: SpeciesDetailsData
  onOpenSpecies: (target: SpeciesDetailTarget) => void
}

/** Row sprite size — SpriteThumbnail's default 32 reads small beside the list's text. */
const SPRITE_SIZE = 40

const COLUMNS: Array<{ key: DexListSortKey; label: string }> = [
  { key: 'dex', label: 'Dex #' },
  { key: 'name', label: 'Name' },
  { key: 'abilities', label: 'Abilities' }
]

/**
 * Full UI/UX pass Leg 4: the Dex tab's Pokémon sub-tab — the reference-dex-list.png model
 * (docs/design/ui-ux-pass/), thinned to the columns the data layer has today (Name / Dex # /
 * Abilities, one row per species — forms live on the species page; Types and base stats wait on TODO.md's Species/Dex reference data layer).
 * Reference-only: no ownership state, so it renders straight from species/forms/
 * speciesDetails rather than through buildDexSections.
 *
 * Generation section headers (as in the sketch) only show in Dex # order, ascending or
 * descending; a name/ability sort is a flat list.
 */
export function DexPokemonList({ species, forms, speciesDetails, onOpenSpecies }: DexPokemonListProps): JSX.Element {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<DexListSort>({ key: 'dex', direction: 'asc' })

  const allRows = useMemo(() => buildDexListRows(species, forms, speciesDetails), [species, forms, speciesDetails])
  const rows = useMemo(() => sortDexListRows(filterDexListRows(allRows, query), sort), [allRows, query, sort])
  const groups = useMemo(
    () => (sort.key === 'dex' ? groupRowsByGeneration(rows) : [{ generation: 0, rows }]),
    [rows, sort.key]
  )

  const toggleSort = (key: DexListSortKey): void =>
    setSort((prev) => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }))

  return (
    <div className="dex-list">
      <input
        type="search"
        className="dex-tab-search"
        value={query}
        placeholder="Search name, #, or ability…"
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="dex-list-header">
        {COLUMNS.map(({ key, label }) => (
          <button key={key} type="button" className="dex-list-sort" onClick={() => toggleSort(key)}>
            {label}
            {sort.key === key && (sort.direction === 'asc' ? ' ▲' : ' ▼')}
          </button>
        ))}
      </div>
      {rows.length === 0 && <p className="dex-tab-empty">No Pokémon match “{query.trim()}”.</p>}
      {groups.map((group) => (
        <div key={group.generation}>
          {sort.key === 'dex' && <h3 className="dex-list-generation">Generation {group.generation}</h3>}
          {group.rows.map((row) => (
            <div key={`${row.speciesId}-${row.formName}`} className="dex-list-row">
              <span className="dex-list-number">#{String(row.speciesId).padStart(3, '0')}</span>
              <span className="dex-list-identity">
                <SpriteThumbnail
                  pokeapiId={row.pokeapiId}
                  spriteFormSuffix={row.spriteFormSuffix}
                  female={false}
                  displayName={row.displayName}
                  size={SPRITE_SIZE}
                  ariaLabel={`Open ${row.displayName}`}
                  onClick={() => onOpenSpecies({ speciesId: row.speciesId, formName: row.formName })}
                />
                <button
                  type="button"
                  className="dex-list-name"
                  onClick={() => onOpenSpecies({ speciesId: row.speciesId, formName: row.formName })}
                >
                  {row.displayName}
                </button>
              </span>
              <span className="dex-list-abilities">
                {row.abilities.map((a) => (
                  <span key={a.name} className={a.isHidden ? 'dex-list-ability-hidden' : undefined}>
                    {a.name}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
