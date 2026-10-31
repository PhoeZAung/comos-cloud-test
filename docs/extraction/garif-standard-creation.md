# Garif standard level-one creation checkpoint

Source: https://finalfantasyd20.com/races/base-races/garif/ (existing staged definition; source reviewed in this pass).
Base commit: 49f46b5c8944b8a49b5b724c984abb792c79d3f8; branch: imports/active.

Implemented: Garif +2 Constitution, +2 Wisdom, -2 Intelligence; Medium Humanoid (garif); speed 30 feet; Common/Garif and source-listed high-INT bonus languages; low-light vision; Animal Herder +2 Handle Animal, Keen Senses +2 Perception. Source weapon proficiencies: longspear, shortspear, javelin, boar spear (not starting inventory).

At creation, select exactly one desert/plains Bond to the Land terrain. Its +2 dodge AC is conditional/manual; terrain is immutable on an existing saved Garif. Masked +1 saves remains situational/manual. Pastoralist offers a single level-1 extra rank allocated to exactly one permitted Craft specialty (3 slots), Knowledge (nature), pastoral Profession specialty (3 slots), or Survival; selected skill becomes a class skill. Exact specialty name required for Craft/Profession. Saved level-1 skill and terrain choices cannot be changed during edits.

Blocked: Garif progression beyond level 1 and multiclass, Historian/Soldier/Unmasked alternates, favored rewards and any fully independent rules review. No conditional +2 AC or +1 saves applied globally. Manual sheet entries retained. Do not infer automatic mask equipment or mount data.

Verification (isolated sandbox): Node v22.16.0. Focused Garif tests 3/3 passed on snapshot 6b8dd83; `npm test` 372/382 passed, ten failures from missing sharp/esbuild or resulting missing live assets; `npm run build:cloud` blocked because esbuild is absent. These are NOT Node 24 final-integrated results. Run with Node >=24, `npm ci && npm test && npm run build:cloud` before merging. No production Firebase login or deployment of Garif has been verified.

Next: resume active Garif checkpoint, validate against the latest remote main, review generated catalog and targeted code, then only merge after complete successful validation.

## October 31 publication checkpoint
PR [#34](https://github.com/PhoeZAung/comos-cloud-test/pull/34) merged to main as `b864d2ac7acf73d2eeb7799ab6497a4909622c65`. On Node 24, [PR Actions run 41180072037](https://github.com/PhoeZAung/comos-cloud-test/actions/runs/41180072037) passed **420/420** tests and `npm run build:cloud`; [main Actions run 41180154151](https://github.com/PhoeZAung/comos-cloud-test/actions/runs/41180154151) also succeeded. This supersedes the earlier isolated Node 22 missing-package validation limitation.

**Not confirmed live**: Railway production deployment `88631e23-6f00-417f-a05f-627f516fc901` for `b864d2a` remains QUEUED with no build/deploy logs, as does earlier martial deployment `a50286b9-93e8-42f6-9952-fe4e7dd2499d`; last successful live deployment is `46f63ee`. Existing Railway main service, Firebase Auth and SQLite `/data` volume were not changed. After Railway success, verify health and signed-in Garif creation/save/reopen before marking this race live_partial.

## Production rollout verification
Railway deployment `88631e23-6f00-417f-a05f-627f516fc901` is now SUCCESS
for b864d2a. All 16 checked current-release assets (including Garif builder,
wizard, racial-choice and progression modules) match the cloud build. Health
is ready and unauthenticated private access returns 401. Evidence:
`martial-progression-deployment-validation.json`. This supersedes the queued
status above. Real signed-in Garif creation/save/reopen remains unverified, so
its checkpoint stays in_progress pending that specifically required check.
