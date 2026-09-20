/**
 * Placeholder list of Mark names a Collection Entry can record (Leg 4 of the
 * Ribbons/Alpha/Size/Capture-Date Tracking milestone). NOT the full curated set — Leg 1's
 * investigation (docs/investigations/ribbons-alpha-size-capture-date.md) counted 43 distinct
 * Marks (35 from Sw/Sh, 8 added in S/V); hand-curating all of them is Leg 5's job. Same
 * "real, not invented, subset that survives into the final list" reasoning as
 * shared/data/ribbons.ts. Includes every S/V addition the investigation doc named as the
 * "can coexist with another Mark" exception (Jumbo/Mini/Itemfinder/Partner/Gourmand/Alpha/
 * Mightiest/Titan) plus a representative spread of Sw/Sh's weather/time/rarity Marks.
 */
export const MARKS = [
  'Cloudy Mark',
  'Rainy Mark',
  'Stormy Mark',
  'Snowy Mark',
  'Blizzard Mark',
  'Dry Mark',
  'Sandstorm Mark',
  'Misty Mark',
  'Dawn Mark',
  'Dusk Mark',
  'Lunchtime Mark',
  'Sleepy-Time Mark',
  'Rare Mark',
  'Uncommon Mark',
  'Jumbo Mark',
  'Mini Mark',
  'Itemfinder Mark',
  'Partner Mark',
  'Gourmand Mark',
  'Alpha Mark',
  'Mightiest Mark',
  'Titan Mark'
] as const

export type MarkName = (typeof MARKS)[number]
