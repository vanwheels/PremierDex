# COMPLETED

Legs 1-16 (Project Scaffold + Living Dex v1 milestones) archived at
`docs/completed-archive/project-scaffold.md` and `docs/completed-archive/living-dex-v1.md`.
See `MILESTONES.md` for the shipped-milestone index.

## [Trainer Profile model] — Leg 1 — 2026-09-02
Standalone `trainer_profiles` table (game, OT name, TID/SID, optional label) with full
CRUD through StorageAdapter/IPC/preload, and a basic add/edit/delete panel in the
renderer. Not yet referenced by any Collection Entry (Leg 4) or the backup export flow
(see TODO's [Trainer Profile backup export/import]). See commit `2bd2543`.
