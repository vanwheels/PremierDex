/**
 * The origin identity a Collection Entry will eventually reference (Leg 4) — game +
 * TID/SID + OT name, standing in for one save file. Built and persisted standalone here
 * (Leg 1): no Collection Entry links to a TrainerProfile yet.
 */
export interface TrainerProfile {
  id: number
  game: string
  otName: string
  /** Trainer ID — 16-bit, 0-65535 on every generation, whether or not the game itself
   * displays it split from SID. */
  tid: number
  /** Secret ID — same 16-bit range as tid. Not shown in-game before Gen 7, but every
   * save still has one; 0 is a normal value here, not "unset". */
  sid: number
  /** User-facing nickname to tell apart multiple profiles for the same game (e.g. two
   * separate playthroughs) — optional, purely for display. */
  label: string | null
}

/** Field set for create/update — everything but the assigned id. */
export interface TrainerProfileInput {
  game: string
  otName: string
  tid: number
  sid: number
  label: string | null
}
