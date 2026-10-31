# Martial follow-up choices and talent resources — October 31, 2026

Continues the user's named Moogle/Galka/Immortal martial batch. The starting
checkpoint was 6b8dd83; remote main was inspected and had no newer commits to
integrate. The unchanged baseline passed all 403 tests.

## Verified behavior

- Dancer's Mystic Dance talent now requires an additional source-listed mystic
  dance selection. Akimbo retains that entitlement through Flair Powers.
- Gunbreaker's Extra Gun Arm Mastery talent now requires its additional mastery.
  Doom Slayer cannot obtain that choice through the replaced parent feature.
- Derived slots have permanent parent-event-based IDs. They are required at the
  acquisition level; choosing the granting talent does not grant every option.
  Removing that talent in a wizard draft removes only its orphaned child slot.
- Prerequisites and repetition are checked in deterministic event order, including
  choices gained at the same level. A normal and bonus slot cannot both learn the
  same unique dance. Complex external prerequisites remain guarded.
- The actual picker retains legal repeat selections. Coordinate is limited to
  five selections, Style Feat to three. Repeatable gun-arm masteries are no longer
  artificially capped at four when an extra source-granted slot is available.
  Choosing specific style/combat feats remains manual.
- Increased Ki changes the owned Ki maximum. Akimbo's optional Ki Pool talent has
  an independent usable Wisdom-based counter; Improved Ki Pool changes that
  talent pool without replacing the base Dancer pool's Charisma basis or Flair.
- Extra Aurora and Aurora Mastery each add their source-defined daily use to
  Aurora. Resource increases preserve expenditure, and score edits recalculate
  the correct pool. No MP is granted by these talents.
- When the old passive Ki reference moves to an active resource card, its custom
  name/description and tracked expenditure are retained by permanent ID.
- Malformed choice arrays, missing/forged children and stale slot entitlements are
  rejected before save. Legacy missing follow-up choices can be recorded in the
  builder; no prior manual choice is guessed.

## Source evidence

The unchanged archived Markdown sources were reread from the sibling extractor:

- `classes/hybrid-classes/dancer/dance-talents/index.md`: Coordinate, Style Feat,
  Mystic Dance, Ki Pool, Increased Ki and Improved Ki Pool.
- `classes/hybrid-classes/dancer/archetypes/akimbo/index.md`: Flair Powers modifies
  mystic dances; Flair replaces the parent Ki pool.
- `classes/hybrid-classes/gunbreaker/gunbreaker-talents/index.md`: Extra Aurora,
  Aurora Mastery and Extra Gun Arm Mastery.
- `classes/hybrid-classes/gunbreaker/index.md`: repeatable mastery selections.

Existing source URLs/hashes and rule IDs are retained in the definitions. The
archive itself remains outside application commits.

## Validation and remaining limits

All **410 tests pass**, including seven new follow-up/resource regressions and
SQLite create → route level-up → database close/reopen checks. Missing and forged
child requests return errors without updating the saved revision. Wizard panels,
repeatable picker options, same-level duplicates, resource spending, score edits,
and manual-card migration are exercised. `npm run build:cloud` passes.

This is local fixture verification. No real Firebase login or deployment was
performed. Conditional combat effects, mounts, weapon capacity/ammunition,
external feat prerequisites, equipment subchoices and Gunsmith modifications
retain the limits recorded in `requested-martial-progression.md`. In particular,
this batch does not resolve the level 19–20 ammo-capacity input or CMD/CMB review.
