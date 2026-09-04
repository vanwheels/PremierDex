import type { CollectionEntry, Form, Gender, Species } from '@shared/types/pokemon'
import { formDisplayName, speciesDisplayName } from './formNames'
import type { Box, BoxCell, EntryDisplayInfo, UnboxedEntry } from './types'

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
  return { ...buildEntryDisplayInfo(entry, species, form), boxNumber, slot }
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
 * Box 1 always appears even with zero placed entries (Vanny's call, 2026-09-03) so the
 * grid layout is visible/testable ahead of Leg 7's editing UI actually placing anything.
 * Only boxes with at least one real cell otherwise appear — box_number has no "how many
 * boxes does this location have" bound in the data model, so paginating every integer
 * between the lowest and highest used number would show long runs of boxes nobody placed
 * anything in.
 */
export function buildBoxes(species: Species[], forms: Form[], entries: CollectionEntry[]): Box[] {
  const speciesById = new Map(species.map((s) => [s.id, s]))
  const formsById = new Map(forms.map((f) => [f.id, f]))

  const boxCells = new Map<number, (BoxCell | null)[]>()
  const boxFor = (boxNumber: number): (BoxCell | null)[] => {
    let cells = boxCells.get(boxNumber)
    if (!cells) {
      cells = new Array(BOX_SIZE).fill(null)
      boxCells.set(boxNumber, cells)
    }
    return cells
  }
  boxFor(1)

  for (const entry of entries) {
    if (entry.boxNumber === null || entry.boxSlot === null) continue
    if (entry.boxSlot < 0 || entry.boxSlot >= BOX_SIZE) continue
    const form = formsById.get(entry.formId)
    if (!form) continue
    const sp = speciesById.get(form.speciesId)
    if (!sp) continue

    boxFor(entry.boxNumber)[entry.boxSlot] = buildCell(entry.boxNumber, entry.boxSlot, entry, sp, form)
  }

  return [...boxCells.entries()]
    .sort(([a], [b]) => a - b)
    .map(([boxNumber, cells]) => ({ boxNumber, cells }))
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
