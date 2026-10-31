# Quadav — Water Tribe and Bond to the Land

Source: https://finalfantasyd20.com/races/beastman-tribes/quadav/ — Standard Racial Traits, Defense Racial Traits, and Alternate Racial Traits. Extracted `rules/staging/races/quadav.race.json` is unchanged and remains `needs_review`.

- **Standard Quadav:** 20 ft land speed and 30 ft swim speed (neither reduced by armor or encumbrance). The source's Full Withdrawal is manual: retract into shell with conditional damage reduction, concealment, forced prone, dropped items, prohibited actions, and a full-round entry/exit. It is not a permanent defensive bonus.
- **Water Tribe:** fully **replaces Full Withdrawal** and separately **modifies the swim-speed component of Base Speed** by +20 ft, from 30 to 50 ft. Land speed remains 20 ft and all unrelated racial traits remain. Amphibious air-and-water breathing remains a racial reference card.
- **Safe runtime correction:** the exact originally extracted `partial_feature/unresolved` operation is split into a source-bounded whole-feature replacement for Full Withdrawal and a narrowly allowlisted Base Speed modifier. The original JSON remains untouched, and unexpected source IDs are not enabled.
- **Choice control:** Bond to the Land requires exactly one source-listed terrain, swamp or underground, on the existing Race wizard step. This is persisted and cannot be changed on an existing character. Its +2 dodge AC remains *conditional*, never a permanent sheet bonus.
- **Editable movement:** only initial Quadav swim movement is seeded from the active racial speed effect. Custom and zero swim-speed fields survive edit/reopen. This intentionally does not replace the user's manual movement values.
- **Manual boundaries:** Full Withdrawal state rules, situational AC, bite combat, metalworking proficiencies, armor prices, favored class rewards and other conditional traits still require independent review. The extracted Full Withdrawal damage-reduction wording differs in source records; do not auto-apply it.
- Full Node 24 test/build and signed-in browser validation must be separate checks. This is a draft PR checkpoint; no merge or deployment authorized.

Coverage: `tests/quadav-water-tribe.test.mjs`.
