import { describe, expect, it } from 'vitest'
import { metLocationsForGame } from './met-locations'

describe('metLocationsForGame', () => {
  it('returns the curated list for Pokémon Red (Leg 3)', () => {
    const locations = metLocationsForGame('Pokémon Red')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 1')
    expect(locations).toContain('Pallet Town')
    expect(locations).toContain('Cerulean Cave')
    // Routes 26-28 are Generation II's Johto-Kanto connectors, not part of Red/Blue.
    expect(locations).not.toContain('Route 26')
  })

  it('returns the same Kanto Gen 1 list for Pokémon Blue (Leg 4 restructure: paired versions share a base list)', () => {
    const red = metLocationsForGame('Pokémon Red')
    const blue = metLocationsForGame('Pokémon Blue')
    expect(blue).toEqual(red)
  })

  it('returns the same Kanto Gen 1 list for Pokémon Yellow (Leg 5: no map differences from Red/Blue)', () => {
    const red = metLocationsForGame('Pokémon Red')
    const yellow = metLocationsForGame('Pokémon Yellow')
    expect(yellow).toEqual(red)
  })

  it('appends Fateful Encounter to every curated game, for Gift Pokémon/Mystery Gift (Leg 4)', () => {
    expect(metLocationsForGame('Pokémon Red')).toContain('Fateful Encounter')
    expect(metLocationsForGame('Pokémon Blue')).toContain('Fateful Encounter')
  })

  it('returns undefined (not just a Fateful Encounter list) for a game with no curated list yet', () => {
    expect(metLocationsForGame('Pokémon Sword')).toBeUndefined()
  })

  it('returns undefined for an unrecognized/blank game', () => {
    expect(metLocationsForGame('')).toBeUndefined()
  })

  it('returns the curated Johto+Kanto list for Pokémon Gold (Leg 6)', () => {
    const locations = metLocationsForGame('Pokémon Gold')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 1')
    expect(locations).toContain('Route 29')
    expect(locations).toContain('New Bark Town')
    expect(locations).toContain('Silver Cave')
    // Gen II's stripped-down Kanto remake drops several Gen I-only locations.
    expect(locations).not.toContain('Cerulean Cave')
    expect(locations).not.toContain('Pokémon Mansion')
    expect(locations).not.toContain('Safari Zone')
    expect(locations).not.toContain('Silph Co.')
    expect(locations).not.toContain('Rocket Hideout')
    expect(locations).not.toContain('S.S. Anne')
    expect(locations).not.toContain('Viridian Forest')
    expect(locations).not.toContain('Underground Path (Routes 7–8)')
    // Battle Tower is a Crystal-exclusive addition, layered in at Leg 7.
    expect(locations).not.toContain('Battle Tower')
    // Renamed from Gen I's Pokémon Tower.
    expect(locations).toContain('Lavender Radio Tower')
    expect(locations).not.toContain('Pokémon Tower')
  })

  it('returns the same Johto+Kanto Gen 2 list for Pokémon Silver (paired versions share a base list)', () => {
    const gold = metLocationsForGame('Pokémon Gold')
    const silver = metLocationsForGame('Pokémon Silver')
    expect(silver).toEqual(gold)
  })

  it('appends Fateful Encounter to Pokémon Gold too (Leg 6)', () => {
    expect(metLocationsForGame('Pokémon Gold')).toContain('Fateful Encounter')
  })

  it('returns Gold/Silver\'s Johto+Kanto list plus Battle Tower for Pokémon Crystal (Leg 7)', () => {
    const gold = metLocationsForGame('Pokémon Gold')
    const crystal = metLocationsForGame('Pokémon Crystal')
    expect(crystal).toBeDefined()
    expect(crystal).toContain('Battle Tower')
    // Crystal does not rename Silver Cave to Mt. Silver (that split naming is HGSS-only).
    expect(crystal).toContain('Silver Cave')
    expect(crystal).not.toContain('Mt. Silver')
    // Everything else carries over unchanged from Gold/Silver.
    expect(crystal).toEqual(expect.arrayContaining(gold as string[]))
    expect(crystal?.length).toBe((gold?.length ?? 0) + 1)
  })

  it('appends Fateful Encounter to Pokémon Crystal too (Leg 7)', () => {
    expect(metLocationsForGame('Pokémon Crystal')).toContain('Fateful Encounter')
  })

  it('returns the curated Hoenn list for Pokémon Ruby (Leg 8)', () => {
    const locations = metLocationsForGame('Pokémon Ruby')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 101')
    expect(locations).toContain('Route 134')
    expect(locations).toContain('Littleroot Town')
    expect(locations).toContain('Sky Pillar')
    // Ruby/Sapphire's Hoenn is distinct from Kanto/Johto — no bleed-through.
    expect(locations).not.toContain('Route 1')
    // Emerald/ORAS-only additions shouldn't be present yet.
    expect(locations).not.toContain('Battle Frontier')
    expect(locations).not.toContain('Battle Resort')
    expect(locations).not.toContain('Sea Mauville')
    expect(locations).not.toContain('Trainer Hill')
  })

  it('gives Ruby the Team Magma Hideout and Sapphire the Team Aqua Hideout (the one within-pair split found at Leg 8, besides Black City/White Forest)', () => {
    const ruby = metLocationsForGame('Pokémon Ruby')
    const sapphire = metLocationsForGame('Pokémon Sapphire')
    expect(ruby).toContain('Team Magma Hideout')
    expect(ruby).not.toContain('Team Aqua Hideout')
    expect(sapphire).toContain('Team Aqua Hideout')
    expect(sapphire).not.toContain('Team Magma Hideout')
  })

  it('returns the same Hoenn Gen 3 list for Ruby and Sapphire aside from the hideout split', () => {
    const ruby = metLocationsForGame('Pokémon Ruby') as string[]
    const sapphire = metLocationsForGame('Pokémon Sapphire') as string[]
    expect(ruby.length).toBe(sapphire.length)
    const rubyWithoutHideout = ruby.filter((location) => location !== 'Team Magma Hideout')
    const sapphireWithoutHideout = sapphire.filter((location) => location !== 'Team Aqua Hideout')
    expect(rubyWithoutHideout).toEqual(sapphireWithoutHideout)
  })

  it('appends Fateful Encounter to Pokémon Ruby and Sapphire too (Leg 8)', () => {
    expect(metLocationsForGame('Pokémon Ruby')).toContain('Fateful Encounter')
    expect(metLocationsForGame('Pokémon Sapphire')).toContain('Fateful Encounter')
  })

  it('returns the curated Hoenn list for Pokémon Emerald (Leg 9)', () => {
    const locations = metLocationsForGame('Pokémon Emerald')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 101')
    expect(locations).toContain('Route 134')
    expect(locations).toContain('Littleroot Town')
    expect(locations).toContain('Sky Pillar')
    // Emerald-only additions layered onto Ruby/Sapphire's Hoenn base.
    expect(locations).toContain('Battle Frontier')
    expect(locations).toContain('Trainer Hill')
    expect(locations).toContain('Mirage Tower')
    expect(locations).toContain('Desert Underpass')
    expect(locations).toContain('Artisan Cave')
    expect(locations).toContain('Marine Cave')
    expect(locations).toContain('Terra Cave')
    expect(locations).toContain('Altering Cave')
    expect(locations).toContain('Birth Island')
    expect(locations).toContain('Faraway Island')
    expect(locations).toContain('Navel Rock')
    // Index 0x3A is renamed, not duplicated: Battle Tower doesn't also appear alongside
    // Battle Frontier.
    expect(locations).not.toContain('Battle Tower')
  })

  it('gives Emerald both teams\' hideouts, not a version-exclusive split (Leg 9)', () => {
    const emerald = metLocationsForGame('Pokémon Emerald')
    expect(emerald).toContain('Team Aqua Hideout')
    expect(emerald).toContain('Team Magma Hideout (Jagged Pass)')
    // Distinct string from Ruby's Lilycove-area hideout — a different physical location.
    expect(emerald).not.toContain('Team Magma Hideout')
  })

  it('returns Ruby\'s Hoenn Gen 3 base list plus Emerald\'s additions, aside from the Battle Tower/Frontier rename and hideouts (Leg 9)', () => {
    const ruby = metLocationsForGame('Pokémon Ruby') as string[]
    const emerald = metLocationsForGame('Pokémon Emerald') as string[]
    const rubyBase = ruby.filter(
      (location) => location !== 'Team Magma Hideout' && location !== 'Battle Tower' && location !== 'Fateful Encounter'
    )
    for (const location of rubyBase) {
      expect(emerald).toContain(location)
    }
  })

  it('appends Fateful Encounter to Pokémon Emerald too (Leg 9)', () => {
    expect(metLocationsForGame('Pokémon Emerald')).toContain('Fateful Encounter')
  })

  it('returns the curated Kanto+Sevii Islands list for Pokémon FireRed (Leg 10)', () => {
    const locations = metLocationsForGame('Pokémon FireRed')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 1')
    expect(locations).toContain('Route 25')
    expect(locations).toContain('Pallet Town')
    expect(locations).toContain('Cerulean Cave')
    // Mainland Kanto is unchanged from Red/Blue/Yellow — no Johto connectors.
    expect(locations).not.toContain('Route 26')
    // "Pokémon League" is not a separate Met Location from Indigo Plateau.
    expect(locations).not.toContain('Pokémon League')
  })

  it('includes every Sevii Islands settlement and sub-area for Pokémon FireRed (Leg 10)', () => {
    const locations = metLocationsForGame('Pokémon FireRed')
    expect(locations).toContain('One Island')
    expect(locations).toContain('Two Island')
    expect(locations).toContain('Three Island')
    expect(locations).toContain('Four Island')
    expect(locations).toContain('Five Island')
    expect(locations).toContain('Six Island')
    expect(locations).toContain('Seven Island')
    expect(locations).toContain('Kindle Road')
    expect(locations).toContain('Icefall Cave')
    expect(locations).toContain('Tanoby Ruins')
    expect(locations).toContain('Tanoby Key')
    expect(locations).toContain('Navel Rock')
    expect(locations).toContain('Birth Island')
    // Six Island's Altering Cave is a distinct physical location from Emerald's.
    expect(locations).toContain('Altering Cave')
  })

  it("lists the seven Tanoby Chambers individually rather than under one umbrella name (Leg 10)", () => {
    const locations = metLocationsForGame('Pokémon FireRed')
    expect(locations).toContain('Monean Chamber')
    expect(locations).toContain('Liptoo Chamber')
    expect(locations).toContain('Weepth Chamber')
    expect(locations).toContain('Dilford Chamber')
    expect(locations).toContain('Scufib Chamber')
    expect(locations).toContain('Rixy Chamber')
    expect(locations).toContain('Viapois Chamber')
    expect(locations).not.toContain('Tanoby Chambers')
  })

  it('returns the same Kanto+Sevii Islands list for Pokémon LeafGreen (paired versions share a base list)', () => {
    const fireRed = metLocationsForGame('Pokémon FireRed')
    const leafGreen = metLocationsForGame('Pokémon LeafGreen')
    expect(leafGreen).toEqual(fireRed)
  })

  it('appends Fateful Encounter to Pokémon FireRed and LeafGreen too (Leg 10)', () => {
    expect(metLocationsForGame('Pokémon FireRed')).toContain('Fateful Encounter')
    expect(metLocationsForGame('Pokémon LeafGreen')).toContain('Fateful Encounter')
  })

  it('returns the curated Orre list for Pokémon Colosseum (Leg 11)', () => {
    const locations = metLocationsForGame('Pokémon Colosseum')
    expect(locations).toBeDefined()
    expect(locations).toContain('Agate Village')
    expect(locations).toContain('Outskirt Stand')
    expect(locations).toContain('Phenac City')
    expect(locations).toContain('Pyrite Town')
    expect(locations).toContain('The Under')
    expect(locations).toContain('Snagem Hideout')
    expect(locations).toContain('Mt. Battle')
    // Colosseum has no wild encounters and no overland Route locations at all.
    expect(locations).not.toContain('Route 1')
  })

  it('distinguishes Colosseum\'s Tower Colosseum from Under Colosseum and Deep Colosseum (Leg 11)', () => {
    const locations = metLocationsForGame('Pokémon Colosseum')
    expect(locations).toContain('Tower Colosseum')
    expect(locations).toContain('Under Colosseum')
    expect(locations).toContain('Deep Colosseum')
    // XD's name for the Realgam Tower arena, not Colosseum's own name for it.
    expect(locations).not.toContain('Realgam Colosseum')
  })

  it('excludes XD-exclusive locations from Pokémon Colosseum\'s list (Leg 11)', () => {
    const locations = metLocationsForGame('Pokémon Colosseum')
    expect(locations).not.toContain('S.S. Libra')
    expect(locations).not.toContain("Kaminko's House")
    expect(locations).not.toContain('Citadark Isle')
    expect(locations).not.toContain('Cipher Key Lair')
  })

  it('excludes generic building interiors that are not distinct Met Locations (Leg 11)', () => {
    const locations = metLocationsForGame('Pokémon Colosseum')
    expect(locations).not.toContain("Mayor's House")
    expect(locations).not.toContain('Pyrite Bldg')
    expect(locations).not.toContain('Card e Room')
  })

  it('appends Fateful Encounter to Pokémon Colosseum too (Leg 11)', () => {
    expect(metLocationsForGame('Pokémon Colosseum')).toContain('Fateful Encounter')
  })

  it('returns the curated Orre list for Pokémon XD: Gale of Darkness (Leg 12)', () => {
    const locations = metLocationsForGame('Pokémon XD: Gale of Darkness')
    expect(locations).toBeDefined()
    expect(locations).toContain('Agate Village')
    expect(locations).toContain('Gateon Port')
    expect(locations).toContain('Pokémon HQ Lab')
    expect(locations).toContain('Phenac City')
    expect(locations).toContain('Pyrite Town')
    expect(locations).toContain('Snagem Hideout')
    // XD has no wild-encounter Route locations either.
    expect(locations).not.toContain('Route 1')
  })

  it('includes XD\'s three Poké Spots — its only wild encounters (Leg 12)', () => {
    const locations = metLocationsForGame('Pokémon XD: Gale of Darkness')
    expect(locations).toContain('Rock Poké Spot')
    expect(locations).toContain('Oasis Poké Spot')
    expect(locations).toContain('Cave Poké Spot')
  })

  it('includes XD-exclusive story locations absent from Colosseum\'s list (Leg 12)', () => {
    const locations = metLocationsForGame('Pokémon XD: Gale of Darkness')
    expect(locations).toContain('S.S. Libra')
    expect(locations).toContain("Kaminko's House")
    expect(locations).toContain('Citadark Isle')
    expect(locations).toContain('Cipher Key Lair')
  })

  it('uses Realgam Tower, not Realgam Colosseum, for XD (Leg 12)', () => {
    const locations = metLocationsForGame('Pokémon XD: Gale of Darkness')
    expect(locations).toContain('Realgam Tower')
    // XD's index table has no separate index for the arena room, unlike Colosseum's
    // dedicated "Tower Colosseum" index.
    expect(locations).not.toContain('Realgam Colosseum')
    expect(locations).not.toContain('Tower Colosseum')
  })

  it('excludes Colosseum-only facilities from Pokémon XD\'s list (Leg 12)', () => {
    const locations = metLocationsForGame('Pokémon XD: Gale of Darkness')
    expect(locations).not.toContain('The Under')
    expect(locations).not.toContain('The Under Subway')
    expect(locations).not.toContain('Under Colosseum')
    expect(locations).not.toContain('Deep Colosseum')
    expect(locations).not.toContain('Phenac Stadium')
    expect(locations).not.toContain('Pyrite Colosseum')
    expect(locations).not.toContain('Prestige Precept Center')
  })

  it('shares Agate Village\'s Relic Stone landmark and Orre Colosseum with Colosseum\'s list (Leg 12)', () => {
    const locations = metLocationsForGame('Pokémon XD: Gale of Darkness')
    expect(locations).toContain('Relic Stone')
    expect(locations).toContain('Orre Colosseum')
  })

  it('appends Fateful Encounter to Pokémon XD too (Leg 12)', () => {
    expect(metLocationsForGame('Pokémon XD: Gale of Darkness')).toContain('Fateful Encounter')
  })

  it('returns the curated Sinnoh list for Pokémon Diamond (Leg 13)', () => {
    const locations = metLocationsForGame('Pokémon Diamond')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 201')
    expect(locations).toContain('Route 230')
    expect(locations).toContain('Twinleaf Town')
    expect(locations).toContain('Mt. Coronet')
    // Sinnoh is distinct from every prior region — no bleed-through.
    expect(locations).not.toContain('Route 1')
    expect(locations).not.toContain('Route 101')
  })

  it("includes Diamond/Pearl's Battle Zone and Stark Mountain, contrary to the assumption they're Platinum-only (Leg 13)", () => {
    const locations = metLocationsForGame('Pokémon Diamond')
    expect(locations).toContain('Fight Area')
    expect(locations).toContain('Survival Area')
    expect(locations).toContain('Resort Area')
    expect(locations).toContain('Stark Mountain')
    expect(locations).toContain('Battle Tower')
    expect(locations).toContain('Hall of Origin')
    expect(locations).toContain('Verity Cavern')
    expect(locations).toContain('Valor Cavern')
    expect(locations).toContain('Acuity Cavern')
  })

  it('excludes Platinum-exclusive locations from Pokémon Diamond\'s list (Leg 13)', () => {
    const locations = metLocationsForGame('Pokémon Diamond')
    expect(locations).not.toContain('Battle Frontier')
    expect(locations).not.toContain('Distortion World')
    expect(locations).not.toContain('Global Terminal')
    expect(locations).not.toContain('Villa')
    expect(locations).not.toContain('Battleground')
    expect(locations).not.toContain('Iron Ruins')
    expect(locations).not.toContain('Iceberg Ruins')
    expect(locations).not.toContain('Rock Peak Ruins')
  })

  it('excludes non-place special indices from Pokémon Diamond\'s list (Leg 13)', () => {
    const locations = metLocationsForGame('Pokémon Diamond')
    expect(locations).not.toContain('Mystery Zone')
    expect(locations).not.toContain('Day-Care Couple')
    expect(locations).not.toContain('Sinnoh')
    expect(locations).not.toContain('Kanto')
    expect(locations).not.toContain('Johto')
    expect(locations).not.toContain('Hoenn')
  })

  it("uses Diamond/Pearl's own building-interior names, resolved from the FB template's display text (Leg 13)", () => {
    const locations = metLocationsForGame('Pokémon Diamond')
    expect(locations).toContain('Galactic HQ')
    expect(locations).not.toContain('Team Galactic HQ')
    expect(locations).toContain('Cafe')
    expect(locations).not.toContain('Café')
    expect(locations).toContain('GTS')
    expect(locations).toContain('Game Corner')
  })

  it('returns the same Sinnoh Gen 4 list for Pokémon Pearl (paired versions share a base list)', () => {
    const diamond = metLocationsForGame('Pokémon Diamond')
    const pearl = metLocationsForGame('Pokémon Pearl')
    expect(pearl).toEqual(diamond)
  })

  it('appends Fateful Encounter to Pokémon Diamond and Pearl too (Leg 13)', () => {
    expect(metLocationsForGame('Pokémon Diamond')).toContain('Fateful Encounter')
    expect(metLocationsForGame('Pokémon Pearl')).toContain('Fateful Encounter')
  })

  it('returns the curated Sinnoh list for Pokémon Platinum (Leg 14)', () => {
    const locations = metLocationsForGame('Pokémon Platinum')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 201')
    expect(locations).toContain('Route 230')
    expect(locations).toContain('Twinleaf Town')
    expect(locations).toContain('Mt. Coronet')
    expect(locations).not.toContain('Route 1')
    expect(locations).not.toContain('Route 101')
  })

  it('includes Platinum-exclusive Battle Frontier facilities and other grey-index additions (Leg 14)', () => {
    const locations = metLocationsForGame('Pokémon Platinum')
    expect(locations).toContain('Battle Frontier')
    expect(locations).toContain('Battle Arcade')
    expect(locations).toContain('Battle Castle')
    expect(locations).toContain('Battle Factory')
    expect(locations).toContain('Battle Hall')
    expect(locations).toContain('Distortion World')
    expect(locations).toContain('Global Terminal')
    expect(locations).toContain('Villa')
    expect(locations).toContain('Battleground')
    expect(locations).toContain("Rotom's Room")
    expect(locations).toContain('T.G. Eterna Bldg')
    expect(locations).toContain('Iron Ruins')
    expect(locations).toContain('Iceberg Ruins')
    expect(locations).toContain('Rock Peak Ruins')
  })

  it('replaces Diamond/Pearl-only names with their Platinum equivalents (Leg 14)', () => {
    const locations = metLocationsForGame('Pokémon Platinum')
    expect(locations).not.toContain('Battle Tower')
    expect(locations).not.toContain('GTS')
    expect(locations).not.toContain('Cafe')
    expect(locations).toContain('Café')
  })

  it('keeps Diamond/Pearl-shared locations that Platinum does not replace (Leg 14)', () => {
    const locations = metLocationsForGame('Pokémon Platinum')
    expect(locations).toContain('Turnback Cave')
    expect(locations).toContain('Fight Area')
    expect(locations).toContain('Survival Area')
    expect(locations).toContain('Resort Area')
    expect(locations).toContain('Stark Mountain')
    expect(locations).toContain('Hall of Origin')
  })

  it('appends Fateful Encounter to Pokémon Platinum too (Leg 14)', () => {
    expect(metLocationsForGame('Pokémon Platinum')).toContain('Fateful Encounter')
  })

  it('returns the curated Johto+Kanto list for Pokémon HeartGold (Leg 15)', () => {
    const locations = metLocationsForGame('Pokémon HeartGold')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 1')
    expect(locations).toContain('Route 48')
    expect(locations).toContain('New Bark Town')
    expect(locations).toContain('Pallet Town')
    expect(locations).toContain('Mt. Silver')
    // Sinnoh isn't accessible from HGSS's own map at all.
    expect(locations).not.toContain('Route 201')
    expect(locations).not.toContain('Twinleaf Town')
  })

  it("uses HGSS's own renamed/remade locations rather than Generation II's names (Leg 15)", () => {
    const locations = metLocationsForGame('Pokémon HeartGold')
    // Tin Tower (Gen II) was renamed Bell Tower in the remake.
    expect(locations).toContain('Bell Tower')
    expect(locations).not.toContain('Tin Tower')
    // Silver Cave (Gen II) split into the exterior Mt. Silver and interior Mt. Silver Cave.
    expect(locations).toContain('Mt. Silver')
    expect(locations).toContain('Mt. Silver Cave')
    expect(locations).not.toContain('Silver Cave')
    // Lavender's former Pokémon Tower/Lavender Radio Tower has no index in HGSS at all —
    // only Goldenrod's Radio Tower is a selectable Met Location here.
    expect(locations).toContain('Goldenrod Radio Tower')
    expect(locations).not.toContain('Lavender Radio Tower')
  })

  it('includes Route 47/48 and the rebuilt Johto Safari Zone area, all HGSS-exclusive (Leg 15)', () => {
    const locations = metLocationsForGame('Pokémon HeartGold')
    expect(locations).toContain('Route 47')
    expect(locations).toContain('Route 48')
    expect(locations).toContain('Safari Zone')
    expect(locations).toContain('Safari Zone Gate')
    expect(locations).toContain('Cliff Cave')
    expect(locations).toContain('Cliff Edge Gate')
    expect(locations).toContain('Frontier Access')
    expect(locations).toContain('Bellchime Trail')
    expect(locations).toContain('Sinjoh Ruins')
    expect(locations).toContain('Embedded Tower')
    expect(locations).toContain('Pokéwalker')
  })

  it('excludes the Mr. Pokémon/Primo gift-context indices as non-places (Leg 15)', () => {
    const locations = metLocationsForGame('Pokémon HeartGold')
    expect(locations).not.toContain('Mr. Pokémon')
    expect(locations).not.toContain('Primo')
  })

  it('returns the same Johto+Kanto Gen 4 list for Pokémon SoulSilver (paired versions share a base list)', () => {
    const heartGold = metLocationsForGame('Pokémon HeartGold')
    const soulSilver = metLocationsForGame('Pokémon SoulSilver')
    expect(soulSilver).toEqual(heartGold)
  })

  it('appends Fateful Encounter to Pokémon HeartGold and SoulSilver too (Leg 15)', () => {
    expect(metLocationsForGame('Pokémon HeartGold')).toContain('Fateful Encounter')
    expect(metLocationsForGame('Pokémon SoulSilver')).toContain('Fateful Encounter')
  })

  it('returns the curated Unova list for Pokémon Black (Leg 16)', () => {
    const locations = metLocationsForGame('Pokémon Black')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 1')
    expect(locations).toContain('Route 18')
    expect(locations).toContain('Nuvema Town')
    expect(locations).toContain('N\'s Castle')
    expect(locations).toContain('Victory Road')
    // Black 2/White 2-exclusive routes/locations aren't part of the original pair.
    expect(locations).not.toContain('Route 19')
    expect(locations).not.toContain('Aspertia City')
    expect(locations).not.toContain('Pokémon World Tournament')
  })

  it('gives Black the Black City/Black Gate pair and White the White Forest/White Gate pair (Leg 16 within-pair split)', () => {
    const black = metLocationsForGame('Pokémon Black')
    const white = metLocationsForGame('Pokémon White')
    expect(black).toContain('Black City')
    expect(black).toContain('Black Gate')
    expect(black).not.toContain('White Forest')
    expect(black).not.toContain('White Gate')
    expect(white).toContain('White Forest')
    expect(white).toContain('White Gate')
    expect(white).not.toContain('Black City')
    expect(white).not.toContain('Black Gate')
  })

  it('returns the same Unova Gen 5 list for Black and White aside from the City/Gate split (Leg 16)', () => {
    const black = metLocationsForGame('Pokémon Black') as string[]
    const white = metLocationsForGame('Pokémon White') as string[]
    expect(black.length).toBe(white.length)
    const blackWithoutSplit = black.filter((location) => location !== 'Black City' && location !== 'Black Gate')
    const whiteWithoutSplit = white.filter((location) => location !== 'White Forest' && location !== 'White Gate')
    expect(blackWithoutSplit).toEqual(whiteWithoutSplit)
  })

  it('excludes Entralink-duplicate and non-place indices from Pokémon Black\'s list (Leg 16)', () => {
    const locations = metLocationsForGame('Pokémon Black')
    expect(locations).not.toContain('Mystery Zone')
    expect(locations).not.toContain('Faraway place')
    expect(locations).not.toContain('Kanto')
    expect(locations).not.toContain('Johto')
    expect(locations).not.toContain('Hoenn')
    expect(locations).not.toContain('Sinnoh')
    expect(locations).not.toContain('Day-Care Couple')
  })

  it('includes dedicated-index buildings and gates for Pokémon Black (Leg 16)', () => {
    const locations = metLocationsForGame('Pokémon Black')
    expect(locations).toContain('Musical Theater')
    expect(locations).toContain('Gear Station')
    expect(locations).toContain('Unity Tower')
    expect(locations).toContain('Accumula Gate')
    expect(locations).toContain('Undella Gate')
    expect(locations).toContain('Nacrene Gate')
    expect(locations).toContain('Castelia Gate')
    expect(locations).toContain('Nimbasa Gate')
    expect(locations).toContain('Opelucid Gate')
    expect(locations).toContain('Bridge Gate')
    expect(locations).toContain('Route Gate')
  })

  it('appends Fateful Encounter to Pokémon Black and White too (Leg 16)', () => {
    expect(metLocationsForGame('Pokémon Black')).toContain('Fateful Encounter')
    expect(metLocationsForGame('Pokémon White')).toContain('Fateful Encounter')
  })

  it('returns the curated Unova list for Pokémon Black 2, including its own new routes/areas (Leg 17)', () => {
    const locations = metLocationsForGame('Pokémon Black 2')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 1')
    expect(locations).toContain('Route 18')
    expect(locations).toContain('Route 19')
    expect(locations).toContain('Route 23')
    expect(locations).toContain('Aspertia City')
    expect(locations).toContain('Virbank City')
    expect(locations).toContain('Humilau City')
    expect(locations).toContain('Victory Road')
  })

  it('renames Cold Storage to Pokémon World Tournament for Black 2/White 2 (Leg 17)', () => {
    const black2 = metLocationsForGame('Pokémon Black 2')
    const white2 = metLocationsForGame('Pokémon White 2')
    expect(black2).toContain('Pokémon World Tournament')
    expect(black2).not.toContain('Cold Storage')
    expect(white2).toContain('Pokémon World Tournament')
    expect(white2).not.toContain('Cold Storage')
  })

  it('includes Pokémon Dream Radar for both Black 2 and White 2 (Leg 17)', () => {
    expect(metLocationsForGame('Pokémon Black 2')).toContain('Pokémon Dream Radar')
    expect(metLocationsForGame('Pokémon White 2')).toContain('Pokémon Dream Radar')
  })

  it('gives Black 2 the Black City/Black Gate/Black Tower trio and White 2 the White Forest/White Gate/White Treehollow trio (Leg 17 within-pair split)', () => {
    const black2 = metLocationsForGame('Pokémon Black 2')
    const white2 = metLocationsForGame('Pokémon White 2')
    expect(black2).toContain('Black City')
    expect(black2).toContain('Black Gate')
    expect(black2).toContain('Black Tower')
    expect(black2).not.toContain('White Forest')
    expect(black2).not.toContain('White Gate')
    expect(black2).not.toContain('White Treehollow')
    expect(white2).toContain('White Forest')
    expect(white2).toContain('White Gate')
    expect(white2).toContain('White Treehollow')
    expect(white2).not.toContain('Black City')
    expect(white2).not.toContain('Black Gate')
    expect(white2).not.toContain('Black Tower')
  })

  it('returns the same Black 2/White 2 base list aside from the City/Gate/Tower split (Leg 17)', () => {
    const black2 = metLocationsForGame('Pokémon Black 2') as string[]
    const white2 = metLocationsForGame('Pokémon White 2') as string[]
    expect(black2.length).toBe(white2.length)
    const black2WithoutSplit = black2.filter(
      (location) => location !== 'Black City' && location !== 'Black Gate' && location !== 'Black Tower'
    )
    const white2WithoutSplit = white2.filter(
      (location) => location !== 'White Forest' && location !== 'White Gate' && location !== 'White Treehollow'
    )
    expect(black2WithoutSplit).toEqual(white2WithoutSplit)
  })

  it("does not carry over Black/White's own Black City/Black Gate/White Forest/White Gate distinction incorrectly (Leg 17)", () => {
    // Black 2/White 2 is its own array, built fresh rather than reusing UNOVA_BLACK/UNOVA_WHITE.
    const black2 = metLocationsForGame('Pokémon Black 2')
    const white2 = metLocationsForGame('Pokémon White 2')
    expect(black2).not.toBe(metLocationsForGame('Pokémon Black'))
    expect(white2).not.toBe(metLocationsForGame('Pokémon White'))
  })

  it('appends Fateful Encounter to Pokémon Black 2 and White 2 too (Leg 17)', () => {
    expect(metLocationsForGame('Pokémon Black 2')).toContain('Fateful Encounter')
    expect(metLocationsForGame('Pokémon White 2')).toContain('Fateful Encounter')
  })

  it('returns the curated Kalos list for Pokémon X (Leg 18)', () => {
    const locations = metLocationsForGame('Pokémon X')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 1')
    expect(locations).toContain('Route 22')
    expect(locations).toContain('Vaniville Town')
    expect(locations).toContain('Lumiose City')
    expect(locations).toContain('Victory Road')
    // Omega Ruby/Alpha Sapphire-only additions aren't part of X/Y's own map.
    expect(locations).not.toContain('Littleroot Town')
    expect(locations).not.toContain('Battle Resort')
    expect(locations).not.toContain('Team Aqua Hideout')
  })

  it('returns the same Kalos Gen 6 list for Pokémon Y (paired versions share a base list)', () => {
    const x = metLocationsForGame('Pokémon X')
    const y = metLocationsForGame('Pokémon Y')
    expect(y).toEqual(x)
  })

  it('excludes non-place special indices from Pokémon X\'s list (Leg 18)', () => {
    const locations = metLocationsForGame('Pokémon X')
    expect(locations).not.toContain('Mystery Zone')
    expect(locations).not.toContain('Faraway Place')
  })

  it("includes each Kalos route's alternate name as its own entry, distinct from Generation V's excluded Entralink duplicates (Leg 18)", () => {
    const locations = metLocationsForGame('Pokémon X')
    expect(locations).toContain('Vaniville Pathway')
    expect(locations).toContain('Menhir Trail')
    // Bulbapedia's index-table template call for this row is a typo (invokes Route 21's
    // template) but the row belongs to Route 22, confirmed via Kalos Route 22's own article.
    expect(locations).toContain('Détourner Way')
  })

  it('includes dedicated-index sub-areas and facilities for Pokémon X (Leg 18)', () => {
    const locations = metLocationsForGame('Pokémon X')
    expect(locations).toContain('Zubat Roost')
    expect(locations).toContain('Lumiose Station')
    expect(locations).toContain('Kiloude Station')
    expect(locations).toContain('Ambrette Aquarium')
    expect(locations).toContain('Blazing Chamber')
    expect(locations).toContain('Flood Chamber')
    expect(locations).toContain('Ironworks Chamber')
    expect(locations).toContain('Dragonmark Chamber')
    expect(locations).toContain('Radiant Chamber')
    // A real, small postgame Mewtwo cave, not a placeholder despite the generic name.
    expect(locations).toContain('Unknown Dungeon')
  })

  it('appends Fateful Encounter to Pokémon X and Y too (Leg 18)', () => {
    expect(metLocationsForGame('Pokémon X')).toContain('Fateful Encounter')
    expect(metLocationsForGame('Pokémon Y')).toContain('Fateful Encounter')
  })

  it('returns the curated Hoenn list for Pokémon Omega Ruby (Leg 19)', () => {
    const locations = metLocationsForGame('Pokémon Omega Ruby')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 101')
    expect(locations).toContain('Route 134')
    expect(locations).toContain('Littleroot Town')
    expect(locations).toContain('Sky Pillar')
    // ORAS's engine recognizes X/Y's Kalos indices for trade-display purposes, but they
    // aren't part of ORAS's own map any more than HGSS's Johto/Kanto was part of Platinum's.
    expect(locations).not.toContain('Route 1')
    expect(locations).not.toContain('Vaniville Town')
    expect(locations).not.toContain('Lumiose City')
  })

  it('returns the same Hoenn ORAS list for Pokémon Alpha Sapphire (paired versions share a base list)', () => {
    const omegaRuby = metLocationsForGame('Pokémon Omega Ruby')
    const alphaSapphire = metLocationsForGame('Pokémon Alpha Sapphire')
    expect(alphaSapphire).toEqual(omegaRuby)
  })

  it('gives Omega Ruby/Alpha Sapphire both teams\' hideouts, not a version-exclusive split like original Ruby/Sapphire (Leg 19)', () => {
    const locations = metLocationsForGame('Pokémon Omega Ruby')
    expect(locations).toContain('Team Aqua Hideout')
    expect(locations).toContain('Team Magma Hideout')
    // At Ruby/Sapphire's original Lilycove-area location, not Emerald's relocated one.
    expect(locations).not.toContain('Team Magma Hideout (Jagged Pass)')
  })

  it('includes the remade Hoenn-only locations absent from the original Ruby/Sapphire/Emerald maps (Leg 19)', () => {
    const locations = metLocationsForGame('Pokémon Omega Ruby')
    expect(locations).toContain('Sea Mauville')
    expect(locations).toContain('Battle Resort')
    expect(locations).toContain('Soaring in the sky')
  })

  it('includes every Mirage Spot area, replacing the original static Mirage Island (Leg 19)', () => {
    const locations = metLocationsForGame('Pokémon Omega Ruby')
    expect(locations).toContain('Mirage Forest')
    expect(locations).toContain('Mirage Cave')
    expect(locations).toContain('Mirage Island')
    expect(locations).toContain('Mirage Mountain')
    expect(locations).toContain('Trackless Forest')
    expect(locations).toContain('Pathless Plain')
    expect(locations).toContain('Nameless Cavern')
    expect(locations).toContain('Fabled Cave')
    expect(locations).toContain('Gnarled Den')
    expect(locations).toContain('Crescent Isle')
    expect(locations).toContain('Secret Islet')
    expect(locations).toContain('Secret Shore')
    expect(locations).toContain('Secret Meadow')
  })

  it('excludes non-place special indices from Pokémon Omega Ruby\'s list (Leg 19)', () => {
    const locations = metLocationsForGame('Pokémon Omega Ruby')
    expect(locations).not.toContain('Inside of Truck')
    expect(locations).not.toContain('Secret Base')
    expect(locations).not.toContain('Day-Care Couple')
  })

  it('appends Fateful Encounter to Pokémon Omega Ruby and Alpha Sapphire too (Leg 19)', () => {
    expect(metLocationsForGame('Pokémon Omega Ruby')).toContain('Fateful Encounter')
    expect(metLocationsForGame('Pokémon Alpha Sapphire')).toContain('Fateful Encounter')
  })

  it('returns the curated Alola list for Pokémon Sun (Leg 20)', () => {
    const locations = metLocationsForGame('Pokémon Sun')
    expect(locations).toBeDefined()
    expect(locations).toContain('Route 1')
    expect(locations).toContain('Route 17')
    expect(locations).toContain('Iki Town')
    expect(locations).toContain('Vast Poni Canyon')
  })

  it('returns the same Alola list for Pokémon Moon (paired versions share a base list)', () => {
    const sun = metLocationsForGame('Pokémon Sun')
    const moon = metLocationsForGame('Pokémon Moon')
    expect(moon).toEqual(sun)
  })

  it('includes Seafolk Village despite its absence from the Alola settlements table (Leg 20)', () => {
    // Initially assumed Ultra Sun/Ultra Moon-exclusive; its own catch/item data confirmed
    // otherwise — see the ALOLA_SM comment for the full correction.
    const locations = metLocationsForGame('Pokémon Sun')
    expect(locations).toContain('Seafolk Village')
  })

  it("resolves Sun/Moon's own Ultra Beast encounters to already-curated Alola locations, not Ultra-space names (Leg 20)", () => {
    const locations = metLocationsForGame('Pokémon Sun')
    expect(locations).toContain("Diglett's Tunnel")
    expect(locations).toContain('Wela Volcano Park')
    expect(locations).toContain('Melemele Meadow')
    expect(locations).toContain('Verdant Cavern')
    expect(locations).toContain('Lush Jungle')
    expect(locations).toContain('Memorial Hill')
    expect(locations).toContain('Ultra Space')
    expect(locations).not.toContain('Ultra Deep Sea')
    expect(locations).not.toContain('Ultra Forest')
    expect(locations).not.toContain('Ultra Crater')
  })

  it('keeps both halves of the Sunne/Moone landmark pairs on the shared list, not split by version (Leg 20)', () => {
    const locations = metLocationsForGame('Pokémon Sun')
    expect(locations).toContain('Altar of the Sunne')
    expect(locations).toContain('Altar of the Moone')
    expect(locations).toContain('Lake of the Sunne')
    expect(locations).toContain('Lake of the Moone')
  })

  it('excludes locations confirmed Ultra Sun/Ultra Moon-exclusive from Pokémon Sun (Leg 20)', () => {
    const locations = metLocationsForGame('Pokémon Sun')
    expect(locations).not.toContain('Big Wave Beach')
    expect(locations).not.toContain('Sandy Cave')
    expect(locations).not.toContain('Heahea Beach')
    expect(locations).not.toContain('Pikachu Valley')
    expect(locations).not.toContain('Poni Beach')
    expect(locations).not.toContain('Plains Grotto')
    expect(locations).not.toContain("Team Rocket's Castle")
    expect(locations).not.toContain('Dividing Peak Tunnel')
    expect(locations).not.toContain('Ultra Megalopolis')
  })

  it('excludes generic repeated building types and non-place fallback strings from Pokémon Sun (Leg 20)', () => {
    const locations = metLocationsForGame('Pokémon Sun')
    expect(locations).not.toContain('Poké Mart')
    expect(locations).not.toContain('Pokémon Center')
    expect(locations).not.toContain('Aether Base')
    expect(locations).not.toContain("Player's house")
    expect(locations).not.toContain('Faraway place')
    expect(locations).not.toContain('Melemele Island')
    expect(locations).not.toContain('Festival Plaza')
  })

  it('appends Fateful Encounter to Pokémon Sun and Moon too (Leg 20)', () => {
    expect(metLocationsForGame('Pokémon Sun')).toContain('Fateful Encounter')
    expect(metLocationsForGame('Pokémon Moon')).toContain('Fateful Encounter')
  })
})
