/**
 * Base egg steps from PokeAPI's `hatch_counter` (base egg cycles). Steps per cycle differ by
 * generation (Bulbapedia's Egg cycle page: 256 in II/III/VII, 255 in IV, 257 in V/VI, 128 in
 * SwSh/SV), and a fresh egg needs one cycle more than its base value to hatch. The raw cycle
 * count is what's stored; this converts it for a given generation.
 *
 * Generation is the game's generation number, so Brilliant Diamond/Shining Pearl (Gen VIII by
 * number, Gen IV engine) read as 128 rather than 255 — a known imprecision, not worth a
 * per-game table until something displays per-game egg steps.
 */
const LATEST_GENERATION = 9

function stepsPerCycle(generation: number): number {
  if (generation === 4) return 255
  if (generation === 5 || generation === 6) return 257
  if (generation >= 8) return 128
  return 256 // II/III/VII; Gen I has no breeding, so it falls back to the first breeding gen's value
}

export function baseEggSteps(hatchCounter: number, generation: number = LATEST_GENERATION): number {
  const perCycle = stepsPerCycle(generation)
  return hatchCounter * perCycle + perCycle
}
