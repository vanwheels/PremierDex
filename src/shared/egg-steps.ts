/**
 * Base egg steps from PokeAPI's `hatch_counter` (base egg cycles). Steps per cycle differ by
 * generation (Bulbapedia's Egg cycle page: 256 in II/III/VII, 255 in IV, 257 in V/VI, 128 in
 * SwSh/SV), and a fresh egg needs one cycle more than its base value to hatch. We use the
 * Gen IV convention — `cycles * 255 + 255` — as the single displayed figure, per the Species/Dex
 * reference data layer spec. The raw cycle count is what's stored, so changing the convention
 * later only touches this function.
 */
const STEPS_PER_CYCLE = 255

export function baseEggSteps(hatchCounter: number): number {
  return hatchCounter * STEPS_PER_CYCLE + STEPS_PER_CYCLE
}
