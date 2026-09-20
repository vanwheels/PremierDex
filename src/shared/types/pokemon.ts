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
  /** User-facing override (Leg 27) on top of Leg 9's pickCollapsedRow auto-pick: pins a
   * specific form (by Form.id, from among the species' collapse-slot candidates — the
   * dex_distinct base row plus its cosmetic_variant rows) to display when the species'
   * section is collapsed. Null means "auto" — fall back to the owned/shiny-based pick.
   * Sticks even if the picked form's owned/shiny status later changes; only an explicit
   * "Auto" reselect clears it back to null. */
  collapsedDisplayFormId: number | null
  /** Whether this species is the end of its evolutionary line — no further species it
   * evolves into (PokeAPI /evolution-chain data, see scripts/fetch-evolution-chains.ts).
   * Drives the "Pre Evos" axis (docs/investigations/dex-completeness-tiers.md's
   * excludePreEvolutions): a species is a pre-evolution exactly when this is false. */
  isFinalEvolutionStage: boolean
  /** This species' direct evolution parent (PokeAPI /evolution-chain data, same source as
   * isFinalEvolutionStage), or null for a chain's root. Lets a consumer walk a species'
   * ancestors one parent pointer at a time — see checkEntryValidity's ancestor-reachability
   * check (Leg 2 of the Evolution-Chain Reachability milestone). */
  evolvesFromSpeciesId: number | null
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
  /** True when a form has never legitimately existed as non-shiny — the opposite axis
   * from shinyLocked (which means "never shiny"). E.g. Spiky-Eared Pichu, whose National
   * Park encounter is always the golden coloring — see TODO.md's "Spiky-Eared Pichu: HOME
   * deposit + always-shiny flags" leg. Distinct from homeBoxable: an always-shiny form
   * can still be non-boxable, or vice versa (Spiky-Eared Pichu happens to be both). */
  alwaysShiny: boolean
}

export interface CollectionEntry {
  id: number
  formId: number
  gender: Gender
  shiny: boolean
  owned: boolean
  /** Origin/nickname (Leg 4) — who caught/received this specific individual. All eight
   * fields below are independent of `owned`: they're only ever meaningful for an owned
   * entry, but nothing here enforces that at the type level — the UI gates it instead.
   * See src/shared/types/trainer-profile.ts and shared/data/origin-games.ts. */
  /** The Trainer Profile originGame/otName/tid/sid/language below are linked to, if any.
   * While linked, those five fields live-mirror the profile — editing and saving the
   * profile updates every entry still pointing at it (Leg 31; reverses Leg 4's original
   * one-time-copy design, see COMPLETED.md). Null if never linked, or if that profile was
   * later deleted (see deleteTrainerProfile), in which case the fields freeze at their
   * last-synced values and become independently editable again. nickname/caughtBall are
   * never tied to a profile and are always independently editable. */
  trainerProfileId: number | null
  originGame: string | null
  otName: string | null
  tid: number | null
  sid: number | null
  /** In-game language flag (Leg 14) — one of shared/data/languages.ts's
   * ORIGIN_LANGUAGES, snapshotted the same way as the other origin fields. */
  language: string | null
  /** User-facing nickname for this individual Pokémon, independent of any Trainer
   * Profile. */
  nickname: string | null
  /** Which Poké Ball this individual was caught in (Leg 28) — one of shared/data/
   * poke-balls.ts's POKE_BALLS, edited alongside the other origin fields but not tied to
   * a Trainer Profile (a ball is per-catch, not per-trainer, so "Copy from Trainer
   * Profile" never touches it). */
  caughtBall: string | null
  /** Free-text "where caught" (Storage Location milestone, Leg 3) — a curated
   * per-game location list is deferred (see TODO.md), so this ships as plain text.
   * Edited through OriginModal alongside the other origin fields above. */
  metLocation: string | null
  /** The Storage Location (HOME/Bank/Box/Ranch/save-file) this individual currently
   * resides in, if assigned (Leg 3) — null means unassigned. Deliberately a separate
   * axis from origin: current location moves freely across trades/transfers while
   * origin stays fixed, so this is written by its own setEntryStorageLocation setter,
   * never by setEntryOrigin. See shared/types/storage-location.ts. */
  storageLocationId: number | null
  /** Numbered sub-unit of storageLocationId this individual is boxed in (e.g. "Box 3"),
   * and its 0-based slot position within that box (Leg 3 of the Box Arrangement/Real
   * Inventory Data Model milestone — a HOME-style 30-cell grid, 5 rows x 6 columns,
   * decided ahead of Leg 6's Box view UI). Both null together (not placed in a box) or
   * both set together — enforced by sqlite-storage.ts's setEntryBoxPosition, not a DB
   * CHECK (see schema.ts). An unowned placeholder entry can occupy a box slot too, shown
   * greyed-out once Box view ships. */
  boxNumber: number | null
  boxSlot: number | null
  /** Whether `gender` above has actually been reviewed for this individual, independent of
   * which value it holds — see genderResolution.ts's own doc comment. A gender-diff form's
   * collapsed entry (splitByGender off) always writes 'male' regardless of the individual's
   * real gender, so `gender === 'male'` alone can't tell a confirmed Male from a
   * never-reviewed one; this flag is what makes "Resolve Gender Ambiguities" able to
   * actually clear an entry instead of re-flagging it forever. Set true by
   * bulkSetEntryGender whenever a gender gets written explicitly (bulk resolve, or the
   * per-row gender toggle) — never reset back to false, so re-confirming later is always
   * possible. */
  genderConfirmed: boolean
  /** Alpha Pokémon (Leg 2 of the Ribbons/Alpha/Size/Capture-Date Tracking milestone) —
   * larger, red-eyed, guaranteed-high-IV variants from Legends Arceus and Legends Z-A.
   * A plain per-individual flag, same shape as `shiny`; deliberately decoupled from the
   * separate Alpha Mark a Scarlet/Violet transfer-in can carry (see
   * docs/investigations/ribbons-alpha-size-capture-date.md) — don't try to infer one from
   * the other. */
  isAlpha: boolean
  /** Met Date (Leg 2 of the Ribbons/Alpha/Size/Capture-Date Tracking milestone) — a real
   * stored field in every mainline game since Generation III, same free-text-adjacent
   * looseness as metLocation (no per-game gating). ISO 8601 (yyyy-mm-dd) or null.
   * Display-only in the info bar, no badge. */
  captureDate: string | null
  /** Size classification (Leg 3 of the Ribbons/Alpha/Size/Capture-Date Tracking
   * milestone) — one of shared/data/size-classes.ts's SIZE_CLASSES, Scarlet/Violet's own
   * 9-tier vocabulary chosen as the shared bucket set since it's the most granular any
   * applicable game shows a player (see docs/investigations/
   * ribbons-alpha-size-capture-date.md's Leg 3 update for how each other applicable
   * game's coarser presentation maps onto it). Not game-gated, same trust-the-user-input
   * precedent as isAlpha. */
  sizeClass: string | null
}

/** Field set for setEntryOrigin — everything but the assigned id, mirroring
 * TrainerProfileInput's shape. A blank game/otName clears origin entirely (and forces
 * tid/sid/language/caughtBall/metLocation/isAlpha/captureDate/sizeClass to their empty
 * state), independent of nickname. storageLocationId is deliberately absent here — see
 * CollectionEntry's doc comment above; it's written only via setEntryStorageLocation. */
export interface CollectionEntryOriginInput {
  trainerProfileId: number | null
  originGame: string | null
  otName: string | null
  tid: number | null
  sid: number | null
  language: string | null
  nickname: string | null
  caughtBall: string | null
  metLocation: string | null
  isAlpha: boolean
  captureDate: string | null
  sizeClass: string | null
}
