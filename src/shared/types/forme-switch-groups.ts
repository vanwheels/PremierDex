/**
 * One species' switchable, non-evolutionary forme group, written by
 * `scripts/build-forme-switch-groups.ts` into `data/pokemon/forme-switch-groups.json` and
 * loaded at runtime by `main/storage/load-species-data.ts`. Shared (rather than main-only)
 * because the species detail popup needs the same shape in the renderer — see
 * `renderer/dex/FormeSwitchGroupView.tsx`.
 *
 * Unlike EvolutionEdge, this is species-scoped rather than a from/to edge: every member of
 * `formNames` belongs to the same `speciesId` (Deoxys's Attack/Defense/Speed formes, Kyurem's
 * Black/White fusions, etc. are all one species with several forms, not several species) —
 * see forme-switch-groups-data.ts's own doc comment for why none of this is an evolution.
 */
export interface FormeSwitchGroup {
  speciesId: number
  /** forms.json formName values in this group, `base` first. */
  formNames: string[]
  /** Human-readable description of how the player performs the switch. */
  method: string
  /** Whether every member of the group can be freely switched back to from any other. */
  reversible: boolean
  /** Per-game variation/caveats on `method`, or null when it's consistent everywhere the
   * species is available. */
  note: string | null
}
