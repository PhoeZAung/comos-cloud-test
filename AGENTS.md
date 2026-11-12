# Production release policy (manual QNAP publishing only)

Production Cosmos is hosted on the user's QNAP, not the older Railway test URL.
**Do not use GitHub Actions to deploy production, restore an automatic deploy
workflow, or assume a merge to main restarts Docker.** The owner connects with
Termius over Tailscale. The installed, proven QNAP release script is
/share/Service/Container/Cosmos/publish-cosmos-qnap.sh; the repo's matching
version is scripts/publish-cosmos-qnap.sh. For each requested production release:
review and merge tested changes to GitHub main; identify the exact full main
commit SHA; provide the manual Termius command:

~~~sh
cd /share/Service/Container/Cosmos
sh ./publish-cosmos-qnap.sh <FULL_40_CHARACTER_MAIN_COMMIT_SHA>
~~~

The optional QNAP-local publish-cosmos launcher (source:
scripts/publish-latest-qnap.sh) fetches main and asks for DEPLOY confirmation.
It is not installed merely by committing its source. Explicit user operation
on QNAP is still necessary. Verify current-code-sha, container logs/health,
and relevant signed-in browser behavior before saying production is published.
Protect data, mounted volumes, backups, secrets, database migrations, and the
Tailscale network. Refer to docs/QNAP_PHONE_DEPLOY.md for the full procedure.
Keep .github/workflows/verify.yml for CI tests only.

---

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
