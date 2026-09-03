/**
 * The fixed set of in-game language flags a Pokémon carries internally — distinct from
 * a trainer's real-world locale. This is the flag PKHex reads out directly and that
 * Masuda-method breeding/nickname-script rules key off, per
 * https://bulbapedia.bulbagarden.net/wiki/Language. Unlike TID/SID (shared/data/
 * origin-games.ts), language has no per-game hide/show: every mainline game and Pokémon
 * GO alike carries one of these, so there's no generation-gating logic needed here.
 * Chinese split into Simplified/Traditional starting Generation VII; both are listed
 * unconditionally rather than gated on the selected origin game's generation, same
 * "don't cross-reference the game field" reasoning schema.ts's tid/sid CHECK ranges use.
 */
export const ORIGIN_LANGUAGES = [
  'Japanese',
  'English',
  'French',
  'German',
  'Italian',
  'Spanish',
  'Korean',
  'Chinese (Simplified)',
  'Chinese (Traditional)'
] as const

export type OriginLanguage = (typeof ORIGIN_LANGUAGES)[number]
