/**
 * Returns a copy of `record` with its keys in plain code-point order, so JSON.stringify emits a
 * stable key order regardless of the order the entries were inserted. Used by the fetch scripts
 * whose maps are filled by concurrent requests (completion order varies run to run).
 * Only meaningful for non-integer keys — JS orders integer-like keys numerically on its own.
 */
export function sortRecord<T>(record: Record<string, T>): Record<string, T> {
  const sorted: Record<string, T> = {}
  for (const key of Object.keys(record).sort()) sorted[key] = record[key]
  return sorted
}
