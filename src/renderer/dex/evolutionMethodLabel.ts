/**
 * Condenses an evolution edge's `method` string for the family-tree arrow label (Leg 9 of
 * the Species detail popup + evolution family tree milestone). Most methods are a single
 * short clause ("Level 16", "Thunder Stone") and render as-is. A method with multiple
 * " or "-joined game-specific alternatives (e.g. Eevee -> Leafeon's "At Eterna Forest + Near
 * a Special Rock + Level Up or At Pinwheel Forest + ... or Leaf Stone") is condensed to a
 * short count-based label instead, with the full string returned separately for a native
 * title tooltip — same pattern as DexRow's dex-invalid-combo-badge. Without this, the arrow
 * column's fixed width forces the whole run-on sentence to wrap across many lines, badly
 * outgrowing its sibling branches' height.
 */
export interface EvolutionMethodLabel {
  label: string
  /** Full method string for a title tooltip, or null when `label` already shows it in full. */
  full: string | null
}

export function condenseMethodLabel(method: string): EvolutionMethodLabel {
  const alternatives = method.split(' or ')
  if (alternatives.length <= 1) return { label: method, full: null }
  return { label: `${alternatives.length} Methods`, full: method }
}
