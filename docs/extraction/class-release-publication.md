# Class release publication — October 31, 2026

The user explicitly requested publish. Red Mage levels 1–2 and the shared
Chocobo Knight/Mog Knight, Dancer/Akimbo and Gunbreaker/Doom Slayer polish are
published in [PR #39](https://github.com/PhoeZAung/comos-cloud-test/pull/39).
Merge: `b4c63eb061f6ca27a7b263ff08a6c0b9fc851a8d`.

Current race work through fa4b770 was integrated before publication. Language,
heritage and resolved replacement behavior from the race chat were preserved.
The combined source passed 449 tests and build:cloud locally. Both
[PR CI](https://github.com/PhoeZAung/comos-cloud-test/actions/runs/41217982170)
and [main CI](https://github.com/PhoeZAung/comos-cloud-test/actions/runs/41218059820)
succeeded.

Railway deployment `ed8b759c-5f4f-4067-8194-16b72b84a850` reports SUCCESS,
one running replica, zero crashed replicas and no pending work. Rollout took
about 53 seconds from creation to success. All 20 checked live module/style
hashes match the cloud build. Health returns 200 with database ready, schema 20
and authentication configured. An unauthenticated private-character read is
correctly denied with 401. See class-release-deployment-validation.json for
exact paths, hashes and check time.

Site: https://feisty-freedom-production-304e.up.railway.app

No real Firebase account login or production character mutation was performed.
Browser tests used loopback fixture sessions and isolated SQLite. No characters
were deleted; the user's plan to replace old characters was not deletion
permission. Database contents, auth and hosting configuration were preserved.

Red Mage remains bounded to levels 1–2, with conditional spell/combat effects,
daily rest refresh and unsupported Ruby Talent subchoices manual or guarded.
The martial classes/archetypes retain their documented conditional combat,
mount, prerequisite and equipment limits. Full independent review is not claimed.

This publish request covered the completed release. Future gameplay work stays
local until another explicit publish request in the classes chat. Next class
milestone: Red Mage level 3, Ruby Arcana and Ruby Knowledge. Continue in the
isolated classes/red-mage checkout and reconcile the race chat's latest branch
before another publication. Publication records alone do not need another
main merge or Railway deployment.
