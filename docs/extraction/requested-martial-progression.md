# Requested Moogle / Galka / Immortal martial setup

Latest local continuation (October 31, 2026): 410 tests and build:cloud pass.
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
every option. Definitions retain needs_review / partial coverage. No deployment, real Firebase login or production account access has been performed. Existing Gunbreaker talent event/option IDs, ability IDs and manually recorded starting equipment remain compatible; legacy imports are not assigned a guessed weapon.

Validation: Node 24.22.2; npm ci; all 403 tests pass; build:cloud passes; local
static preview GET /create-class.html returns HTTP 200. The original baseline
had 384 tests. Newer origin/main through 46f63ee was merged, preserving its Galka
alternates, Gunbreaker level-two talent IDs and bonus-feat ownership. Fifteen
additional requested race/class combinations also level successfully to 20.

Progression bonuses use canonical identities and SET-value upgrade records. Doom
Slayer's level-20 Strength/Dexterity/Wisdom increases apply once. Conditional
armor/speed/attack modifiers stay on manual cards. Increasing a resource maximum
preserves expenditure; leveling does not refill HP or daily resources. Magicked
Ammo's counter records the numeric per-load source allowance through level 18;
weapon capacity and the level 19–20 capacity rule require manual verification.
Starting gun-arm recording is optional to preserve existing manual equipment.

The queue retains prior deployment states. New scope is recorded as locally
validated, never as a fresh deployment or full independent source review.
