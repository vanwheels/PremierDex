/**
 * Hand-maintained data tables backing `fetch-pokemon-forms.ts`'s fetch/classification
 * logic: field overrides, shiny-lock/always-shiny facts, PokeAPI version-group ->
 * generation mapping, regional-form tokens, and the small species lists that steer which
 * varieties get special handling. Split out of fetch-pokemon-forms.ts (TODO.md's Leg 6 of
 * Codebase File-Size Cleanup) to keep that file's fetch/classification logic under the
 * line-count hard cap — see that file's module doc comment for the classification rules
 * these tables feed into.
 */
import type { SeedForm } from './fetch-pokemon-forms'

/** speciesId:formName -> field overrides, applied after the heuristic below. Most entries
 * are the home-depositability escape hatch: PokeAPI has no signal at all for "does Home
 * currently accept this form," so these set homeBoxable: false by hand, sourced against
 * Serebii's depositable-species list (see docs/investigations/home-depositability-audit.md
 * section 2, verified 2026-09-01). Minior's 7 core-color formes were checked live against
 * PokeAPI's raw response before being added here (is_battle_only is false for minior-red et
 * al., confirming this is a genuine Home-support gap rather than a bug in the
 * is_battle_only heuristic).
 *
 * Arceus's 18 plates and Genesect's 4 drives are a different override: formCategory:
 * 'non_boxable' (not just homeBoxable: false). Both are held-item-driven type changes —
 * remove the Plate/Drive and the Pokemon reverts — not a permanent forme change like
 * Wormadam's cloak (locked at evolution) or Rotom's appliances (persists without the Secret
 * Key). is_battle_only is false for these on PokeAPI (checked live 2026-09-02: e.g.
 * arceus-bug, genesect-douse), so the heuristic alone would wrongly call them dex_distinct.
 * Per Vanny's call (TODO.md's Leg 22), neither represents its own Living Dex/Home box slot —
 * only the base (no-item) form does. */
export const OVERRIDES: Record<string, Partial<SeedForm>> = {
  '493:bug': { formCategory: 'non_boxable', homeBoxable: false }, // Arceus plates
  '493:dark': { formCategory: 'non_boxable', homeBoxable: false },
  '493:dragon': { formCategory: 'non_boxable', homeBoxable: false },
  '493:electric': { formCategory: 'non_boxable', homeBoxable: false },
  '493:fighting': { formCategory: 'non_boxable', homeBoxable: false },
  '493:fire': { formCategory: 'non_boxable', homeBoxable: false },
  '493:flying': { formCategory: 'non_boxable', homeBoxable: false },
  '493:ghost': { formCategory: 'non_boxable', homeBoxable: false },
  '493:grass': { formCategory: 'non_boxable', homeBoxable: false },
  '493:ground': { formCategory: 'non_boxable', homeBoxable: false },
  '493:ice': { formCategory: 'non_boxable', homeBoxable: false },
  '493:poison': { formCategory: 'non_boxable', homeBoxable: false },
  '493:psychic': { formCategory: 'non_boxable', homeBoxable: false },
  '493:rock': { formCategory: 'non_boxable', homeBoxable: false },
  '493:steel': { formCategory: 'non_boxable', homeBoxable: false },
  '493:water': { formCategory: 'non_boxable', homeBoxable: false },
  '493:unknown': { formCategory: 'non_boxable', homeBoxable: false },
  '493:fairy': { formCategory: 'non_boxable', homeBoxable: false },
  '649:douse': { formCategory: 'non_boxable', homeBoxable: false }, // Genesect drives
  '649:shock': { formCategory: 'non_boxable', homeBoxable: false },
  '649:burn': { formCategory: 'non_boxable', homeBoxable: false },
  '649:chill': { formCategory: 'non_boxable', homeBoxable: false },
  '483:origin': { homeBoxable: false }, // Dialga
  '484:origin': { homeBoxable: false }, // Palkia
  '487:origin': { homeBoxable: false }, // Giratina
  '800:dusk': { homeBoxable: false }, // Necrozma Dusk Mane
  '800:dawn': { homeBoxable: false }, // Necrozma Dawn Wings
  '898:ice': { homeBoxable: false }, // Calyrex Ice Rider
  '898:shadow': { homeBoxable: false }, // Calyrex Shadow Rider
  '1017:wellspring-mask': { homeBoxable: false }, // Ogerpon
  '1017:hearthflame-mask': { homeBoxable: false },
  '1017:cornerstone-mask': { homeBoxable: false },
  '774:red': { homeBoxable: false }, // Minior core colors
  '774:orange': { homeBoxable: false },
  '774:yellow': { homeBoxable: false },
  '774:green': { homeBoxable: false },
  '774:blue': { homeBoxable: false },
  '774:indigo': { homeBoxable: false },
  '774:violet': { homeBoxable: false },
  '172:spiky-eared': { homeBoxable: false }, // Spiky-Eared Pichu (HGSS National Park event) — see TODO.md's Leg 6
  '646:black': { homeBoxable: false }, // Black Kyurem — not Home-boxable, unlike base Kyurem
  '646:white': { homeBoxable: false } // White Kyurem — same
}

/** speciesId:formName -> shiny-locked, per docs/investigations/shiny-locked-audit.md's
 * confirmed table (2026-09-02, Serebii's shiny-locked page cross-referenced against
 * Bulbapedia). Zacian/Zamazenta are deliberately excluded despite Bulbapedia listing
 * their normal story gift as non-shiny: a legitimate shiny of both was distributed via a
 * past Mystery Gift/serial-code event, and per Vanny's policy call an event's real-world
 * expiration doesn't retroactively lock a species — preserved distribution files mean
 * collectors can still obtain one. Exported so the one-off forms.json migration script
 * (see git history around this leg) can reuse the same list rather than duplicating it. */
export const SHINY_LOCKED: ReadonlySet<string> = new Set([
  '25:original-cap', // Pikachu's event cap forms (not partner-cap, which IS shiny-obtainable in Let's Go)
  '25:hoenn-cap',
  '25:sinnoh-cap',
  '25:unova-cap',
  '25:kalos-cap',
  '25:alola-cap',
  '25:world-cap',
  '494:base', // Victini
  '658:ash', // Ash-Greninja (non_boxable, hidden from the dex view, but still a real fact)
  '666:poke-ball', // Vivillon's Poke Ball pattern only
  '720:base', // Hoopa (Confined and Unbound share the lock — one individual, forme change)
  '720:unbound',
  '801:base', // Magearna
  '801:original',
  '802:base', // Marshadow
  '809:gmax', // Melmetal's Gigantamax factor (non_boxable, hidden, base Melmetal is NOT locked)
  '893:base', // Zarude
  '893:dada',
  '670:eternal', // Floette's Eternal Flower only
  '789:base', // Cosmog
  '790:base', // Cosmoem
  '891:base', // Kubfu
  '892:base', // Urshifu Single Strike (Kubfu's evolution retains the lock either style)
  '892:rapid-strike', // Urshifu Rapid Strike
  '896:base', // Glastrier
  '897:base', // Spectrier
  '898:base', // Calyrex
  '898:ice', // Calyrex Ice Rider (fusion with locked Glastrier)
  '898:shadow', // Calyrex Shadow Rider (fusion with locked Spectrier)
  '901:bloodmoon', // Ursaluna's Bloodmoon form only — base Ursaluna is NOT locked
  '1007:base', // Koraidon
  '1008:base', // Miraidon
  '1009:base', // Walking Wake
  '1010:base', // Iron Leaves
  '1011:base', // Okidogi
  '1012:base', // Munkidori
  '1013:base', // Fezandipiti
  '1017:base', // Ogerpon (all 4 masks share the lock — one individual, held-item forme change)
  '1017:wellspring-mask',
  '1017:hearthflame-mask',
  '1017:cornerstone-mask',
  '1020:base', // Gouging Fire
  '1021:base', // Raging Bolt
  '1022:base', // Iron Boulder
  '1023:base', // Iron Crown
  '1024:base', // Terapagos
  '1025:base' // Pecharunt
])

/** speciesId:formName -> always-shiny, the opposite-axis set from SHINY_LOCKED above —
 * a form that has never legitimately existed as non-shiny. Currently just Spiky-Eared
 * Pichu: its HeartGold/SoulSilver National Park encounter is always the golden coloring,
 * with no non-shiny version obtainable by any means. See TODO.md's Leg 6. */
export const ALWAYS_SHINY: ReadonlySet<string> = new Set(['172:spiky-eared'])

/** Captured from PokeAPI's /version-group list + each entry's .generation during
 * planning — small and stable enough to hardcode rather than fetch per form. */
export const VERSION_GROUP_GENERATION: Record<string, number> = {
  'red-blue': 1,
  yellow: 1,
  'red-green-japan': 1,
  'blue-japan': 1,
  'gold-silver': 2,
  crystal: 2,
  'ruby-sapphire': 3,
  emerald: 3,
  'firered-leafgreen': 3,
  colosseum: 3,
  xd: 3,
  'diamond-pearl': 4,
  platinum: 4,
  'heartgold-soulsilver': 4,
  'black-white': 5,
  'black-2-white-2': 5,
  'x-y': 6,
  'omega-ruby-alpha-sapphire': 6,
  'sun-moon': 7,
  'ultra-sun-ultra-moon': 7,
  'lets-go-pikachu-lets-go-eevee': 7,
  'sword-shield': 8,
  'the-isle-of-armor': 8,
  'the-crown-tundra': 8,
  'brilliant-diamond-shining-pearl': 8,
  'legends-arceus': 8,
  'scarlet-violet': 9,
  'the-teal-mask': 9,
  'the-indigo-disk': 9,
  'legends-za': 9,
  'mega-dimension': 9,
  champions: 9
}

export const REGIONAL_GROUPS: Record<string, SeedForm['regionalGroup']> = {
  alola: 'alolan',
  galar: 'galarian',
  hisui: 'hisuian',
  paldea: 'paldean'
}

export const KORAIDON_ID = 1007
export const MIRAIDON_ID = 1008
export const KORAIDON_RIDE_MODES = ['limited-build', 'sprinting-build', 'swimming-build', 'gliding-build']
export const MIRAIDON_RIDE_MODES = ['low-power-mode', 'drive-mode', 'aquatic-mode', 'glide-mode']
export const LETS_GO_STARTER_SPECIES = [25, 133] // Pikachu, Eevee

/**
 * Species whose defaultPokemon.forms array (the >1 signal fetchDefaultVarietySubForms in
 * fetch-pokemon-forms.ts keys off) is a PokeAPI structural artifact, not real sub-forms:
 * Mothim's forms list is Burmy's plant/sandy/trash cloak names, and Scatterbug/Spewpa's is
 * Vivillon's 20 pattern names — mirrored from a species one step away in the evolution
 * chain even though none of them ever change appearance. Confirmed live 2026-09-02: every
 * one of those sub-forms' sprite fields (front_default, front_female, the works) comes
 * back null, unlike Burmy's/Vivillon's own sub-forms, which all have real, distinct
 * sprites. A blanket "front_default is null" check can't replace this exclusion list — it
 * would also drop real, sprite-less dex entries elsewhere (Xerneas's Active Mode,
 * Sinistea/Polteageist's Antique, and Poltchageist/Sinistcha's second form all come back
 * null on every sprite field too, despite being real, trackable forms — they simply have
 * no known sprite source via the API at all, per TODO.md's "Female-form sprites missing"
 * leg). Species here fall through to fetchSpeciesForms' plain single-'base'-form branch
 * instead. See TODO.md's Leg 22.
 */
export const SPURIOUS_MULTI_FORM_SPECIES = new Set([414, 664, 665]) // Mothim, Scatterbug, Spewpa

/**
 * A second, differently-caused reason a species' defaultPokemon.forms array has length
 * > 1 without real sub-forms belonging in forms.json: Frillish, Jellicent, and Pyroar
 * each expose their male/female difference as two pokemon-form entries ("<species>-male",
 * is_default, and "<species>-female") rather than via a second variety or a plain
 * front_female field on one form — confirmed live 2026-09-02. Running these through
 * fetchDefaultVarietySubForms would create a real-looking but broken 'female' row: that
 * sub-form's own sprite fields are all null (the art actually lives on the *male*
 * sub-form's front_female field — see TODO.md's "Female-form sprites missing" leg), and
 * it's pure duplication besides — hasGenderDifference is already correctly computed as
 * true on the single 'base' row via hasDistinctFemaleSprite's species-level check, and
 * the renderer (buildDexSections.ts's splitGenderRows, sprites.ts's `female` param)
 * derives both the male and female display rows and sprite URLs from that one row.
 * Falls through to the plain single-'base'-form path below like
 * SPURIOUS_MULTI_FORM_SPECIES, for the same reason but not the same cause: this isn't a
 * PokeAPI structural artifact, just a form the existing gender-diff model already covers.
 */
export const GENDER_PAIR_MULTI_FORM_SPECIES = new Set([592, 593, 668]) // Frillish, Jellicent, Pyroar
