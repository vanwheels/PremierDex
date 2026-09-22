import { useMemo } from 'react'
import type { Form, Species } from '@shared/types/pokemon'
import type { EvolutionEdge } from '@shared/types/evolution'
import { SpriteThumbnail } from './SpriteThumbnail'
import { formDisplayName, speciesDisplayName } from './formNames'
import { buildEvolutionFamilyTree, type EvolutionTreeNode } from './evolutionTree'

interface EvolutionTreeProps {
  /** Any species in the family — the tree always renders the whole family (root to every
   * leaf), regardless of which member this is. */
  speciesId: number
  formName: string
  species: Species[]
  forms: Form[]
  evolutionEdges: EvolutionEdge[]
  /** Bubble click — re-centers/navigates the popup to that species/form. The tree itself
   * doesn't track "current" state; it's a controlled component driven by speciesId/formName
   * above, same as the rest of this codebase's inputs. */
  onSelectSpecies: (speciesId: number, formName: string) => void
}

const BUBBLE_SIZE = 56

/**
 * Species detail popup's evolution family tree (Leg 2). Renders the full chain containing
 * `speciesId` as generations stacked top-down: each node's children lay out in a wrapping
 * horizontal row below it (CSS flex-wrap — see evolution-tree.css), so a wide branch like
 * Eevee's 8 evolutions wraps onto multiple rows instead of overflowing, while a normal
 * linear chain (Bulbasaur -> Ivysaur -> Venusaur) just stacks straight down.
 *
 * Regional-form branches (Raichu vs. Raichu-Alola) render as separate bubbles per
 * evolutionTree.ts's (speciesId, formName) node identity, matching Leg 1's evolution-edges
 * data.
 */
export function EvolutionTree({
  speciesId,
  formName,
  species,
  forms,
  evolutionEdges,
  onSelectSpecies
}: EvolutionTreeProps): JSX.Element {
  const speciesById = useMemo(() => new Map(species.map((s) => [s.id, s])), [species])
  const formByKey = useMemo(() => new Map(forms.map((f) => [`${f.speciesId}:${f.formName}`, f])), [forms])
  const tree = useMemo(
    () => buildEvolutionFamilyTree(speciesId, species, evolutionEdges),
    [speciesId, species, evolutionEdges]
  )

  return (
    <div className="evolution-tree">
      <EvolutionTreeNodeView
        node={tree}
        speciesById={speciesById}
        formByKey={formByKey}
        currentSpeciesId={speciesId}
        currentFormName={formName}
        onSelectSpecies={onSelectSpecies}
      />
    </div>
  )
}

interface NodeViewProps {
  node: EvolutionTreeNode
  speciesById: Map<number, Species>
  formByKey: Map<string, Form>
  currentSpeciesId: number
  currentFormName: string
  onSelectSpecies: (speciesId: number, formName: string) => void
}

function EvolutionTreeNodeView({
  node,
  speciesById,
  formByKey,
  currentSpeciesId,
  currentFormName,
  onSelectSpecies
}: NodeViewProps): JSX.Element {
  const sp = speciesById.get(node.speciesId)
  const form = formByKey.get(`${node.speciesId}:${node.formName}`)
  const displayName = sp && form ? formDisplayName(speciesDisplayName(sp.name), form) : (sp ? speciesDisplayName(sp.name) : `#${node.speciesId}`)
  const isCurrent = node.speciesId === currentSpeciesId && node.formName === currentFormName

  return (
    <div className="evolution-tree-node">
      <div className="evolution-tree-bubble">
        {form ? (
          <SpriteThumbnail
            pokeapiId={form.pokeapiId}
            spriteFormSuffix={form.spriteFormSuffix}
            female={false}
            displayName={displayName}
            size={BUBBLE_SIZE}
            className={isCurrent ? 'evolution-tree-sprite evolution-tree-sprite-current' : 'evolution-tree-sprite'}
            ariaLabel={isCurrent ? `${displayName} (currently shown)` : `Show ${displayName}'s evolution family`}
            onClick={() => onSelectSpecies(node.speciesId, node.formName)}
          />
        ) : (
          // Defensive only — every real evolutionEdges/forms pair should resolve. See
          // evolutionTree.ts's doc comment on why forms.json is trusted for this lookup.
          <span className="evolution-tree-sprite-missing" style={{ width: BUBBLE_SIZE, height: BUBBLE_SIZE }}>
            ?
          </span>
        )}
        <span className="evolution-tree-name">{displayName}</span>
      </div>
      {node.children.length > 0 && (
        <div className="evolution-tree-children">
          {node.children.map(({ method, node: childNode }) => (
            <div className="evolution-tree-branch" key={`${childNode.speciesId}:${childNode.formName}`}>
              <div className="evolution-tree-arrow">
                <span className="evolution-tree-arrow-glyph" aria-hidden="true">
                  ↓
                </span>
                <span className="evolution-tree-arrow-label">{method}</span>
              </div>
              <EvolutionTreeNodeView
                node={childNode}
                speciesById={speciesById}
                formByKey={formByKey}
                currentSpeciesId={currentSpeciesId}
                currentFormName={currentFormName}
                onSelectSpecies={onSelectSpecies}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
