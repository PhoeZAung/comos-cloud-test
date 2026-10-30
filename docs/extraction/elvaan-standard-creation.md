# Elvaan standard-trait creation batch

Read the archived official Elvaan page at https://finalfantasyd20.com/races/core-races/elvaan/. The original HTML SHA-256 is `5e4efa8292f54624cc2a44ff47e1bbf1b9e8e0f7395fefcf088946a33ea43611`, also recorded in the race definition and import catalog. Source review remains `needs_review`.

The standard racial ability vector (+2 STR, +2 WIS, −2 DEX), Medium humanoid/elvaan identity, 30-foot speed, Common/Elvaan languages, low-light vision, Perception bonus, Knowledge (history/nobility) bonuses/class skills and racial weapon proficiencies were compared with the archived Standard Racial Traits and its defense, skill, offense and senses subsections.

Martial Background previously required a weapon choice that the wizard could not record, so standard Elvaan saves were blocked. The wizard now records exactly one verified proficient weapon and emits a separate manual Weapon Focus feat card. The bounded list is the six proficiencies directly supplied by active Weapon Familiarity: longbow, composite longbow, longsword, rapier, shortbow and composite shortbow. Other class-derived weapon options need a broader weapon catalog. Removing Weapon Familiarity blocks that limited list; disabling Martial Background explicitly removes its choice and owned feat.

Optional bonus languages use the seven source options and a positive Intelligence-modifier limit. The language pool is now connected to the active Languages trait, appears in both race and ability-score steps, and survives saving/reopening. Foreign, duplicate, stale and excessive selections are rejected.

Fearless, Hatred and Gatecrasher remain conditional/manual; no blanket save, attack or BAB increase is introduced. Weapon Focus benefits are manual and tied to the selected weapon. Variant heritages, alternate traits and favored-class rewards are outside this batch. The wizard and server guard the unverified variant scope. This is a partial playable milestone, not approval of the full race page.

Validation: all 305 tests pass and the cloud build succeeds. Four new tests cover the Black Mage, Archer, Dancer and Bard compiler paths, racial scores/identity/skills, proficiency validation, language limits, owned-feat replacement, manual edits and guarded variant scope. Phone-sized Chromium (390 × 844) created and reopened Elvaan Dancer and Elvaan Bard through the real HTTP routes with fixture authentication and temporary SQLite storage. Both retain Longsword Weapon Focus and Common/Elvaan/Celestial; HP 8, skill ranks 5/7 and MP 0/3 respectively. No page errors. Real production provider login is not claimed.

After this baseline, return to variant heritages, alternate choices/replacements, full weapon catalog coverage, independent feat review and favored-class reconciliation in later milestones. GitHub CI and public asset verification are recorded in the queue checkpoint.

Deployment verified: public runtime asset hashes match the tested build. See the corresponding deployment-validation JSON and import checkpoint. GitHub checks: https://github.com/PhoeZAung/comos-cloud-test/actions/runs/41024380782.
