import { useMemo } from 'react'
import type { Form, Species } from '@shared/types/pokemon'
import type { EvolutionEdge } from '@shared/types/evolution'
import { SpriteThumbnail } from './SpriteThumbnail'
import { formDisplayName, speciesDisplayName } from './formNames'
import { buildEvolutionFamilyTree, type EvolutionTreeNode } from './evolutionFamilyTree'
import { condenseMethodLabel } from './evolutionMethodLabel'

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

const BUBBLE_SIZE = 84

/** Above this many siblings, a branch's children split into two independently-stacked
 * columns (Leg 9) — Eevee's 8-way branch is the only family in the dataset wide enough to
 * trigger this today. A single column of 8 sibling bubbles forced the whole tree into
 * vertical scroll (`.evolution-tree`'s max-height: 70vh); halving the column count roughly
 * halves that height. A shared CSS grid was tried first and reverted — see
 * evolution-tree.css's own comment on `.evolution-tree-children-wide` for why. */
const WIDE_BRANCH_THRESHOLD = 4

/**
 * Species detail popup's evolution family tree (Leg 2, reworked to a horizontal
 * left-to-right layout in Leg 5 per Vanny's feedback — "reads better" than the original
 * top-down stack). Each node lays out as a row: its own bubble, then a column of its
 * children to the right (evolution-tree.css's flex-direction: row/column split, not a
 * JSX structural change from Leg 2 — the node/children/branch nesting already matched a
 * sideways genealogy-chart shape once the CSS main axis flipped). A branching family
 * (Pikachu's 2 Raichu branches, Tyrogue's 3) stacks its siblings vertically in that column,
 * while a normal linear chain (Bulbasaur -> Ivysaur -> Venusaur) just reads straight across.
 * A branch wide enough to cross WIDE_BRANCH_THRESHOLD (Eevee's 8 evolutions) splits into two
 * columns instead (Leg 9) rather than staying a single tall one — see that constant's own
 * comment. Each branch's arrow label is condensed via evolutionMethodLabel.ts
 * when the underlying method has multiple game-specific alternatives (also Leg 9), since the
 * full run-on sentence badly outgrew its sibling branches' height at the arrow column's fixed
 * width.
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
    () => buildEvolutionFamilyTree(speciesId, formName, species, forms, evolutionEdges),
    [speciesId, formName, species, forms, evolutionEdges]
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

  const renderBranch = ({ method, node: childNode }: EvolutionTreeNode['children'][number]): JSX.Element => {
    const methodLabel = condenseMethodLabel(method)
    return (
      <div className="evolution-tree-branch" key={`${childNode.speciesId}:${childNode.formName}`}>
        <div className="evolution-tree-arrow">
          <span className="evolution-tree-arrow-glyph" aria-hidden="true">
            →
          </span>
          <span className="evolution-tree-arrow-label" title={methodLabel.full ?? undefined}>
            {methodLabel.label}
          </span>
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
    )
  }

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
      {node.children.length > 0 &&
        (node.children.length > WIDE_BRANCH_THRESHOLD ? (
          <div className="evolution-tree-children evolution-tree-children-wide">
            <div className="evolution-tree-children-col">
              {node.children.slice(0, Math.ceil(node.children.length / 2)).map(renderBranch)}
            </div>
            <div className="evolution-tree-children-col evolution-tree-children-col-divided">
              {node.children.slice(Math.ceil(node.children.length / 2)).map(renderBranch)}
            </div>
          </div>
        ) : (
          <div className="evolution-tree-children">{node.children.map(renderBranch)}</div>
        ))}
    </div>
  )
}
