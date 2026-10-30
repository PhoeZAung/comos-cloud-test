# Resume the class and race import queue

The user chose class/race integration as the main goal. Use the existing FFd20
archive and keep unresolved Pathfinder-dependent mechanics manual or guarded.
Bulk Pathfinder collection is paused. Do not wait for cloud publication to
prepare definitions and adapters that can be validated from the saved sources.

The standing user instruction is to continue through validated queue milestones
without waiting for another "next", while the active run has capacity and the
user has not stopped it. Push recoverable checkpoints as work progresses.
Codex does not perform this reasoning unattended after a run or runtime stops.

This queue tracks **73 classes, 63 races and 579 archetypes**. It schedules and
records implementation work; it cannot perform AI reasoning while Codex is
paused, out of usage, or not running. A new session can resume saved work.

## Durable checkpoints

- `catalog.json` holds stable IDs, website order, parent links, source hashes,
  retrieval dates and relative archive locations. It contains no raw page text.
- `progress.json` is the authoritative checkpoint. The CLI writes it atomically
  under a short writer lock, checks revision conflicts, and retains each item's
  stage, section/cursor, next action, evidence and support limits.
- `QUEUE.md` and `ARCHETYPES.md` are generated human-readable views. If a process
  stops between checkpoint and report generation, regenerate them from JSON.
  Work-in-progress application manifest errors are reported as warnings; they
  do not erase the cursor or prevent saving a repair checkpoint.
- Commit and push checkpoint changes together with the corresponding work.
  GitHub preserves pushed progress if the current cloud machine stops.
- The raw HTML/Markdown archive and SQLite inventory live separately in the
  extractor workspace. They are not backed up by pushing this application repo.
  Restore the user's local source archive if a fresh cloud task lacks them.

## Start or resume

Use the existing checkout. Do not create a Git worktree unless the user asks.
Preserve local changes before switching branches. Work on **`imports/active`**
so a new session has one known branch to find unfinished work:

1. Inspect `git status`, the current branch and `git branch -r`.
2. Fetch origin. If `origin/imports/active` exists, resume that branch after
   preserving any current work. If absent, create it from current `origin/main`.
   Never reset a branch or overwrite a newer checkpoint to match an older copy.
3. Run `node scripts/import-queue.mjs status` and
   `node scripts/import-queue.mjs next`. An in-progress entry is returned first.
4. Read its source, checkpoint, actual definition and review issues. Continue at
   the recorded cursor. If the source cache is missing, restore it or record a
   precise blocker; do not claim the source has been reread.
5. Checkpoint after each meaningful source section, rule mapping, adapter change
   or validation step. Commit and push useful work before a pause. Partial work
   stays on `imports/active`; do not merge an unfinished or failing batch.

The original Dwarf/Elvaan continuation is retained in
`docs/extraction/CONTINUATION.json`. Existing Chocobo Knight, Dancer, Archer,
Black Mage, Bard, Elvaan, Galka, Moogle, Immortal, Dwarf and Mog Knight support is recorded as partial
milestones rather than full completion. Bard level 1 and the standard Elvaan
and Galka traits have verified deployment milestones. Half-Breed is blocked on verified parent-trait RP costs and inheritance choices.
Antrider has a staged source definition, but is blocked on maneuver-feat
prerequisites, companion handling and later parent replacements. Beastmaster's
bounded first-level creation/editing scope is deployed: eleven ordinary starting
companions or none, fixed starting selection, manual companion combat/training,
Nature Sense and daily counters. All 35 source entries remain staged for later
work. See `docs/extraction/beastmaster-level-one-import.md` for checks and limits.
Hume standard first-level traits are deployed with score choice, Skilled budget,
a separate manual bonus-feat slot and bounded language-name recording. See
`docs/extraction/hume-standard-creation.md` for limits and evidence.
Mithra's standard traits, bonus languages, Fleet-Footed and Cat's Luck counter
are also deployed; see `docs/extraction/mithra-standard-creation.md`.
Tarutaru standard traits, Talented's specialty and bonus languages are deployed;
see `docs/extraction/tarutaru-standard-creation.md`. Beast Rider source data is
staged/blocked on verified druid-style mount rules and its specialized adapter;
do not substitute the different FFd20 Beastmaster table. Dragoon first-level creation/editing is deployed with six source reference abilities, shared Limit Break expenditure and manual jump mechanics. See `docs/extraction/dragoon-level-one-import.md`. The active baseline item is **Aegyl**, beginning with standard traits and source-listed languages. Always read
the current queue instead of restarting these completed milestones. A blocked entry
is skipped without deleting its last section or evidence.

## Commands

Commands run from the application repository using Node.js 24+. No extra npm
packages or network access are required just to read/update the queue.

```sh
node scripts/import-queue.mjs status
node scripts/import-queue.mjs status --json
node scripts/import-queue.mjs plan
node scripts/import-queue.mjs next
node scripts/import-queue.mjs start
```

Starting an explicit item is also supported:

```sh
node scripts/import-queue.mjs start ffd20:class:bard
node scripts/import-queue.mjs checkpoint ffd20:class:bard --stage runtime-adapter --cursor "Starting song choices" --next "Implement and validate song entitlement" --note "Record exact work completed here" --evidence docs/extraction/bard-batch-02.md
```

For a blocker, retain the cursor and state the actual missing prerequisite:

```sh
node scripts/import-queue.mjs block ffd20:class:bard --note "Specific unresolved rule or missing source" --next "Concrete action needed to resolve it"
node scripts/import-queue.mjs next
```

To resume a blocked entry after resolving its issue, explicitly start it again.
To park current work, checkpoint it with `--state queued`; its cursor survives.
`--expect-revision N` rejects a stale write. `--kind class`, `--kind race` and
`--kind archetype` select a work kind when no other entry is active.

When a limited, tested scope is deployed, record `--state live_partial` with
an explicit `--scope` and one or more `--evidence` references. This advances the
schedule without claiming full rule coverage. Use `next --include-partial` to
revisit partial entries for later progression, choices or review milestones.
When no unblocked baseline item remains, continue those later milestones using
`--include-partial`; do not ask for a new “next” instruction for every entry.
Retain completed sections and change only the newly declared support scope.

Full completion additionally requires `--coverage full`, `--review-evidence`,
scope/validation evidence, a reviewed/enabled definition and complete declared
progression. These are records of work that must actually be performed; the
queue does not certify mechanics or replace validators/tests. Never remove a
review issue merely to make a completion gate pass.

```sh
node scripts/import-queue.mjs render
```

Rendering regenerates the readable lists without moving a checkpoint. A lock
left by a dead process on the same host is recovered automatically. A lock from
another host is not discarded automatically: inspect it and confirm the old
worker is stopped before recovering that local transient file.

## Small, verifiable batches

Follow existing class/race/archetype contracts and permanent feature IDs. Review
prestige/NPC entry requirements before deciding their legal import scope; do not
enable them as generic level-1 player choices. Preserve parent/child family
links and the prior class-family packaging decision while using the repository's
current runtime file contracts. A format migration needs its own validated step.

Keep unverified replacements, mandatory choices and conditional effects guarded
or manual. Data staging never implies that an adapter is ready. Run meaningful
targeted checks, `npm test`, and `npm run build:cloud` before merging a verified
batch. For gameplay changes, exercise creation and save/reopen behavior with a
local fixture; production login tests require an actual user account. Record
CI/deployment evidence and manual limits. Do not mark a passing local fixture as
production provider verification.

Merge only the checked batch under the user's applicable deployment
authorization. After merge, continue `imports/active` from the current main
without dropping newer checkpoints. If the host deletes that merged branch,
recreate it from main; the completed checkpoint is already on main.

## Resume prompt

> Resume the class/race import queue in PhoeZAung/comos-cloud-test. Read
> docs/imports/RESUME.md, resume imports/active if it exists, run the queue status
> and next commands, and continue from the recorded checkpoint. Use the existing
> FFd20 archive. Work through small validated batches, save and push checkpoints,
> and retain partial/manual limits. Do not restart completed source collection.
