import { useMemo, useState } from 'react'
import type { CollectionEntry, Form } from '@shared/types/pokemon'
import type { BoxPlaceholder, StorageBox } from '@shared/types/box'
import { BUILDABLE_TIERS, TIER_CONFIGS, TIER_LABELS, type DexTier } from './completionStats'
import {
  buildOccupiedUnitIndex,
  buildPlaceholderKeys,
  countAvailableSlots,
  extraBoxesNeeded,
  pendingRequiredUnits,
  type DexColor
} from './boxTemplates'

interface DexApplyTemplateModalProps {
  forms: Form[]
  /** Already scoped to the target location, same convention as storageBoxes/
   * boxPlaceholders below — total-based as of Leg 6, so unlike the pre-Leg-6 modal this no
   * longer needs the collection's full, unscoped entry list. See boxTemplates.ts's
   * buildOccupiedUnitIndex. */
  entries: CollectionEntry[]
  storageBoxes: StorageBox[]
  boxPlaceholders: BoxPlaceholder[]
  onApply: (tier: DexTier, color: DexColor) => void
  onClose: () => void
}

/**
 * Tier + color picker for "Apply Template" (Leg 2 of the Dex completeness tier migration,
 * redefined total-based at Leg 6) — auto-populates the selected Storage Location's boxes
 * with ghost placeholders for `docs/investigations/dex-completeness-tiers.md`'s
 * `requiredUnits()`, minus whatever already occupies a slot in this location (a real entry
 * or an existing placeholder). Same modal chrome reuse convention as DexBoxPlaceholderModal
 * (origin-modal-*). The live preview line re-runs the same planning math DexBoxGrid's
 * actual apply handler uses, just to count rather than place — cheap even at Living Form
 * Dex's full size, and it's what tells the user what they're about to do before they
 * commit to it.
 */
export function DexApplyTemplateModal({
  forms,
  entries,
  storageBoxes,
  boxPlaceholders,
  onApply,
  onClose
}: DexApplyTemplateModalProps): JSX.Element {
  const [tier, setTier] = useState<DexTier>(BUILDABLE_TIERS[0])
  const [color, setColor] = useState<DexColor>('regular')

  const occupiedUnitIndex = useMemo(() => buildOccupiedUnitIndex(entries), [entries])
  const existingPlaceholderKeys = useMemo(() => buildPlaceholderKeys(boxPlaceholders), [boxPlaceholders])
  const occupiedSlotCount = useMemo(() => {
    let count = 0
    for (const entry of entries) {
      if (entry.boxNumber !== null && entry.boxSlot !== null) count++
    }
    return count + boxPlaceholders.length
  }, [entries, boxPlaceholders])

  const preview = useMemo(() => {
    const tierConfig = TIER_CONFIGS[tier]
    const units = pendingRequiredUnits({ tierConfig, color, forms, occupiedUnitIndex, existingPlaceholderKeys })
    const available = countAvailableSlots(storageBoxes.length, occupiedSlotCount)
    return { unitCount: units.length, extraBoxes: extraBoxesNeeded(units.length, available) }
  }, [tier, color, forms, occupiedUnitIndex, existingPlaceholderKeys, storageBoxes.length, occupiedSlotCount])

  return (
    <div className="origin-modal-backdrop" onClick={onClose}>
      <div className="origin-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="origin-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2>Apply Template</h2>
        <label className="origin-modal-field">
          Tier
          <select value={tier} onChange={(e) => setTier(e.target.value as DexTier)}>
            {BUILDABLE_TIERS.map((t) => (
              <option key={t} value={t}>
                {TIER_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="dex-apply-template-color">
          <legend>Color</legend>
          <label>
            <input type="radio" name="template-color" checked={color === 'regular'} onChange={() => setColor('regular')} />
            Regular
          </label>
          <label>
            <input type="radio" name="template-color" checked={color === 'shiny'} onChange={() => setColor('shiny')} />
            Shiny
          </label>
        </fieldset>
        <p className="dex-apply-template-preview">
          {preview.unitCount === 0
            ? 'Nothing left to place — every required unit already has a slot or placeholder here.'
            : `Places ${preview.unitCount} ghost${preview.unitCount === 1 ? '' : 's'}${
                preview.extraBoxes > 0 ? ` across ${preview.extraBoxes} new box${preview.extraBoxes === 1 ? '' : 'es'}` : ''
              }.`}
        </p>
        <div className="origin-modal-actions">
          <button type="button" onClick={() => onApply(tier, color)} disabled={preview.unitCount === 0}>
            Apply
          </button>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
