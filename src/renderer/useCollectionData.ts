import { useCallback, useEffect, useState } from 'react'
import type { CollectionEntry, CollectionEntryOriginInput, Form, Species } from '@shared/types/pokemon'
import type { StorageLocation } from '@shared/types/storage-location'
import type { BoxPlaceholder, StorageBox } from '@shared/types/box'
import type { SpeciesAvailabilityData } from '@shared/types/species-availability'
import type { TrainerProfile } from '@shared/types/trainer-profile'

// Empty until loadAll's fetch resolves (App gates rendering behind `loading` until then) —
// an empty availability dataset makes the Dex view's invalid-combo check a no-op rather
// than a crash.
const EMPTY_SPECIES_AVAILABILITY: SpeciesAvailabilityData = { pokedexes: {}, gameToPokedexes: {} }

export interface CollectionData {
  species: Species[]
  forms: Form[]
  entries: CollectionEntry[]
  storageLocations: StorageLocation[]
  boxes: StorageBox[]
  boxPlaceholders: BoxPlaceholder[]
  trainerProfiles: TrainerProfile[]
  speciesAvailability: SpeciesAvailabilityData
  loading: boolean
  importVersion: number
  loadAll: () => Promise<void>
  handleImported: () => void
  refetchTrainerProfiles: () => void
  refetchEntries: () => void
  setEntryOwned: (entryId: number, owned: boolean) => void
  setEntryStorageLocation: (entryId: number, storageLocationId: number | null) => void
  setEntryOrigin: (entryId: number, input: CollectionEntryOriginInput) => void
  setEntryBoxPosition: (entryId: number, boxNumber: number | null, boxSlot: number | null) => void
  swapEntryBoxPositions: (entryIdA: number, entryIdB: number) => void
  /** See StorageAdapter.fillBoxSlots' own doc comment. */
  fillBoxSlots: (entryIds: number[], boxNumber: number, startSlot: number) => void
  setCollapsedDisplayForm: (speciesId: number, formId: number | null) => void
  /** "Add Box" (Leg 2 of the Box View Polish milestone) — resolves with the newly created
   * box so DexBoxGrid can jump straight to it. */
  addBox: (storageLocationId: number) => Promise<StorageBox>
  renameBox: (boxId: number, name: string | null) => void
  /** "Set placeholder…"/"Change species" (Leg 5 of the Box View Polish milestone) — set
   * doubles as create-or-change-species, see StorageAdapter.setBoxPlaceholder. */
  setBoxPlaceholder: (storageLocationId: number, boxNumber: number, boxSlot: number, speciesId: number) => void
  /** "Clear placeholder". */
  clearBoxPlaceholder: (storageLocationId: number, boxNumber: number, boxSlot: number) => void
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
  const [boxPlaceholders, setBoxPlaceholders] = useState<BoxPlaceholder[]>([])
  const [trainerProfiles, setTrainerProfiles] = useState<TrainerProfile[]>([])
  const [speciesAvailability, setSpeciesAvailability] = useState<SpeciesAvailabilityData>(EMPTY_SPECIES_AVAILABILITY)
  const [loading, setLoading] = useState(true)
  // Bumped after a JSON import so TrainerProfilesPanel/StorageLocationsPanel remount and
  // refetch — they load their own data on mount only and have no other way to learn the DB
  // moved out from under them.
  const [importVersion, setImportVersion] = useState(0)

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
      window.premierDex.listTrainerProfiles()
    ]).then(
      ([speciesList, formList, entryList, storageLocationList, boxList, placeholderList, availability, trainerProfileList]) => {
        setSpecies(speciesList)
        setForms(formList)
        setEntries(entryList)
        setStorageLocations(storageLocationList)
        setBoxes(boxList)
        setBoxPlaceholders(placeholderList)
        setSpeciesAvailability(availability)
        setTrainerProfiles(trainerProfileList)
      }
    )
  }, [])

  const handleImported = useCallback((): void => {
    setImportVersion((v) => v + 1)
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

  const setEntryBoxPosition = useCallback((entryId: number, boxNumber: number | null, boxSlot: number | null): void => {
    window.premierDex.setEntryBoxPosition(entryId, boxNumber, boxSlot).then((updated) => {
      setEntries((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)))
      // A real entry landing on a slot clears whatever placeholder was there server-side
      // (see sqlite-storage.ts's clearBoxPlaceholderStmt) — mirror that locally so a stale
      // placeholder can't reappear from this hook's own state once the entry later moves
      // off that slot again.
      if (boxNumber !== null && boxSlot !== null && updated.storageLocationId !== null) {
        const { storageLocationId } = updated
        setBoxPlaceholders((prev) =>
          prev.filter((p) => !(p.storageLocationId === storageLocationId && p.boxNumber === boxNumber && p.boxSlot === boxSlot))
        )
      }
    })
  }, [])

  const swapEntryBoxPositions = useCallback((entryIdA: number, entryIdB: number): void => {
    window.premierDex.swapEntryBoxPositions(entryIdA, entryIdB).then(([updatedA, updatedB]) => {
      setEntries((prev) =>
        prev.map((entry) => {
          if (entry.id === updatedA.id) return updatedA
          if (entry.id === updatedB.id) return updatedB
          return entry
        })
      )
    })
  }, [])

  const fillBoxSlots = useCallback((entryIds: number[], boxNumber: number, startSlot: number): void => {
    window.premierDex.fillBoxSlots(entryIds, boxNumber, startSlot).then((updated) => {
      const updatedById = new Map(updated.map((entry) => [entry.id, entry]))
      setEntries((prev) => prev.map((entry) => updatedById.get(entry.id) ?? entry))
      // Same local mirror as setEntryBoxPosition above, one slot per filled entry.
      const clearedSlots = new Set(updated.map((entry) => `${entry.storageLocationId}:${boxNumber}:${entry.boxSlot}`))
      setBoxPlaceholders((prev) =>
        prev.filter((p) => !clearedSlots.has(`${p.storageLocationId}:${p.boxNumber}:${p.boxSlot}`))
      )
    })
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
    (storageLocationId: number, boxNumber: number, boxSlot: number, speciesId: number): void => {
      window.premierDex.setBoxPlaceholder(storageLocationId, boxNumber, boxSlot, speciesId).then((updated) => {
        setBoxPlaceholders((prev) => {
          const withoutSlot = prev.filter(
            (p) => !(p.storageLocationId === storageLocationId && p.boxNumber === boxNumber && p.boxSlot === boxSlot)
          )
          return [...withoutSlot, updated]
        })
      })
    },
    []
  )

  const clearBoxPlaceholder = useCallback((storageLocationId: number, boxNumber: number, boxSlot: number): void => {
    window.premierDex.clearBoxPlaceholder(storageLocationId, boxNumber, boxSlot).then(() => {
      setBoxPlaceholders((prev) =>
        prev.filter((p) => !(p.storageLocationId === storageLocationId && p.boxNumber === boxNumber && p.boxSlot === boxSlot))
      )
    })
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
    loading,
    importVersion,
    loadAll,
    handleImported,
    refetchTrainerProfiles,
    refetchEntries,
    setEntryOwned,
    setEntryStorageLocation,
    setEntryOrigin,
    setEntryBoxPosition,
    swapEntryBoxPositions,
    fillBoxSlots,
    setCollapsedDisplayForm,
    addBox,
    renameBox,
    setBoxPlaceholder,
    clearBoxPlaceholder
  }
}
