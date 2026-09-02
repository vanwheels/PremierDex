/**
 * Core data model shared between main and renderer, per the locked v1 schema:
 * Species -> Form (FK species_id) -> CollectionEntry (FK form_id). See
 * src/main/storage/schema.ts for the SQLite table definitions these mirror.
 */

/**
 * Whether a form is its own Living Dex row (dex_distinct — e.g. Alolan Ninetales),
 * a display-only cosmetic variant of its base form (cosmetic_variant — e.g. Vivillon
 * patterns), or not boxable in HOME at all (non_boxable — e.g. some battle-only forms).
 * All forms are seeded as 'dex_distinct' placeholders until the real categorization
 * pass (see TODO.md) assigns accurate values.
 */
export type FormCategory = 'dex_distinct' | 'cosmetic_variant' | 'non_boxable'

/** Only meaningful when the owning Form's hasGenderDifference is true. */
export type Gender = 'male' | 'female' | 'unknown'

export interface Species {
  id: number // National Dex number
  name: string
  generation: number // generation introduced
}

export interface Form {
  id: number
  speciesId: number
  formName: string
  formCategory: FormCategory
  homeBoxable: boolean
  hasGenderDifference: boolean
  firstAvailableGeneration: number
  regionalGroup: string | null
  /** PokeAPI's own numeric pokemon id — the sprite CDN's file-naming key. Equal to the
   * National Dex number for base forms; an unrelated id (10001+) for alternate
   * varieties. Shared across every cosmetic sub-form of a species that packs its
   * variants as multiple pokemon-form entries under one variety (see
   * spriteFormSuffix) rather than as separate varieties. See sprites.ts. */
  pokeapiId: number
  /** Non-null only for a cosmetic sub-form sharing its pokeapiId with sibling forms
   * (e.g. Unown's letters, Vivillon's patterns, Alcremie's cream/sweet combos) — the
   * sprite CDN keys these as "{pokeapiId}-{spriteFormSuffix}.png" instead of the plain
   * "{pokeapiId}.png" every other form uses. See sprites.ts and
   * docs/investigations/home-depositability-audit.md section 3. */
  spriteFormSuffix: string | null
  /** True when no legitimate shiny of this species/form has ever existed by any means —
   * normal in-game generation or a past distribution, expired or not — as opposed to "is
   * it currently, officially still obtainable." A different axis than homeBoxable: a
   * shiny-locked Pokemon is still ownable/boxable, only its shiny variant isn't. See
   * docs/investigations/shiny-locked-audit.md for the definition's derivation and the
   * per-form sourcing. */
  shinyLocked: boolean
}

export interface CollectionEntry {
  id: number
  formId: number
  gender: Gender
  shiny: boolean
  owned: boolean
  /** Origin/nickname (Leg 4) — who caught/received this specific individual, snapshotted
   * immutably at the time it was set rather than live-joined to a Trainer Profile, so
   * later edits to that profile (or its deletion) never retroactively change this entry.
   * All six fields are independent of `owned`: they're only ever meaningful for an owned
   * entry, but nothing here enforces that at the type level — the UI gates it instead.
   * See src/shared/types/trainer-profile.ts and shared/data/origin-games.ts. */
  /** The Trainer Profile the fields below were copied from, if any — provenance only,
   * not re-validated against the profile's current values. Null if never set from a
   * profile, or if that profile was later deleted (see deleteTrainerProfile). */
  trainerProfileId: number | null
  originGame: string | null
  otName: string | null
  tid: number | null
  sid: number | null
  /** User-facing nickname for this individual Pokémon, independent of any Trainer
   * Profile. */
  nickname: string | null
}

/** Field set for setEntryOrigin — everything but the assigned id, mirroring
 * TrainerProfileInput's shape. All fields nullable: a blank game/otName clears origin
 * entirely (and forces tid/sid null), independent of nickname. */
export interface CollectionEntryOriginInput {
  trainerProfileId: number | null
  originGame: string | null
  otName: string | null
  tid: number | null
  sid: number | null
  nickname: string | null
}
