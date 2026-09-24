import type { GameEncounterSection } from './encountersFormat'
import { filterSectionsByGeneration, sectionSummary } from './encountersFormat'
import { gameColor } from './gameColors'

/**
 * SpeciesPage's Where to Find contents: one collapsible section per game (closed by default,
 * summarised as "Gold — 41 locations"), limited to the page's Gen I-IX toggle. Every game's
 * table shares the same <colgroup> widths (fixed table layout) so Method/Levels line up
 * across sections. The caller hides the whole box when `sections` is empty (no data at all
 * for this form); a generation with no encounters gets a note instead.
 */
export function WhereToFindBox({
  sections,
  generation
}: {
  sections: GameEncounterSection[]
  generation: number
}): JSX.Element {
  const visible = filterSectionsByGeneration(sections, generation)
  if (visible.length === 0) return <p>No wild encounters recorded for Generation {generation}.</p>

  return (
    <>
      {visible.map((game) => {
        const { bg, fg } = gameColor(game.gameId)
        return (
          <details key={game.label} className="species-page-encounter-game">
            <summary className="species-page-encounter-game-header" style={{ backgroundColor: bg, color: fg }}>
              {sectionSummary(game)}
            </summary>
            <table className="species-page-encounter-table">
              <colgroup>
                <col className="species-page-encounter-col-location" />
                <col className="species-page-encounter-col-method" />
                <col className="species-page-encounter-col-levels" />
                <col className="species-page-encounter-col-conditions" />
              </colgroup>
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Method</th>
                  <th>Levels</th>
                  <th>Conditions</th>
                </tr>
              </thead>
              <tbody>
                {game.locations.flatMap((loc) =>
                  loc.rows.map((row, i) => (
                    <tr key={`${loc.location}-${i}`}>
                      <td>{i === 0 ? loc.location : ''}</td>
                      <td>{row.method}</td>
                      <td>{row.levels}</td>
                      <td>{row.conditions ?? ''}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </details>
        )
      })}
    </>
  )
}
