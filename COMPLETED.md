# COMPLETED

Legs 1-16 (Project Scaffold + Living Dex v1 milestones) archived at
`docs/completed-archive/project-scaffold.md` and `docs/completed-archive/living-dex-v1.md`.
See `MILESTONES.md` for the shipped-milestone index.

## [Trainer Profile model] — Leg 1 — 2026-09-02
Standalone `trainer_profiles` table (game, OT name, TID/SID, optional label) with full
CRUD through StorageAdapter/IPC/preload, and a basic add/edit/delete panel in the
renderer. Not yet referenced by any Collection Entry (Leg 4) or the backup export flow
(see TODO's [Trainer Profile backup export/import]). See commit `2bd2543`.

Follow-up same day: TID/SID range was wrong (Bulbapedia confirms Gen I-VI shows a
5-digit TID and never displays a SID at all; Gen VII+ shows a 6-digit TID and a 4-digit
SID) — widened the CHECK constraints and made both columns nullable, with a schema
migration for the brief pre-widen shape. Also pulled `[Origin-game list]` (was Leg 3)
forward into this leg at Vanny's call: `shared/data/origin-games.ts` lists every
mainline title, Colosseum/XD, and Pokémon GO, each flagged for whether it shows a
Trainer ID and/or Secret ID; the Game field is now a datalist-backed autocomplete
sourced from that list, and TID/SID inputs hide themselves per the matched game's flags
(GO hides both; pre-Gen-VII hides SID only). See commit `f1e0612`.
