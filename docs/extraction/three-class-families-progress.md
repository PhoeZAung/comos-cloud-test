# Thief, Warrior and Monk: three local class families

October 31, 2026. This batch adds level 1–20 campaign sheet support for three
base classes and all 70 archived archetypes. It is unpublished and not a claim
of independently reviewed full combat automation. Earlier Red Mage +18archetype
work remains included locally; previously verified live release is still PR39.

| Family | Archetypes | Parent features | SET upgrades | Distinct native base options |
| --- | ---: | ---: | ---: | ---: |
| Thief |25|28|17|208talents, plus manual/native first-level selection pools |
| Warrior |25|39|9|71talents,11weapon groups,20maneuver selections |
| Monk |20|25|23|38talents,13blitz techniques |

## What the shared adapter handles

Source Hit Dice, BAB, saves, MP, skills, proficiencies, ability milestones,
sequential default HP, recorded native choices and exact feature/event
replacements use existing sheet fields. Chosen-weapon and external combat
bonuses stay manual. Past talent selections survive later replacements and
cannot be forged during level-up or replaced in saved editing. Same-named
parent amendments share one card. Archetype resource definitions override parent
ones, and HP/MP/spent uses/manual rows survive edits and progression.

Monk preserves existing first-level IDs, Bodybuilding HP and its original
Improved Unarmed Strike feat record while Martial Arts is retained; Weapon Adept
loses that grant. White Monk uses source d8/three-quarter BAB/WIS/MP; Spellthief
uses INT/MP. Their spell learning, effects and caster-level adjudication remain
manual spell rows/cards, with no unrelated spell wizard. Source race/size/trait
requirements are enforced, including Gnath Swarming for Swarm Fighter.

## Actual validation

493 tests pass and build:cloud succeeds with Node24.22.2. All73paths create and
advance to20, with unique ownership and correct source chassis. Actual character
update routes accept1387level-ups; all73records survive database close/reopen.
Additional source/runtime tests cover partial slots, restricted weapon groups,
ranked prerequisites, negative requests, WhiteMonk chassis, unequal CON/WIS Ki
pools, spent uses, source timing conflicts, saved choices and manual spell rows.

Seven browser progression checks save: Thief1→2, Warrior1→2, Monk2→3 with Blitz,
Combatant1→2, WhiteMonk1→2, SwarmFighter1→2 and Thief11→12 with an ability boost
and advanced Blindsense. A Warrior was also created from scratch using standard
array/Galka/native first-level choices and reopened. All8records survive server
stop/SQLite reopen. Local test server stopped. These are fixture sessions;
no real Firebase login, production character mutation or deployment occurred.

Three class-isolation fixtures use existing standard-trait toggles to disable
unsupported racial choices: Palico Languages (Meowfist), Gria Languages/Martial
Background (Scaled Fist), and Viera Elemental Summoner (Treetop Monk). This does
not certify their default racial choices. Race safeguards remain unchanged and
race implementation remains owned by the separate chat.

## Manual limits

Conditional effects, companions, forms, feats, equipment, cross-class options,
complex or external prerequisites, spell subchoices and optional resource
bonuses remain source cards/manual entries per user direction. Actual named
native prerequisites and rank/level gates are checked where represented.
Sky Pirate/Saboteur grant source features at11 while consuming the12talent slot;
this discrepancy is disclosed on cards/audit. Warrior's22optional/modification
statements remain manual and audited. See individual family progress/audit files.
Monk records both its source-inventory hash and actual Markdown hash separately.
No full-completion/review flags were asserted.

## Continue and publish

Keep all gameplay local until a new explicit publish request. Preserve the race
chat's main changes and reconcile shared wizard/queue files before publication.
Next candidate batch: White Mage, then Knight/Dragoon full families. Use parallel
family data work plus shared runtime integration and whole-family regression.
Do not split ordinary progression into one-level releases. NAS migration remains
a later user-directed deployment task; do not change hosting now.

Evidence: three-class-families-validation.json, tests/sheet-family-progression.test.mjs,
family source/runtime tests, and the chat deliverable three-class-families-local.png.
