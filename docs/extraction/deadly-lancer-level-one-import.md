# Deadly Lancer first-level integration

Source: https://finalfantasyd20.com/classes/base-classes/chocobo-knight/archetypes/deadly-lancer/
Archived HTML SHA-256: `9f24820ff5d2b3370e957120555178641a7d9d7b98b25586620f6ab1d87cbfa1`.

First-level Chocobo Knight creation can select Deadly Lancer. Its proficiency component replaces the parent selection with simple weapons, the polearm and spear weapon groups, and light/medium/heavy armor; shields are not granted. Commander’s Aura is replaced by Charging Lancer. The parent mount reference, Challenge counter, Mounted Combat feat, Fight as One and Supreme Overrun Limit Breaks remain. No race restriction is invented.

Charging Lancer is a manual source card: a mounted charge of at least 10 feet that hits with a spear, lance or polearm adds 1d6 at first level. This damage is not multiplied by a critical hit or a class feature. No attack, charge path, weapon, mount or automatic extra damage is created. Restored class/archetype cards now retain their granting class and correct source URL rather than inheriting the Black Mage source.

The definition preserves nine source features, nineteen Jousting Tricks, thirteen total-value upgrades, two exact first-level replacements and nine deferred later parent relationships. Charging Lancer reaches 10d6 at level 19 in the staged progression rather than adding upgrade totals. Trick gates, repeat policies and manual prerequisite flags are retained for review; none is available at first level. Later levels, trick choices and multiclassing remain guarded. Later parent IDs/replacement choices, conditional combat rules, favored rewards and independent full review require separate work.

Validation: all 363 tests and the cloud build pass. Three targeted regressions cover source hash/graph/tricks/upgrades, first-level feature/proficiency replacements, correct restoration/source ownership, manual combat entry and spent resource preservation, and forged later/incompatible choices. Phone-sized Chromium fixtures created, edited, saved and reopened Galka and Moogle Deadly Lancers, retained their archetype and shared Limit Break expenditure without healing HP, rejected level-up and saw no page errors. See `deadly-lancer-browser-validation.json`. Authentication was a local fixture, not production provider login.
