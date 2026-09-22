/**
 * Hand-curated source data for `build-forme-switch-groups.ts`, which validates these against
 * `data/pokemon/forms.json` and writes `data/pokemon/forme-switch-groups.json`.
 *
 * These are forme *changes*, not evolutions: PokeAPI's `/evolution-chain` endpoint (what
 * `fetch-evolution-chains.ts` pulls) doesn't model any of this, since none of it is an
 * evolution — no chain-walk or API field exists to derive it from, unlike evolution-edges.json.
 * Sourced by hand against Bulbapedia/official mechanics (verified live 2026-09-22), the same
 * treatment `pokemon-forms-data.ts` already gives OVERRIDES/SHINY_LOCKED/ALWAYS_SHINY for
 * facts PokeAPI has no signal for at all.
 *
 * Scope: only species where 2+ of their `dex_distinct`/`cosmetic_variant` forms.json rows
 * (i.e. boxable — see fetch-pokemon-forms.ts's classification) belong to one switchable,
 * non-evolutionary group. This deliberately excludes every species whose alternate state is
 * `non_boxable` — Mega Evolutions, Gigantamax, Zen Mode, Ultra Necrozma, Zygarde Complete,
 * Zacian/Zamazenta Crowned, Palafin Hero, Terapagos Terastal/Stellar, Meloetta Pirouette,
 * Wishiwashi School, Arceus's plates/Genesect's drives — those revert automatically (in or
 * immediately after battle) rather than persisting as a real, catchable/boxable state a
 * collection would track side by side with the base forme. Confirmed live 2026-09-22 that
 * Zacian/Zamazenta's Crowned formes specifically revert the instant they're not holding the
 * Rusted Sword/Shield (unlike this list's item-driven forms, which persist once switched) —
 * so despite being item-triggered, they belong with the battle-only group, not this one.
 *
 * Zygarde (species 718) was investigated and deliberately left out: PokeAPI's own varieties
 * for it (`zygarde-50` [default], `zygarde-10`, `zygarde-10-power-construct`,
 * `zygarde-50-power-construct`, `zygarde-complete`, `zygarde-mega`) don't cleanly separate
 * into "boxable switchable formes" vs. "ability/battle variant" the way every other species
 * here does — `10` vs. `10-power-construct` look like they encode an ability distinction
 * (Aura Break vs. Power Construct) rather than two genuinely different box states, and 10%/50%
 * switching in-game is gated on already having the Power Construct ability. Revisit if this
 * ever needs to be nailed down rather than guessed.
 */

/** One species' switchable, non-evolutionary forme group. */
export interface FormeSwitchGroupSeed {
  speciesId: number
  /** forms.json formName values in this group, `base` first. */
  formNames: string[]
  /** Human-readable description of how the player performs the switch. */
  method: string
  /** Whether every member of the group can be freely switched back to from any other. */
  reversible: boolean
  /** Per-game variation/caveats on `method`, or null when it's consistent everywhere the
   * species is available. */
  note: string | null
}

export const FORME_SWITCH_GROUPS: FormeSwitchGroupSeed[] = [
  {
    speciesId: 386, // Deoxys
    formNames: ['base', 'attack', 'defense', 'speed'],
    method:
      "Touch the meteorite in Professor Cozmo's house in Fallarbor Town — cycles Normal -> Attack -> Defense -> Speed -> Normal",
    reversible: true,
    note:
      'Omega Ruby/Alpha Sapphire only. In the original Generation III games the forme was locked to the game ' +
      'version instead — Attack in FireRed, Defense in LeafGreen, Speed in Emerald — and could only be changed ' +
      'by trading to a different game.'
  },
  {
    speciesId: 479, // Rotom
    formNames: ['base', 'heat', 'wash', 'frost', 'fan', 'mow'],
    method: 'Have Rotom possess the matching appliance, or use the Rotom Catalog key item to switch freely from anywhere',
    reversible: true,
    note:
      "Platinum: interact with the appliances in Rotom's Room (Team Galactic Eterna Building) — the forms aren't " +
      'available at all in vanilla Diamond/Pearl. Brilliant Diamond/Shining Pearl, Sword/Shield, Scarlet/Violet, ' +
      'and Legends Z-A replace the appliance room with the portable Rotom Catalog key item instead.'
  },
  {
    speciesId: 487, // Giratina
    formNames: ['base', 'origin'],
    method: 'Hold the Griseous Orb to take Origin Forme; remove it to revert to Altered Forme',
    reversible: true,
    note:
      "From Pokémon Legends: Arceus onward, the Griseous Orb no longer changes forme — a separate Griseous Core " +
      'item does that instead, and works the same way (hold to switch to Origin, unequip to revert).'
  },
  {
    speciesId: 492, // Shaymin
    formNames: ['base', 'sky'],
    method: 'Use a Gracidea on Shaymin to take Sky Forme',
    reversible: true,
    note:
      'Reverts to Land Forme at night, if frozen, or (prior to Generation VII) when deposited in a PC box/' +
      'Pokémon Bank/Day Care. Only available in Diamond/Pearl/Platinum, HeartGold/SoulSilver, and Legends: ' +
      "Arceus — Shaymin can't take Sky Forme in every game it appears in."
  },
  {
    speciesId: 646, // Kyurem
    formNames: ['base', 'black', 'white'],
    method:
      'Use the DNA Splicers with Zekrom in the party to fuse into Black Kyurem, or with Reshiram to fuse into ' +
      'White Kyurem; use the Splicers again to split back into Kyurem and its partner',
    reversible: true,
    note:
      'Fusing removes Zekrom or Reshiram from the party/boxes until the Splicers are used again to reverse it — ' +
      'only one of Black/White Kyurem can exist at a time per save file.'
  },
  {
    speciesId: 800, // Necrozma
    formNames: ['base', 'dusk', 'dawn'],
    method:
      'Use the N-Solarizer with Solgaleo in the party to fuse into Dusk Mane Necrozma, or the N-Lunarizer with ' +
      'Lunala to fuse into Dawn Wings Necrozma; use the same item again to split back apart',
    reversible: true,
    note:
      "Either fused forme can further Ultra Burst into Ultra Necrozma in battle, but that's a battle-only " +
      "transformation that reverts after the fight (forms.json's non_boxable 'ultra' row) — not part of this " +
      'switchable, boxable group.'
  },
  {
    speciesId: 898, // Calyrex
    formNames: ['base', 'ice', 'shadow'],
    method:
      'Use the Reins of Unity with Glastrier in the party to become Ice Rider Calyrex, or with Spectrier to ' +
      'become Shadow Rider Calyrex; use the Reins again to separate back into Calyrex and its mount',
    reversible: true,
    note: null
  },
  {
    speciesId: 720, // Hoopa
    formNames: ['base', 'unbound'],
    method: 'Use the Prison Bottle to release Hoopa into Unbound Forme; use it again to seal it back into Confined Forme',
    reversible: true,
    note:
      'Unbound Forme automatically reverts to Confined after 3 in-game days, and (Generation VI only) whenever ' +
      'Hoopa is deposited in a PC box.'
  },
  {
    speciesId: 641, // Tornadus
    formNames: ['base', 'therian'],
    method: 'Use the Reveal Glass to switch to Therian Forme; use it again to revert to Incarnate Forme',
    reversible: true,
    note:
      'Reveal Glass is a Black 2/White 2 key item; also obtainable in Legends: Arceus after catching all four ' +
      "Forces of Nature (including Enamorus) and completing each one's Pokédex research."
  },
  {
    speciesId: 642, // Thundurus
    formNames: ['base', 'therian'],
    method: 'Use the Reveal Glass to switch to Therian Forme; use it again to revert to Incarnate Forme',
    reversible: true,
    note:
      'Reveal Glass is a Black 2/White 2 key item; also obtainable in Legends: Arceus after catching all four ' +
      "Forces of Nature (including Enamorus) and completing each one's Pokédex research."
  },
  {
    speciesId: 645, // Landorus
    formNames: ['base', 'therian'],
    method: 'Use the Reveal Glass to switch to Therian Forme; use it again to revert to Incarnate Forme',
    reversible: true,
    note:
      'Reveal Glass is a Black 2/White 2 key item; also obtainable in Legends: Arceus after catching all four ' +
      "Forces of Nature (including Enamorus) and completing each one's Pokédex research."
  },
  {
    speciesId: 905, // Enamorus
    formNames: ['base', 'therian'],
    method: 'Use the Reveal Glass to switch to Therian Forme; use it again to revert to Incarnate Forme',
    reversible: true,
    note:
      "Unlike the original trio, Enamorus' Therian Forme debuted in Legends: Arceus rather than Black 2/White 2 " +
      '— the Reveal Glass there is earned by catching and completing Pokédex research for all four Forces of Nature.'
  },
  {
    speciesId: 1017, // Ogerpon
    formNames: ['base', 'wellspring-mask', 'hearthflame-mask', 'cornerstone-mask'],
    method: "Give Ogerpon the matching mask to hold from the bag's Other Items pouch; remove it to revert to Teal Mask Forme",
    reversible: true,
    note: 'All four masks are obtained automatically during the Teal Mask/Indigo Disk storyline (Scarlet/Violet DLC) once Ogerpon is caught.'
  },
  {
    speciesId: 647, // Keldeo
    formNames: ['base', 'resolute'],
    method: 'Teach Keldeo the move Secret Sword to take Resolute Form; have it forget Secret Sword to revert to Ordinary Form',
    reversible: true,
    note:
      "Cosmetic only — Resolute Form has identical types and stats to Ordinary Form (forms.json categorizes it " +
      "cosmetic_variant, not dex_distinct like every other group here). Move-based rather than item-based."
  }
]
