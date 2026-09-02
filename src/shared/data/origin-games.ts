/**
 * Reference list of origin games for Trainer Profile entry (Leg 3, pulled forward into
 * Leg 1 — see TODO.md). Mainline titles, transfer-eligible spinoffs (Colosseum, XD: Gale
 * of Darkness), and Pokémon GO.
 *
 * hasTrainerId/hasSecretId encode what a player can actually read off their game, per
 * https://bulbapedia.bulbagarden.net/wiki/Trainer_ID_number:
 * - Pokémon GO has no Trainer ID or Secret ID at all — origin identity there is just the
 *   trainer/OT name.
 * - Generations I-VI store a Secret ID internally but never display it anywhere in-game,
 *   so there's nothing for a player to enter.
 * - Generation VII onward derives both a 6-digit Trainer ID and a 4-digit Secret ID from
 *   a single 32-bit value and shows both on the Trainer Card.
 */
export interface OriginGame {
  id: string
  name: string
  /** Generation introduced; null for Pokémon GO, which isn't part of the mainline
   * generation numbering. */
  generation: number | null
  /** False only for Pokémon GO. */
  hasTrainerId: boolean
  /** False for Pokémon GO and every Generation I-VI game. */
  hasSecretId: boolean
}

function mainlineGame(id: string, name: string, generation: number): OriginGame {
  return { id, name, generation, hasTrainerId: true, hasSecretId: generation >= 7 }
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
  { id: 'go', name: 'Pokémon GO', generation: null, hasTrainerId: false, hasSecretId: false }
]

export function findOriginGame(name: string): OriginGame | undefined {
  return ORIGIN_GAMES.find((g) => g.name === name)
}
