/**
 * Reference list of origin games for Trainer Profile entry (Leg 3, pulled forward into
 * Leg 1 — see TODO.md). Mainline titles, transfer-eligible spinoffs (Colosseum, XD: Gale
 * of Darkness), and Pokémon GO.
 *
 * hasTrainerId/hasSecretId encode whether an origin game has that value at all, per
 * https://bulbapedia.bulbagarden.net/wiki/Trainer_ID_number:
 * - Pokémon GO has no Secret ID, but does show a Trainer ID in-game: a 12-digit
 *   "Trainer Code" (grouped as XXXX XXXX XXXX on the profile/add-friend screen), used to
 *   add friends. It isn't derived the same way as mainline's TID/SID pair and doesn't fit
 *   the mainline 6-digit range, so it sets `trainerIdMax` to override the default cap
 *   (see TrainerProfileForm.tsx / OriginModal.tsx).
 * - Generations I-VI store a Secret ID internally but never display it in-game — a player
 *   can't read it off their Trainer Card, but it's still extractable with an external tool
 *   (e.g. PKHex), so the field stays enterable rather than hidden.
 * - Generation VII onward derives both a 6-digit Trainer ID and a 4-digit Secret ID from
 *   a single 32-bit value and shows both on the Trainer Card.
 */
export interface OriginGame {
  id: string
  name: string
  /** Generation introduced; null for Pokémon GO, which isn't part of the mainline
   * generation numbering. */
  generation: number | null
  /** True for every listed game today (Pokémon GO shows a 12-digit Trainer Code — see
   * file header) — kept as a flag rather than assumed true so a future entry without any
   * visible Trainer ID still has a way to opt out. */
  hasTrainerId: boolean
  /** False only for Pokémon GO — every mainline generation has a Secret ID internally,
   * even where it's not shown in-game (see file header). */
  hasSecretId: boolean
  /** Overrides the default 6-digit Trainer ID cap (999999) used by TrainerProfileForm.tsx
   * / OriginModal.tsx. Only Pokémon GO sets this, for its 12-digit Trainer Code. */
  trainerIdMax?: number
}

function mainlineGame(id: string, name: string, generation: number): OriginGame {
  return { id, name, generation, hasTrainerId: true, hasSecretId: true }
}

export const ORIGIN_GAMES: OriginGame[] = [
  mainlineGame('red', 'Pokémon Red', 1),
  mainlineGame('blue', 'Pokémon Blue', 1),
  mainlineGame('yellow', 'Pokémon Yellow', 1),
  mainlineGame('gold', 'Pokémon Gold', 2),
  mainlineGame('silver', 'Pokémon Silver', 2),
  mainlineGame('crystal', 'Pokémon Crystal', 2),
  mainlineGame('ruby', 'Pokémon Ruby', 3),
  mainlineGame('sapphire', 'Pokémon Sapphire', 3),
  mainlineGame('firered', 'Pokémon FireRed', 3),
  mainlineGame('leafgreen', 'Pokémon LeafGreen', 3),
  mainlineGame('emerald', 'Pokémon Emerald', 3),
  mainlineGame('colosseum', 'Pokémon Colosseum', 3),
  mainlineGame('xd', 'Pokémon XD: Gale of Darkness', 3),
  mainlineGame('diamond', 'Pokémon Diamond', 4),
  mainlineGame('pearl', 'Pokémon Pearl', 4),
  mainlineGame('platinum', 'Pokémon Platinum', 4),
  mainlineGame('heartgold', 'Pokémon HeartGold', 4),
  mainlineGame('soulsilver', 'Pokémon SoulSilver', 4),
  mainlineGame('black', 'Pokémon Black', 5),
  mainlineGame('white', 'Pokémon White', 5),
  mainlineGame('black-2', 'Pokémon Black 2', 5),
  mainlineGame('white-2', 'Pokémon White 2', 5),
  mainlineGame('x', 'Pokémon X', 6),
  mainlineGame('y', 'Pokémon Y', 6),
  mainlineGame('omega-ruby', 'Pokémon Omega Ruby', 6),
  mainlineGame('alpha-sapphire', 'Pokémon Alpha Sapphire', 6),
  mainlineGame('sun', 'Pokémon Sun', 7),
  mainlineGame('moon', 'Pokémon Moon', 7),
  mainlineGame('ultra-sun', 'Pokémon Ultra Sun', 7),
  mainlineGame('ultra-moon', 'Pokémon Ultra Moon', 7),
  mainlineGame('lets-go-pikachu', "Pokémon Let's Go, Pikachu!", 7),
  mainlineGame('lets-go-eevee', "Pokémon Let's Go, Eevee!", 7),
  mainlineGame('sword', 'Pokémon Sword', 8),
  mainlineGame('shield', 'Pokémon Shield', 8),
  mainlineGame('brilliant-diamond', 'Pokémon Brilliant Diamond', 8),
  mainlineGame('shining-pearl', 'Pokémon Shining Pearl', 8),
  mainlineGame('legends-arceus', 'Pokémon Legends: Arceus', 8),
  mainlineGame('scarlet', 'Pokémon Scarlet', 9),
  mainlineGame('violet', 'Pokémon Violet', 9),
  mainlineGame('legends-za', 'Pokémon Legends: Z-A', 9),
  { id: 'go', name: 'Pokémon GO', generation: null, hasTrainerId: true, hasSecretId: false, trainerIdMax: 999_999_999_999 }
]

export function findOriginGame(name: string): OriginGame | undefined {
  return ORIGIN_GAMES.find((g) => g.name === name)
}
