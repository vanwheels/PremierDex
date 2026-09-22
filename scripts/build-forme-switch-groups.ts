/**
 * Validates `forme-switch-groups-data.ts`'s hand-curated FORME_SWITCH_GROUPS against
 * `data/pokemon/forms.json` (every speciesId+formName pair must actually exist there — this
 * is what catches a formName typo or a stale species id, the same role
 * fetch-evolution-chains.ts's live cross-check against forms.json played for
 * evolution-edges.json) and writes the validated result to
 * data/pokemon/forme-switch-groups.json (committed static data, loaded at runtime by a
 * future leg — see TODO.md's Leg 8 of the Species Detail Popup + Evolution Family Tree
 * milestone).
 *
 * No network fetch: unlike fetch-evolution-chains.ts/fetch-pokemon-forms.ts, there's no
 * PokeAPI endpoint this data could come from (see forme-switch-groups-data.ts's module doc
 * comment) — the source of truth is the hand-curated array itself, and this script's only
 * job is to catch mistakes in it before they reach committed data.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FORME_SWITCH_GROUPS } from './forme-switch-groups-data'

interface FormsJsonRow {
  speciesId: number
  formName: string
}

function main(): void {
  const scriptDir = dirname(fileURLToPath(import.meta.url))
  const dataDir = join(scriptDir, '..', 'data', 'pokemon')
  const forms = JSON.parse(readFileSync(join(dataDir, 'forms.json'), 'utf-8')) as FormsJsonRow[]
  const knownForms = new Set(forms.map((f) => `${f.speciesId}:${f.formName}`))

  const seenSpecies = new Set<number>()
  for (const group of FORME_SWITCH_GROUPS) {
    if (seenSpecies.has(group.speciesId)) {
      throw new Error(`Duplicate speciesId ${group.speciesId} in FORME_SWITCH_GROUPS`)
    }
    seenSpecies.add(group.speciesId)

    if (group.formNames.length < 2) {
      throw new Error(`speciesId ${group.speciesId} has fewer than 2 formNames — not a switch group`)
    }
    if (group.formNames[0] !== 'base') {
      throw new Error(`speciesId ${group.speciesId}'s formNames must start with 'base', got '${group.formNames[0]}'`)
    }
    for (const formName of group.formNames) {
      const key = `${group.speciesId}:${formName}`
      if (!knownForms.has(key)) {
        throw new Error(`speciesId ${group.speciesId} formName '${formName}' not found in forms.json`)
      }
    }
  }

  const sorted = [...FORME_SWITCH_GROUPS].sort((a, b) => a.speciesId - b.speciesId)
  const outPath = join(dataDir, 'forme-switch-groups.json')
  writeFileSync(outPath, JSON.stringify(sorted, null, 2) + '\n')
  console.log(`Wrote ${sorted.length} forme-switch groups to ${outPath}`)
}

main()
