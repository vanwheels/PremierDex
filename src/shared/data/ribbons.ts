/**
 * Curated Ribbon list (Leg 5 of the Ribbons/Alpha/Size/Capture-Date Tracking milestone, see
 * docs/investigations/ribbons-alpha-size-capture-date.md) — replaces Leg 4's 20-name
 * placeholder. Sourced via a research subagent against Bulbapedia's "List of Ribbons in the
 * games" article (raw MediaWiki template data, not paraphrase), cross-checked against
 * community sources for rank-tier naming, verified 2026-09-19 — same "subagent research,
 * verified, not from-memory" approach as shared/data/supplemental-availability.ts.
 *
 * Verified total: 117 ribbons (III=32, IV=48, V=9, VI=16, VII=4, VIII=5, IX=3) — not exactly
 * Leg 1's ~115 estimate. The gap is two "Gold" Memory Ribbon variants (Contest Memory Ribbon
 * (Gold), Battle Memory Ribbon (Gold), both Gen VI) that Bulbapedia's own page template
 * renders as separate entries from their plain counterparts; without splitting those out,
 * Gen VI is 14 not 16. All 20 of Leg 4's placeholder names survive unchanged here.
 *
 * `retiredOnTransfer`: true for every Gen III/IV Contest, Super Contest, and Battle Tower
 * ribbon — these are silently replaced by a single Contest Memory Ribbon or Battle Memory
 * Ribbon (the Gold variant if the transferred individual held the full pre-Gen-VI set) when
 * transferred into Gen VI+. Per this milestone's Leg 1 scoping, this file does NOT track
 * "is this ribbon still legal for this individual's current game context" — same
 * don't-build-past-demonstrated-need call as ball/form legality. The curated list offers the
 * full historical name set (including retired ones) and trusts the user to pick correctly
 * for wherever the individual currently sits (e.g. still on its original save_file).
 *
 * Naming collision fix (app-level, not an in-game display convention): Gen III's Hoenn
 * Contest ribbons and Gen IV's Sinnoh Super Contest ribbons are tracked as distinct in-game
 * items but the Normal and Master rank tiers of each of the 5 categories (Cool/Beauty/Cute/
 * Smart/Tough) share identical display text (e.g. both eras have a bare "Cool Ribbon" and a
 * "Cool Ribbon Master") — confirmed by the research pass, not assumed. Since this schema's
 * ribbon_name is a single CHECK-constrained string with UNIQUE(entry_id, ribbon_name), two
 * same-named-but-distinct ribbons can't both be recorded on one individual (a real scenario:
 * a Hoenn-origin Pokémon Pal Park'd into Platinum and then entered in a Sinnoh Super
 * Contest). Resolved by suffixing all 20 Gen IV Super Contest ribbon rows with "(Sinnoh)" —
 * applied uniformly across all four rank tiers per category (not just the two that actually
 * collide) so the rank-tier group reads consistently rather than half-suffixed. Gen III's
 * names are left exactly as Bulbapedia has them, unsuffixed, since they're unambiguous on
 * their own and were the placeholder list's original spelling.
 *
 * `category` values used: League, Contest (Gen III), Super Contest (Gen IV), Contest
 * Spectacular (Gen VI/VIII), Memory, Battle Tower/Frontier, Feeling, Achievement,
 * Special/Event, Deprecated Gift. "Deprecated Gift" ribbons (Marine/Land/Sky/History/Red/
 * Green/Blue/Festival/Carnival Ribbon) were unused data slots in their original generation,
 * never awarded, and were each later repurposed as a different Gen V+ ribbon's data slot
 * (documented in `notes`) — kept here as real, distinct historical entries since they are
 * genuine ribbon names that could theoretically appear in old save data, not invented.
 */
export interface RibbonInfo {
  name: string
  generation: number
  category: string
  retiredOnTransfer: boolean
  notes?: string
}

export const RIBBON_DATA: RibbonInfo[] = [
  // Generation III (32)
  { name: 'Champion Ribbon', generation: 3, category: 'League', retiredOnTransfer: false, notes: 'Entered the Hall of Fame in any region' },
  { name: 'Cool Ribbon', generation: 3, category: 'Contest', retiredOnTransfer: true, notes: 'Hoenn Contest, Cool, Normal Rank' },
  { name: 'Cool Ribbon Super', generation: 3, category: 'Contest', retiredOnTransfer: true, notes: 'Hoenn Contest, Cool, Super Rank' },
  { name: 'Cool Ribbon Hyper', generation: 3, category: 'Contest', retiredOnTransfer: true, notes: 'Hoenn Contest, Cool, Hyper Rank' },
  { name: 'Cool Ribbon Master', generation: 3, category: 'Contest', retiredOnTransfer: true, notes: 'Hoenn Contest, Cool, Master Rank' },
  { name: 'Beauty Ribbon', generation: 3, category: 'Contest', retiredOnTransfer: true, notes: 'Normal Rank' },
  { name: 'Beauty Ribbon Super', generation: 3, category: 'Contest', retiredOnTransfer: true, notes: 'Super Rank' },
  { name: 'Beauty Ribbon Hyper', generation: 3, category: 'Contest', retiredOnTransfer: true, notes: 'Hyper Rank' },
  { name: 'Beauty Ribbon Master', generation: 3, category: 'Contest', retiredOnTransfer: true, notes: 'Master Rank' },
  { name: 'Cute Ribbon', generation: 3, category: 'Contest', retiredOnTransfer: true, notes: 'Normal Rank' },
  { name: 'Cute Ribbon Super', generation: 3, category: 'Contest', retiredOnTransfer: true, notes: 'Super Rank' },
  { name: 'Cute Ribbon Hyper', generation: 3, category: 'Contest', retiredOnTransfer: true, notes: 'Hyper Rank' },
  { name: 'Cute Ribbon Master', generation: 3, category: 'Contest', retiredOnTransfer: true, notes: 'Master Rank' },
  { name: 'Smart Ribbon', generation: 3, category: 'Contest', retiredOnTransfer: true, notes: 'Normal Rank' },
  { name: 'Smart Ribbon Super', generation: 3, category: 'Contest', retiredOnTransfer: true, notes: 'Super Rank' },
  { name: 'Smart Ribbon Hyper', generation: 3, category: 'Contest', retiredOnTransfer: true, notes: 'Hyper Rank' },
  { name: 'Smart Ribbon Master', generation: 3, category: 'Contest', retiredOnTransfer: true, notes: 'Master Rank' },
  { name: 'Tough Ribbon', generation: 3, category: 'Contest', retiredOnTransfer: true, notes: 'Normal Rank' },
  { name: 'Tough Ribbon Super', generation: 3, category: 'Contest', retiredOnTransfer: true, notes: 'Super Rank' },
  { name: 'Tough Ribbon Hyper', generation: 3, category: 'Contest', retiredOnTransfer: true, notes: 'Hyper Rank' },
  { name: 'Tough Ribbon Master', generation: 3, category: 'Contest', retiredOnTransfer: true, notes: 'Master Rank' },
  { name: 'Winning Ribbon', generation: 3, category: 'Battle Tower/Frontier', retiredOnTransfer: true, notes: 'Hoenn Battle Tower, Lv.50 mode 56+ win streak' },
  { name: 'Victory Ribbon', generation: 3, category: 'Battle Tower/Frontier', retiredOnTransfer: true, notes: 'Hoenn Battle Tower, Lv.100/Open Level mode 56+ win streak' },
  { name: 'Effort Ribbon', generation: 3, category: 'Achievement', retiredOnTransfer: false, notes: 'Maxed (510) total effort values' },
  { name: 'Artist Ribbon', generation: 3, category: 'Achievement', retiredOnTransfer: false, notes: 'Portrait chosen for Lilycove Museum after a high-scoring Hoenn Master/Link Contest win' },
  { name: 'Country Ribbon', generation: 3, category: 'Special/Event', retiredOnTransfer: false, notes: 'Pokémon League tournament winner, Pokémon Festa 2004/2005/2007' },
  { name: 'National Ribbon', generation: 3, category: 'Special/Event', retiredOnTransfer: false, notes: 'Shadow Pokémon purified in Pokémon Colosseum/XD' },
  { name: 'Earth Ribbon', generation: 3, category: 'Special/Event', retiredOnTransfer: false, notes: '100-battle win streak at Mt. Battle (Colosseum)' },
  { name: 'World Ribbon', generation: 3, category: 'Special/Event', retiredOnTransfer: false, notes: 'Pokémon League tournament winner, Pokémon Festa 2004/2005' },
  { name: 'Marine Ribbon', generation: 3, category: 'Deprecated Gift', retiredOnTransfer: false, notes: 'Unused, never awarded; slot repurposed for Battle Champion Ribbon (Gen V)' },
  { name: 'Land Ribbon', generation: 3, category: 'Deprecated Gift', retiredOnTransfer: false, notes: 'Unused, never awarded; slot repurposed for Regional Champion Ribbon (Gen V)' },
  { name: 'Sky Ribbon', generation: 3, category: 'Deprecated Gift', retiredOnTransfer: false, notes: 'Unused, never awarded; slot repurposed for National Champion Ribbon (Gen V)' },

  // Generation IV (48)
  { name: 'Sinnoh Champion Ribbon', generation: 4, category: 'League', retiredOnTransfer: false, notes: 'HG/SS is the only game of this era with no league ribbon' },
  { name: 'Cool Ribbon (Sinnoh)', generation: 4, category: 'Super Contest', retiredOnTransfer: true, notes: 'Sinnoh Super Contest, Cool, Normal Rank — "(Sinnoh)" is this file’s disambiguation, not an in-game label; see file doc comment' },
  { name: 'Cool Ribbon Great (Sinnoh)', generation: 4, category: 'Super Contest', retiredOnTransfer: true, notes: 'Great Rank' },
  { name: 'Cool Ribbon Ultra (Sinnoh)', generation: 4, category: 'Super Contest', retiredOnTransfer: true, notes: 'Ultra Rank' },
  { name: 'Cool Ribbon Master (Sinnoh)', generation: 4, category: 'Super Contest', retiredOnTransfer: true, notes: 'Master Rank' },
  { name: 'Beauty Ribbon (Sinnoh)', generation: 4, category: 'Super Contest', retiredOnTransfer: true, notes: 'Normal Rank' },
  { name: 'Beauty Ribbon Great (Sinnoh)', generation: 4, category: 'Super Contest', retiredOnTransfer: true, notes: 'Great Rank' },
  { name: 'Beauty Ribbon Ultra (Sinnoh)', generation: 4, category: 'Super Contest', retiredOnTransfer: true, notes: 'Ultra Rank' },
  { name: 'Beauty Ribbon Master (Sinnoh)', generation: 4, category: 'Super Contest', retiredOnTransfer: true, notes: 'Master Rank' },
  { name: 'Cute Ribbon (Sinnoh)', generation: 4, category: 'Super Contest', retiredOnTransfer: true, notes: 'Normal Rank' },
  { name: 'Cute Ribbon Great (Sinnoh)', generation: 4, category: 'Super Contest', retiredOnTransfer: true, notes: 'Great Rank' },
  { name: 'Cute Ribbon Ultra (Sinnoh)', generation: 4, category: 'Super Contest', retiredOnTransfer: true, notes: 'Ultra Rank' },
  { name: 'Cute Ribbon Master (Sinnoh)', generation: 4, category: 'Super Contest', retiredOnTransfer: true, notes: 'Master Rank' },
  { name: 'Smart Ribbon (Sinnoh)', generation: 4, category: 'Super Contest', retiredOnTransfer: true, notes: 'Normal Rank' },
  { name: 'Smart Ribbon Great (Sinnoh)', generation: 4, category: 'Super Contest', retiredOnTransfer: true, notes: 'Great Rank' },
  { name: 'Smart Ribbon Ultra (Sinnoh)', generation: 4, category: 'Super Contest', retiredOnTransfer: true, notes: 'Ultra Rank' },
  { name: 'Smart Ribbon Master (Sinnoh)', generation: 4, category: 'Super Contest', retiredOnTransfer: true, notes: 'Master Rank' },
  { name: 'Tough Ribbon (Sinnoh)', generation: 4, category: 'Super Contest', retiredOnTransfer: true, notes: 'Normal Rank' },
  { name: 'Tough Ribbon Great (Sinnoh)', generation: 4, category: 'Super Contest', retiredOnTransfer: true, notes: 'Great Rank' },
  { name: 'Tough Ribbon Ultra (Sinnoh)', generation: 4, category: 'Super Contest', retiredOnTransfer: true, notes: 'Ultra Rank' },
  { name: 'Tough Ribbon Master (Sinnoh)', generation: 4, category: 'Super Contest', retiredOnTransfer: true, notes: 'Master Rank' },
  { name: 'Ability Ribbon', generation: 4, category: 'Battle Tower/Frontier', retiredOnTransfer: true, notes: 'Beat Palmer, battle 21 of a Single Battle streak' },
  { name: 'Great Ability Ribbon', generation: 4, category: 'Battle Tower/Frontier', retiredOnTransfer: true, notes: 'Beat Palmer, battle 49 of a Single Battle streak' },
  { name: 'Double Ability Ribbon', generation: 4, category: 'Battle Tower/Frontier', retiredOnTransfer: true, notes: '50-win Double Battle streak' },
  { name: 'Multi Ability Ribbon', generation: 4, category: 'Battle Tower/Frontier', retiredOnTransfer: true, notes: '50-win Multi Battle streak with an NPC partner' },
  { name: 'Pair Ability Ribbon', generation: 4, category: 'Battle Tower/Frontier', retiredOnTransfer: true, notes: '50-win Multi Battle streak with a linked human partner' },
  { name: 'World Ability Ribbon', generation: 4, category: 'Battle Tower/Frontier', retiredOnTransfer: true, notes: 'Wi-Fi Battle Tower rank-up win; unobtainable since DS WFC shut down in 2014' },
  { name: 'Alert Ribbon', generation: 4, category: 'Feeling', retiredOnTransfer: false, notes: 'Sunyshore City NPC, Mondays' },
  { name: 'Shock Ribbon', generation: 4, category: 'Feeling', retiredOnTransfer: false, notes: 'Sunyshore City NPC, Tuesdays' },
  { name: 'Downcast Ribbon', generation: 4, category: 'Feeling', retiredOnTransfer: false, notes: 'Sunyshore City NPC, Wednesdays' },
  { name: 'Careless Ribbon', generation: 4, category: 'Feeling', retiredOnTransfer: false, notes: 'Sunyshore City NPC, Thursdays' },
  { name: 'Relax Ribbon', generation: 4, category: 'Feeling', retiredOnTransfer: false, notes: 'Sunyshore City NPC, Fridays' },
  { name: 'Snooze Ribbon', generation: 4, category: 'Feeling', retiredOnTransfer: false, notes: 'Sunyshore City NPC, Saturdays' },
  { name: 'Smile Ribbon', generation: 4, category: 'Feeling', retiredOnTransfer: false, notes: 'Sunyshore City NPC, Sundays' },
  { name: 'Gorgeous Ribbon', generation: 4, category: 'Achievement', retiredOnTransfer: false, notes: 'Purchased from the Ribbon Syndicate, ₦10,000' },
  { name: 'Royal Ribbon', generation: 4, category: 'Achievement', retiredOnTransfer: false, notes: 'Purchased, ₦100,000; requires already owning Gorgeous Ribbon in Sinnoh' },
  { name: 'Gorgeous Royal Ribbon', generation: 4, category: 'Achievement', retiredOnTransfer: false, notes: 'Purchased, ₦999,999; requires already owning Royal Ribbon in Sinnoh' },
  { name: 'Footprint Ribbon', generation: 4, category: 'Achievement', retiredOnTransfer: false, notes: 'Maximum friendship (Gen IV rule; later gens use a level-gap rule instead)' },
  { name: 'Record Ribbon', generation: 4, category: 'Achievement', retiredOnTransfer: false, notes: 'Never made available in any game' },
  { name: 'Legend Ribbon', generation: 4, category: 'Achievement', retiredOnTransfer: false, notes: 'Awarded to the whole party after defeating Red at Mt. Silver (HG/SS)' },
  { name: 'Classic Ribbon', generation: 4, category: 'Special/Event', retiredOnTransfer: false, notes: 'Event Pokémon only; blocks GTS/Wonder Trade' },
  { name: 'Premier Ribbon', generation: 4, category: 'Special/Event', retiredOnTransfer: false, notes: 'Event Mew/Mewtwo distributions; blocks GTS/Wonder Trade' },
  { name: 'History Ribbon', generation: 4, category: 'Deprecated Gift', retiredOnTransfer: false, notes: 'Unused; slot repurposed for Event Ribbon (Gen V)' },
  { name: 'Red Ribbon', generation: 4, category: 'Deprecated Gift', retiredOnTransfer: false, notes: 'Unused; slot repurposed for World Champion Ribbon (Gen V)' },
  { name: 'Green Ribbon', generation: 4, category: 'Deprecated Gift', retiredOnTransfer: false, notes: 'Unused; slot repurposed for Birthday Ribbon (Gen V)' },
  { name: 'Blue Ribbon', generation: 4, category: 'Deprecated Gift', retiredOnTransfer: false, notes: 'Unused; slot repurposed for Special Ribbon (Gen V)' },
  { name: 'Festival Ribbon', generation: 4, category: 'Deprecated Gift', retiredOnTransfer: false, notes: 'Unused; slot repurposed for Souvenir Ribbon (Gen V)' },
  { name: 'Carnival Ribbon', generation: 4, category: 'Deprecated Gift', retiredOnTransfer: false, notes: 'Unused; slot repurposed for Wishing Ribbon (Gen V)' },

  // Generation V (9)
  { name: 'Event Ribbon', generation: 5, category: 'Special/Event', retiredOnTransfer: false, notes: 'Event-participation ribbon; reuses the deprecated History Ribbon slot' },
  { name: 'Birthday Ribbon', generation: 5, category: 'Special/Event', retiredOnTransfer: false, notes: 'Birthday event Pokémon; reuses the deprecated Green Ribbon slot' },
  { name: 'Special Ribbon', generation: 5, category: 'Special/Event', retiredOnTransfer: false, notes: 'Generic special-day event ribbon; reuses the deprecated Blue Ribbon slot' },
  { name: 'Souvenir Ribbon', generation: 5, category: 'Special/Event', retiredOnTransfer: false, notes: '"Cherished memory" event ribbon; reuses the deprecated Festival Ribbon slot' },
  { name: 'Wishing Ribbon', generation: 5, category: 'Special/Event', retiredOnTransfer: false, notes: 'Event ribbon; reuses the deprecated Carnival Ribbon slot' },
  { name: 'Battle Champion Ribbon', generation: 5, category: 'Special/Event', retiredOnTransfer: false, notes: 'Japan-only "Yamamoto’s Tournament Pokémon" distribution; reuses the deprecated Marine Ribbon slot' },
  { name: 'Regional Champion Ribbon', generation: 5, category: 'Special/Event', retiredOnTransfer: false, notes: 'Never legitimately distributed (one known Pokémon HOME data glitch only); reuses the deprecated Land Ribbon slot' },
  { name: 'National Champion Ribbon', generation: 5, category: 'Special/Event', retiredOnTransfer: false, notes: 'Never legitimately distributed (same HOME glitch); reuses the deprecated Sky Ribbon slot' },
  { name: 'World Champion Ribbon', generation: 5, category: 'Special/Event', retiredOnTransfer: false, notes: 'Distributed on "Ryota Otsubo’s Krookodile" (Gen VII event); reuses the deprecated Red Ribbon slot' },

  // Generation VI (16)
  { name: 'Kalos Champion Ribbon', generation: 6, category: 'League', retiredOnTransfer: false, notes: 'Beat the Kalos Champion' },
  { name: 'Hoenn Champion Ribbon', generation: 6, category: 'League', retiredOnTransfer: false, notes: 'Beat the Hoenn Champion (ORAS)' },
  { name: 'Coolness Master Ribbon', generation: 6, category: 'Contest Spectacular', retiredOnTransfer: false, notes: 'Won Master Rank Cool category' },
  { name: 'Beauty Master Ribbon', generation: 6, category: 'Contest Spectacular', retiredOnTransfer: false, notes: 'Won Master Rank Beauty category' },
  { name: 'Cuteness Master Ribbon', generation: 6, category: 'Contest Spectacular', retiredOnTransfer: false, notes: 'Won Master Rank Cute category' },
  { name: 'Cleverness Master Ribbon', generation: 6, category: 'Contest Spectacular', retiredOnTransfer: false, notes: 'Won Master Rank Clever category' },
  { name: 'Toughness Master Ribbon', generation: 6, category: 'Contest Spectacular', retiredOnTransfer: false, notes: 'Won Master Rank Tough category' },
  { name: 'Contest Star Ribbon', generation: 6, category: 'Contest Spectacular', retiredOnTransfer: false, notes: 'Auto-awarded for winning all 5 Master Rank categories' },
  { name: 'Contest Memory Ribbon', generation: 6, category: 'Memory', retiredOnTransfer: false, notes: 'Awarded transferring in a Pokémon holding any Gen III/IV Contest or Super Contest ribbon' },
  { name: 'Contest Memory Ribbon (Gold)', generation: 6, category: 'Memory', retiredOnTransfer: false, notes: 'Requires the transferred Pokémon held all 20 Gen III + 20 Gen IV contest ribbons' },
  { name: 'Battle Memory Ribbon', generation: 6, category: 'Memory', retiredOnTransfer: false, notes: 'Awarded transferring in a Pokémon holding any Gen III/IV Tower ribbon' },
  { name: 'Battle Memory Ribbon (Gold)', generation: 6, category: 'Memory', retiredOnTransfer: false, notes: 'Requires all 8 pre-Gen-VI Tower ribbons' },
  { name: 'Skillful Battler Ribbon', generation: 6, category: 'Battle Tower/Frontier', retiredOnTransfer: false, notes: 'Battle Maison: beat a Battle Chatelaine, battle 20' },
  { name: 'Expert Battler Ribbon', generation: 6, category: 'Battle Tower/Frontier', retiredOnTransfer: false, notes: 'Battle Maison: beat a Battle Chatelaine, battle 50 of Super Battles' },
  { name: 'Best Friends Ribbon', generation: 6, category: 'Achievement', retiredOnTransfer: false, notes: 'Lead Pokémon at maximum friendship/affection' },
  { name: 'Training Ribbon', generation: 6, category: 'Achievement', retiredOnTransfer: false, notes: 'Lead Pokémon "Supremely Trained" via Super Training' },

  // Generation VII (4)
  { name: 'Alola Champion Ribbon', generation: 7, category: 'League', retiredOnTransfer: false, notes: 'Became Alola Champion' },
  { name: 'Battle Royal Master Ribbon', generation: 7, category: 'Battle Tower/Frontier', retiredOnTransfer: false, notes: 'Won a Master Rank Battle Royal at the Battle Royal Dome' },
  { name: 'Battle Tree Great Ribbon', generation: 7, category: 'Battle Tower/Frontier', retiredOnTransfer: false, notes: 'Beat a Battle Legend at the Battle Tree' },
  { name: 'Battle Tree Master Ribbon', generation: 7, category: 'Battle Tower/Frontier', retiredOnTransfer: false, notes: 'Beat a Battle Legend in Super Battles at the Battle Tree' },

  // Generation VIII (5)
  { name: 'Galar Champion Ribbon', generation: 8, category: 'League', retiredOnTransfer: false, notes: 'Became Galar Champion' },
  { name: 'Tower Master Ribbon', generation: 8, category: 'Battle Tower/Frontier', retiredOnTransfer: false, notes: 'Beat Leon at MAX Rank (Sw/Sh) or Palmer at Rank 10 (BDSP)' },
  { name: 'Master Rank Ribbon', generation: 8, category: 'Achievement', retiredOnTransfer: false, notes: 'Ranked Battle wins after already reaching MAX Rank in a season' },
  { name: 'Hisui Ribbon', generation: 8, category: 'Achievement', retiredOnTransfer: false, notes: 'Posed at Dagero’s photo studio, Jubilife Village (Legends: Arceus)' },
  { name: 'Twinkling Star Ribbon', generation: 8, category: 'Contest Spectacular', retiredOnTransfer: false, notes: 'BDSP-exclusive; Master Rank Brilliant/Shining Contest Show, requires already having Contest Star Ribbon' },

  // Generation IX (3)
  { name: 'Paldea Champion Ribbon', generation: 9, category: 'League', retiredOnTransfer: false, notes: 'Won the Pokémon League or the Academy Ace Tournament' },
  { name: 'Once-in-a-Lifetime Ribbon', generation: 9, category: 'Achievement', retiredOnTransfer: false, notes: 'Intended ~1/100 chance via Surprise Trade; no verified report of it actually occurring' },
  { name: 'Partner Ribbon', generation: 9, category: 'Special/Event', retiredOnTransfer: false, notes: 'Traded with special coaches in the League Club Room, or bundled with certain event Pokémon' }
]

export const RIBBONS = RIBBON_DATA.map((r) => r.name)

export type RibbonName = (typeof RIBBONS)[number]
