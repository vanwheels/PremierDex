import type { CollectionEntry, Form, Gender, Species } from '@shared/types/pokemon'
import type { DexOptions, DexRowData, DexSection } from './types'

const REGIONAL_LABELS: Record<string, string> = {
  alolan: 'Alolan Forms',
  galarian: 'Galarian Forms',
  hisuian: 'Hisuian Forms',
  paldean: 'Paldean Forms'
}
const REGIONAL_ORDER = ['alolan', 'galarian', 'hisuian', 'paldean']

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
  414: 'plant', // Mothim
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
  664: 'icy-snow', // Scatterbug
  665: 'icy-snow', // Spewpa
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
 * accents), so a handful of names still render imperfectly (e.g. "Farfetchd" instead of
 * "Farfetch'd", "Jangmo-O" instead of "Jangmo-o"). Logged as a follow-up in TODO.md rather
 * than fixed here — see the "Pokémon name capitalization" leg.
 */
function capitalizeWords(text: string): string {
  return text.replace(/(?:^|[\s-])[a-z]/g, (match) => match.toUpperCase())
}

function formDisplayName(speciesName: string, form: Form): string {
  const formName = form.formName === 'base' ? BASE_FORM_NAMES[form.speciesId] : form.formName
  if (!formName) return speciesName
  return `${speciesName} (${capitalizeWords(formName.replace(/-/g, ' '))})`
}

interface EntrySlot {
  regular: CollectionEntry | null
  shiny: CollectionEntry | null
}
type EntriesByGender = Map<Gender, EntrySlot>

function indexEntriesByForm(entries: CollectionEntry[]): Map<number, EntriesByGender> {
  const byForm = new Map<number, EntriesByGender>()
  for (const entry of entries) {
    let byGender = byForm.get(entry.formId)
    if (!byGender) {
      byGender = new Map()
      byForm.set(entry.formId, byGender)
    }
    let slot = byGender.get(entry.gender)
    if (!slot) {
      slot = { regular: null, shiny: null }
      byGender.set(entry.gender, slot)
    }
    if (entry.shiny) slot.shiny = entry
    else slot.regular = entry
  }
  return byForm
}

/**
 * Builds the row(s) for one form. Gender-diff forms collapse to a single row (the male
 * entry) unless splitGenderRows is on, in which case they expand to a ♂ row and a ♀ row.
 * Forms without a gender difference always seed only 'unknown'-gender entries.
 */
function buildRows(
  speciesName: string,
  dexNumber: number,
  form: Form,
  entriesByGender: EntriesByGender | undefined,
  splitGenderRows: boolean
): DexRowData[] {
  const baseName = formDisplayName(speciesName, form)

  const rowFor = (gender: Gender, suffix: string): DexRowData => {
    const slot = entriesByGender?.get(gender)
    return {
      key: `${form.id}-${gender}`,
      formId: form.id,
      dexNumber,
      displayName: suffix ? `${baseName} ${suffix}` : baseName,
      regular: slot?.regular ?? null,
      shinyEntry: slot?.shiny ?? null,
      pokeapiId: form.pokeapiId,
      spriteFormSuffix: form.spriteFormSuffix,
      firstAvailableGeneration: form.firstAvailableGeneration,
      homeBoxable: form.homeBoxable,
      shinyLocked: form.shinyLocked
    }
  }

  if (!form.hasGenderDifference) return [rowFor('unknown', '')]
  if (!splitGenderRows) return [rowFor('male', '')]
  return [rowFor('male', '♂'), rowFor('female', '♀')]
}

/**
 * Shapes species/forms/collection-entries into display sections per the current toggle
 * options. Toggles only affect this view-model — never the stored data. non_boxable
 * forms (Mega/Gmax/battle-only, etc.) are never collectible and are filtered out here.
 */
export function buildDexSections(
  species: Species[],
  forms: Form[],
  entries: CollectionEntry[],
  options: DexOptions
): DexSection[] {
  const entriesByForm = indexEntriesByForm(entries)
  const formsBySpecies = new Map<number, Form[]>()
  for (const form of forms) {
    if (form.formCategory === 'non_boxable') continue
    const list = formsBySpecies.get(form.speciesId)
    if (list) list.push(form)
    else formsBySpecies.set(form.speciesId, [form])
  }

  const sections: DexSection[] = []
  const regionalBuckets = new Map<string, DexRowData[]>()

  for (const sp of species) {
    const speciesName = capitalizeWords(sp.name)
    const speciesForms = formsBySpecies.get(sp.id) ?? []
    const rows: DexRowData[] = []
    const cosmeticRows: DexRowData[] = []

    for (const form of speciesForms) {
      const entriesByGender = entriesByForm.get(form.id)
      const rowsForForm = buildRows(speciesName, sp.id, form, entriesByGender, options.splitGenderRows)

      if (form.formCategory === 'cosmetic_variant') {
        cosmeticRows.push(...rowsForForm)
        continue
      }

      // dex_distinct
      if (form.regionalGroup !== null && options.regionalMode === 'grouped') {
        const bucket = regionalBuckets.get(form.regionalGroup) ?? []
        bucket.push(...rowsForForm)
        regionalBuckets.set(form.regionalGroup, bucket)
      } else {
        rows.push(...rowsForForm)
      }
    }

    sections.push({ key: `species-${sp.id}`, heading: speciesName, speciesId: sp.id, rows, cosmeticRows })
  }

  if (options.regionalMode === 'grouped') {
    for (const group of REGIONAL_ORDER) {
      const rows = regionalBuckets.get(group)
      if (!rows || rows.length === 0) continue
      sections.push({
        key: `regional-${group}`,
        heading: REGIONAL_LABELS[group] ?? group,
        speciesId: null,
        rows,
        cosmeticRows: []
      })
    }
  }

  return sections
}

/**
 * Picks which row represents a foldable species (one with cosmetic variants — Unown,
 * Maushold, etc.) when its section is collapsed: the first candidate, checking `rows[0]`
 * then `cosmeticRows` in list order, that has an owned regular or shiny entry — or
 * `rows[0]` itself if none are checked off. Only meaningful when the species actually has
 * cosmetic rows; DexTable is the only caller, and only for the row slot carrying the
 * expand toggle (rows[0]) — any further dex_distinct rows in the section (e.g. Floette's
 * Eternal Flower) render as-is regardless of collapse state.
 */
export function pickCollapsedRow(rows: DexRowData[], cosmeticRows: DexRowData[]): DexRowData {
  const candidates = [rows[0], ...cosmeticRows]
  return candidates.find((row) => row.regular?.owned || row.shinyEntry?.owned) ?? rows[0]
}
