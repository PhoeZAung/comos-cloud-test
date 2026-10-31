# Requested martial batch publication

User explicitly requested "publish" on October 31, 2026. The requested Moogle,
Chocobo Knight/Mog Knight, Galka, Gunbreaker/Doom Slayer, Immortal and
Dancer/Akimbo batch was pushed, checked and merged in
[PR #33](https://github.com/PhoeZAung/comos-cloud-test/pull/33) as
`49f46b5c8944b8a49b5b724c984abb792c79d3f8`.
[Branch CI](https://github.com/PhoeZAung/comos-cloud-test/actions/runs/41177622886)
and [main CI](https://github.com/PhoeZAung/comos-cloud-test/actions/runs/41177688235)
passed 417 tests and the cloud build.

Railway initially queued the release. The currently successful production
release is `b864d2ac7acf73d2eeb7799ab6497a4909622c65`, which contains that merge
plus the separately merged Garif PR #34. Its
[main CI](https://github.com/PhoeZAung/comos-cloud-test/actions/runs/41180154151)
succeeded with 420 tests and the cloud build. Local build:cloud was also rerun
against the integrated source used for verification.

Railway deployment `88631e23-6f00-417f-a05f-627f516fc901` reports SUCCESS,
one running replica, zero crashed replicas and no pending environment work.
At https://feisty-freedom-production-304e.up.railway.app, all 16 checked public
module/style hashes match the current release build. Health returns HTTP 200,
database ready, schema 20 and authentication configured. An unauthenticated
private-character read returns HTTP 401. See
`martial-progression-deployment-validation.json` for paths, hashes and timestamp.
The older requested-batch deployment was superseded by this newer release.

This verifies deployment, not a real Firebase account login or production
character creation/save/reopen. Gameplay persistence was tested with SQLite
fixtures. Existing database, authentication and hosting settings were preserved.
The level 1–20 sheet, choice/resource and optional ammunition support remains
partial rule coverage; manual/guarded limits in the implementation notes remain.
No independent full rules review is claimed.

This authorization covered publication of the validated batch. Future gameplay
changes remain local until a new explicit publish request. Publication records
and queue checkpoints are saved on imports/active without another main merge.
