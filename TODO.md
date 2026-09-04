# TODO

## Current Milestone: Box View Polish & Multi-Box Editing

Vanny's design pass on Box view after Leg 6/7 landed (2026-09-03) — a batch of feedback
plus four design decisions confirmed via AskUserQuestion (adjacent box = full interactive
second grid; phantom Pokémon = persisted placeholder, not local-only; multi-drag = drop
target fills contiguously in selection order, blocked if any needed slot is occupied by
something outside the selection; box add/rename = new per-location schema is in scope).

### [Multi-select + multi-drag] — Leg 4
Shift-click selects a contiguous range from the first selected index to the second;
ctrl-click toggles individual cells into/out of the selection. Dragging a multi-selection
carries all selected entry ids (payload rework — today's dragEntryPayload.ts carries a
single id); dropping fills slots contiguously starting at the drop target, in the
selection's original order, and is rejected outright if any needed slot is already
occupied by something not in the dragged selection. Most useful once Leg 3's second box
exists (cross-box drags), but the selection/payload rework itself doesn't need it.
Last touched: 2026-09-03. Re-check count: 0.

### [Phantom placeholder Pokémon] — Leg 5
Right-click an empty slot to pick a species and mark that slot as a persisted "planned"
placeholder — saved to the DB as its own concept distinct from real owned/unowned
CollectionEntry rows (so it survives reload and never counts toward real collection
totals). Renders dimmed/marked-as-planned. Needs its own small schema (species id per
box slot, no gender/shiny/individual data — it's just "I intend to put something of this
species here").
Last touched: 2026-09-03. Re-check count: 0.

## Unscheduled

Standalone items not part of the current milestone — pick up opportunistically or when
explicitly prioritized.

### [Regional dex number in Box detail panel] — unscheduled
Raised alongside the Box View Polish milestone but out of scope for it: Species currently
only carries `regionalGroup` (a label), no actual per-game regional dex *number* — that
field doesn't exist in the data model at all yet. Needs its own scoping (which
game/region's numbering, one column vs. per-game) before it can be added to the info bar
alongside National Dex #.
Last touched: 2026-09-03. Re-check count: 0.

### [Bulk move/duplicate entries between storage locations] — unscheduled
Raised by Vanny 2026-09-03 while scoping the Unassigned-backfill fix (Leg 6): a way to
move or duplicate a batch of entries from one storage location to another (not just the
existing per-row picker) would help now that the 0->1 location auto-backfill only ever
fires once. Not scoped or designed — just a decent-feature idea, not urgent.
Last touched: 2026-09-03. Re-check count: 0.

### [Box names/empty boxes missing from JSON backup export/import] — unscheduled
Surfaced while implementing [Add / rename boxes] (Leg 2 of Box View Polish, see
COMPLETED.md): the new `boxes` table (id/storage_location_id/box_number/name) isn't part
of CollectionExport, so a backup round-trip silently drops every box's custom name and
any box with zero entries in it — same class of gap Leg 13 of Collection & Origin Tracking
fixed for trainerProfiles/storageLocations. Import itself is safe (collection-backup.ts's
importCollection re-runs schema.ts's backfillBoxes after restoring entries, so Box view
stays functional — no crash, no missing Box 1), it just can't restore a name or an
intentionally-empty box the export never captured. Needs a CollectionExport version bump
(v2 -> v3, same "reject the old version outright" precedent as v1->v2) plus a `boxes`
array in the export/import shape.
Last touched: 2026-09-04. Re-check count: 0.

### [App icon] — unscheduled
No custom icon exists yet (`build/icon.png` per electron-builder convention, matching
GW2-Squaded) — packaged builds currently ship with Electron's default icon. Not blocking
local/internal packaging, so left off the leg sequence. Confirmed 2026-09-02: stays
unscheduled and outside any milestone grouping — Vanny will submit the artwork when it's
ready rather than this being scoped into a leg.
Blocked: needs production-quality PokéBall-or-similar artwork before a real public
release.
Last touched: 2026-09-02. Re-check count: 0.

### [Virtualize the Dex Table body] — unscheduled
Leg 2 (2026-09-03) fixed the worst of the resize/tab-switch lag (memoized data pipeline
was already fine; the real costs were a full unmount/remount on tab switch and
table-layout: auto forcing per-row remeasurement on resize) — see COMPLETED.md. A smaller
residual delay remains on both, inherent to keeping ~1000+ real DOM rows around: resize
still reflows row heights when column-width changes affect text wrapping, and un-hiding
the table on tab switch still costs a browser layout+paint pass over every row even
though React no longer rebuilds them. Fully eliminating either needs windowing (only
~20-40 rows in the DOM at once), which was set aside during Leg 2 as too large a lift for
that leg — would need reworking how expand/collapse and cosmetic rows work under a
virtualizer, plus sticky-header handling.
Confirmed 2026-09-03: Vanny finds the post-Leg-2 delay acceptable for now — pick this up
only if it becomes a real problem, not proactively.
Last touched: 2026-09-03. Re-check count: 0.

### [Split schema.ts] — unscheduled
Crossed the ~300-line soft cap at Leg 5 (341 lines), 421 after Leg 3 of Box Arrangement's
box_number/box_slot retrofit, now 466 after this milestone's Leg 2 added the `boxes` table
+ backfillBoxes — still under the 500 hard cap, but the margin is shrinking each time a
storage-shaped leg touches this file. Each closed-set CHECK column (language, caught_ball)
has picked up its own "ALTER-time CHECK can't be widened later" rebuild block over time,
and that pattern will likely repeat if another CHECK-constrained column needs the same
treatment. Candidate split: pull the CHECK-widen rebuild blocks (sid-4294, caught_ball)
into their own module alongside the retrofit ALTERs, mirroring how sqlite-storage.ts's
export/import logic got split into collection-backup.ts (Leg 3 of Box Arrangement — see
COMPLETED.md).
Confirmed 2026-09-03: deliberately kept out of the User-Customizable Dex Layout milestone
— orthogonal code health, not blocking. Stays standalone; pick up opportunistically if a
future leg touches this file again, or proactively if it crosses ~480 lines first.
Last touched: 2026-09-04. Re-check count: 0.

## Future Milestones (unscheduled)

Large items Vanny explicitly flagged as out of scope for a past milestone — logged here
so they aren't lost, not queued into a leg yet.

### [Dex completeness tier migration] — future milestone
Migrating a collection from a regular living dex/shiny living dex (species-only) up to a
complete living dex/shiny living dex (form + gender included), and figuring out whether
downgrading is even possible. Upgrading needs a way to flag previously-unspecified-gender
entries with the correct gender the user actually possesses. Vanny called this out as
large and needing real scoping work before it's picked up — not for this milestone.
Last touched: 2026-09-02. Re-check count: 0.

### [Ribbons/Alpha/size/capture-date tracking] — future milestone
Ribbon tracking, with an Alpha marker bundled into the same pass since both are per-entry
badges. Size classification and capture date noted as possible additions at the same
time, capture date flagged by Vanny as very low priority. All blocked on Ribbons being
scoped first.
Last touched: 2026-09-02. Re-check count: 0.

### [Deeper per-game validity: form/gender legality + curated Met Location list] — future milestone
Split out of a past milestone during its 2026-09-02 leg-planning pass: the initial
validity dataset only covers species-availability-per-game + Legends Arceus's ball pool,
and Met Location ships as free text — both deliberately narrowed so that milestone's legs
stayed small. This item covers the fuller versions: per-game form/gender/ball-combo
legality (beyond just ball pool), and a curated real-locations-per-game dataset
(routes/cities/areas) to replace the free-text Met Location field. Needs its own scoping
before being picked up, same as Ribbons/Dex-tier above.
Confirmed 2026-09-03 via real usage: this is no longer just a "nice to have deeper"
enhancement — a large chunk of Vanny's Unassigned entries are showing false-positive
Invalid Combo badges. Root cause (read in invalidCombo.ts): the species-availability
dataset only encodes each game's base regional dex, so it doesn't account for (a)
postgame unlocks that expand the catchable pool past the base dex, or (b) a species being
reachable by evolving a catchable pre-evolution even when the evolved form itself isn't in
the wild encounter table (e.g. Ivysaur logged as Ultra Moon origin — not directly
catchable there, but reachable by evolving a caught Bulbasaur). Both are obtainability
gaps in the current data model, not edge cases. Vanny confirmed 2026-09-03 this stays
queued behind the current milestone despite the urgency.
Last touched: 2026-09-03. Re-check count: 0.
</content>
