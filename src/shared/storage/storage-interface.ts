import type { CollectionEntry, CollectionEntryOriginInput, Form, Gender, Species } from '../types/pokemon'
import type { TrainerProfile, TrainerProfileInput } from '../types/trainer-profile'
import type { StorageLocation, StorageLocationInput } from '../types/storage-location'
import type { BoxPlaceholder, StorageBox } from '../types/box'
import type { CollectionExport, CollectionImportResult } from './collection-export'

/**
 * The full local storage surface the app depends on. The renderer never talks to
 * SQLite directly — it only ever depends on this interface, reached via the
 * preload-exposed `window.premierDex` bridge (see src/preload/index.ts). Domain-specific
 * (not a generic blob Repository<T>) because Species/Form/CollectionEntry are real
 * relational reads, not opaque records.
 *
 * Methods are async even though better-sqlite3 itself is synchronous, so the interface
 * doesn't leak that implementation detail across the IPC boundary.
 *
 * exportCollection/importCollection are pure DB operations (no file I/O, no dialogs) —
 * the file-picker flow that wraps them lives in main/ipc/backup-ipc.ts instead, since
 * that's Electron-dialog orchestration, not storage.
 */
export interface StorageAdapter {
  listSpecies(): Promise<Species[]>
  listForms(): Promise<Form[]>
  listCollectionEntries(): Promise<CollectionEntry[]>
  setOwned(entryId: number, owned: boolean): Promise<CollectionEntry>
  /** Leg 27: pins (or, with formId null, clears) the form a foldable species' section
   * displays when collapsed, overriding pickCollapsedRow's auto-pick. */
  setCollapsedDisplayForm(speciesId: number, formId: number | null): Promise<Species>
  setEntryOrigin(entryId: number, input: CollectionEntryOriginInput): Promise<CollectionEntry>
  /** Separate from setEntryOrigin (Leg 3) — current location and origin are deliberately
   * different axes, see CollectionEntry's doc comment. Null clears the assignment back
   * to unassigned. */
  setEntryStorageLocation(entryId: number, storageLocationId: number | null): Promise<CollectionEntry>
  /** Places (or, with both null, removes) an entry at a box/slot position within its
   * already-assigned storage location (Leg 3 of the Box Arrangement milestone). Both
   * boxNumber/boxSlot must be null or non-null together; rejects assigning a position to
   * an entry with no storageLocationId. See CollectionEntry's doc comment. */
  setEntryBoxPosition(entryId: number, boxNumber: number | null, boxSlot: number | null): Promise<CollectionEntry>
  /** Exchanges two entries' box positions in one atomic step (Leg 7 of the Box Arrangement
   * milestone, DexBoxGrid's drag-a-cell-onto-another-cell flow) — a naive two-call
   * setEntryBoxPosition/setEntryBoxPosition sequence throws on the UNIQUE(storage_
   * location_id, box_number, box_slot) index, since the second call's target slot is
   * still occupied by the first entry's own pre-move row. Rejects if either entry has no
   * box position yet. */
  swapEntryBoxPositions(entryIdA: number, entryIdB: number): Promise<[CollectionEntry, CollectionEntry]>
  /** Places a batch of entries into a contiguous run of slots starting at `startSlot`,
   * in `entryIds` order, in one atomic step (Leg 4 of the Box View Polish milestone,
   * DexBoxPane's multi-select drag-drop flow) — same UNIQUE-index workaround as
   * swapEntryBoxPositions above, generalized to N entries instead of 2. Rejects if any
   * entry has no storageLocationId; does not itself check the target slots are free of
   * non-`entryIds` occupants or in range — DexBoxPane's own drop-target rejection covers
   * that before this is ever called, and the DB's existing box_slot/UNIQUE constraints
   * still apply as a backstop. */
  fillBoxSlots(entryIds: number[], boxNumber: number, startSlot: number): Promise<CollectionEntry[]>
  /** Bulk version of setEntryStorageLocation (List view's multi-select move) — same
   * per-entry semantics (box position always clears), just looped in one DB round trip. */
  bulkSetEntryStorageLocation(entryIds: number[], storageLocationId: number | null): Promise<CollectionEntry[]>
  /** Bulk gender correction ([Dex completeness tier migration] Leg 3's "Resolve Gender
   * Ambiguities" flow) — flips each listed entry's stored gender directly. A gender-diff
   * form's owned entry gets written under the collapsed 'male' key regardless of the
   * individual's real gender whenever splitByGender display is off (see
   * buildDexSections.ts's collapsed row), so this is how a user-confirmed correction gets
   * applied once a splitByGender tier needs to trust which physical individual is which.
   * Not tied to the (form, gender, shiny) uniqueness dropped in the Box Arrangement
   * milestone — each listed entry is corrected independently of any other row sharing its
   * old key. */
  bulkSetEntryGender(entryIds: number[], gender: Gender): Promise<CollectionEntry[]>
  /** "Fill In" (Leg 7 of the Dex completeness tier migration) — for each `placements`
   * entry (computed by boxTemplates.ts's computeFillInPlacements: one already-owned,
   * currently-unboxed individual per fillable placeholder), moves that entry into
   * `storageLocationId` at the given box position and clears whatever placeholder was
   * "planning" that slot — same real-entry-fulfills-the-plan clear setEntryBoxPosition/
   * fillBoxSlots already do. Skips (rather than aborts the whole batch on) a placement
   * whose entry no longer qualifies — same stale-state tolerance as setBoxPlaceholders —
   * but unlike that method, reports *why* each one was skipped (`not_found`/`not_owned`/
   * `already_boxed (...)`), added while diagnosing a report of an entry staying unboxed
   * with no visible error: a caller can log `skipped` to tell a real bug in what it asked
   * to fill from an ordinary stale-state race. `applied` carries every touched entry so a
   * caller can merge it into local state the same way bulkSetEntryStorageLocation/
   * bulkSetEntryGender already do. */
  fillInPlaceholders(
    storageLocationId: number,
    placements: Array<{ entryId: number; boxNumber: number; boxSlot: number }>
  ): Promise<{ applied: CollectionEntry[]; skipped: Array<{ entryId: number; reason: string }> }>
  /** Cross-location move (Leg 1 of the Box View Move & Undo Operations milestone) — backs
   * both Box view's drag-a-selection-onto-a-different-location's-pane gesture and its
   * "Move to location…" picker. Writes each listed entry's storage_location_id and box
   * position together in one step (same fillInPlaceholderEntryStmt write
   * fillInPlaceholders already uses) — a plain setEntryStorageLocation-then-
   * setEntryBoxPosition two-step doesn't work here, since the first step alone leaves the
   * entry mid-move with no box position, and the second step's own guard requires one
   * already be assigned. `placements` gives each entry's own exact destination slot rather
   * than a fillBoxSlots-style single startSlot, since the picker path can spread a
   * selection across non-contiguous free slots (possibly across more than one box) that
   * only the caller (which already computed/created room at the destination) knows about.
   * Does not itself check the target slots are free of non-`placements` occupants — same
   * contract fillBoxSlots carries; the caller's own placement-finding or drop-target
   * rejection covers that first. */
  moveEntriesToLocation(
    storageLocationId: number,
    placements: Array<{ entryId: number; boxNumber: number; boxSlot: number }>
  ): Promise<CollectionEntry[]>
  /** Undo for a batch move (Leg 3 of the Box View Move & Undo Operations milestone,
   * inverting fillBoxSlots/moveEntriesToLocation) — writes each listed entry straight back
   * to its pre-move (storageLocationId, boxNumber, boxSlot) triple, in one atomic step.
   * Unlike moveEntriesToLocation, `storageLocationId` is per-snapshot rather than one value
   * for the whole batch, since a snapshot is just "whatever this entry's own row looked
   * like before," not a caller-chosen destination — and boxNumber/boxSlot may be null
   * (restoring an entry that was unboxed, e.g. sitting in the tray, before the move). Same
   * vacate-first workaround as fillBoxSlots/swapEntryBoxPositions: a snapshot's own
   * destination slot may currently be occupied by another entry in the same batch that
   * hasn't been restored yet. */
  restoreEntryBoxPositions(
    snapshots: Array<{ entryId: number; storageLocationId: number | null; boxNumber: number | null; boxSlot: number | null }>
  ): Promise<CollectionEntry[]>
  exportCollection(): Promise<CollectionExport>
  importCollection(data: CollectionExport): Promise<CollectionImportResult>
  listTrainerProfiles(): Promise<TrainerProfile[]>
  createTrainerProfile(input: TrainerProfileInput): Promise<TrainerProfile>
  updateTrainerProfile(id: number, input: TrainerProfileInput): Promise<TrainerProfile>
  deleteTrainerProfile(id: number): Promise<void>
  listStorageLocations(): Promise<StorageLocation[]>
  createStorageLocation(input: StorageLocationInput): Promise<StorageLocation>
  updateStorageLocation(id: number, input: StorageLocationInput): Promise<StorageLocation>
  /** Storage Locations tab's "Duplicate" button — clones the location itself (name gets
   * " (Copy)" appended) plus every entry currently sitting in it, each landing unassigned
   * within the new location. Does not clone box arrangement — see TODO.md's [Clear box]
   * follow-up. Replaces the per-entry List-view duplicate from commit 74c73c9, unworkable
   * at 1025+ entries; see sqlite-storage.ts's duplicateStorageLocationTx for the rest of
   * that reasoning. */
  duplicateStorageLocation(id: number): Promise<StorageLocation>
  deleteStorageLocation(id: number): Promise<void>
  /** Every box across every Storage Location (Leg 2 of the Box View Polish milestone) —
   * a location's own boxes are filtered out of this flat list client-side, same convention
   * as listCollectionEntries. */
  listBoxes(): Promise<StorageBox[]>
  /** Creates the next-numbered, unnamed box for a Storage Location (MAX(boxNumber)+1;
   * 1 if it has none yet, though every location always has at least Box 1 in practice). */
  addBox(storageLocationId: number): Promise<StorageBox>
  /** Renames (or, with null, clears the name of) a box. */
  renameBox(boxId: number, name: string | null): Promise<StorageBox>
  /** Every "planned" placeholder across every Storage Location (Leg 5 of the Box View
   * Polish milestone) — same flat-list-filtered-client-side convention as listBoxes. */
  listBoxPlaceholders(): Promise<BoxPlaceholder[]>
  /** Sets (or, if one already exists there, changes the form/gender/color of) the
   * placeholder at a box slot. Rejects if that slot already holds a real CollectionEntry —
   * see schema.ts's `box_placeholders` table comment. */
  setBoxPlaceholder(
    storageLocationId: number,
    boxNumber: number,
    boxSlot: number,
    formId: number,
    gender: Gender,
    shiny: boolean
  ): Promise<BoxPlaceholder>
  /** Bulk version of setBoxPlaceholder (Leg 2 of the Dex completeness tier migration) —
   * applying a Box Template can stamp 1000+ placeholders in one go. Silently skips any
   * placement whose slot already holds a real entry (same guard as the single-set method,
   * just non-throwing here — see sqlite-storage.ts's own comment). Resolves with every
   * placeholder now in `storageLocationId`, not just the newly written ones, so a caller
   * can simply replace its local copy of that location's placeholders wholesale. */
  setBoxPlaceholders(
    storageLocationId: number,
    placements: Array<{ boxNumber: number; boxSlot: number; formId: number; gender: Gender; shiny: boolean }>
  ): Promise<BoxPlaceholder[]>
  /** Removes the placeholder at a box slot, if any. A no-op if that slot has none. */
  clearBoxPlaceholder(storageLocationId: number, boxNumber: number, boxSlot: number): Promise<void>
  /** "Clear Placeholders" (Leg 6 of the Dex completeness tier migration): removes every
   * placeholder in a Storage Location in one go, template-stamped and manually
   * right-click-set alike — more necessary now that Apply Template stamps a full tier
   * layout every time rather than just the pending gap. */
  clearAllBoxPlaceholders(storageLocationId: number): Promise<void>
  /** Ribbons an individual holds (Leg 4 of the Ribbons/Alpha/Size/Capture-Date Tracking
   * milestone) — a many-to-many axis, so unlike the rest of CollectionEntry's fields this
   * isn't embedded on the entry itself; fetched on demand by RibbonsMarksModal instead. See
   * shared/data/ribbons.ts for the (placeholder, pending Leg 5) name list. */
  listEntryRibbons(entryId: number): Promise<string[]>
  /** Full replace-all, same convention as setEntryOrigin's snapshot write: `ribbonNames`
   * becomes the entry's complete ribbon set, not a diff against its current one. */
  setEntryRibbons(entryId: number, ribbonNames: string[]): Promise<string[]>
  /** Marks an individual holds — same many-to-many, fetched-on-demand shape as
   * listEntryRibbons above, but the separate, parallel Marks system (see
   * docs/investigations/ribbons-alpha-size-capture-date.md for why Marks aren't a Ribbons
   * variant). See shared/data/marks.ts for the (placeholder, pending Leg 5) name list. */
  listEntryMarks(entryId: number): Promise<string[]>
  /** Full replace-all, same convention as setEntryRibbons above. */
  setEntryMarks(entryId: number, markNames: string[]): Promise<string[]>
}
