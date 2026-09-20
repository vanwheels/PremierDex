/**
 * Placeholder list of ribbon names a Collection Entry can record (Leg 4 of the
 * Ribbons/Alpha/Size/Capture-Date Tracking milestone). NOT the full curated set — Leg 1's
 * investigation (docs/investigations/ribbons-alpha-size-capture-date.md) counted ~115
 * distinct ribbons across Gen III-IX; hand-curating all of them with source/era metadata is
 * Leg 5's job. This is a real (Bulbapedia-sourced, not invented) subset chosen to unblock
 * the schema/UI this leg builds — every name here is expected to survive as-is into Leg 5's
 * full list, so a ribbon Vanny records against this placeholder set won't be orphaned once
 * the CHECK constraint widens. Same flat CHECK-constrained-string approach as
 * shared/data/size-classes.ts/poke-balls.ts/languages.ts. Includes the two Gen VI+ "Memory"
 * ribbons (Contest/Battle) that silently replace a Pokémon's older, retired ribbons on
 * transfer — see the investigation doc for that mechanic.
 */
export const RIBBONS = [
  'Champion Ribbon',
  'Effort Ribbon',
  'Alert Ribbon',
  'Shock Ribbon',
  'Downcast Ribbon',
  'Careless Ribbon',
  'Relax Ribbon',
  'Snooze Ribbon',
  'Smile Ribbon',
  'Best Friends Ribbon',
  'Training Ribbon',
  'Footprint Ribbon',
  'Record Ribbon',
  'Legend Ribbon',
  'Country Ribbon',
  'National Ribbon',
  'Earth Ribbon',
  'World Ribbon',
  'Contest Memory Ribbon',
  'Battle Memory Ribbon'
] as const

export type RibbonName = (typeof RIBBONS)[number]
