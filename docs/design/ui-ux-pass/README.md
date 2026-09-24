# Full UI/UX pass — sketch context

Vanny's hand-drawn sketches for the "Full UI/UX pass on the Dex interface" milestone, plus the
decisions from the 2026-09-24 scoping discussion that the drawings alone don't show.
Leg bodies in `TODO.md` reference this folder.

## sketch-1-collection-shell.jpg (Legs 1, 2)
- Top-level tabs collapse from 4 (Living Dex, Collection, Trainer Profiles, Storage Locations)
  to 2: **Collection** and **Dex**.
- **Collection replaces today's Living Dex** (not the old Collection tab, which is removed).
- Storage Location dropdown selects the *current* storage location; the pencil beside it opens
  a popup with everything the Storage Locations tab does today.
- "Trainer Profiles" button (top right of the tab) opens a popup with everything the Trainer
  Profiles tab does today.
- Overall / By Generation / By Regional Variant boxes are today's Living Dex completion
  section, rearranged — not new functionality.
- Header "0/0" box is the palette toggle (blue diamond / purple pearl), i.e. today's
  System/Diamond/Pearl `ThemeModeToggle` restyled (Leg 2). "Settings" sits beside it.
- Everything else currently in Living Dex stays as-is for now; layout of those items is
  undecided and out of scope for Leg 1.

## sketch-2-species-page.jpg (Leg 3)
- Gen strip is Gen 1-Gen 9 (the sketch cut off at VII from spacing). Long-term it toggles all
  page info per generation/version; Leg 3 scopes it to sprites only.
- Ability slots are a variable-length list; the long dashes beside each are the description.
- Weight is cut from the app. Fields still to place: location, movesets, egg group, exp
  growth, EVs, capture rate, Base Egg Steps (new), regional dex #s, base stats.

## reference-dex-list.png (Leg 4)
Showdown/Serebii-style Pokédex list from a ROM-hack tool, the model for the new Dex tab. Its
green check / red X column is a ROM-hack availability flag — **ignore it**, the Dex tab has no
ownership concept.
