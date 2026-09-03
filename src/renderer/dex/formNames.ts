import type { Form } from '@shared/types/pokemon'

/**
 * The default variety's formName is always stored as the literal 'base' (storage
 * convention — see fetch-pokemon-forms.ts), even for species whose base forme has a real
 * in-game name (Deoxys "Normal", Wormadam "Plant"). This maps speciesId back to that true
 * PokeAPI form_name so formDisplayName can render it through the exact same
 * `(form-name)` formatting every non-base sibling already uses, rather than falling back
 * to the bare species name. Species with no entry here (the vast majority) keep the bare
 * species name for their base form, same as before.
 *
 * Swept live against PokeAPI 2026-09-02 (every species with >1 form in forms.json,
 * checking the is_default sub-form's own form_name) — see
 * docs/investigations/home-depositability-audit.md section 4. Deliberately excludes
 * species whose only non-generic default form_name is 'male' (Frillish, Jellicent,
 * Pyroar, Meowstic, Indeedee, Basculegion, Oinkologne) — that's PokeAPI's internal
 * disambiguation label for a male/female form pair, not a real Pokedex forme name, so the
 * base row is already correct showing just the species name.
 */
const BASE_FORM_NAMES: Record<number, string> = {
  201: 'a', // Unown
  386: 'normal', // Deoxys
  412: 'plant', // Burmy
  413: 'plant', // Wormadam
  421: 'overcast', // Cherrim
  422: 'west', // Shellos
  423: 'west', // Gastrodon
  487: 'altered', // Giratina
  492: 'land', // Shaymin
  493: 'normal', // Arceus
  550: 'red-striped', // Basculin
  555: 'standard', // Darmanitan
  585: 'spring', // Deerling
  586: 'spring', // Sawsbuck
  641: 'incarnate', // Tornadus
  642: 'incarnate', // Thundurus
  645: 'incarnate', // Landorus
  647: 'ordinary', // Keldeo
  648: 'aria', // Meloetta
  666: 'meadow', // Vivillon
  669: 'red', // Flabébé
  670: 'red', // Floette
  671: 'red', // Florges
  676: 'natural', // Furfrou
  681: 'shield', // Aegislash
  710: 'average', // Pumpkaboo
  711: 'average', // Gourgeist
  716: 'neutral', // Xerneas
  718: '50', // Zygarde
  720: 'confined', // Hoopa
  741: 'baile', // Oricorio
  745: 'midday', // Lycanroc
  746: 'solo', // Wishiwashi
  773: 'normal', // Silvally
  774: 'red-meteor', // Minior
  778: 'disguised', // Mimikyu
  849: 'amped', // Toxtricity
  854: 'phony', // Sinistea
  855: 'phony', // Polteageist
  869: 'vanilla-cream-strawberry-sweet', // Alcremie
  875: 'ice', // Eiscue
  877: 'full-belly', // Morpeko
  892: 'single-strike', // Urshifu
  905: 'incarnate', // Enamorus
  925: 'family-of-four', // Maushold
  931: 'green-plumage', // Squawkabilly
  964: 'zero', // Palafin
  978: 'curly', // Tatsugiri
  982: 'two-segment', // Dudunsparce
  999: 'chest', // Gimmighoul
  1012: 'counterfeit', // Poltchageist
  1013: 'unremarkable' // Sinistcha
}

/**
 * Capitalizes the first letter of each hyphen- or space-separated word, preserving the
 * separators. Species and form names are stored as raw lowercase PokeAPI slugs (e.g.
 * "mr-mime", "ho-oh", "10-percent") — this fixes the common case but can't restore
 * punctuation the slug format drops (apostrophes, periods, colons, gender symbols,
 * accents) or lowercase-after-hyphen names. Species affected by that are listed in
 * SPECIES_NAME_EXCEPTIONS below and go through speciesDisplayName instead.
 */
export function capitalizeWords(text: string): string {
  return text.replace(/(?:^|[\s-])[a-z]/g, (match) => match.toUpperCase())
}

/**
 * Species whose real name can't be reconstructed from their PokeAPI slug by
 * capitalizeWords alone — apostrophes, periods, a colon, gender symbols, an accent, and
 * lowercase-after-hyphen names. Keyed by the raw slug (Species.name). Ho-Oh and
 * Porygon-Z are deliberately absent: capitalizeWords already renders them correctly.
 * Leg 29 — see TODO.md's "Pokémon name punctuation exceptions" / COMPLETED.md's Leg 7.
 */
const SPECIES_NAME_EXCEPTIONS: Record<string, string> = {
  farfetchd: "Farfetch'd",
  sirfetchd: "Sirfetch'd",
  'mr-mime': 'Mr. Mime',
  'mr-rime': 'Mr. Rime',
  'mime-jr': 'Mime Jr.',
  'type-null': 'Type: Null',
  'nidoran-f': 'Nidoran♀',
  'nidoran-m': 'Nidoran♂',
  flabebe: 'Flabébé',
  'jangmo-o': 'Jangmo-o',
  'hakamo-o': 'Hakamo-o',
  'kommo-o': 'Kommo-o'
}

/** Renders a species' raw PokeAPI slug (Species.name) as its real display name, using
 * SPECIES_NAME_EXCEPTIONS where capitalizeWords can't reconstruct it. The single choke
 * point for species-name display — see buildDexSections.ts and buildCollectionGroups.ts. */
export function speciesDisplayName(name: string): string {
  return SPECIES_NAME_EXCEPTIONS[name] ?? capitalizeWords(name)
}

/** Shared by buildDexSections.ts (per-form rows) and collection/buildCollectionGroups.ts
 * (Leg 18, per-entry rows) — both need the exact same species+form display formatting. */
export function formDisplayName(speciesName: string, form: Form): string {
  const formName = form.formName === 'base' ? BASE_FORM_NAMES[form.speciesId] : form.formName
  if (!formName) return speciesName
  return `${speciesName} (${capitalizeWords(formName.replace(/-/g, ' '))})`
}
