import type { CollectionEntry, Form, Gender, Species } from '@shared/types/pokemon'
import type { BoxPlaceholder, StorageBox } from '@shared/types/box'
import { formDisplayName, speciesDisplayName } from './formNames'
import type { Box, BoxCell, BoxPlaceholderCell, EntryDisplayInfo, UnboxedEntry } from './types'

/** HOME's own box dimensions (Leg 3 of this milestone decided the grid shape ahead of
 * this leg's UI) — 5 rows x 6 columns, 0-indexed slots 0-29 top-left to bottom-right. */
export const BOX_ROWS = 5
export const BOX_COLS = 6
export const BOX_SIZE = BOX_ROWS * BOX_COLS

function genderSuffix(gender: Gender): string {
  if (gender === 'male') return ' ♂'
  if (gender === 'female') return ' ♀'
  return ''
}

/** Shared by buildCell (a placed individual) and buildUnboxedEntries (Leg 7: one not yet
 * placed) — see EntryDisplayInfo's own doc comment. */
function buildEntryDisplayInfo(entry: CollectionEntry, species: Species, form: Form): EntryDisplayInfo {
  const baseName = formDisplayName(speciesDisplayName(species.name), form)
  return {
    entry,
    dexNumber: species.id,
    displayName: `${baseName}${genderSuffix(entry.gender)}${entry.shiny ? ' ✨' : ''}`,
    pokeapiId: form.pokeapiId,
    spriteFormSuffix: form.spriteFormSuffix,
    femaleSprite: entry.gender === 'female',
    homeBoxable: form.homeBoxable,
    shinyLocked: form.shinyLocked,
    alwaysShiny: form.alwaysShiny
  }
}

function buildCell(boxNumber: number, slot: number, entry: CollectionEntry, species: Species, form: Form): BoxCell {
  return { ...buildEntryDisplayInfo(entry, species, form), kind: 'entry', boxNumber, slot }
}

/** A representative form for a placeholder's sprite — there's no real Form tied to a
 * placeholder (species id only, see BoxPlaceholder's doc comment), so this picks the
 * species' first boxable form, falling back to its first form at all if every one of its
 * forms is non_boxable. `forms` is the caller's full unfiltered list (DB order: species_id
 * then id ascending, see sqlite-storage.ts's listFormsStmt), so the first match here is
 * the species' base form in the common case — same "first form in list order" convention
 * pickCollapsedRow (buildDexSections.ts) falls back to for its own display pick. */
function pickPlaceholderForm(speciesId: number, forms: Form[]): Form | undefined {
  let firstAny: Form | undefined
  for (const form of forms) {
    if (form.speciesId !== speciesId) continue
    if (!firstAny) firstAny = form
    if (form.formCategory !== 'non_boxable') return form
  }
  return firstAny
}

function buildPlaceholderCell(placeholder: BoxPlaceholder, species: Species, form: Form): BoxPlaceholderCell {
  return {
    kind: 'placeholder',
    boxNumber: placeholder.boxNumber,
    slot: placeholder.boxSlot,
    speciesId: placeholder.speciesId,
    displayName: speciesDisplayName(species.name),
    pokeapiId: form.pokeapiId,
    spriteFormSuffix: form.spriteFormSuffix
  }
}

/**
 * Shapes a location-scoped entry list into real per-box grids (Leg 6 of the Box
 * Arrangement milestone) — the per-individual counterpart to buildDexSections' per-form
 * slots, mirroring buildCollectionGroups' own species/form lookup pattern. Only entries
 * carrying both boxNumber and boxSlot (set together, see CollectionEntry's doc comment)
 * become cells; every other entry is invisible here, same as buildCollectionGroups skips
 * unowned entries for its own purpose. An unowned entry with a box position still gets a
 * cell — Box view's whole premise is real physical contents, greyed out the same way
 * Hybrid's unowned placeholders are (see DexBoxGrid).
 *
 * `boxes` (already scoped to the caller's selected location, same convention as `entries`)
 * is the actual source of which boxes exist and are navigable (Leg 2 of the Box View
 * Polish milestone) — a real persisted `boxes` row per box, not "Box 1 always shows, plus
 * anything with >=1 real cell" (this function's own pre-Leg-2 rule, back when box_number
 * had no independent existence in the data model at all). An entry naming a box_number
 * with no matching row is simply skipped, same treatment as an unresolvable form/species —
 * shouldn't happen post-migration (schema.ts's backfillBoxes covers every box_number any
 * entry already references) but isn't assumed.
 *
 * `placeholders` (Leg 5, same pre-scoping convention as `entries`/`boxes`) fills in any
 * slot real entries left null — real cells are placed first so a placeholder can never
 * clobber one even if the DB somehow disagreed (shouldn't happen, see schema.ts's
 * `box_placeholders` comment on how the write side keeps that invariant).
 */
export function buildBoxes(
  boxes: StorageBox[],
  species: Species[],
  forms: Form[],
  entries: CollectionEntry[],
  placeholders: BoxPlaceholder[]
): Box[] {
  const speciesById = new Map(species.map((s) => [s.id, s]))
  const formsById = new Map(forms.map((f) => [f.id, f]))

  const boxByNumber = new Map<number, Box>()
  for (const box of boxes) {
    boxByNumber.set(box.boxNumber, { id: box.id, boxNumber: box.boxNumber, name: box.name, cells: new Array(BOX_SIZE).fill(null) })
  }

  for (const entry of entries) {
    if (entry.boxNumber === null || entry.boxSlot === null) continue
    if (entry.boxSlot < 0 || entry.boxSlot >= BOX_SIZE) continue
    const box = boxByNumber.get(entry.boxNumber)
    if (!box) continue
    const form = formsById.get(entry.formId)
    if (!form) continue
    const sp = speciesById.get(form.speciesId)
    if (!sp) continue

    box.cells[entry.boxSlot] = buildCell(entry.boxNumber, entry.boxSlot, entry, sp, form)
  }

  for (const placeholder of placeholders) {
    if (placeholder.boxSlot < 0 || placeholder.boxSlot >= BOX_SIZE) continue
    const box = boxByNumber.get(placeholder.boxNumber)
    if (!box || box.cells[placeholder.boxSlot] !== null) continue
    const sp = speciesById.get(placeholder.speciesId)
    if (!sp) continue
    const form = pickPlaceholderForm(placeholder.speciesId, forms)
    if (!form) continue

    box.cells[placeholder.boxSlot] = buildPlaceholderCell(placeholder, sp, form)
  }

  return [...boxByNumber.values()].sort((a, b) => a.boxNumber - b.boxNumber)
}

/**
 * Entries in a location-scoped list with no box position yet (Leg 7 of the Box
 * Arrangement milestone) — DexBoxTray's drag source for placing an entry into a box.
 * Same species/form resolution as buildBoxes, and same "entries are already
 * location-scoped by the caller" assumption. Sorted dex-number-then-name, same comparator
 * convention as buildCollectionGroups.ts's row sort.
 */
export function buildUnboxedEntries(species: Species[], forms: Form[], entries: CollectionEntry[]): UnboxedEntry[] {
  const speciesById = new Map(species.map((s) => [s.id, s]))
  const formsById = new Map(forms.map((f) => [f.id, f]))

  const result: UnboxedEntry[] = []
  for (const entry of entries) {
    if (entry.boxNumber !== null) continue
    const form = formsById.get(entry.formId)
    if (!form) continue
    const sp = speciesById.get(form.speciesId)
    if (!sp) continue
    result.push(buildEntryDisplayInfo(entry, sp, form))
  }

  return result.sort((a, b) => a.dexNumber - b.dexNumber || a.displayName.localeCompare(b.displayName))
}
