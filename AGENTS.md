# Class and race import work

For class/race import or resume requests, read `docs/imports/RESUME.md` and run
`node scripts/import-queue.mjs status` followed by `next`. The authoritative
checkpoint is `docs/imports/progress.json`; resume active work before taking a
new entry. Pushed work on `imports/active` is the continuation point after a
cloud interruption. Inspect and preserve existing changes before branch moves.

Use this checkout; do not create a Git worktree unless explicitly requested.
Prefer the archived FFd20 sources. Pathfinder bulk collection is paused under
the current class/race-first plan. Preserve raw archive data outside application
commits and keep source hashes, choices and replacement mappings auditable.

Checkpoint meaningful progress, record blockers and manual limits, and push
recoverable work before pauses. Archived/staged/selectable/partial-live/full
completion are distinct. Do not enable unsupported rules by flipping flags or
describe a local fixture login as real production verification. Follow current
user authorization and the existing validation/deployment workflow.
