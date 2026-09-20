/**
 * Fixed list of size categories a Collection Entry can record (Leg 3 of the
 * Ribbons/Alpha/Size/Capture-Date Tracking milestone). Scarlet/Violet's own 9-tier
 * Mesagoza size-check vocabulary — the most granular presentation any applicable game
 * actually shows a player, confirmed against Serebii/Bulbapedia (see
 * docs/investigations/ribbons-alpha-size-capture-date.md's Leg 3 update). Every other
 * applicable game's coarser presentation (Let's Go/Legends Z-A's 5-tier XS-XL, Pokémon
 * GO's 4-tag XXS/XS/XL/XXL, Legends Arceus's binary small/large aura) maps onto a subset
 * of this same set rather than needing its own column — same flat CHECK-constrained-string
 * approach as shared/data/languages.ts and shared/data/poke-balls.ts, and same "don't
 * cross-reference origin_game" reasoning as those two.
 */
export const SIZE_CLASSES = ['XXXS', 'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const

export type SizeClass = (typeof SIZE_CLASSES)[number]
