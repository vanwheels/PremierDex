# TODO

No milestone currently in progress — Box View Polish & Multi-Box Editing shipped
2026-09-04 (see MILESTONES.md/COMPLETED.md). Pick the next one from Unscheduled or Future
Milestones below, or scope a new one.

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

### [Box names/empty boxes/placeholders missing from JSON backup export/import] — unscheduled
Surfaced while implementing [Add / rename boxes] (Leg 2 of Box View Polish, see
COMPLETED.md): the `boxes` table (id/storage_location_id/box_number/name) isn't part of
CollectionExport, so a backup round-trip silently drops every box's custom name and any
box with zero entries in it — same class of gap Leg 13 of Collection & Origin Tracking
fixed for trainerProfiles/storageLocations. Import itself is safe (collection-backup.ts's
importCollection re-runs schema.ts's backfillBoxes after restoring entries, so Box view
stays functional — no crash, no missing Box 1), it just can't restore a name or an
intentionally-empty box the export never captured. Widened at Leg 5 of Box View Polish
(see COMPLETED.md): the new `box_placeholders` table (storage_location_id/box_number/
box_slot/species_id) has the exact same gap — a backup round-trip silently drops every
"planned" placeholder too, same reasoning, same missing table. Needs a CollectionExport
version bump (v2 -> v3, same "reject the old version outright" precedent as v1->v2) plus
`boxes` and `boxPlaceholders` arrays in the export/import shape — worth fixing together
since both are the same underlying "a Box View Polish milestone table never got added to
CollectionExport" gap.
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
box_number/box_slot retrofit, 466 after Leg 2 of Box View Polish added the `boxes` table +
backfillBoxes, now 492 after that same milestone's Leg 5 added `box_placeholders` — one
line under the 500 hard cap, and past the "~480 lines, pick up proactively" line named
below. Each closed-set CHECK column (language, caught_ball) has picked up its own
"ALTER-time CHECK can't be widened later" rebuild block over time, and that pattern will
likely repeat if another CHECK-constrained column needs the same treatment. Candidate
split: pull the CHECK-widen rebuild blocks (sid-4294, caught_ball) into their own module
alongside the retrofit ALTERs, mirroring how sqlite-storage.ts's export/import logic got
split into collection-backup.ts (Leg 3 of Box Arrangement — see COMPLETED.md).
Confirmed 2026-09-03: deliberately kept out of the User-Customizable Dex Layout milestone
— orthogonal code health, not blocking. The "pick up proactively past ~480 lines" line
from that confirmation has now been crossed (Box View Polish's Leg 5, 2026-09-04) without
a leg of its own — flagged in that milestone's post-mortem rather than actioned inline,
since the split itself was orthogonal to what that leg needed. Should be picked up before,
or as part of, whichever future leg next adds a table or retrofit block here.
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
queued behind the then-current milestone despite the urgency; that milestone (Box View
Polish & Multi-Box Editing) has since shipped 2026-09-04, so nothing is queued ahead of
this any more — worth a fresh call on whether it's picked up next given the urgency.
Last touched: 2026-09-04. Re-check count: 1.
</content>
