/**
 * Hand-curated PokeAPI pokedex-name -> display-name table (Per-Game Regional Dex Numbers
 * milestone, Leg 2 — see docs/investigations/regional-dex-numbers.md). Same "structural
 * mapping, not obtainability data" category as fetch-species-availability.ts's own
 * ORIGIN_GAME_VERSION_GROUP, just consumed at render time instead of fetch time, so it
 * lives here in shared/ rather than in the (main-process-only) fetch script.
 *
 * Several PokeAPI dex names intentionally share a display name (e.g. `original-johto` and
 * `updated-johto` both read "Johto") — a given entry's origin game only ever maps to one
 * of a pair like that (GSC vs. HGSS), so the two never render side by side and the shared
 * name causes no ambiguity in practice.
 */
export const REGIONAL_DEX_DISPLAY_NAMES: Record<string, string> = {
  kanto: 'Kanto',
  'letsgo-kanto': 'Kanto',
  'original-johto': 'Johto',
  'updated-johto': 'Johto',
  hoenn: 'Hoenn',
  'updated-hoenn': 'Hoenn',
  'original-sinnoh': 'Sinnoh',
  'extended-sinnoh': 'Sinnoh',
  'original-unova': 'Unova',
  'updated-unova': 'Unova',
  'kalos-central': 'Kalos (Central)',
  'kalos-coastal': 'Kalos (Coastal)',
  'kalos-mountain': 'Kalos (Mountain)',
  'original-alola': 'Alola',
  'updated-alola': 'Alola',
  'original-melemele': 'Melemele Island',
  'updated-melemele': 'Melemele Island',
  'original-akala': 'Akala Island',
  'updated-akala': 'Akala Island',
  'original-ulaula': "Ula'ula Island",
  'updated-ulaula': "Ula'ula Island",
  'original-poni': 'Poni Island',
  'updated-poni': 'Poni Island',
  galar: 'Galar',
  'isle-of-armor': 'Isle of Armor',
  'crown-tundra': 'Crown Tundra',
  hisui: 'Hisui',
  paldea: 'Paldea',
  kitakami: 'Kitakami',
  blueberry: 'Blueberry Academy',
  'lumiose-city': 'Lumiose City',
  hyperspace: 'Hyperspace'
}

/** Falls back to the raw PokeAPI dex name for anything not yet curated above (e.g. a new
 * regional dex from a future game) rather than throwing — this is display text, not a
 * correctness check, so an uncurated name degrading to its raw form beats a crash. */
export function regionalDexDisplayName(dexName: string): string {
  return REGIONAL_DEX_DISPLAY_NAMES[dexName] ?? dexName
}
