import { useMemo, useState } from 'react'
import type { CollectionEntry, CollectionEntryOriginInput, Form, Species } from '@shared/types/pokemon'
import { SpriteModal } from '../dex/SpriteModal'
import type { SpriteModalTarget } from '../dex/SpriteModal'
import { OriginModal } from '../dex/OriginModal'
import type { OriginModalTarget } from '../dex/OriginModal'
import { buildCollectionGroups } from './buildCollectionGroups'
import { CollectionRow } from './CollectionRow'
import { DEFAULT_COLLECTION_GROUP_BY } from './types'
import type { CollectionGroupBy } from './types'

interface CollectionViewProps {
  species: Species[]
  forms: Form[]
  entries: CollectionEntry[]
  onSaveOrigin: (entryId: number, input: CollectionEntryOriginInput) => void
}

const GROUP_BY_LABELS: Record<CollectionGroupBy, string> = {
  originGame: 'Origin Game',
  ot: 'OT',
  shiny: 'Shiny'
}
const GROUP_BY_OPTIONS = Object.keys(GROUP_BY_LABELS) as CollectionGroupBy[]

/**
 * Browses the owned collection itself, grouped by one dimension at a time (Leg 18) —
 * a different lens than DexTable's species-first grid. Owns its sprite/origin modal
 * state the same way DexTable does; unowning an entry stays a Dex-view action, so there's
 * no onToggleEntry here.
 */
export function CollectionView({ species, forms, entries, onSaveOrigin }: CollectionViewProps): JSX.Element {
  const [groupBy, setGroupBy] = useState<CollectionGroupBy>(DEFAULT_COLLECTION_GROUP_BY)
  const [spriteTarget, setSpriteTarget] = useState<SpriteModalTarget | null>(null)
  const [originTarget, setOriginTarget] = useState<OriginModalTarget | null>(null)

  const groups = useMemo(() => buildCollectionGroups(species, forms, entries, groupBy), [species, forms, entries, groupBy])

  return (
    <div className="collection-view">
      <label>
        Group by:{' '}
        <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as CollectionGroupBy)}>
          {GROUP_BY_OPTIONS.map((key) => (
            <option key={key} value={key}>
              {GROUP_BY_LABELS[key]}
            </option>
          ))}
        </select>
      </label>
      {groups.length === 0 && <p>No owned Pokémon yet.</p>}
      {groups.map((group) => (
        <section key={group.key} className="collection-group">
          <h2>
            {group.label} <span className="collection-group-count">({group.rows.length})</span>
          </h2>
          <table className="dex-table">
            <thead>
              <tr>
                <th>Sprite</th>
                <th>#</th>
                <th>Name</th>
                <th>Nickname</th>
                <th>Origin</th>
              </tr>
            </thead>
            <tbody>
              {group.rows.map((row) => (
                <CollectionRow key={row.key} row={row} onOpenSprite={setSpriteTarget} onOpenOrigin={setOriginTarget} onSaveOrigin={onSaveOrigin} />
              ))}
            </tbody>
          </table>
        </section>
      ))}
      {spriteTarget && <SpriteModal target={spriteTarget} onClose={() => setSpriteTarget(null)} />}
      {originTarget && (
        <OriginModal entry={originTarget.entry} displayName={originTarget.displayName} onClose={() => setOriginTarget(null)} onSave={onSaveOrigin} />
      )}
    </div>
  )
}
