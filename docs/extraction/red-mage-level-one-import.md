# Red Mage local first-level milestone

This chat owns classes and archetypes. Work is isolated in branch
`classes/red-mage` in `/home/phoeaung/Documents/Codex/2026-10-30/hi/work/comos-classes`.
The race chat can keep its own checkout; this branch does not modify race definitions.
Future class publication requires the user's explicit publish request here.

Source: archived Red Mage main page, Red Mage spell list and 62 individual
spell pages in the existing FFd20 cache. Main/list and individual spell hashes
are recorded in `rules/classes/red-mage.class.json` and `red-mage-spells.json`.
All 20 main progression table rows are transcribed; only level 1 is enabled.

Implemented: d8 HP, 3/4 BAB baseline, good Fortitude/Will, poor Reflex,
6 + INT skill ranks, class proficiencies, average 140 gil and starting outfit.
Effective CHA controls bonus MP and spell DC. Creation requires 2 distinct
cantrips and 3 + starting CHA modifier distinct first-level Red Mage spells.
The starting spell entitlement is frozen across later ability-score edits.
Quick Mind or Spell Combat Expertise is required; the two other Red Magery
options require level 5 and are unavailable. Saved Magery cannot be freely
replaced. Individual Dual Spellcasting and Flexibility cards share the existing
Limit Break system. Spell Proficiency is a conditional reference, not a global
Precise Shot feat. Existing manual spell notes, rows and MP expenditure survive
editing. CHA sheet edits update bonus MP without granting additional spells.

Manual/guarded: spell resolution, action economy, Spell Combat penalties,
armor/shield spell-failure exceptions, HP/MP conversion, targets and conditions.
Arcane Pool, Ruby Talents/Arcana, higher progression, archetypes, multiclassing,
scroll learning and favored rewards await further source-backed milestones.
No independent full review, real Firebase login or production publication claimed.

Validation: Node 24.22.2; 424 tests pass and build:cloud passes. Four Red Mage
integration tests cover owned statistics/choices/limits, forged selections,
manual edits, spent resources, fixed starting entitlements and SQLite durable
close/reopen. Existing class roster assertion now includes Red Mage.
Regenerate spells with `node scripts/generate-red-mage-spells.mjs`; `--check`
checks drift. Class catalog uses the existing generation script.

The isolated queue parks Garif only to select Red Mage for this class-only chat;
its original production account-verification requirement is retained. Before
any future merge, reconcile progress.json and generated queue reports with the
race chat's latest checkpoint instead of replacing its race progress wholesale.
Next: Red Mage level 2 (Arcane Pool, Ruby Talent selection and Spellstrike),
followed by later progression. Keep working locally.
