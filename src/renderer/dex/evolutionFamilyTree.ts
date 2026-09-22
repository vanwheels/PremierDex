import type { Form, Species } from '@shared/types/pokemon'
import type { EvolutionEdge } from '@shared/types/evolution'

/** One (species+form) node in an evolution family tree, plus the edges leading to each of
 * its direct children. Regional-form branches (Raichu vs. Raichu-Alola) are separate nodes
 * here even though they share a speciesId — see EvolutionEdge's own doc comment. */
export interface EvolutionTreeNode {
  speciesId: number
  formName: string
  children: Array<{ method: string; node: EvolutionTreeNode }>
}

/** Walks Species.evolvesFromSpeciesId back to a chain's root (species-level — PokeAPI has
 * no such thing as a chain rooted at a non-default form). Falls back to `speciesId` itself
 * if it's missing from `species` (shouldn't happen against real app data) or a broken
 * parent pointer is hit, rather than throwing. */
export function findEvolutionFamilyRootSpeciesId(speciesId: number, species: Species[]): number {
  const byId = new Map(species.map((s) => [s.id, s]))
  let current = byId.get(speciesId)
  if (!current) return speciesId

  const visited = new Set<number>([current.id])
  while (current.evolvesFromSpeciesId !== null) {
    const parent = byId.get(current.evolvesFromSpeciesId)
    if (!parent || visited.has(parent.id)) break
    current = parent
    visited.add(current.id)
  }
  return current.id
}

/** Builds the full evolution family tree containing `speciesId`/`formName`, rooted at the
 * chain's base-form ancestor. Branches (regional forms, multi-evolution species like Eevee)
 * come straight from `evolutionEdges` — see its own doc comment for why this can't be done
 * from Species.evolvesFromSpeciesId alone. Guards against a cyclic edge set (shouldn't occur
 * in real PokeAPI data) by never re-visiting a (speciesId, formName) pair.
 *
 * `formName`'s current form is checked against `forms` first: a `cosmetic_variant` or
 * `non_boxable` form (Pikachu's Cosplay/cap variants, any species' Mega/Gmax) is a pure
 * reskin or battle-only form that can't evolve or be evolved into, even though the species
 * it belongs to might otherwise have a family — PokeAPI's evolution-chain data (what
 * `evolutionEdges` is built from) is species-level and doesn't know about formName at all,
 * so without this check the root walk below would silently substitute the base form's
 * family. Bug found by Vanny (Leg 6 of the Species detail popup + evolution family tree
 * milestone): cosmetic-variant Pikachu forms were showing the base Pikachu -> Raichu chain. */
export function buildEvolutionFamilyTree(
  speciesId: number,
  formName: string,
  species: Species[],
  forms: Form[],
  evolutionEdges: EvolutionEdge[]
): EvolutionTreeNode {
  const currentForm = forms.find((f) => f.speciesId === speciesId && f.formName === formName)
  if (currentForm && currentForm.formCategory !== 'dex_distinct') {
    return { speciesId, formName, children: [] }
  }

  const edgesByParent = new Map<string, EvolutionEdge[]>()
  for (const edge of evolutionEdges) {
    const key = `${edge.fromSpeciesId}:${edge.fromFormName}`
    const list = edgesByParent.get(key)
    if (list) list.push(edge)
    else edgesByParent.set(key, [edge])
  }

  const visiting = new Set<string>()
  const build = (nodeSpeciesId: number, formName: string): EvolutionTreeNode => {
    const key = `${nodeSpeciesId}:${formName}`
    if (visiting.has(key)) return { speciesId: nodeSpeciesId, formName, children: [] }
    visiting.add(key)

    const outgoing = edgesByParent.get(key) ?? []
    return {
      speciesId: nodeSpeciesId,
      formName,
      children: outgoing.map((edge) => ({
        method: edge.method,
        node: build(edge.toSpeciesId, edge.toFormName)
      }))
    }
  }

  const rootSpeciesId = findEvolutionFamilyRootSpeciesId(speciesId, species)
  return build(rootSpeciesId, 'base')
}
