/**
 * Curated Mark list (Leg 5 of the Ribbons/Alpha/Size/Capture-Date Tracking milestone, see
 * docs/investigations/ribbons-alpha-size-capture-date.md) — replaces Leg 4's 22-name
 * placeholder. Sourced via a research subagent against Bulbapedia's "Mark" article (there is
 * no separate "List of marks" page — that title doesn't exist) plus Serebii's Scarlet/Violet
 * marks page, verified 2026-09-19 — same "subagent research, verified, not from-memory"
 * approach as shared/data/supplemental-availability.ts.
 *
 * Verified total: 53 marks — not Leg 1's 43 estimate. The gap is three real, Bulbapedia-
 * documented marks that fall outside the weather/time/rarity/personality/S-V-new buckets
 * Leg 1's estimate was built from: Fishing Mark and Curry Mark (both Sw/Sh-only, dropped in
 * Scarlet/Violet), and Destiny Mark (data existed unused in Sw/Sh, first actually obtainable
 * in Scarlet/Violet — classified here by first-obtainable generation, 9). All 22 of Leg 4's
 * placeholder names survive unchanged here.
 *
 * The 28 "personality" marks (Rowdy Mark through Slump Mark) are NOT tied to a Pokémon's
 * Nature — that was Leg 1's working assumption going in, and the research pass found no
 * support for it on either source: Bulbapedia's own text describes an independent 1/28
 * random roll among the personality-mark group, with no stated Nature correspondence. Do not
 * infer or build a Nature-to-Mark mapping from this list.
 *
 * `canCoexist`: per Bulbapedia's "Mark" article verbatim — "The Partner, Gourmand, and
 * Itemfinder Marks can be earned by any Pokémon, regardless of whether it already has
 * another mark. Likewise, the Jumbo and Mini Marks can be earned if a Pokémon has a Scale
 * value of 255 or 0 respectively, regardless of whether it already has another mark." No
 * other mark has a documented coexistence exception (Alpha/Mightiest/Titan default to
 * false — absence of documented evidence, not a confirmed "no").
 */
export interface MarkInfo {
  name: string
  generation: number
  category: string
  canCoexist: boolean
  notes?: string
}

export const MARK_DATA: MarkInfo[] = [
  // Generation VIII — condition marks: weather
  { name: 'Cloudy Mark', generation: 8, category: 'Weather', canCoexist: false, notes: 'Caught in cloudy weather' },
  { name: 'Rainy Mark', generation: 8, category: 'Weather', canCoexist: false, notes: 'Caught in rain' },
  { name: 'Stormy Mark', generation: 8, category: 'Weather', canCoexist: false, notes: 'Caught in a thunderstorm' },
  { name: 'Snowy Mark', generation: 8, category: 'Weather', canCoexist: false, notes: 'Caught in snow' },
  { name: 'Blizzard Mark', generation: 8, category: 'Weather', canCoexist: false, notes: 'Caught in a blizzard/snowstorm' },
  { name: 'Dry Mark', generation: 8, category: 'Weather', canCoexist: false, notes: 'Caught in harsh sunlight; mechanic absent in Scarlet/Violet' },
  { name: 'Sandstorm Mark', generation: 8, category: 'Weather', canCoexist: false, notes: 'Caught in a sandstorm' },
  { name: 'Misty Mark', generation: 8, category: 'Weather', canCoexist: false, notes: 'Caught in fog' },

  // Generation VIII — condition marks: time/activity
  { name: 'Lunchtime Mark', generation: 8, category: 'Time/Activity', canCoexist: false, notes: 'Caught midday' },
  { name: 'Sleepy-Time Mark', generation: 8, category: 'Time/Activity', canCoexist: false, notes: 'Caught at night' },
  { name: 'Dusk Mark', generation: 8, category: 'Time/Activity', canCoexist: false, notes: 'Caught in the evening' },
  { name: 'Dawn Mark', generation: 8, category: 'Time/Activity', canCoexist: false, notes: 'Caught in the morning' },

  // Generation VIII — condition marks: rarity
  { name: 'Rare Mark', generation: 8, category: 'Rarity', canCoexist: false, notes: 'Very low base odds (~1/1000) wild-encounter roll' },
  { name: 'Uncommon Mark', generation: 8, category: 'Rarity', canCoexist: false, notes: 'Low base odds (~1/50) wild-encounter roll' },

  // Generation VIII — condition marks: other special encounter
  { name: 'Fishing Mark', generation: 8, category: 'Special Encounter', canCoexist: false, notes: 'Caught while fishing; mechanic absent in Scarlet/Violet' },
  { name: 'Curry Mark', generation: 8, category: 'Special Encounter', canCoexist: false, notes: 'Guaranteed on a Pokémon that approaches after cooking curry at camp; absent in Scarlet/Violet' },

  // Generation VIII — personality marks (28; independent 1/28 random roll, NOT Nature-tied — see file doc comment)
  { name: 'Rowdy Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Rowdy"' },
  { name: 'Absent-Minded Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Spacey"' },
  { name: 'Jittery Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Anxious"' },
  { name: 'Excited Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Giddy"' },
  { name: 'Charismatic Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Radiant"' },
  { name: 'Calmness Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Serene"' },
  { name: 'Intense Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Feisty"' },
  { name: 'Zoned-Out Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Daydreamer"' },
  { name: 'Joyful Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Joyful"' },
  { name: 'Angry Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Furious"' },
  { name: 'Smiley Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Beaming"' },
  { name: 'Teary Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Teary-Eyed"' },
  { name: 'Upbeat Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Chipper"' },
  { name: 'Peeved Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Grumpy"' },
  { name: 'Intellectual Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Scholar"' },
  { name: 'Ferocious Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Rampaging"' },
  { name: 'Crafty Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Opportunist"' },
  { name: 'Scowling Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Stern"' },
  { name: 'Kindly Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Kindhearted"' },
  { name: 'Flustered Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Easily Flustered"' },
  { name: 'Pumped-Up Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Driven"' },
  { name: 'Zero Energy Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Apathetic"' },
  { name: 'Prideful Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Arrogant"' },
  { name: 'Unsure Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Reluctant"' },
  { name: 'Humble Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Humble"' },
  { name: 'Thorny Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Pompous"' },
  { name: 'Vigor Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Lively"' },
  { name: 'Slump Mark', generation: 8, category: 'Personality', canCoexist: false, notes: 'Title "the Worn-Out"' },

  // Generation IX — size marks (new in Scarlet/Violet)
  { name: 'Jumbo Mark', generation: 9, category: 'Size', canCoexist: true, notes: 'Mesagoza NPC, Pokémon at max Scale value (255)' },
  { name: 'Mini Mark', generation: 9, category: 'Size', canCoexist: true, notes: 'Mesagoza NPC, Pokémon at min Scale value (0)' },

  // Generation IX — new special-encounter marks
  { name: 'Itemfinder Mark', generation: 9, category: 'Special Encounter', canCoexist: true, notes: 'Random chance while it fetches items in Let’s Go mode' },
  { name: 'Partner Mark', generation: 9, category: 'Special Encounter', canCoexist: true, notes: 'High friendship (200+) plus random chance while walking with it out of its ball' },
  { name: 'Gourmand Mark', generation: 9, category: 'Special Encounter', canCoexist: true, notes: 'Random chance while it accompanies making/buying sandwiches or food' },
  { name: 'Alpha Mark', generation: 9, category: 'Special Encounter', canCoexist: false, notes: 'Auto-applied to Alpha Pokémon transferred in from Legends: Arceus via HOME' },
  { name: 'Mightiest Mark', generation: 9, category: 'Special Encounter', canCoexist: false, notes: 'Auto-applied to specific event Pokémon caught in 7-star Tera Raid Battles' },
  { name: 'Titan Mark', generation: 9, category: 'Special Encounter', canCoexist: false, notes: 'Auto-applied to Titan Pokémon; Titan Pokémon cannot obtain normal marks' },
  { name: 'Destiny Mark', generation: 9, category: 'Special Encounter', canCoexist: false, notes: 'Random chance on a wild Pokémon encountered on the player’s birthday; unused data in Sw/Sh, first obtainable in Scarlet/Violet' }
]

export const MARKS = MARK_DATA.map((m) => m.name)

export type MarkName = (typeof MARKS)[number]
