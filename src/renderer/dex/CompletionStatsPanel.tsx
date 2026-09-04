import type { CompletionBucket, CompletionCount, CompletionStats, CompletionStatsOptions, DexTier } from './completionStats'
import { applyTierToOptions, BUILDABLE_TIERS, matchingTier, TIER_LABELS } from './completionStats'

function formatPercent(count: CompletionCount): string {
  if (count.total === 0) return '—'
  return `${((count.owned / count.total) * 100).toFixed(1)}%`
}

function StatsRow({ bucket }: { bucket: CompletionBucket }): JSX.Element {
  return (
    <tr>
      <td>{bucket.label}</td>
      <td>
        {bucket.regular.owned} / {bucket.regular.total}
      </td>
      <td>{formatPercent(bucket.regular)}</td>
      <td>
        {bucket.shiny.owned} / {bucket.shiny.total}
      </td>
      <td>{formatPercent(bucket.shiny)}</td>
    </tr>
  )
}

function StatsTable({ title, rows }: { title: string; rows: CompletionBucket[] }): JSX.Element {
  return (
    <div className="completion-stats-block">
      <h3>{title}</h3>
      <table className="completion-stats-table">
        <thead>
          <tr>
            <th></th>
            <th>Non-Shiny</th>
            <th>Non-Shiny %</th>
            <th>Shiny</th>
            <th>Shiny %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((bucket) => (
            <StatsRow key={bucket.key} bucket={bucket} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface CompletionStatsPanelProps {
  stats: CompletionStats
  options: CompletionStatsOptions
  onOptionsChange: (options: CompletionStatsOptions) => void
}

/**
 * Owned%/shiny% completion dashboard (Leg 17), with toggles driving what the breakdown
 * counts (Leg 19 — see computeCompletionStats.ts for what each toggle does). Otherwise
 * presentation-only: reads the already-computed stats, writes nothing. The regional-group
 * table is omitted entirely when no regional forms exist in the data (shouldn't happen
 * post-seed, but keeps this component honest about its input rather than assuming).
 */
export function CompletionStatsPanel({ stats, options, onOptionsChange }: CompletionStatsPanelProps): JSX.Element {
  return (
    <section className="completion-stats">
      <h2>Completion</h2>
      <div className="completion-stats-toolbar">
        <label>
          Tier
          <select
            value={matchingTier(options) ?? 'custom'}
            onChange={(e) => onOptionsChange(applyTierToOptions(e.target.value as DexTier, options))}
          >
            {/* Only shown (never selectable — a plain <option> with no value the picker
             * ever sets) once the checkboxes below have drifted off every named tier, e.g.
             * a lone splitByGender toggle with includeCosmeticVariants off. Picking a tier
             * is a shortcut into a point in the same options space, not a locked mode: the
             * checkboxes stay live afterward and can drift back to "Custom" again. */}
            {matchingTier(options) === null && (
              <option value="custom" disabled>
                Custom
              </option>
            )}
            {BUILDABLE_TIERS.map((tier) => (
              <option key={tier} value={tier}>
                {TIER_LABELS[tier]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={options.includeCosmeticVariants}
            onChange={(e) => onOptionsChange({ ...options, includeCosmeticVariants: e.target.checked })}
          />
          Include cosmetic variants
        </label>
        <label>
          <input
            type="checkbox"
            checked={options.splitByGender}
            onChange={(e) => onOptionsChange({ ...options, splitByGender: e.target.checked })}
          />
          Split by gender
        </label>
        <label>
          <input
            type="checkbox"
            checked={options.foldRegionalIntoGeneration}
            onChange={(e) => onOptionsChange({ ...options, foldRegionalIntoGeneration: e.target.checked })}
          />
          Fold regional forms into generation totals
        </label>
      </div>
      <div className="completion-stats-tables">
        <StatsTable title="Overall" rows={[stats.overall]} />
        <StatsTable title="By Generation" rows={stats.byGeneration} />
        {stats.byRegionalGroup.length > 0 && <StatsTable title="By Regional Group" rows={stats.byRegionalGroup} />}
      </div>
    </section>
  )
}
