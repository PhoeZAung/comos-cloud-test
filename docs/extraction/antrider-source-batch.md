# Antrider source batch

Official archived page: https://finalfantasyd20.com/classes/base-classes/chocobo-knight/archetypes/antrider/
Original HTML SHA-256: `b79280541ba25e2c77c4a668964ad6d0bd2a6dc19e3ac4d28bc62c57cbbe332f` (matches the import catalog).

Staged five stable features (Ant Steed, Maneuver Tactics, Mindlink, Acidic Bite, Mindlink Pulse), seven persistent-value upgrades, two resolved first-level replacements, the maneuver-feat selection levels and daily resource progression, complete starting mount statistics and all 20 mount progression rows. Race eligibility is Antica only. Acidic Bite deals earth damage as printed; its name does not imply acid damage.

The first-level replacements reference the existing parent Chocobo Mount and Challenge IDs. Five later targets—Expert Trainer, Master Feeder, Improved Chocobo Mount, Superior Chocobo Mount and Protect the Meek—do not yet exist in the first-level parent definition. Their names, levels and source locators are retained as deferred mappings, without invented parent IDs or a claim that the full replacement graph is resolved.

The Knight Ant starting block prints poison Fort DC 17. Its formula, 10 + half HD + Constitution modifier, gives 16 using the level-1 table's HD 2 and Constitution 21. Both values are preserved for review and no poison DC is automated. Mindlessness, the table's 1+ INT skill/feat/trick column labels, the prose's bonus tricks and Hive Guard's separate bonus feat also need explicit companion handling. No ordinary skill/feat entitlement is silently granted to a mindless ant.

Playable import is blocked on verified Maneuver Tactics feat prerequisites/selection, Antica integration and the specialized companion/runtime adapter. Later parent features must be staged before resolving later replacements. The manifest is `staged` with `adapter: null`; the wizard does not offer Antrider, and the server rejects a forged archetype selection. Structural validation is not mechanical approval. Source review remains `needs_review`.

Four regression tests cover source/catalog hashes, replacement targets/deferred targets, all mount progression rows, printed/formula poison discrepancy, persistent upgrades, resource progression, manual conditions and runtime exclusion. Full suite/build and deployed guard checks are recorded in the import checkpoint when verified.

Validation for this batch: all 313 tests and npm run build:cloud pass. A 390 × 844 Chromium fixture showed the Half-Breed explanation, stayed at the race step, and received HTTP 400 for a forged all-traits-disabled build with valid allocated skill ranks. No character was created and no page errors occurred. This used local fixture authentication, not production provider login. Evidence: docs/extraction/half-breed-browser-validation.json.
