# Bard first-level import

This batch implements new level-1 Bard creation and editing. It supersedes the earlier disabled/staged availability statements in the historical Bard extraction reports only within this scope. Source review remains `needs_review`.

## Sources

- Archived Bard class page: https://finalfantasyd20.com/classes/core-classes/bard/
- All 30 individual first-level song pages are imported into `rules/classes/bard-song-mechanics.json`, with actions, cost, school, range, targets/areas, duration, saving throws, spell resistance, manual paraphrases, source URLs, retrieval dates and SHA-256 hashes. Each extracted article was compared with its hashed original page. The archived MP System page hash was also checked.
- The 11 previously extracted jingles join those songs in a generated, validated first-level runtime catalog. The 135 level-2–6 song mechanics remain pending.
- Elemental Threnody is maintained according to its individual Duration field; the index-only normal-song classification was corrected with an explicit source reference.

## Supported behavior

- Single-class Bard at level 1: d8, BAB 0, Fort/Ref/Will 0/2/2, 6 + INT modifier skill points (minimum 1), simple weapons, harp bows, light armor, 105 average gil and the standard outfit.
- Exactly two distinct jingles and 3 + effective CHA modifier distinct first-level songs; CHA 11–45. Choices use the Bard catalog, not Black Mage spells. Invalid, swapped and missing selections are rejected by the server model.
- Base MP 2 plus the existing verified bonus-MP table using CHA and maximum song level 1. Jingles cost 0 MP; ordinary first-level songs cost 1 MP. Song save DCs, concentration and recovery use the Bard casting profile and CHA.
- First-level performance cards and one shared 4 + CHA modifier daily-round counter. Only Siren’s Song and Soul Voice are actionable Limit Break cards; the generic class heading is not emitted as a third action. Both use the shared Limit Break rules. Performance rounds are reset manually; saving a character is not a rest.
- The starting CHA modifier is saved at creation. Later stat edits change MP and DCs, but do not grant extra starting songs; earlier first-level Bard saves migrate from their actual learned-song count. Forged starting allowances are rejected.
- Saving/reopening does not refill current HP, MP or spent performance rounds, duplicate owned rows, remove manual rows, or overwrite manually renamed song cards. Sheet CHA edits adjust bonus MP and performance capacity without healing.
- Later levels, multiclassing, archetypes, song talents and Versatile Performance remain unavailable. Immortal Magic Ineptitude and other existing incompatible casting-race guards apply to Bard too.

Maintained songs have manual upkeep, range, duration, repeated-save/resistance and target rules on their cards. No maintained effect is turned into a permanent AC, save, healing or damage bonus. Orchestration rolls, extra purchased songs, metasong and automatic combat adjudication are outside this batch.

## Validation

- Full suite: 301 tests passed, including eight new source, entitlement, save/reopen, resource, guard and library tests. Existing availability tests now expect Bard’s bounded adapter while unintegrated classes remain disabled.
- `npm run build:cloud` passed.
- Local Chromium at 390 × 844 with the real HTTP route/service and temporary SQLite storage: both default Moogle Bard and high-CHA/INT Moogle Bard created and reopened successfully with no page errors. Default: HP 8, MP 3, 4 songs, 2 jingles, 6 ranks. High scores: HP 8, MP 4, 8 songs, 2 jingles, 8 ranks.
- Browser session is a local authentication fixture. Real production provider login and user-account acceptance were not tested.
- CI and deployment verification are recorded in the import checkpoint after completion.

Deployment verified: public runtime asset hashes match the tested build. See the corresponding deployment-validation JSON and import checkpoint. GitHub checks: https://github.com/PhoeZAung/comos-cloud-test/actions/runs/41022762945.
