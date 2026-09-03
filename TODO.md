# TODO

## [Origin auto-populate from Trainer Profile edits] — unscheduled
Vanny wants a Collection Entry's origin info to auto-update when its source Trainer
Profile is edited later. This runs directly against Leg 4's deliberate design (origin
data is copied once at pick-time and then edited independently, intentionally never
re-synced — see COMPLETED.md's Leg 4 entry) — implementing this either reverses that
decision or needs a separate "sync back" action distinct from the current one-time copy.
Blocked: needs Vanny's explicit call on which direction to take before this can be
scoped into a leg.
Last touched: 2026-09-02. Re-check count: 0.

## [App icon] — unscheduled
No custom icon exists yet (`build/icon.png` per electron-builder convention, matching
GW2-Squaded) — packaged builds currently ship with Electron's default icon. Not blocking
local/internal packaging, so left off the leg sequence. Confirmed 2026-09-02: stays
unscheduled and outside any milestone grouping — Vanny will submit the artwork when it's
ready rather than this being scoped into a leg.
Blocked: needs production-quality PokéBall-or-similar artwork before a real public
release.
Last touched: 2026-09-02. Re-check count: 0.

## Future Milestones (post-current)

Large items Vanny explicitly flagged as out of scope for the current milestone — logged
here so they aren't lost, not queued into a leg yet.

## [Dex completeness tier migration] — future milestone
Migrating a collection from a regular living dex/shiny living dex (species-only) up to a
complete living dex/shiny living dex (form + gender included), and figuring out whether
downgrading is even possible. Upgrading needs a way to flag previously-unspecified-gender
entries with the correct gender the user actually possesses. Vanny called this out as
large and needing real scoping work before it's picked up — not for this milestone.
Last touched: 2026-09-02. Re-check count: 0.

## [Ribbons/Alpha/size/capture-date tracking] — future milestone
Ribbon tracking, with an Alpha marker bundled into the same pass since both are per-entry
badges. Size classification and capture date noted as possible additions at the same
time, capture date flagged by Vanny as very low priority. All blocked on Ribbons being
scoped first.
Last touched: 2026-09-02. Re-check count: 0.

## [Next milestone: Nav restructuring → Validation/Storage-Location sync → Dex Table redesign] — future milestone
Supersedes the earlier "UI overhaul" entry below, per a 2026-09-02 planning discussion —
split into three ordered parts so the one piece that structurally depends on new schema
doesn't get built twice:
1. **Menu/section restructuring** — split the current single cluttered page into distinct
   sections (Trainer Profiles/Storage Locations/Collection/etc). Independent of the schema
   work below, safe to do first — this is why Vanny wants UI work to lead the milestone.
2. **Per-game validation + Storage Location sync** — a foundational per-game validity
   dataset (which species/form/gender/ball combos a given game actually allows), a new
   `storageLocationId` FK on CollectionEntry, a new Met Location field (doesn't exist on
   CollectionEntry today), Legends Arceus's own ball pool (not in shared/data/poke-balls.ts
   currently), an Invalid Flag for bad combos (soft warn only, not a hard block — this
   isn't a full legality-checker app), and per-Storage-Location completion tracking.
   Held-item form-changes (Arceus Plates, Genesect Drives, Giratina's Griseous Orb,
   Zacian/Zamazenta Crowned, Silvally, etc.) are a known modeling gap, deliberately split
   into their own investigation doc rather than solved inline here.
3. **Living Dex Table redesign** — tabbed per Storage Location (using its existing `name`
   field as the tab label — no schema change needed there), plus richer per-row info
   (fields not yet decided). Built last, after part 2 lands, so the row layout is designed
   once against the full field set instead of redone when validation/storage fields show up.
Last touched: 2026-09-02. Re-check count: 0.
