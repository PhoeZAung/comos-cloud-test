# Galka / Gunbreaker / Doom Slayer — bounded wizard integration

Galka standard racial traits already have a deployed partial-live adapter and do not need to be duplicated. The Gunbreaker definition has 20 source-indexed progression rows; only first-level creation and editing is currently playable in the rules wizard.

The first-level Gunbreaker grants its class abilities, Gunsmithing bonus feat, no spellcasting, and a shared Limit Break pool. The Doom Slayer option is restricted to Gunbreaker and replaces Aurora and Gunsmith with Praetor Sacrament and Doom Gun Arm at first level. The wizard saves the selected archetype to the character sheet. Conditional effects, equipment, combat, ammo, and weapon modes are manual reference rules, not automatically calculated permanent bonuses. The source marks Doom Slayer as a non-FF archetype, so the GM should approve its use.

Sources:
- https://finalfantasyd20.com/classes/hybrid-classes/gunbreaker/
- https://finalfantasyd20.com/classes/hybrid-classes/gunbreaker/archetypes/doom-slayer/

**Level-up limitation:** levels 2–20 are recorded as source progression data but **cannot be saved** using this bounded adapter. Gunbreaker talents, gun-arm techniques/masteries, modifications, advanced archetype replacements and Doom Slayer runes all need complete rule selection/upgrade adapters before level-up can work faithfully. Unsupported combinations are guarded by the server-side build validation.

Targeted regression tests have been added, but have **not yet been executed** on the connected source branch. Do not merge/deploy or mark fully verified until `npm test` and `npm run build:cloud` complete successfully, followed by save/reopen acceptance. This work was committed on a separate feature branch and does not advance the paused import queue checkpoint.
