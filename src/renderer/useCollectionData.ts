import { useCallback, useEffect, useRef, useState } from 'react'
import type { CollectionEntry, CollectionEntryOriginInput, Form, Gender, Species } from '@shared/types/pokemon'
import type { StorageLocation } from '@shared/types/storage-location'
import type { BoxPlaceholder, StorageBox } from '@shared/types/box'
import type { FillInPlacement, TemplatePlacement } from './dex/boxTemplates'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import type { EvolutionEdge } from '@shared/types/evolution'
import type { FormeSwitchGroup } from '@shared/types/forme-switch-groups'
import type { SpeciesDetailsData } from '@shared/types/species-details'
import type { EncounterData } from '@shared/types/encounters'
import type { TrainerProfile } from '@shared/types/trainer-profile'
import { useBoxPositionUndo } from './useBoxPositionUndo'

// Empty until loadAll's fetch resolves (App gates rendering behind `loading` until then) —
// an empty availability dataset makes the Dex view's invalid-combo check a no-op rather
// than a crash.
const EMPTY_SPECIES_AVAILABILITY: SpeciesAvailabilityData = { pokedexes: {}, entryNumbers: {}, gameToPokedexes: {} }

// Same not-loaded-yet shape as EMPTY_SPECIES_AVAILABILITY above.
const EMPTY_SPECIES_DETAILS: SpeciesDetailsData = { species: {}, forms: {}, growthRates: {}, abilities: {} }

// Same not-loaded-yet shape as EMPTY_SPECIES_DETAILS above.
const EMPTY_ENCOUNTER_DATA: EncounterData = { encounters: {}, locationAreas: [], methods: [], versions: [] }

export interface CollectionData {
  species: Species[]
  forms: Form[]
  entries: CollectionEntry[]
  storageLocations: StorageLocation[]
  boxes: StorageBox[]
  boxPlaceholders: BoxPlaceholder[]
  trainerProfiles: TrainerProfile[]
  speciesAvailability: SpeciesAvailabilityData
  /** Leg 2 of the Species detail popup + evolution family tree milestone — per-edge
   * evolution-method/regional-branch data, feeding renderer/dex/evolutionTree.ts. */
  evolutionEdges: EvolutionEdge[]
  /** Leg 8 of the Species detail popup + evolution family tree milestone — non-evolutionary
   * forme-switch group data, feeding renderer/dex/FormeSwitchGroupView.tsx. */
  formeSwitchGroups: FormeSwitchGroup[]
  /** Leg 2 of the Species database: full per-species pages milestone — per-species/per-form
   * detail data (ability descriptions, base happiness, EV yield, etc.) for the full species
   * page (Leg 3). */
  speciesDetails: SpeciesDetailsData
  /** Leg 2 of the Encounter data + Where to Find milestone — per-pokeapiId wild/snag
   * encounter data, for the species page's Where to Find section (Leg 3). */
  encounterData: EncounterData
  loading: boolean
  loadAll: () => Promise<void>
  handleImported: () => void
  refetchTrainerProfiles: () => void
  refetchEntries: () => void
  setEntryOwned: (entryId: number, owned: boolean) => void
  setEntryStorageLocation: (entryId: number, storageLocationId: number | null) => void
  setEntryOrigin: (entryId: number, input: CollectionEntryOriginInput) => void
  setEntryBoxPosition: (entryId: number, boxNumber: number | null, boxSlot: number | null) => void
  swapEntryBoxPositions: (entryIdA: number, entryIdB: number) => void
  /** Leg 2 of the Box View Move & Undo Operations milestone: reverts the most recent
   * setEntryBoxPosition/swapEntryBoxPositions call. Leg 3 extends this to also cover
   * fillBoxSlots/moveEntriesToLocation — see the undo/canUndo doc comment above their
   * implementation for the stack's shape. */
  undo: () => void
  /** Whether `undo` has anything to revert — drives the undo button's disabled state. */
  canUndo: boolean
  /** See StorageAdapter.fillBoxSlots' own doc comment. */
  fillBoxSlots: (entryIds: number[], boxNumber: number, startSlot: number) => void
  /** List view's multi-select "Move to…" — see StorageAdapter.bulkSetEntryStorageLocation's
   * own doc comment. */
  bulkMoveEntries: (entryIds: number[], storageLocationId: number | null) => void
  /** "Resolve Gender Ambiguities" (Leg 3 of the Dex completeness tier migration) — see
   * StorageAdapter.bulkSetEntryGender's own doc comment. LivingDexView's modal always
   * calls this with 'female' (the only correction it ever makes); kept general here to
   * match bulkMoveEntries' own shape. */
  bulkSetEntryGender: (entryIds: number[], gender: Gender) => void
  /** "Fill In" (Leg 7 of the Dex completeness tier migration) — see
   * StorageAdapter.fillInPlaceholders' own doc comment. */
  fillInPlaceholders: (storageLocationId: number, placements: FillInPlacement[]) => Promise<void>
  /** Cross-location move (Leg 1 of the Box View Move & Undo Operations milestone) — see
   * StorageAdapter.moveEntriesToLocation's own doc comment. */
  moveEntriesToLocation: (storageLocationId: number, placements: FillInPlacement[]) => Promise<void>
  setCollapsedDisplayForm: (speciesId: number, formId: number | null) => void
  /** "Add Box" (Leg 2 of the Box View Polish milestone) — resolves with the newly created
   * box so DexBoxGrid can jump straight to it. */
  addBox: (storageLocationId: number) => Promise<StorageBox>
  renameBox: (boxId: number, name: string | null) => void
  /** "Set placeholder…"/"Change species" (Leg 5 of the Box View Polish milestone) — set
   * doubles as create-or-change-form, see StorageAdapter.setBoxPlaceholder. */
  setBoxPlaceholder: (storageLocationId: number, boxNumber: number, boxSlot: number, formId: number, gender: Gender, shiny: boolean) => void
  /** "Apply Template" (Leg 2 of the Dex completeness tier migration) — see
   * StorageAdapter.setBoxPlaceholders' own doc comment. */
  setBoxPlaceholders: (storageLocationId: number, placements: TemplatePlacement[]) => Promise<void>
  /** "Clear placeholder". */
  clearBoxPlaceholder: (storageLocationId: number, boxNumber: number, boxSlot: number) => void
  /** "Clear Placeholders" (Leg 6 of the Dex completeness tier migration) — see
   * StorageAdapter.clearAllBoxPlaceholders' own doc comment. */
  clearAllBoxPlaceholders: (storageLocationId: number) => Promise<void>
}

/** Owns every piece of data fetched from the main process (species/forms/entries/storage
 * locations/trainer profiles/species availability) plus the CRUD operations that mutate
 * it — shared across all four top-level views (Living Dex, Collection, Trainer Profiles,
 * Storage Locations), which is why it lives above any one of them rather than inside the
 * Living Dex view. Split out of App.tsx (Leg 1 of the Box Arrangement milestone) ahead of
 * that view's third view-mode branch (Box).
 *
 * Auto-assign-on-check-in (the old handleToggleEntry) is deliberately NOT here: it composes
 * setEntryOwned with setEntryStorageLocation based on the Living Dex view's selected
 * location tab, which is that view's own state, not data. See LivingDexView. */
export function useCollectionData(): CollectionData {
  const [species, setSpecies] = useState<Species[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [entries, setEntries] = useState<CollectionEntry[]>([])
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([])
  const [boxes, setBoxes] = useState<StorageBox[]>([])
  const [boxPlaceholders, setBoxPlaceholdersState] = useState<BoxPlaceholder[]>([])
  const [trainerProfiles, setTrainerProfiles] = useState<TrainerProfile[]>([])
  const [speciesAvailability, setSpeciesAvailability] = useState<SpeciesAvailabilityData>(EMPTY_SPECIES_AVAILABILITY)
  const [evolutionEdges, setEvolutionEdges] = useState<EvolutionEdge[]>([])
  const [formeSwitchGroups, setFormeSwitchGroups] = useState<FormeSwitchGroup[]>([])
  const [speciesDetails, setSpeciesDetails] = useState<SpeciesDetailsData>(EMPTY_SPECIES_DETAILS)
  const [encounterData, setEncounterData] = useState<EncounterData>(EMPTY_ENCOUNTER_DATA)
  const [loading, setLoading] = useState(true)

  // Leg 2 of the Box View Move & Undo Operations milestone. Mirrors `entries` in a ref
  // (rather than reading `entries` directly) so setEntryBoxPosition/swapEntryBoxPositions
  // can stay zero-dependency useCallbacks, matching every other mutator in this file.
  const entriesRef = useRef<CollectionEntry[]>(entries)
  useEffect(() => {
    entriesRef.current = entries
  }, [entries])

  // Reused after a JSON import too, since that writes owned state straight to SQLite
  // without going through setOwned — React's copy has to be reloaded from scratch.
  const loadAll = useCallback((): Promise<void> => {
    return Promise.all([
      window.premierDex.listSpecies(),
      window.premierDex.listForms(),
      window.premierDex.listCollectionEntries(),
      window.premierDex.listStorageLocations(),
      window.premierDex.listBoxes(),
      window.premierDex.listBoxPlaceholders(),
      window.premierDex.loadSpeciesAvailability(),
      window.premierDex.loadEvolutionEdges(),
      window.premierDex.loadFormeSwitchGroups(),
      window.premierDex.loadSpeciesDetails(),
      window.premierDex.loadEncounters(),
      window.premierDex.listTrainerProfiles()
    ]).then(
      ([
        speciesList,
        formList,
        entryList,
        storageLocationList,
        boxList,
        placeholderList,
        availability,
        edges,
        formeSwitchGroupList,
        details,
        encounters,
        trainerProfileList
      ]) => {
        setSpecies(speciesList)
        setForms(formList)
        setEntries(entryList)
        setStorageLocations(storageLocationList)
        setBoxes(boxList)
        setBoxPlaceholdersState(placeholderList)
        setSpeciesAvailability(availability)
        setEvolutionEdges(edges)
        setFormeSwitchGroups(formeSwitchGroupList)
        setSpeciesDetails(details)
        setEncounterData(encounters)
        setTrainerProfiles(trainerProfileList)
      }
    )
  }, [])

  const handleImported = useCallback((): void => {
    loadAll()
  }, [loadAll])

  // Trainer Profile create/update/delete all leave this hook's own `trainerProfiles` copy
  // stale (TrainerProfilesPanel manages its own list independently) — refetched here too so
  // a save_file location's depositability gate (locationDepositability.ts) always resolves
  // against the current game. Update (live sync) and delete (orphaning) also rewrite
  // collection_entries directly at the DB layer, bypassing setEntryOrigin, so entries gets
  // refetched alongside for those two.
  const refetchTrainerProfiles = useCallback((): void => {
    window.premierDex.listTrainerProfiles().then(setTrainerProfiles)
  }, [])

  const refetchEntries = useCallback((): void => {
    window.premierDex.listCollectionEntries().then(setEntries)
    refetchTrainerProfiles()
  }, [refetchTrainerProfiles])

  useEffect(() => {
    loadAll().finally(() => setLoading(false))
  }, [loadAll])

  const setEntryOwned = useCallback((entryId: number, owned: boolean): void => {
    window.premierDex.setOwned(entryId, owned).then((updated) => {
      setEntries((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)))
    })
  }, [])

  const setEntryStorageLocation = useCallback((entryId: number, storageLocationId: number | null): void => {
    window.premierDex.setEntryStorageLocation(entryId, storageLocationId).then((updated) => {
      setEntries((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)))
    })
  }, [])

  const setEntryOrigin = useCallback((entryId: number, input: CollectionEntryOriginInput): void => {
    window.premierDex.setEntryOrigin(entryId, input).then((updated) => {
      setEntries((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)))
    })
  }, [])

  // Box-position/undo-stack slice (setEntryBoxPosition/swapEntryBoxPositions/fillBoxSlots/
  // moveEntriesToLocation/undo) split out into its own hook — Leg 4 of the Codebase
  // File-Size Cleanup milestone. See useBoxPositionUndo's own doc comment.
  const { setEntryBoxPosition, swapEntryBoxPositions, undo, canUndo, fillBoxSlots, moveEntriesToLocation } = useBoxPositionUndo(
    entriesRef,
    setEntries,
    setBoxPlaceholdersState
  )

  const bulkMoveEntries = useCallback((entryIds: number[], storageLocationId: number | null): void => {
    window.premierDex.bulkSetEntryStorageLocation(entryIds, storageLocationId).then((updated) => {
      const updatedById = new Map(updated.map((entry) => [entry.id, entry]))
      setEntries((prev) => prev.map((entry) => updatedById.get(entry.id) ?? entry))
    })
  }, [])

  const bulkSetEntryGender = useCallback((entryIds: number[], gender: Gender): void => {
    if (entryIds.length === 0) return
    window.premierDex.bulkSetEntryGender(entryIds, gender).then((updated) => {
      const updatedById = new Map(updated.map((entry) => [entry.id, entry]))
      setEntries((prev) => prev.map((entry) => updatedById.get(entry.id) ?? entry))
    })
  }, [])

  // "Fill In" (Leg 7 of the Dex completeness tier migration) — merges the moved entries
  // into local state (same updatedById pattern as bulkSetEntryGender/bulkMoveEntries
  // above). fillInPlaceholders only resolves `applied` for the placements that actually
  // landed (see its own doc comment — a placement can be skipped against stale state), so
  // which placeholders to drop locally is read back off `applied`'s entry ids rather than
  // assumed from the full `placements` list, or a still-a-ghost placeholder could get
  // dropped from local state despite surviving in the DB. `skipped` is logged rather than
  // silently dropped — added while diagnosing a report of an entry staying unboxed with no
  // visible error, so a repeat gives a concrete reason instead of another guess.
  const fillInPlaceholders = useCallback(async (storageLocationId: number, placements: FillInPlacement[]): Promise<void> => {
    if (placements.length === 0) return
    const { applied, skipped } = await window.premierDex.fillInPlaceholders(storageLocationId, placements)
    if (skipped.length > 0) {
      console.warn('Fill In: skipped placement(s)', skipped)
    }
    const updatedById = new Map(applied.map((entry) => [entry.id, entry]))
    setEntries((prev) => prev.map((entry) => updatedById.get(entry.id) ?? entry))
    const filledSlots = new Set(
      placements.filter((p) => updatedById.has(p.entryId)).map((p) => `${storageLocationId}:${p.boxNumber}:${p.boxSlot}`)
    )
    setBoxPlaceholdersState((prev) =>
      prev.filter((p) => !filledSlots.has(`${p.storageLocationId}:${p.boxNumber}:${p.boxSlot}`))
    )
  }, [])

  const setCollapsedDisplayForm = useCallback((speciesId: number, formId: number | null): void => {
    window.premierDex.setCollapsedDisplayForm(speciesId, formId).then((updated) => {
      setSpecies((prev) => prev.map((sp) => (sp.id === updated.id ? updated : sp)))
    })
  }, [])

  const addBox = useCallback((storageLocationId: number): Promise<StorageBox> => {
    return window.premierDex.addBox(storageLocationId).then((created) => {
      setBoxes((prev) => [...prev, created])
      return created
    })
  }, [])

  const renameBox = useCallback((boxId: number, name: string | null): void => {
    window.premierDex.renameBox(boxId, name).then((updated) => {
      setBoxes((prev) => prev.map((box) => (box.id === updated.id ? updated : box)))
    })
  }, [])

  // set/clearBoxPlaceholder (Leg 5 of the Box View Polish milestone) — set both creates a
  // fresh placeholder and changes an existing one's species (see StorageAdapter's own
  // doc comment), so there's no separate updatedById merge step needed: matching on
  // (storageLocationId, boxNumber, boxSlot), same identity the DB's own UNIQUE index uses,
  // covers both cases in one replace-or-append.
  const setBoxPlaceholder = useCallback(
    (storageLocationId: number, boxNumber: number, boxSlot: number, formId: number, gender: Gender, shiny: boolean): void => {
      window.premierDex.setBoxPlaceholder(storageLocationId, boxNumber, boxSlot, formId, gender, shiny).then((updated) => {
        setBoxPlaceholdersState((prev) => {
          const withoutSlot = prev.filter(
            (p) => !(p.storageLocationId === storageLocationId && p.boxNumber === boxNumber && p.boxSlot === boxSlot)
          )
          return [...withoutSlot, updated]
        })
      })
    },
    []
  )

  // Apply Template (Leg 2 of the Dex completeness tier migration) — bulk version of
  // setBoxPlaceholder above. The IPC call resolves with every placeholder now in
  // `storageLocationId` (not just the newly written ones, see StorageAdapter's own doc
  // comment), so the merge is a wholesale replace of that location's slice rather than the
  // single-set method's per-slot patch.
  const setBoxPlaceholders = useCallback(
    async (storageLocationId: number, placements: TemplatePlacement[]): Promise<void> => {
      const updated = await window.premierDex.setBoxPlaceholders(storageLocationId, placements)
      setBoxPlaceholdersState((prev) => [...prev.filter((p) => p.storageLocationId !== storageLocationId), ...updated])
    },
    []
  )

  const clearBoxPlaceholder = useCallback((storageLocationId: number, boxNumber: number, boxSlot: number): void => {
    window.premierDex.clearBoxPlaceholder(storageLocationId, boxNumber, boxSlot).then(() => {
      setBoxPlaceholdersState((prev) =>
        prev.filter((p) => !(p.storageLocationId === storageLocationId && p.boxNumber === boxNumber && p.boxSlot === boxSlot))
      )
    })
  }, [])

  // "Clear Placeholders" (Leg 6 of the Dex completeness tier migration) — bulk counterpart
  // to clearBoxPlaceholder above: drops every placeholder row for one location from local
  // state in a single filter, rather than the single-slot removal above.
  const clearAllBoxPlaceholders = useCallback(async (storageLocationId: number): Promise<void> => {
    await window.premierDex.clearAllBoxPlaceholders(storageLocationId)
    setBoxPlaceholdersState((prev) => prev.filter((p) => p.storageLocationId !== storageLocationId))
  }, [])

  return {
    species,
    forms,
    entries,
    storageLocations,
    boxes,
    boxPlaceholders,
    trainerProfiles,
    speciesAvailability,
    evolutionEdges,
    formeSwitchGroups,
    speciesDetails,
    encounterData,
    loading,
    loadAll,
    handleImported,
    refetchTrainerProfiles,
    refetchEntries,
    setEntryOwned,
    setEntryStorageLocation,
    setEntryOrigin,
    setEntryBoxPosition,
    swapEntryBoxPositions,
    undo,
    canUndo,
    fillBoxSlots,
    bulkMoveEntries,
    bulkSetEntryGender,
    fillInPlaceholders,
    moveEntriesToLocation,
    setCollapsedDisplayForm,
    addBox,
    renameBox,
    setBoxPlaceholder,
    setBoxPlaceholders,
    clearBoxPlaceholder,
    clearAllBoxPlaceholders
  }
}
