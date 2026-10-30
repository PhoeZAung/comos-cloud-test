# Combat maneuver calculator follow-up

Discovered during the Burmecian standard-trait adapter: `sheetStats()` in `src/features/sheet/model.mjs` calculates CMD from 10 + STR + DEX + size + cmd_temp, omitting BAB. Its CMB calculation adds both STR and DEX. The module explicitly describes compatibility with the imported Mount Aetheria sheet; saved manual totals and component conventions must be checked before a shared-formula migration.

The class/race batches only own their declared racial contributions. Burmecian Battle-Hardened adds exactly +1 through its tracked CMD adjustment, and removal/editing preserve manual adjustments. This does not certify the legacy base CMD/CMB calculator. Verify complete combat maneuver totals manually against current core rules until the dedicated combat-rules migration is implemented and validated.

Follow-up: verify the current core maneuver formulas and supported ability substitutions/AC bonuses from authoritative rules, inspect representative imported and managed characters, then implement component ownership/fallback handling and migration regressions so existing manual totals are not silently double-counted. No character records were accessed or changed during this investigation.
