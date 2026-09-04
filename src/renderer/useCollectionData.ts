import { useCallback, useEffect, useState } from 'react'
import type { CollectionEntry, CollectionEntryOriginInput, Form, Species } from '@shared/types/pokemon'
import type { StorageLocation } from '@shared/types/storage-location'
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
  setCollapsedDisplayForm: (speciesId: number, formId: number | null) => void
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
      window.premierDex.loadSpeciesAvailability(),
      window.premierDex.listTrainerProfiles()
    ]).then(([speciesList, formList, entryList, storageLocationList, availability, trainerProfileList]) => {
      setSpecies(speciesList)
      setForms(formList)
      setEntries(entryList)
      setStorageLocations(storageLocationList)
      setSpeciesAvailability(availability)
      setTrainerProfiles(trainerProfileList)
    })
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

  const setCollapsedDisplayForm = useCallback((speciesId: number, formId: number | null): void => {
    window.premierDex.setCollapsedDisplayForm(speciesId, formId).then((updated) => {
      setSpecies((prev) => prev.map((sp) => (sp.id === updated.id ? updated : sp)))
    })
  }, [])

  return {
    species,
    forms,
    entries,
    storageLocations,
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
    setCollapsedDisplayForm
  }
}
