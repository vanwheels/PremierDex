/**
 * The origin identity a Collection Entry will eventually reference (Leg 4) — game +
 * TID/SID + OT name, standing in for one save file. Built and persisted standalone here
 * (Leg 1): no Collection Entry links to a TrainerProfile yet.
 */
/**
 * Trainer ID / Secret ID display rules changed shape across generations (see
 * shared/data/origin-games.ts and https://bulbapedia.bulbagarden.net/wiki/Trainer_ID_number):
 * Gen I-VI shows a 5-digit TID (0-65535) and never displays a SID at all; Gen VII+ shows
 * a 6-digit TID (0-999999) and a 4-digit SID (0-4294); Pokémon GO has neither. Both
 * fields are nullable here for exactly that reason — null means "this origin game
 * doesn't show this field," not "unknown."
 */
export interface TrainerProfile {
  id: number
  game: string
  otName: string
  tid: number | null
  sid: number | null
  /** User-facing nickname to tell apart multiple profiles for the same game (e.g. two
   * separate playthroughs) — optional, purely for display. */
  label: string | null
}

/** Field set for create/update — everything but the assigned id. */
export interface TrainerProfileInput {
  game: string
  otName: string
  tid: number | null
  sid: number | null
  label: string | null
}
