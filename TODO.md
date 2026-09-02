# TODO

## [Move nicknames out of Origin field] — Leg 10
Nicknames currently live inside the Origin field/modal; they should be their own column,
positioned between Name and Owned, on whatever grid(s) currently fold them into Origin.
Sequenced ahead of Leg 15 (Dex search/filter), which adds a search-by-nickname dimension
that depends on nicknames having their own field to search against.
Last touched: 2026-09-02. Re-check count: 0.

## [TID visibility when setting Pokémon origin] — Leg 11
When picking/setting a Collection Entry's origin (via Trainer Profile selection or the
per-entry Origin modal), the TID should be visible to help disambiguate between similarly
named profiles. Noted by Vanny during dev-data entry.
Last touched: 2026-09-02. Re-check count: 0.

## [Trainer Profile + Storage Location sort] — Leg 12
Trainer Profiles and Storage Locations should be sortable by game (release date order),
game (alphabetical), and OT name/Name (alphabetical). No sort control exists yet on
either panel — both just render in insertion/query order.
Last touched: 2026-09-02. Re-check count: 0.

## [Trainer Profile + Storage Location backup export/import] — Leg 13
Neither Trainer Profiles (Leg 1) nor Storage Locations (Leg 2) are included in the JSON
backup export/import flow (`collection-export.ts`) — a reinstall or a restore from
backup silently loses every profile/location the user created. Noticed while building
Leg 1, re-confirmed as the same gap while building Leg 2; deferred both times since each
leg's scope was CRUD + schema + basic UI only, and wiring it in touches the export
format/version. Now confirmed live: Leg 4 gave Collection Entries a `trainerProfileId`
FK, so a restore drops each entry's link back to its source profile (the copied
origin_game/ot_name/tid/sid/nickname snapshot itself is unaffected — only the
provenance FK dangles).
Last touched: 2026-09-02. Re-check count: 0.

## [Origin language/country field] — Leg 14
Add language/origin-country as a tracked origin attribute (Trainer Profile and/or
per-entry origin data), alongside the existing game/OT/TID/SID fields.
Last touched: 2026-09-02. Re-check count: 0.

## [Dex search/filter] — Leg 15
Search the Living Dex by name/dex#; filter by owned, shiny, regional form, generation,
and the existing badge flags (homeBoxable, shinyLocked). No dependency on the Trainer
Profile/origin work above — can be picked up independently if priorities shift.
Vanny's 2026-09-02 pass adds two more search dimensions to fold in here: search by
nickname (moved to its own field in Leg 10) and search by origin settings (origin game/
OT/TID/SID).
Last touched: 2026-09-02. Re-check count: 0.

## [Dex sort] — Leg 16
Sortable columns on the Living Dex grid (dex#, name, generation, owned/shiny status).
Independent of the origin-tracking chain.
Last touched: 2026-09-02. Re-check count: 0.

## [Completion stats dashboard] — Leg 17
Owned%/shiny% completion stats, broken down by generation and regional group. Natural
follow-on to search/filter/sort (Legs 15-16) reusing the same query surface, but not
strictly blocked on them.
Vanny's 2026-09-02 pass flags this as likely larger than currently scoped: completion
needs to be tracked per dex tier (e.g. regular living dex vs. complete/form-and-gender
living dex — see the migration item under Future Milestones below), separately for owned
and shiny. May need to split into its own leg once the tier concept exists; flagging
here rather than resizing Leg 17 unilaterally.
Last touched: 2026-09-02. Re-check count: 0.

## [Collection view by origin/OT/Shiny/Ribbon/Alpha] — Leg 18
Ability to view/group the collection by origin game, OT, and Shiny status now; Ribbon and
Alpha as later additions once those concepts exist in the schema. Broader than Leg 15's
per-entry search/filter — this is a view/grouping mode across the whole collection.
Overlaps with Leg 15 on the origin-game/OT dimensions; Ribbon/Alpha pieces are blocked on
those markers existing at all (see the Ribbons/Alpha item under Future Milestones).
Last touched: 2026-09-02. Re-check count: 0.

## [Pokémon name punctuation exceptions] — unscheduled
Leg 7 title-cases raw PokeAPI slugs (hyphens preserved as separators) at every display
site, but ~14 species have real names the slug format can't represent: apostrophes
(Farfetch'd/Sirfetch'd), periods (Mr. Mime, Mr. Rime, Mime Jr.), a colon (Type: Null),
gender symbols (Nidoran♀/♂), an accent (Flabébé), and lowercase-after-hyphen exceptions
(Jangmo-o/Hakamo-o/Kommo-o, Ho-Oh and Porygon-Z are already correct as-is). Deliberately
deferred at Vanny's call — simple title-case only, no exceptions dictionary — see
COMPLETED.md's Leg 7 entry.
Last touched: 2026-09-02. Re-check count: 0.

## [User-facing selector for collapsed foldable-species form] — unscheduled
Leg 9 shipped the checked-off-first default (falls back to list order if nothing's
checked — see COMPLETED.md). Vanny floated a stretch on top of that: let the user
explicitly pick which form displays when collapsed, overriding the automatic pick. Not
started — flagged as a stretch, not committed scope, when Leg 9 was opened.
Last touched: 2026-09-02. Re-check count: 0.

## [App icon] — unscheduled
No custom icon exists yet (`build/icon.png` per electron-builder convention, matching
GW2-Squaded) — packaged builds currently ship with Electron's default icon. Not blocking
local/internal packaging, so left off the leg sequence.
Blocked: needs production-quality PokéBall-or-similar artwork before a real public
release.
Last touched: 2026-09-01. Re-check count: 0.

## [alwaysShiny UI consumer] — unscheduled
Leg 6 added `alwaysShiny` (data layer only, per that leg's explicit "data-only fix"
framing) but nothing in the renderer reads it yet — unlike `homeBoxable`/`shinyLocked`,
which both already reach `DexRow` (a badge, and for `shinyLocked` also a disabled
checkbox). The natural consistent treatment would mirror `shinyLocked`'s but on the
opposite checkbox: disable the *regular* (non-shiny) checkbox and badge the row when
`alwaysShiny` is true, so Spiky-Eared Pichu can't be marked owned-and-not-shiny. Not done
as part of Leg 6 to keep that leg's scope to the data correction it was framed as.
Last touched: 2026-09-02. Re-check count: 0.

## [Origin auto-populate from Trainer Profile edits] — unscheduled
Vanny wants a Collection Entry's origin info to auto-update when its source Trainer
Profile is edited later. This runs directly against Leg 4's deliberate design (origin
data is copied once at pick-time and then edited independently, intentionally never
re-synced — see COMPLETED.md's Leg 4 entry) — implementing this either reverses that
decision or needs a separate "sync back" action distinct from the current one-time copy.
Blocked: needs Vanny's explicit call on which direction to take before this can be
scoped into a leg.
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

## [UI overhaul / visual upgrade milestone] — future milestone
Vanny's call: once the current milestone ships and gets its post-mortem, the next large
milestone should be a UI overhaul / visual upgrade pass rather than another feature leg.
Last touched: 2026-09-02. Re-check count: 0.
