# Garlean — bounded standard first-level race integration

Source: `rules/staging/races/garlean.race.json`, from the archived FFd20 Garlean source. The staged definition remains `needs_review`: this is a bounded source-backed milestone, **not full rule approval**.

- **Ability and identity:** +2 CON, +2 INT, −2 WIS; Medium Humanoid (garlean), 30-foot speed; starts with Common. Only source-listed high-INT languages Elvaan, Galkan, Goblin, Lalafellan and Mithran.
- **Unconditional skills:** +2 racial Perception, Knowledge (history), Knowledge (nobility), Knowledge (technology) and Repair; History and Nobility are class skills. Select one of three sheet Craft rows and name its technology-related specialty for +2 racial.
- **Sovereignty:** the source allows Firearms (Simple) OR a specific Gun Arm Exotic Weapon Proficiency. Only Firearms (Simple) is enabled; no unsupported generic exotic weapon proficiency.
- **Magic Ineptitude:** reject level-one classes whose current calculated MP is positive. Magic User alternate and spell/item interaction exceptions require separate review. Third Eye at-will detect magic and its Su/Sp source inconsistency are shown as manual source traits, never silently granted as spells.
- **Conditional:** Fearless, Hardy, Magitek Training provide situational saves or dodge AC, never default permanent stats.
- **Guards:** level 2+, multiclass, alternates, variants, individual standard trait disabling and saved initial option changes are blocked. Favored class rewards stay manual. Full review remains outstanding.

Test: `tests/garlean-standard-creation.test.mjs`. No classes or archetypes altered. Cloud Node 24 testing and build required before merge. No real Firebase login or signed-in save/reopen verification is claimed.
