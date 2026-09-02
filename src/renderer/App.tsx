import { useEffect, useState } from 'react'
import type { CollectionEntry, Form, Species } from '@shared/types/pokemon'

/**
 * Proof-of-pipeline screen for the scaffold leg: confirms DB seeding + IPC + renderer
 * wiring works end-to-end. This is NOT the real spreadsheet-style Living Dex UI — that's
 * its own later leg (see TODO.md) once form data is accurately categorized.
 */
export function App(): JSX.Element {
  const [species, setSpecies] = useState<Species[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [entries, setEntries] = useState<CollectionEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([window.premierDex.listSpecies(), window.premierDex.listForms(), window.premierDex.listCollectionEntries()])
      .then(([speciesList, formList, entryList]) => {
        setSpecies(speciesList)
        setForms(formList)
        setEntries(entryList)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p>Loading…</p>
  }

  return (
    <main>
      <h1>PremierDex</h1>
      <p>
        Loaded {species.length} species / {forms.length} forms / {entries.length} collection entries.
      </p>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Gen</th>
          </tr>
        </thead>
        <tbody>
          {species.slice(0, 10).map((s) => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.name}</td>
              <td>{s.generation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
