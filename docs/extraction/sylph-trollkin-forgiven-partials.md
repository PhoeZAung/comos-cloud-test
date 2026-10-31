# Sylph, Trollkin and Forgiven: source-checked partial racial replacements

This draft batch reconciles three previously unresolved source operations at runtime. The extracted `rules/staging/races/*.race.json` source definitions and independent review labels remain unchanged. References:

- [Sylph official FFd20 race](https://finalfantasyd20.com/races/beastman-tribes/sylph/)
- [Trollkin official FFd20 race](https://finalfantasyd20.com/races/beastman-tribes/trollkin/)
- [Forgiven official FFd20 race](https://finalfantasyd20.com/races/beastman-tribes/forgiven/)

## Sylph: Improved Flight

Official standard Base Speed: land **20 ft**, fly **40 ft (poor)**. Improved Flight fully replaces **Camouflage** and **Beguiling Liar**, **without removing Base Speed**. It changes its land speed to **10 ft**, fly speed to **60 ft (good)** (two steps improved from poor). The existing identity movement land/fly effects are adjusted from exact source baselines; initial sheet fly speed and maneuverability are filled in, but explicit manual edits, including zero, survive save/reopen. No standing AC/skill bonus is fabricated. Other standard traits are retained; heritage flight and other situational effects still need separate review.

## Trollkin: Faster Healing

The official description explicitly says Fast Healing 2 *replaces normal Fast Healing*, while its replacement sentence says it replaces Thick Skin. The staged partial operation lists both. Runtime now removes **both Fast Healing 1 and Thick Skin** and adds **only Faster Healing 2** as a manual reference trait. It does **not** create a turn-based HP recovery engine or stack 1+2 healing. The detailed source says suppression for one minute after **fire or earth** damage, while the heading says *Acid or Fire*; the conflict is displayed, not silently adjudicated. Normal limb/starvation/thirst/suffocation exceptions are maintained. An incompatible Thick Skin replacement is still rejected.

## Forgiven: Scion of Mortality

The official description modifies **only Celestial** among starting languages (Common remains) and adds **humanoid (hume) effect eligibility** to an otherwise **outsider (native)** Forgiven. Do not remove the entire Languages or Type feature. The runtime removes only the `identity.languages.celestial` effect, preserves `identity.languages.common` and outsider/native identity, and adds a manual Scion reference card for dual-race feat, spell, and race-effect adjudication. It does *not* falsely convert all outsiders to humanoids or turn dual eligibility into an always-on numeric bonus. Existing language options and unrelated racial traits remain.

## Safety/testing

The runtime rewrite requires exact original operation ID, resolution, scope, original targets and add IDs. The allowlist for modified parts verifies baseline land/fly speeds and Forgiven Common/Celestial and outsider/native effects. All unknown partial operations remain disabled; existing alternate-conflict and save permanence checks are retained.

New tests: `tests/sylph-trollkin-forgiven-partials.test.mjs`, plus historical regression updates in `tests/race-extraction.test.mjs`, `tests/race-bulk-replacements.test.mjs`, and `tests/race-wizard-availability.test.mjs`. Run full Node 24 suite plus cloud build on the final PR HEAD, and keep the PR draft. Separate signed-in integration checks remain necessary after explicit publication. **No merge or deployment authorized.**
