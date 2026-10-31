# Requested Moogle / Galka / Immortal martial setup

User request, 2026-10-30: prioritize Moogle, Chocobo Knight, Mog Knight,
Galka, Gunbreaker, Doom Slayer, Immortal, Dancer and Akimbo, including progression
through level 20. This supersedes the old Garif-first pause for this batch.

Local implementation: three martial classes and their requested archetypes have
level 1–20 progression, explicit source-bound choice slots, owned replacement
cards, resource scaling, and guarded sequential level-up. Existing standard racial
choices remain supported. SQLite fixture creation and route updates through all
nineteen level-ups, database close/reopen, stale revisions, forged changes,
manual-entry preservation and resource expenditure are covered by
`tests/martial-progression.test.mjs`.

Conditional combat, mounts/companions, firearm ammunition/reloading, starting
weapon equipment statistics and externally verified prerequisites remain manual.
Options whose prerequisites cannot be proved by the current owned feature and
choice model stay unavailable. Bonus combat feat subchoices, weapon specialisms,
and reconfigurable Gunsmith modifications require manual adjudication. This is
level 1–20 sheet support, not complete automatic combat or independent review of
every option. Definitions retain needs_review / partial coverage. No deployment,
real Firebase login, production account access or existing-character migration
has been performed.

Baseline: Node 24.22.2, npm ci, 384 tests. Initial local expanded scope: 394 tests
pass and build:cloud passes. Newer origin/main Gunbreaker/Galka support was then
discovered; integration and revalidation are required before the final checkpoint.
