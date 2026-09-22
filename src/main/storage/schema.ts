import type Database from 'better-sqlite3'
import { LANGUAGE_LIST_SQL, RIBBON_LIST_SQL, MARK_LIST_SQL } from './schema-constants'
import {
  retrofitSpeciesColumns,
  retrofitFormsColumns,
  retrofitCollectionEntriesOriginColumns,
  retrofitColumnsAfterSidWiden,
  retrofitLateCollectionEntryColumns
} from './schema-retrofits'
import {
  rebuildTrainerProfilesNotNullTid,
  rebuildTrainerProfilesSidWiden,
  rebuildCollectionEntriesSidWiden,
  rebuildCollectionEntriesCaughtBallCheck,
  rebuildCollectionEntriesDropUnique,
  rebuildBoxPlaceholdersFormId,
  rebuildCollectionEntryRibbonsCheck,
  rebuildCollectionEntryMarksCheck
} from './schema-rebuilds'

export function applySchema(db: Database.Database): void {
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS species (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      generation INTEGER NOT NULL,
      -- User-facing override (Leg 27) on top of Leg 9's owned/shiny auto-pick: pins which
      -- form displays when this species' cosmetic-variant section is collapsed. NULL
      -- means "auto" (pickCollapsedRow's default). Forward reference to forms(id) is fine
      -- here — SQLite only resolves FK targets at enforcement time, not CREATE TABLE
      -- parse time, and forms is created immediately below.
      collapsed_display_form_id INTEGER REFERENCES forms(id),
      -- Evolution-chain membership (Leg 5 of the Dex completeness tier migration): true
      -- when this species has no further evolution (PokeAPI's evolves_to is empty for it
      -- in every chain it appears in -- see scripts/fetch-evolution-chains.ts). Drives the
      -- "Pre Evos" axis (docs/investigations/dex-completeness-tiers.md's
      -- excludePreEvolutions) that unblocks the FinalFormForm/FinalForm tiers. Defaults to
      -- 1 on a fresh row; runSeed's backfill (seed.ts) is what actually keeps this correct
      -- for every species, same "insert a default, then unconditionally re-sync" pattern
      -- as forms' home_boxable/shiny_locked/always_shiny above.
      is_final_evolution_stage INTEGER NOT NULL DEFAULT 1,
      -- Direct evolution parent (Leg 1 of the Evolution-Chain Reachability milestone), null
      -- for a chain's root -- see scripts/fetch-evolution-chains.ts. Self-referential FK,
      -- same forward-reference-is-fine reasoning as collapsed_display_form_id above (the FK
      -- target is this same table, already being created). Lets checkEntryValidity walk a
      -- species' ancestors one parent pointer at a time (Leg 2) rather than needing the
      -- full evolution tree. Same unconditional-re-sync backfill pattern as
      -- is_final_evolution_stage.
      evolves_from_species_id INTEGER REFERENCES species(id)
    );

    CREATE TABLE IF NOT EXISTS forms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      species_id INTEGER NOT NULL REFERENCES species(id),
      form_name TEXT NOT NULL,
      form_category TEXT NOT NULL CHECK (form_category IN ('dex_distinct', 'cosmetic_variant', 'non_boxable')),
      home_boxable INTEGER NOT NULL DEFAULT 1,
      shiny_locked INTEGER NOT NULL DEFAULT 0,
      always_shiny INTEGER NOT NULL DEFAULT 0,
      has_gender_difference INTEGER NOT NULL DEFAULT 0,
      first_available_generation INTEGER NOT NULL,
      regional_group TEXT,
      pokeapi_id INTEGER,
      sprite_form_suffix TEXT,
      UNIQUE(species_id, form_name)
    );
    CREATE INDEX IF NOT EXISTS idx_forms_species ON forms(species_id);

    -- No UNIQUE(form_id, gender, shiny) here (dropped Leg 2 of the Box Arrangement
    -- milestone, see TODO.md/COMPLETED.md): duplicate owned copies of the same species/
    -- form/gender/shiny combo are real tracked individuals, not a visual trick, so more
    -- than one row can legitimately share that triple. A pre-Leg-2 database that already
    -- has the constraint gets it dropped by schema-rebuilds.ts's
    -- rebuildCollectionEntriesDropUnique instead — SQLite can't ALTER a table to remove a
    -- UNIQUE constraint, same limitation as the CHECK-widen rebuilds there.
    CREATE TABLE IF NOT EXISTS collection_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_id INTEGER NOT NULL REFERENCES forms(id),
      gender TEXT NOT NULL DEFAULT 'unknown' CHECK (gender IN ('male', 'female', 'unknown')),
      shiny INTEGER NOT NULL DEFAULT 0,
      owned INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_entries_form ON collection_entries(form_id);

    -- Origin identity a Collection Entry will eventually reference (Leg 4) — standalone
    -- for now, see [Trainer Profile model] in TODO.md. tid/sid are nullable: Pokémon GO
    -- has neither, and pre-Gen-7 games never display a SID in-game, though it exists
    -- internally and can be read out with a tool like PKHex (see
    -- shared/types/trainer-profile.ts). Both ranges cover the widest any generation
    -- shows/holds — 0-999999 — rather than a tighter per-generation bound, since that
    -- depends on the game name text in a column SQLite CHECK can't cross-reference.
    CREATE TABLE IF NOT EXISTS trainer_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game TEXT NOT NULL,
      ot_name TEXT NOT NULL,
      tid INTEGER CHECK (tid IS NULL OR tid BETWEEN 0 AND 999999),
      sid INTEGER CHECK (sid IS NULL OR sid BETWEEN 0 AND 999999),
      label TEXT,
      language TEXT CHECK (language IS NULL OR language IN (${LANGUAGE_LIST_SQL}))
    );

    -- A Pokémon's current location (HOME/Bank/Box/Ranch/save-file), separate from its
    -- origin (trainer_profiles) so trades/transfers move location without touching
    -- origin. See [Storage Location model] in TODO.md. None of the five kinds have a
    -- real capturable identifier (confirmed against Bulbapedia/Project Pokémon: Bank,
    -- Box, and Ranch expose nothing usable, and HOME's only account-level ID is a social
    -- friend code, not a per-slot identity) — so identity is a plain user-provided name,
    -- not a type-specific field. save_file is the one type genuinely scoped to a specific
    -- save, so it must link to the trainer_profile whose boxes it is; the other four
    -- kinds are standalone and must NOT carry that link.
    CREATE TABLE IF NOT EXISTS storage_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_type TEXT NOT NULL CHECK (location_type IN ('home', 'bank', 'box', 'ranch', 'save_file')),
      name TEXT NOT NULL,
      trainer_profile_id INTEGER REFERENCES trainer_profiles(id),
      CHECK (
        (location_type = 'save_file' AND trainer_profile_id IS NOT NULL) OR
        (location_type != 'save_file' AND trainer_profile_id IS NULL)
      )
    );

    -- One row per real box within a Storage Location (Leg 2 of the Box View Polish &
    -- Multi-Box Editing milestone) — box *existence* is what makes a box navigable in Box
    -- view now, not "does it happen to hold >=1 real cell" (buildBoxes.ts's old rule, see
    -- its own doc comment pre-Leg-2). name is an optional user label set via "Rename
    -- box" in DexBoxGrid; null means unnamed, shown there as just "Box N". ON DELETE
    -- CASCADE, unlike collection_entries.storage_location_id: an entry survives its
    -- location's deletion by falling back to Unassigned, but a box has no equivalent
    -- "orphaned but kept" state worth preserving once its location is gone.
    CREATE TABLE IF NOT EXISTS boxes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      storage_location_id INTEGER NOT NULL REFERENCES storage_locations(id) ON DELETE CASCADE,
      box_number INTEGER NOT NULL CHECK (box_number >= 1),
      name TEXT,
      UNIQUE(storage_location_id, box_number)
    );
    CREATE INDEX IF NOT EXISTS idx_boxes_location ON boxes(storage_location_id);

    -- "Planned" placeholders (Leg 5 of the Box View Polish & Multi-Box Editing milestone) —
    -- a user's intent to eventually put some form/gender/color in a given empty slot, set
    -- either by right-clicking an empty Box view slot (species-only picker, resolved to a
    -- canonical form/gender) or, since Leg 2 of the Dex completeness tier migration,
    -- auto-stamped by applying a Box Template. Deliberately its own table rather than a
    -- special CollectionEntry (owned = 0 already means "not yet owned" and is real
    -- inventory-shaped: it carries individual-identity fields that mean nothing for a bare
    -- intent, and it would count toward completion stats and the tray's unboxed list, which
    -- a placeholder must never do). form_id/gender/shiny (species_id only through Leg 5;
    -- widened by Leg 2 of the Dex completeness tier migration — see shared/types/box.ts's
    -- BoxPlaceholder doc comment for why a bare species can't represent a tier's required
    -- units). box_number/box_slot (not a boxes(id) FK) mirrors collection_entries' own box
    -- position columns for the same reason: a placeholder is scoped to a location's
    -- numbered box, not the boxes row's identity. Same ON DELETE CASCADE as boxes above —
    -- a placeholder has no "orphaned but kept" state worth preserving once its location is
    -- gone, same reasoning as that table's own comment. The UNIQUE index is what makes "one
    -- placeholder per slot" a DB-level invariant; sqlite-storage.ts's setBoxPlaceholder
    -- additionally refuses to place one on a slot a real CollectionEntry already occupies,
    -- and setEntryBoxPosition/fillBoxSlots clear any placeholder sitting in a slot a real
    -- entry is moved into, so a slot is never both a real cell and a "planned" one at once.
    CREATE TABLE IF NOT EXISTS box_placeholders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      storage_location_id INTEGER NOT NULL REFERENCES storage_locations(id) ON DELETE CASCADE,
      box_number INTEGER NOT NULL CHECK (box_number >= 1),
      box_slot INTEGER NOT NULL CHECK (box_slot BETWEEN 0 AND 29),
      form_id INTEGER NOT NULL REFERENCES forms(id),
      gender TEXT NOT NULL DEFAULT 'unknown' CHECK (gender IN ('male', 'female', 'unknown')),
      shiny INTEGER NOT NULL DEFAULT 0,
      UNIQUE(storage_location_id, box_number, box_slot)
    );
    CREATE INDEX IF NOT EXISTS idx_box_placeholders_location ON box_placeholders(storage_location_id);

    -- Ribbons & Marks (Leg 4 of the Ribbons/Alpha/Size/Capture-Date Tracking milestone, see
    -- docs/investigations/ribbons-alpha-size-capture-date.md) — two separate, parallel
    -- many-to-many join tables rather than a nullable column on collection_entries: a
    -- Pokemon can hold several Ribbons at once, and while a Mark is normally single-value,
    -- Partner/Gourmand/Itemfinder/Jumbo/Mini Marks can coexist with another Mark already
    -- held. ribbon_name/mark_name are CHECK-constrained TEXT (same closed-set approach as
    -- caught_ball/language/size_class) rather than a separate ribbons/marks lookup table
    -- with its own id, keeping this consistent with how every other closed-set value in this
    -- schema is represented. ON DELETE CASCADE (same as boxes/box_placeholders above): a
    -- ribbon/mark row has no meaning once its entry is gone, and seed.ts's species-exclusion
    -- DELETE FROM collection_entries should carry these away with it rather than orphaning
    -- or blocking on them. This is the first FK anything has ever targeted
    -- collection_entries(id) with — see the foreign_keys=OFF additions in
    -- schema-rebuilds.ts's legacy collection_entries rebuilds, required so a DROP TABLE
    -- collection_entries there doesn't throw FOREIGN KEY constraint failed against these
    -- rows.
    -- ribbon_name/mark_name's CHECK list is Leg 5's full curated set (see shared/data/
    -- ribbons.ts/marks.ts); schema-rebuilds.ts's rebuild block self-heals any install
    -- that created these tables back when CHECK was still Leg 4's small placeholder list.
    CREATE TABLE IF NOT EXISTS collection_entry_ribbons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id INTEGER NOT NULL REFERENCES collection_entries(id) ON DELETE CASCADE,
      ribbon_name TEXT NOT NULL CHECK (ribbon_name IN (${RIBBON_LIST_SQL})),
      UNIQUE(entry_id, ribbon_name)
    );
    CREATE INDEX IF NOT EXISTS idx_entry_ribbons_entry ON collection_entry_ribbons(entry_id);

    CREATE TABLE IF NOT EXISTS collection_entry_marks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id INTEGER NOT NULL REFERENCES collection_entries(id) ON DELETE CASCADE,
      mark_name TEXT NOT NULL CHECK (mark_name IN (${MARK_LIST_SQL})),
      UNIQUE(entry_id, mark_name)
    );
    CREATE INDEX IF NOT EXISTS idx_entry_marks_entry ON collection_entry_marks(entry_id);
  `)

  // Column retrofits (schema-retrofits.ts) and table rebuilds (schema-rebuilds.ts) run
  // interleaved in a specific order below, not grouped by module — see
  // schema-rebuilds.ts's file-level comment for the ordering hazard this preserves:
  // rebuildTrainerProfilesSidWiden/rebuildCollectionEntriesSidWiden rebuild their table
  // from a column list that predates language/caught_ball/storage_location_id/
  // box_number/box_slot, so they must run before retrofitColumnsAfterSidWiden adds those
  // columns. Reordering this silently drops that data on any install still carrying the
  // old sid CHECK.
  retrofitSpeciesColumns(db)
  retrofitFormsColumns(db)
  retrofitCollectionEntriesOriginColumns(db)
  rebuildTrainerProfilesNotNullTid(db)
  rebuildTrainerProfilesSidWiden(db)
  rebuildCollectionEntriesSidWiden(db)
  retrofitColumnsAfterSidWiden(db)
  rebuildCollectionEntriesCaughtBallCheck(db)
  rebuildCollectionEntriesDropUnique(db)
  rebuildBoxPlaceholdersFormId(db)
  retrofitLateCollectionEntryColumns(db)
  rebuildCollectionEntryRibbonsCheck(db)
  rebuildCollectionEntryMarksCheck(db)

  // Backfills `boxes` rows so every Storage Location has at least a Box 1, plus a row for
  // any box_number collection_entries already reference — covers a pre-Leg-2 install
  // (whose entries can already sit in boxes with no row for them yet, since buildBoxes.ts
  // used to derive box existence straight from entries) and collection-backup.ts's
  // importCollection, which cascade-deletes every boxes row when storage_locations gets
  // wiped-and-reinserted (see its own comment). INSERT OR IGNORE against the UNIQUE
  // (storage_location_id, box_number) index makes this safe to run unconditionally on
  // every startup, not just once.
  backfillBoxes(db)
}

export function backfillBoxes(db: Database.Database): void {
  db.exec(`
    INSERT OR IGNORE INTO boxes (storage_location_id, box_number, name)
    SELECT id, 1, NULL FROM storage_locations;

    INSERT OR IGNORE INTO boxes (storage_location_id, box_number, name)
    SELECT DISTINCT storage_location_id, box_number, NULL
    FROM collection_entries
    WHERE storage_location_id IS NOT NULL AND box_number IS NOT NULL;
  `)
}
