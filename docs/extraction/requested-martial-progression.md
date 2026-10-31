# Requested Moogle / Galka / Immortal martial setup

Published October 31, 2026 in PR #33 (49f46b5), now included in the successful
production release b864d2a. Public assets and health verified; no real Firebase
account login performed. See `martial-progression-publication.md` and its JSON
evidence. The following local notes describe implementation checkpoints.

Latest local continuation (October 31, 2026): 417 tests and build:cloud pass.
See `gunbreaker-ammunition-tracker.md` for the new optional, capacity-aware
Gunbreaker/Doom Slayer tracker. Unconfigured manual counters retain their prior
limits. The user requires all work to stay local until an explicit "publish".
Follow-up talent choices, repeat limits and Ki/Aurora resources are recorded in
`martial-follow-up-choices.md`. The 403-test results below describe the original
October 30 checkpoint.

User request, 2026-10-30: prioritize Moogle, Chocobo Knight, Mog Knight,
Galka, Gunbreaker, Doom Slayer, Immortal, Dancer and Akimbo, including progression
through level 20. This supersedes the old Garif-first pause for this batch.

Local implementation: three martial classes and their requested archetypes have
level 1–20 progression, explicit source-bound choice slots, owned replacement
cards, resource scaling, and guarded sequential level-up. Standard Moogle and Immortal choices and the newer Galka alternate traits remain supported. SQLite fixture creation and route updates through all
nineteen level-ups, database close/reopen, stale revisions, forged changes,
manual-entry preservation and resource expenditure are covered by
`tests/martial-progression.test.mjs`.

Conditional combat, mounts/companions, firearm ammunition/reloading, starting
weapon equipment statistics and externally verified prerequisites remain manual.
Options whose prerequisites cannot be proved by the current owned feature and
choice model stay unavailable. Bonus combat feat subchoices, weapon specialisms,
and reconfigurable Gunsmith modifications require manual adjudication. This is
level 1–20 sheet support, not complete automatic combat or independent review of
every option. Definitions retain needs_review / partial coverage. At the original local checkpoint, no deployment or real Firebase login had been performed. Publication is now verified as recorded above; production account access remains untested. Existing Gunbreaker talent event/option IDs, ability IDs and manually recorded starting equipment remain compatible; legacy imports are not assigned a guessed weapon.

Validation: Node 24.22.2; npm ci; all 403 tests pass; build:cloud passes; local
static preview GET /create-class.html returns HTTP 200. The original baseline
had 384 tests. Newer origin/main through 46f63ee was merged, preserving its Galka
alternates, Gunbreaker level-two talent IDs and bonus-feat ownership. Fifteen
additional requested race/class combinations also level successfully to 20.

Progression bonuses use canonical identities and SET-value upgrade records. Doom
Slayer's level-20 Strength/Dexterity/Wisdom increases apply once. Conditional
armor/speed/attack modifiers stay on manual cards. Increasing a resource maximum
preserves expenditure; leveling does not refill HP or daily resources. Magicked
Ammo's legacy unconfigured counter records the numeric per-load allowance
through level 18; the optional tracker now supports source-listed capacities
and the level 19–20 capacity rule. Modified weapons and multi-magazine handling
remain manual.
Starting gun-arm recording is optional to preserve existing manual equipment.

The queue now records the bounded deployed scope and publication evidence.
It does not claim full independent source review or real account verification.
