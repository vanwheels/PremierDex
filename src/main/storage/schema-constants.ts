import { ORIGIN_LANGUAGES } from '@shared/data/languages'
import { POKE_BALLS } from '@shared/data/poke-balls'
import { SIZE_CLASSES } from '@shared/data/size-classes'
import { RIBBONS } from '@shared/data/ribbons'
import { MARKS } from '@shared/data/marks'

// Language (Leg 14) is a genuinely closed set defined by the games themselves (unlike
// `game`, which is open-ended enough to cover ROM hacks/future titles and so stays a
// plain unconstrained TEXT column) — safe to enforce with a CHECK, same as `gender`'s
// enum above. Built from ORIGIN_LANGUAGES rather than hardcoded so schema.ts and
// shared/data/languages.ts can't drift apart.
export const LANGUAGE_LIST_SQL = ORIGIN_LANGUAGES.map((l) => `'${l}'`).join(', ')

// Caught-in Poké Ball (Leg 28) — same closed-set reasoning as language above, built from
// POKE_BALLS so schema.ts and shared/data/poke-balls.ts can't drift apart. collection_entries
// only: a ball is per-catch, not per-trainer, so trainer_profiles never gets this column.
export const POKE_BALL_LIST_SQL = POKE_BALLS.map((b) => `'${b}'`).join(', ')

// Size classification (Leg 3 of the Ribbons/Alpha/Size/Capture-Date Tracking milestone) —
// same closed-set reasoning as language/caught_ball above, built from SIZE_CLASSES so
// schema.ts and shared/data/size-classes.ts can't drift apart.
export const SIZE_CLASS_LIST_SQL = SIZE_CLASSES.map((s) => `'${s}'`).join(', ')

// Ribbons & Marks (Leg 4 schema, Leg 5 curated data — Ribbons/Alpha/Size/Capture-Date
// Tracking milestone) — same closed-set reasoning as above, built from
// shared/data/ribbons.ts and shared/data/marks.ts so schema.ts can't drift from them. Leg 5
// widened both from Leg 4's small placeholder sets to the full curated lists (117
// ribbons/53 marks); the rebuild block later in this function self-heals any install
// that already created these tables against the old CHECK.
export const RIBBON_LIST_SQL = RIBBONS.map((r) => `'${r}'`).join(', ')
export const MARK_LIST_SQL = MARKS.map((m) => `'${m}'`).join(', ')
