import { describe, expect, it } from 'vitest'
import type { Species } from '@shared/types/pokemon'
import type { EvolutionEdge } from '@shared/types/evolution'
import { buildEvolutionFamilyTree, findEvolutionFamilyRootSpeciesId } from './evolutionFamilyTree'

function makeSpecies(id: number, evolvesFromSpeciesId: number | null): Species {
  return { id, name: `species-${id}`, generation: 1, collapsedDisplayFormId: null, isFinalEvolutionStage: false, evolvesFromSpeciesId }
}

function makeEdge(overrides: Partial<EvolutionEdge> & Pick<EvolutionEdge, 'fromSpeciesId' | 'toSpeciesId'>): EvolutionEdge {
  return { fromFormName: 'base', toFormName: 'base', method: 'Level 16', ...overrides }
}

// Bulbasaur -> Ivysaur -> Venusaur
const LINEAR_SPECIES: Species[] = [makeSpecies(1, null), makeSpecies(2, 1), makeSpecies(3, 2)]
const LINEAR_EDGES: EvolutionEdge[] = [
  makeEdge({ fromSpeciesId: 1, toSpeciesId: 2, method: 'Level 16' }),
  makeEdge({ fromSpeciesId: 2, toSpeciesId: 3, method: 'Level 32' })
]

describe('findEvolutionFamilyRootSpeciesId', () => {
  it('returns the species itself when it has no evolution parent', () => {
    expect(findEvolutionFamilyRootSpeciesId(1, LINEAR_SPECIES)).toBe(1)
  })

  it('walks evolvesFromSpeciesId back to the chain root from a middle species', () => {
    expect(findEvolutionFamilyRootSpeciesId(2, LINEAR_SPECIES)).toBe(1)
  })

  it('walks back to the chain root from the final stage', () => {
    expect(findEvolutionFamilyRootSpeciesId(3, LINEAR_SPECIES)).toBe(1)
  })

  it('falls back to the given id when the species is unknown', () => {
    expect(findEvolutionFamilyRootSpeciesId(999, LINEAR_SPECIES)).toBe(999)
  })

  it('does not infinite-loop on a cyclic evolvesFromSpeciesId chain', () => {
    const cyclic: Species[] = [makeSpecies(10, 11), makeSpecies(11, 10)]
    expect([10, 11]).toContain(findEvolutionFamilyRootSpeciesId(10, cyclic))
  })
})

describe('buildEvolutionFamilyTree', () => {
  it('builds a linear chain regardless of which member id is passed in', () => {
    for (const startId of [1, 2, 3]) {
      const tree = buildEvolutionFamilyTree(startId, LINEAR_SPECIES, LINEAR_EDGES)
      expect(tree.speciesId).toBe(1)
      expect(tree.formName).toBe('base')
      expect(tree.children).toHaveLength(1)
      expect(tree.children[0].method).toBe('Level 16')
      expect(tree.children[0].node.speciesId).toBe(2)
      expect(tree.children[0].node.children).toHaveLength(1)
      expect(tree.children[0].node.children[0].node.speciesId).toBe(3)
      expect(tree.children[0].node.children[0].node.children).toHaveLength(0)
    }
  })

  it('builds every branch for a multi-evolution species (Eevee-shaped)', () => {
    const species: Species[] = [makeSpecies(133, null), ...[134, 135, 136].map((id) => makeSpecies(id, 133))]
    const edges: EvolutionEdge[] = [134, 135, 136].map((id) => makeEdge({ fromSpeciesId: 133, toSpeciesId: id }))
    const tree = buildEvolutionFamilyTree(133, species, edges)
    expect(tree.children).toHaveLength(3)
    expect(tree.children.map((c) => c.node.speciesId).sort()).toEqual([134, 135, 136])
  })

  it('keeps a regional-form branch as its own node distinct from the base-form branch', () => {
    // Pikachu (25) -> Raichu (26, base) via Thunder Stone, and -> Raichu-Alola (26, alola)
    // via the same item — see evolution-edges.json's real Pikachu rows.
    const species: Species[] = [makeSpecies(25, null), makeSpecies(26, 25)]
    const edges: EvolutionEdge[] = [
      makeEdge({ fromSpeciesId: 25, toSpeciesId: 26, toFormName: 'base', method: 'Thunder Stone' }),
      makeEdge({ fromSpeciesId: 25, toSpeciesId: 26, toFormName: 'alola', method: 'Thunder Stone' })
    ]
    const tree = buildEvolutionFamilyTree(25, species, edges)
    expect(tree.children).toHaveLength(2)
    const formNames = tree.children.map((c) => c.node.formName).sort()
    expect(formNames).toEqual(['alola', 'base'])
  })

  it('does not infinite-loop on a cyclic edge set', () => {
    const species: Species[] = [makeSpecies(1, null), makeSpecies(2, 1)]
    const edges: EvolutionEdge[] = [
      makeEdge({ fromSpeciesId: 1, toSpeciesId: 2 }),
      makeEdge({ fromSpeciesId: 2, toSpeciesId: 1 })
    ]
    const tree = buildEvolutionFamilyTree(1, species, edges)
    expect(tree.speciesId).toBe(1)
    expect(tree.children[0].node.speciesId).toBe(2)
  })
})
