import { useEffect, useMemo, useState } from 'react'
import type { CollectionEntry, Form, Species } from '@shared/types/pokemon'
import { buildDexSections } from './dex/buildDexSections'
import { DexTable } from './dex/DexTable'
import { DexToolbar } from './dex/DexToolbar'
import type { DexOptions } from './dex/types'

const DEFAULT_OPTIONS: DexOptions = { splitGenderRows: false, regionalMode: 'inline' }

/** The v1 spreadsheet-style Living Dex grid. See TODO.md's [Spreadsheet-style Living Dex UI] item. */
export function App(): JSX.Element {
  const [species, setSpecies] = useState<Species[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [entries, setEntries] = useState<CollectionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [options, setOptions] = useState<DexOptions>(DEFAULT_OPTIONS)

  useEffect(() => {
    Promise.all([window.premierDex.listSpecies(), window.premierDex.listForms(), window.premierDex.listCollectionEntries()])
      .then(([speciesList, formList, entryList]) => {
        setSpecies(speciesList)
        setForms(formList)
        setEntries(entryList)
      })
      .finally(() => setLoading(false))
  }, [])

  const sections = useMemo(
    () => buildDexSections(species, forms, entries, options),
    [species, forms, entries, options]
  )

  const handleToggleEntry = (entryId: number, owned: boolean): void => {
    window.premierDex.setOwned(entryId, owned).then((updated) => {
      setEntries((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)))
    })
  }

  if (loading) {
    return <p>Loading…</p>
  }

  return (
    <main>
      <h1>PremierDex</h1>
      <DexToolbar options={options} onChange={setOptions} />
      <DexTable sections={sections} onToggleEntry={handleToggleEntry} />
    </main>
  )
}
