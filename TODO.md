# TODO

## [Configurable completion stats breakdown] — Leg 19
Replace `completionStats.ts`'s single hardcoded "By Generation" breakdown with a
toggle-driven one: three independent toggles — include cosmetic variants, split by
gender, fold regional forms into generation totals (default off) — drive one computation
instead of four parallel named-tier functions. Vanny's four proposed tiers (Base Dex /
Base Form Dex / Complete Gender Dex / Complete Dex, each by generation) fall out as toggle
combinations rather than separate code paths. Regional forms are currently double-counted
— folded into both their own generation bucket (by `Form.firstAvailableGeneration`, e.g.
Alolan/Galarian Meowth land in Gen 7/8, not Gen 1 as Vanny first thought — likely a stale
packaged-build observation) and `byRegionalGroup` — the "exclude from generation totals"
toggle default fixes that; Regional stays its own always-separate section regardless of
toggle state. Possible overlap worth checking against the "Dex completeness tier
migration" future-milestone item below (regular vs. complete living dex) once this is
scoped in detail — that item is about migrating stored *ownership* data between tiers,
this one is about how the *stats display* is computed, but the tier vocabulary may end up
shared.
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
